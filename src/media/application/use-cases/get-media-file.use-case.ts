import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { Readable } from 'stream';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { PrismaService } from '../../../database/prisma.service';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';

export interface GetMediaActor {
  id: string;
  role: Role;
}

export interface MediaFileStreamResult {
  stream: Readable;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  fileName: string;
}

@Injectable()
export class GetMediaFileUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    mediaId: string,
    actor: GetMediaActor,
    range?: string,
  ): Promise<MediaFileStreamResult> {
    const media = await this.mediaRepository.findById(mediaId);

    if (!media || media.deletedAt) {
      throw new NotFoundException(`Media with ID '${mediaId}' not found`);
    }

    if (media.captureSessionId) {
      const captureSession = await this.prisma.captureSession.findUnique({
        where: { id: media.captureSessionId },
        include: {
          inspectionRequest: true,
        },
      });

      if (captureSession?.inspectionRequest) {
        await this.assertUserAuthorized(
          captureSession.inspectionRequest,
          captureSession,
          actor,
        );
      }
    }

    const { stream, contentType, contentLength, contentRange } =
      await this.s3StorageService.getObject(media.fileUrl, range);

    return {
      stream,
      contentType: contentType || media.mimeType || 'application/octet-stream',
      contentLength,
      contentRange,
      fileName: media.fileName,
    };
  }

  private async assertUserAuthorized(
    inspection: {
      id: string;
      bankId: string;
      assignedRepresentativeId?: string | null;
    },
    captureSession: { representativeId?: string } | null | undefined,
    actor: GetMediaActor,
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
      actor.role === Role.USER ||
      actor.role === Role.VIEWER
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
}
