import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaStatus } from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import type { IImageProcessorService } from '../../domain/services/image-processor.service.interface';
import { MAX_BATCH_IMAGES_COUNT } from '../../infrastructure/services/file-validator.service';
import { Media } from '../../domain/entities/media.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import {
  InspectionMediaContextValidator,
  ResolvedInspectionMediaContext,
} from '../services/inspection-media-context-validator.service';
import { createConcurrencyLimiter } from '../../../shared/utils/concurrency-limit.util';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { BatchUploadMediaDto } from '../../presentation/dto/batch-upload-media.dto';
import {
  BatchUploadResponseDto,
  BatchMediaItemResult,
} from '../dto/batch-upload-response.dto';

export interface BatchUploadActor {
  id: string;
  role: Role;
}

export const BATCH_UPLOAD_CONCURRENCY = 10;

@Injectable()
export class BatchUploadMediaUseCase {
  private readonly logger = new Logger(BatchUploadMediaUseCase.name);

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
    @Inject('IImageProcessorService')
    private readonly imageProcessor: IImageProcessorService,
    private readonly contextValidator: InspectionMediaContextValidator,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    files: Express.Multer.File[] | undefined,
    dto: BatchUploadMediaDto & { inspectionId: string },
    actor: BatchUploadActor,
  ): Promise<BatchUploadResponseDto> {
    // 1. Batch-level validation: files count
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    if (files.length > MAX_BATCH_IMAGES_COUNT) {
      throw new BadRequestException(
        `A maximum of ${MAX_BATCH_IMAGES_COUNT} images per batch is allowed`,
      );
    }

    // 2. Batch-level validation: inspection existence, locked state, capture session, authorization
    const context = await this.contextValidator.validateAndResolve(
      dto.inspectionId,
      dto.captureSessionId,
      dto.categoryId,
      actor,
    );

    // 3. Concurrency-limited processing (max 10 parallel operations)
    const limit = createConcurrencyLimiter(BATCH_UPLOAD_CONCURRENCY);
    const baseSortOrder = dto.sortOrder ?? 0;

    const taskPromises = files.map((file, index) =>
      limit(() =>
        this.processSingleImage(file, context, actor, baseSortOrder + index),
      ),
    );

    const settledResults = await Promise.allSettled(taskPromises);

    // 4. Aggregate partial success results
    let uploaded = 0;
    let failed = 0;
    const results: BatchMediaItemResult[] = [];

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        const itemResult = settled.value;
        results.push(itemResult);
        if (itemResult.status === 'UPLOADED') {
          uploaded++;
        } else {
          failed++;
        }
      } else {
        // Fallback for any unexpected unhandled rejection
        failed++;
        results.push({
          fileName: 'unknown',
          status: 'FAILED',
          errorCode: 'STORAGE_ERROR',
          errorMessage:
            settled.reason?.message || 'Unexpected batch processing error',
          retryable: true,
        });
      }
    }

    return {
      total: files.length,
      uploaded,
      failed,
      results,
    };
  }

  private async processSingleImage(
    file: Express.Multer.File,
    context: ResolvedInspectionMediaContext,
    actor: BatchUploadActor,
    sortOrder: number,
  ): Promise<BatchMediaItemResult> {
    const originalName = file.originalname || 'image';

    // Step 1: Validate image (MIME/size) — video/non-image rejected before DB
    try {
      this.fileValidator.validateImage(file);
    } catch (validationError: any) {
      const isVideoOrNonImage =
        validationError?.name === 'UnsupportedMediaTypeException' ||
        validationError?.message?.includes('Only image files');
      const isOversized =
        validationError?.name === 'FileTooLargeException' ||
        validationError?.message?.includes('exceeds the limit');

      return {
        fileName: originalName,
        status: 'FAILED',
        errorCode: isVideoOrNonImage
          ? 'UNSUPPORTED_MEDIA_TYPE'
          : isOversized
            ? 'FILE_TOO_LARGE'
            : 'INVALID_IMAGE',
        errorMessage: validationError.message || 'File validation failed',
        retryable: false,
      };
    }

    // Step 2: Save Media entity to DB as PENDING upfront so failures are tracked
    const mediaId = randomUUID();
    const objectKey = `banks/${context.bankId}/inspections/${context.inspectionId}/${mediaId}.webp`;

    const media = new Media({
      id: mediaId,
      categoryId: context.categoryId,
      uploadedById: actor.id,
      captureSessionId: context.captureSessionId,
      fileName: originalName,
      fileUrl: objectKey,
      mimeType: file.mimetype,
      fileSize: file.size || file.buffer.length,
      fileHash: null,
      width: null,
      height: null,
      duration: null,
      sortOrder,
      status: MediaStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    try {
      await this.mediaRepository.save(media);
    } catch (dbSaveError: any) {
      this.logger.error(
        `Failed to save initial PENDING media record '${mediaId}': ${dbSaveError.message}`,
      );
      return {
        id: mediaId,
        fileName: originalName,
        status: 'FAILED',
        errorCode: 'DATABASE_ERROR',
        errorMessage:
          dbSaveError.message ||
          'Failed to initialize media record in database',
        retryable: true,
      };
    }

    // Step 3: Process image via Sharp
    let processed;
    try {
      processed = await this.imageProcessor.process(file.buffer, file.mimetype);
    } catch {
      media.markFailed('Invalid or corrupted image format');
      await this.mediaRepository.update(media).catch((dbErr) => {
        this.logger.error(
          `Failed to update media record '${mediaId}' to FAILED: ${dbErr.message}`,
        );
      });

      return {
        id: mediaId,
        fileName: originalName,
        status: 'FAILED',
        errorCode: 'INVALID_IMAGE',
        errorMessage: 'Invalid or corrupted image format',
        retryable: false,
      };
    }

    // Step 4: Upload to SeaweedFS (S3)
    try {
      await this.s3StorageService.upload(
        objectKey,
        processed.buffer,
        processed.mimeType,
      );
    } catch (s3Error: any) {
      const failureReason =
        s3Error.message || 'Failed to upload object to SeaweedFS';
      media.markFailed(failureReason);
      await this.mediaRepository.update(media).catch((dbErr) => {
        this.logger.error(
          `Failed to update media record '${mediaId}' to FAILED: ${dbErr.message}`,
        );
      });

      return {
        id: mediaId,
        fileName: originalName,
        status: 'FAILED',
        errorCode: 'STORAGE_ERROR',
        errorMessage: failureReason,
        retryable: true,
      };
    }

    // Step 5: Update Media entity to UPLOADED with processed details
    try {
      const finalFileName = file.originalname
        ? file.originalname.replace(/\.[^/.]+$/, `.${processed.extension}`)
        : `${mediaId}.${processed.extension}`;

      media.markUploadedWithDetails({
        width: processed.width,
        height: processed.height,
        fileSize: processed.size,
        mimeType: processed.mimeType,
        fileName: finalFileName,
      });

      await this.mediaRepository.update(media);
    } catch (dbUpdateError: any) {
      this.logger.error(
        `Failed to update media status to UPLOADED for ID '${mediaId}'. Cleaning up S3 object '${objectKey}'...`,
        dbUpdateError.stack,
      );

      // Compensating S3 cleanup
      await this.s3StorageService.delete(objectKey).catch((cleanupErr) => {
        this.logger.error(
          `[ORPHANED_S3_OBJECT] Compensating cleanup failed to delete S3 object '${objectKey}': ${cleanupErr.message}`,
        );
      });

      return {
        id: mediaId,
        fileName: originalName,
        status: 'FAILED',
        errorCode: 'DATABASE_ERROR',
        errorMessage:
          dbUpdateError.message ||
          'Failed to update media record status to UPLOADED',
        retryable: true,
      };
    }

    return {
      id: media.id,
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      status: 'UPLOADED',
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      width: media.width,
      height: media.height,
    };
  }
}
