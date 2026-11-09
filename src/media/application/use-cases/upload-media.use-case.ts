import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaStatus } from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import type { IImageProcessorService } from '../../domain/services/image-processor.service.interface';
import { Media } from '../../domain/entities/media.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import { BaseException } from '../../../shared/exceptions/base.exception';
import { InvalidImageFormatException } from '../../../shared/exceptions/media.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { UploadMediaDto } from '../../presentation/dto/upload-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';

export interface UploadMediaActor {
  id: string;
  role: Role;
}

@Injectable()
export class UploadMediaUseCase {
  private readonly logger = new Logger(UploadMediaUseCase.name);

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
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
    actor: UploadMediaActor,
  ): Promise<MediaResponseDto> {
    // 1. Validate image presence, MIME type, and size (strictly images only)
    this.fileValidator.validateImage(file);
    const validFile = file!;

    // 2. Validate inspection status, user authorization, and resolve category & capture session
    const context = await this.contextValidator.validateAndResolve(
      dto.inspectionId,
      dto.captureSessionId,
      dto.categoryId,
      actor,
    );

    // 3. Generate UUID for media record
    const mediaId = randomUUID();

    // 4. Image Processing via Sharp (convert to WebP, extract dimensions)
    let uploadBuffer: Buffer;
    let uploadMimeType: string;
    let extension: string;
    let fileSize: number;
    let width: number | null;
    let height: number | null;
    let fileName: string;

    try {
      const processed = await this.imageProcessor.process(
        validFile.buffer,
        validFile.mimetype,
      );
      uploadBuffer = processed.buffer;
      uploadMimeType = processed.mimeType;
      extension = processed.extension;
      fileSize = processed.size;
      width = processed.width;
      height = processed.height;

      if (validFile.originalname) {
        fileName = validFile.originalname.replace(/\.[^/.]+$/, `.${extension}`);
      } else {
        fileName = `${mediaId}.${extension}`;
      }
    } catch (processingError) {
      const failureReason = 'Invalid or corrupted image format';

      const failedMedia = new Media({
        id: mediaId,
        categoryId: context.categoryId,
        uploadedById: actor.id,
        captureSessionId: context.captureSessionId,
        fileName: validFile.originalname || `${mediaId}.webp`,
        fileUrl: `banks/${context.bankId}/inspections/${context.inspectionId}/${mediaId}.webp`,
        mimeType: validFile.mimetype,
        fileSize: validFile.size || validFile.buffer.length,
        fileHash: dto.fileHash ?? null,
        width: null,
        height: null,
        duration: null,
        sortOrder: dto.sortOrder ?? 0,
        status: MediaStatus.FAILED,
        failureReason,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await this.mediaRepository.save(failedMedia).catch((dbErr) => {
        this.logger.error(
          `Failed to save failed media record '${mediaId}': ${dbErr.message}`,
        );
      });

      if (processingError instanceof BaseException) {
        throw processingError;
      }
      throw new InvalidImageFormatException(
        'Invalid or corrupted image format',
      );
    }

    // 5. Generate canonical object key: banks/{bankId}/inspections/{inspectionId}/{mediaId}.webp
    const objectKey = `banks/${context.bankId}/inspections/${context.inspectionId}/${mediaId}.${extension}`;

    // 6. Create Domain Entity with PENDING status
    const media = new Media({
      id: mediaId,
      categoryId: context.categoryId,
      uploadedById: actor.id,
      captureSessionId: context.captureSessionId,
      fileName,
      fileUrl: objectKey,
      mimeType: uploadMimeType,
      fileSize,
      fileHash: dto.fileHash ?? null,
      width,
      height,
      duration: null,
      sortOrder: dto.sortOrder ?? 0,
      status: MediaStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await this.mediaRepository.save(media);

    // 7. Upload file to SeaweedFS (S3)
    try {
      await this.s3StorageService.upload(
        objectKey,
        uploadBuffer,
        uploadMimeType,
      );
    } catch (uploadError) {
      const failureReason =
        (uploadError as Error).message ||
        'Failed to upload object to SeaweedFS';
      media.markFailed(failureReason);
      await this.mediaRepository.update(media).catch((dbErr) => {
        this.logger.error(
          `Failed to update media record '${mediaId}' to FAILED: ${dbErr.message}`,
        );
      });

      throw new StorageOperationException(
        `Media upload failed: ${failureReason}`,
      );
    }

    // 8. Update Media record to UPLOADED after successful upload
    try {
      media.markUploaded();
      await this.mediaRepository.update(media);
    } catch (dbError) {
      // Dual-write consistency compensation:
      // S3 upload succeeded, but DB persistence failed. Clean up S3 object.
      this.logger.error(
        `Failed to update media status to UPLOADED for ID '${mediaId}'. Cleaning up S3 object '${objectKey}'...`,
        (dbError as Error).stack,
      );
      await this.s3StorageService.delete(objectKey).catch((cleanupErr) => {
        this.logger.error(
          `Compensating cleanup failed to delete S3 object '${objectKey}': ${cleanupErr.message}`,
        );
      });
      throw dbError;
    }

    return MediaResponseDto.fromDomain(media);
  }
}
