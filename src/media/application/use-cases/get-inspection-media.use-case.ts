import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';
import { MediaResponseDto } from '../dto/media-response.dto';
import { GetInspectionMediaFilterDto } from '../../presentation/dto/get-inspection-media.filter.dto';

export interface GetInspectionMediaActor {
  id: string;
  role: Role;
}

@Injectable()
export class GetInspectionMediaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    inspectionId: string,
    actor: GetInspectionMediaActor,
    filter?: GetInspectionMediaFilterDto,
  ): Promise<MediaResponseDto[]> {
    const type = filter?.type;

    // 1. Validate query parameter if provided
    if (type !== undefined && type !== 'image' && type !== 'video') {
      throw new BadRequestException(
        `Invalid media type '${type}'. Supported values are 'image' or 'video'.`,
      );
    }

    // 2. Fetch inspection to check existence and authorization
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
      include: {
        captureSessions: true,
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection request with ID '${inspectionId}' not found`,
      );
    }

    // 3. Assert user authorization
    await this.assertUserAuthorized(inspection, actor);

    // 4. Construct DB-level media type filter
    const mimeFilter =
      type === 'image'
        ? { startsWith: 'image/' }
        : type === 'video'
          ? { startsWith: 'video/' }
          : undefined;

    // 5. Query all non-deleted media associated with this inspection:
    // Either linked via captureSession.inspectionRequestId OR via fileUrl containing the inspection ID
    const rows = await this.prisma.media.findMany({
      where: {
        OR: [
          { captureSession: { inspectionRequestId: inspectionId } },
          { fileUrl: { contains: `/inspections/${inspectionId}/` } },
        ],
        ...(mimeFilter ? { mimeType: mimeFilter } : {}),
        ...(filter?.checklistItemCodes?.length
          ? { checklistItemCode: { in: filter.checklistItemCodes } }
          : {}),
        deletedAt: null,
      },
      include: {
        category: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // 6. Map media records
    const results: MediaResponseDto[] = rows.map((row) => {
      const dto = MediaResponseDto.fromPrisma(row);
      dto.categoryName = row.category?.name;
      return dto;
    });

    return results;
  }

  private async assertUserAuthorized(
    inspection: {
      id: string;
      bankId: string;
      assignedRepresentativeId?: string | null;
      captureSessions?: Array<{ representativeId?: string }>;
    },
    actor: GetInspectionMediaActor,
  ): Promise<void> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    if (isGlobalAdmin) {
      return;
    }

    if (actor.role === Role.REPRESENTATIVE) {
      const isAssigned =
        inspection.assignedRepresentativeId === actor.id ||
        inspection.captureSessions?.some(
          (cs) => cs.representativeId === actor.id,
        );

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
