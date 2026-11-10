import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaStatus } from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import type { IVideoProcessorService } from '../../domain/services/video-processor.service.interface';
import { Media } from '../../domain/entities/media.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { UploadVideoDto } from '../../presentation/dto/upload-video.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';
import { VideoProcessingQueueService } from '../../infrastructure/services/video-processing-queue.service';

export interface UploadVideoActor {
  id: string;
  role: Role;
}

export interface UploadVideoParams extends UploadVideoDto {
  inspectionId: string;
}

interface BackgroundJobPayload {
  mediaId: string;
  fileBuffer: Buffer;
  fileMimeType: string;
  fileName: string;
  videoObjectKey: string;
  thumbObjectKey: string;
}

@Injectable()
export class UploadVideoUseCase {
  private readonly logger = new Logger(UploadVideoUseCase.name);

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
    @Inject('IVideoProcessorService')
    private readonly videoProcessor: IVideoProcessorService,
    private readonly contextValidator: InspectionMediaContextValidator,
    private readonly s3StorageService: S3StorageService,
    private readonly queueService: VideoProcessingQueueService,
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

    // 3. Pre-generate canonical identifiers and S3 object keys
    const mediaId = randomUUID();
    const videoObjectKey = `banks/${context.bankId}/inspections/${context.inspectionId}/videos/${mediaId}.mp4`;
    const thumbObjectKey = `banks/${context.bankId}/inspections/${context.inspectionId}/videos/${mediaId}_thumb.webp`;
    const fileName = validFile.originalname
      ? validFile.originalname.replace(/\.[^/.]+$/, '.mp4')
      : `${mediaId}.mp4`;

    // 4. Create initial Domain Entity with PENDING status
    const media = new Media({
      id: mediaId,
      categoryId: context.categoryId,
      uploadedById: actor.id,
      captureSessionId: context.captureSessionId,
      fileName,
      fileUrl: videoObjectKey,
      mimeType: 'video/mp4',
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

    // 5. Save initial PENDING record in PostgreSQL
    await this.mediaRepository.save(media);

    // 6. Enqueue asynchronous background processing (True Fire-and-Forget, capped concurrency)
    this.queueService.enqueue(() =>
      this.processVideoInBackground({
        mediaId,
        fileBuffer: validFile.buffer,
        fileMimeType: validFile.mimetype,
        fileName,
        videoObjectKey,
        thumbObjectKey,
      }),
    );

    // 7. Instantly respond to client with 201 Created (< 500ms)
    return MediaResponseDto.fromDomain(media);
  }

  /**
   * Asynchronous background worker executed inside the concurrency queue.
   * Traps all errors with structured Pino logging to prevent unhandled Promise rejections.
   */
  public async processVideoInBackground(
    payload: BackgroundJobPayload,
  ): Promise<void> {
    const {
      mediaId,
      fileBuffer,
      fileMimeType,
      fileName,
      videoObjectKey,
      thumbObjectKey,
    } = payload;
    const uploadedKeys: string[] = [];

    try {
      this.logger.log(
        `Starting background video processing for media '${mediaId}'...`,
      );

      // 1. Transcode video (720p H.264/AAC, WebP thumbnail, probe metadata)
      const processed = await this.videoProcessor.process(
        fileBuffer,
        fileMimeType,
      );

      // 2. Upload video asset to SeaweedFS (S3) and track key
      await this.s3StorageService.upload(
        videoObjectKey,
        processed.videoBuffer,
        processed.videoMimeType,
      );
      uploadedKeys.push(videoObjectKey);

      // 3. Upload thumbnail asset to SeaweedFS (S3) and track key
      await this.s3StorageService.upload(
        thumbObjectKey,
        processed.thumbnailBuffer,
        processed.thumbnailMimeType,
      );
      uploadedKeys.push(thumbObjectKey);

      // 4. Fetch media domain entity and finalize with metadata & UPLOADED status
      const media = await this.mediaRepository.findById(mediaId);
      if (!media) {
        throw new Error(
          `Media record '${mediaId}' not found during background finalization.`,
        );
      }

      media.markUploadedWithDetails({
        width: processed.width,
        height: processed.height,
        fileSize: processed.videoSize,
        mimeType: processed.videoMimeType,
        duration: processed.duration,
        fileName,
      });

      await this.mediaRepository.update(media);

      this.logger.log(
        `Background video processing completed successfully for media '${mediaId}' (${processed.duration}s, ${processed.videoSize} bytes).`,
      );
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Background video processing failed';
      this.logger.error(
        {
          mediaId,
          error: errorMessage,
          stack: error?.stack,
        },
        `Background video processing failed for media '${mediaId}'`,
      );

      // S3 Cleanup: purge any successfully uploaded objects if another step in the job failed
      if (uploadedKeys.length > 0) {
        this.logger.warn(
          `Purging ${uploadedKeys.length} partially uploaded S3 object(s) for failed media '${mediaId}'...`,
        );
        await Promise.allSettled(
          uploadedKeys.map((key) =>
            this.s3StorageService.delete(key).catch((delErr) => {
              this.logger.error(
                `Failed to purge orphaned S3 object '${key}': ${delErr.message}`,
              );
            }),
          ),
        );
      }

      // Persist failure status in PostgreSQL
      try {
        const media = await this.mediaRepository.findById(mediaId);
        if (media) {
          media.markFailed(errorMessage);
          await this.mediaRepository.update(media);
        }
      } catch (dbErr: any) {
        this.logger.error(
          `Failed to update media '${mediaId}' to FAILED: ${dbErr?.message || dbErr}`,
          dbErr?.stack,
        );
      }
    }
  }
}
