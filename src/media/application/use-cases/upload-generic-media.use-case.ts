import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaStatus } from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IMediaCategoryRepository } from '../../domain/repositories/media-category.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import type { IImageProcessorService } from '../../domain/services/image-processor.service.interface';
import { Media } from '../../domain/entities/media.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import { BaseException } from '../../../shared/exceptions/base.exception';
import { InvalidImageFormatException } from '../../../shared/exceptions/media.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { GenericUploadMediaDto } from '../../presentation/dto/generic-upload-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';

export interface UploadGenericMediaActor {
  id: string;
  role: Role;
}

@Injectable()
export class UploadGenericMediaUseCase {
  private readonly logger = new Logger(UploadGenericMediaUseCase.name);

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaCategoryRepository')
    private readonly categoryRepository: IMediaCategoryRepository,
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
    @Inject('IImageProcessorService')
    private readonly imageProcessor: IImageProcessorService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    file: Express.Multer.File | undefined,
    dto: GenericUploadMediaDto,
    actor: UploadGenericMediaActor,
  ): Promise<MediaResponseDto> {
    // 1. Strict image-only validation (rejects videos & non-images immediately)
    this.fileValidator.validateImage(file);
    const validFile = file!;

    // 2. Resolve media category (defaults to 'GENERAL')
    const categoryId = await this.resolveCategoryId(dto.category);

    // 3. Generate UUID for media record
    const mediaId = randomUUID();

    // 4. Process image through Sharp (EXIF auto-rotation, resize, WebP conversion)
    let uploadBuffer: Buffer;
    let uploadMimeType: string;
    let extension: string;
    let fileSize: number;
    let width: number;
    let height: number;
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
      const failedExt = this.fileValidator.extractExtension(validFile);
      const failedMedia = new Media({
        id: mediaId,
        categoryId,
        uploadedById: actor.id,
        captureSessionId: null,
        fileName: validFile.originalname || `${mediaId}.${failedExt}`,
        fileUrl: `general/${actor.id}/${mediaId}.${failedExt}`,
        mimeType: validFile.mimetype,
        fileSize: validFile.size || validFile.buffer.length,
        fileHash: null,
        width: null,
        height: null,
        duration: null,
        sortOrder: 0,
        status: MediaStatus.FAILED,
        failureReason: 'Invalid or corrupted image format',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await this.mediaRepository.save(failedMedia).catch((dbErr) => {
        this.logger.error(
          `Failed to save failed generic media record '${mediaId}': ${dbErr.message}`,
        );
      });

      if (processingError instanceof BaseException) {
        throw processingError;
      }
      throw new InvalidImageFormatException(
        'Invalid or corrupted image format',
      );
    }

    // 5. Construct canonical object key: general/{userId}/{mediaId}.webp
    const objectKey = `general/${actor.id}/${mediaId}.${extension}`;

    // 6. Create domain Media entity with PENDING status
    const media = new Media({
      id: mediaId,
      categoryId,
      uploadedById: actor.id,
      captureSessionId: null,
      fileName,
      fileUrl: objectKey,
      mimeType: uploadMimeType,
      fileSize,
      fileHash: null,
      width,
      height,
      duration: null,
      sortOrder: 0,
      status: MediaStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await this.mediaRepository.save(media);

    // 7. Upload buffer to SeaweedFS (S3)
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
          `Failed to update generic media record '${mediaId}' to FAILED: ${dbErr.message}`,
        );
      });

      throw new StorageOperationException(
        `Media upload failed: ${failureReason}`,
      );
    }

    // 8. Update Media record to UPLOADED with compensating cleanup
    try {
      media.markUploaded();
      await this.mediaRepository.update(media);
    } catch (dbError) {
      this.logger.error(
        `Failed to update generic media status to UPLOADED for ID '${mediaId}'. Cleaning up S3 object '${objectKey}'...`,
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

  private async resolveCategoryId(categoryNameOrId?: string): Promise<string> {
    if (categoryNameOrId) {
      const byId = await this.categoryRepository.findById(categoryNameOrId);
      if (byId) {
        return byId.id;
      }
      const category =
        await this.categoryRepository.getOrCreateDefault(categoryNameOrId);
      return category.id;
    }

    const defaultCategory =
      await this.categoryRepository.getOrCreateDefault('GENERAL');
    return defaultCategory.id;
  }
}
