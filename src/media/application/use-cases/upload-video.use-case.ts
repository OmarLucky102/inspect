import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaStatus } from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import { Media } from '../../domain/entities/media.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { UploadVideoDto } from '../../presentation/dto/upload-video.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';

export interface UploadVideoActor {
  id: string;
  role: Role;
}

export interface UploadVideoParams extends UploadVideoDto {
  inspectionId: string;
}

@Injectable()
export class UploadVideoUseCase {
  private readonly logger = new Logger(UploadVideoUseCase.name);

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
    private readonly contextValidator: InspectionMediaContextValidator,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    file: Express.Multer.File | undefined,
    params: UploadVideoParams,
    actor: UploadVideoActor,
  ): Promise<MediaResponseDto> {
    // 1. Validate video file presence, MIME type (strictly video/*), and size (<= 250 MB)
    this.fileValidator.validateVideo(file);
    const validFile = file!;

    // 2. Validate inspection status, user authorization, and resolve category & capture session
    const context = await this.contextValidator.validateAndResolve(
      params.inspectionId,
      params.captureSessionId,
      params.categoryId,
      actor,
    );

    // 3. Generate UUID for media record
    const mediaId = randomUUID();

    // 4. Derive file extension and canonical S3 object key
    const extension = this.fileValidator.extractExtension(validFile);
    const objectKey = `banks/${context.bankId}/inspections/${context.inspectionId}/videos/${mediaId}.${extension}`;
    const fileName = validFile.originalname || `${mediaId}.${extension}`;

    // 5. Create Domain Entity with PENDING status (no Sharp processing for raw video)
    const media = new Media({
      id: mediaId,
      categoryId: context.categoryId,
      uploadedById: actor.id,
      captureSessionId: context.captureSessionId,
      fileName,
      fileUrl: objectKey,
      mimeType: validFile.mimetype,
      fileSize: validFile.size || validFile.buffer.length,
      fileHash: params.fileHash ?? null,
      width: null,
      height: null,
      duration: null,
      sortOrder: params.sortOrder ?? 0,
      status: MediaStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await this.mediaRepository.save(media);

    // 6. Upload raw video directly to SeaweedFS (S3)
    try {
      await this.s3StorageService.upload(
        objectKey,
        validFile.buffer,
        validFile.mimetype,
      );
    } catch (uploadError) {
      const failureReason =
        (uploadError as Error).message || 'Failed to upload video to SeaweedFS';
      media.markFailed(failureReason);
      await this.mediaRepository.update(media).catch((dbErr) => {
        this.logger.error(
          `Failed to update media record '${mediaId}' to FAILED: ${dbErr.message}`,
        );
      });

      throw new StorageOperationException(
        `Video upload failed: ${failureReason}`,
      );
    }

    // 7. Update Media record to UPLOADED after successful S3 upload
    try {
      media.markUploaded();
      await this.mediaRepository.update(media);
    } catch (dbError) {
      // Dual-write consistency compensation:
      // S3 upload succeeded, but DB persistence failed. Clean up S3 object.
      this.logger.error(
        `Failed to update media status to UPLOADED for video ID '${mediaId}'. Cleaning up S3 object '${objectKey}'...`,
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
