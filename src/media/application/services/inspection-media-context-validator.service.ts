import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InspectionStatus, CaptureSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { IMediaCategoryRepository } from '../../domain/repositories/media-category.repository.interface';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';

export interface InspectionActor {
  id: string;
  role: Role;
}

export interface ResolvedInspectionMediaContext {
  inspectionId: string;
  bankId: string;
  captureSessionId: string | null;
  categoryId: string;
}

@Injectable()
export class InspectionMediaContextValidator {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IMediaCategoryRepository')
    private readonly categoryRepository: IMediaCategoryRepository,
  ) {}

  async validateAndResolve(
    inspectionId: string,
    requestedCaptureSessionId: string | undefined,
    requestedCategoryIdOrName: string | undefined,
    actor: InspectionActor,
  ): Promise<ResolvedInspectionMediaContext> {
    // 1. Fetch inspection with relations
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
      include: {
        bank: true,
        captureSessions: true,
      },
    });

    if (!inspection) {
      throw new InspectionRequestNotFoundException(inspectionId);
    }

    // 2. Verify inspection is not in a locked terminal status
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

    // 3. Resolve capture session
    let resolvedCaptureSessionId = requestedCaptureSessionId;
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

    // 4. Assert user authorization
    await this.assertUserAuthorized(inspection, targetCaptureSession, actor);

    // 5. Resolve category ID
    const categoryId = await this.resolveCategoryId(requestedCategoryIdOrName);

    return {
      inspectionId: inspection.id,
      bankId: inspection.bankId,
      captureSessionId: resolvedCaptureSessionId ?? null,
      categoryId,
    };
  }

  private async assertUserAuthorized(
    inspection: {
      id: string;
      bankId: string;
      assignedRepresentativeId?: string | null;
    },
    captureSession: { representativeId?: string } | null | undefined,
    actor: InspectionActor,
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
