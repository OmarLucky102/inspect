import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { PrismaService } from '../../../database/prisma.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';
import { MediaResponseDto } from '../dto/media-response.dto';

export interface GetMediaActor {
  id: string;
  role: Role;
}

@Injectable()
export class GetMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    mediaId: string,
    actor: GetMediaActor,
  ): Promise<MediaResponseDto> {
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

    return MediaResponseDto.fromDomain(media);
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
