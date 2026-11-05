import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  MediaStatus,
  CaptureSessionStatus,
  InspectionStatus,
} from '@prisma/client';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import type { IMediaCategoryRepository } from '../../domain/repositories/media-category.repository.interface';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import { Media } from '../../domain/entities/media.entity';
import { PrismaService } from '../../../database/prisma.service';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';
import { UploadMediaDto } from '../../presentation/dto/upload-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';

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
    @Inject('IMediaCategoryRepository')
    private readonly categoryRepository: IMediaCategoryRepository,
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
    actor: UploadMediaActor,
  ): Promise<MediaResponseDto> {
    // 1 & 2. Validate file presence, MIME type, and size
    this.fileValidator.validate(file);
    const validFile = file!;

    // 3 & 4. Retrieve inspection and capture session from DB & validate authorization
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: dto.inspectionId },
      include: {
        bank: true,
        captureSessions: true,
      },
    });

    if (!inspection) {
      throw new InspectionRequestNotFoundException(dto.inspectionId);
    }

    const lockedStatuses: InspectionStatus[] = [
      InspectionStatus.COMPLETED,
      InspectionStatus.APPROVED,
      InspectionStatus.CANCELLED,
      InspectionStatus.REJECTED,
    ];
    if (lockedStatuses.includes(inspection.currentStatus)) {
      throw new InvalidInspectionRequestStateException(
        `Cannot upload media to an inspection request with status '${inspection.currentStatus}'.`,
      );
    }

    let resolvedCaptureSessionId = dto.captureSessionId;
    let targetCaptureSession = resolvedCaptureSessionId
      ? inspection.captureSessions.find(
          (cs) => cs.id === resolvedCaptureSessionId,
        )
      : undefined;

    if (resolvedCaptureSessionId && !targetCaptureSession) {
      const existingSession = await this.prisma.captureSession.findUnique({
        where: { id: resolvedCaptureSessionId },
      });
      if (!existingSession) {
        throw new NotFoundException(
          `Capture session with ID '${resolvedCaptureSessionId}' not found`,
        );
      }
      if (existingSession.inspectionRequestId !== inspection.id) {
        throw new BadRequestException(
          `Capture session '${resolvedCaptureSessionId}' does not belong to inspection '${inspection.id}'`,
        );
      }
      targetCaptureSession = existingSession;
    }

    if (!resolvedCaptureSessionId) {
      const activeSession = inspection.captureSessions.find(
        (cs) => cs.status === CaptureSessionStatus.IN_PROGRESS,
      );
      if (activeSession) {
        resolvedCaptureSessionId = activeSession.id;
        targetCaptureSession = activeSession;
      }
    }

    await this.assertUserAuthorized(inspection, targetCaptureSession, actor);

    // Resolve MediaCategory
    const categoryId = await this.resolveCategoryId(dto.categoryId);

    // 5. Derive bankId from database relationship
    const bankId = inspection.bankId;

    // 6. Generate UUID for media record
    const mediaId = randomUUID();

    // 7. Generate canonical object key: banks/{bankId}/inspections/{inspectionId}/{mediaId}.{ext}
    const extension = this.fileValidator.extractExtension(validFile);
    const objectKey = `banks/${bankId}/inspections/${inspection.id}/${mediaId}.${extension}`;

    // 8. Create Domain Entity with PENDING status
    const media = new Media({
      id: mediaId,
      categoryId,
      uploadedById: actor.id,
      captureSessionId: resolvedCaptureSessionId ?? null,
      fileName: validFile.originalname || `${mediaId}.${extension}`,
      fileUrl: objectKey,
      mimeType: validFile.mimetype,
      fileSize: validFile.size || validFile.buffer.length,
      fileHash: dto.fileHash ?? null,
      width: null,
      height: null,
      duration: null,
      sortOrder: dto.sortOrder ?? 0,
      status: MediaStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await this.mediaRepository.save(media);

    // 9. Upload file to SeaweedFS (S3)
    try {
      await this.s3StorageService.upload(
        objectKey,
        validFile.buffer,
        validFile.mimetype,
      );
    } catch (uploadError) {
      // 11. Handle upload failure: update domain entity to FAILED
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

    // 10. Update Media record to UPLOADED after successful upload
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

  private async assertUserAuthorized(
    inspection: {
      id: string;
      bankId: string;
      assignedRepresentativeId?: string | null;
    },
    captureSession: { representativeId?: string } | null | undefined,
    actor: UploadMediaActor,
  ): Promise<void> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    if (isGlobalAdmin) {
      return;
    }

    if (actor.role === Role.REPRESENTATIVE) {
      const isAssigned =
        inspection.assignedRepresentativeId === actor.id ||
        (captureSession && captureSession.representativeId === actor.id);

      if (!isAssigned) {
        throw new InspectionRequestAccessDeniedException(
          'Representative is not assigned to this inspection request',
        );
      }
      return;
    }

    if (
      actor.role === Role.MANAGER ||
      actor.role === Role.REVIEWER ||
      actor.role === Role.USER
    ) {
      const membership = await this.prisma.bankMembership.findFirst({
        where: {
          bankId: inspection.bankId,
          userId: actor.id,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw new InspectionRequestAccessDeniedException(
          `User is not an active member of bank '${inspection.bankId}'`,
        );
      }
      return;
    }

    throw new InspectionRequestAccessDeniedException();
  }

  private async resolveCategoryId(categoryId?: string): Promise<string> {
    if (categoryId) {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundException(
          `Media category with ID '${categoryId}' not found`,
        );
      }
      return category.id;
    }

    const defaultCategory =
      await this.categoryRepository.getOrCreateDefault('GENERAL');
    return defaultCategory.id;
  }
}
