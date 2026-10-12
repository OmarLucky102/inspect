import {
  InspectionStatusHistory as PrismaInspectionStatusHistory,
  Prisma,
} from '@prisma/client';
import { InspectionStatusHistory } from '../../domain/entities/inspection-status-history.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';

export class InspectionStatusHistoryMapper {
  static toDomain(
    prismaHistory: PrismaInspectionStatusHistory,
  ): InspectionStatusHistory {
    return new InspectionStatusHistory({
      id: prismaHistory.id,
      inspectionRequestId: prismaHistory.inspectionRequestId,
      fromStatus: prismaHistory.fromStatus as InspectionStatus | null,
      toStatus: prismaHistory.toStatus as InspectionStatus,
      changedBy: prismaHistory.changedBy,
      changedAt: prismaHistory.changedAt,
      note: prismaHistory.note,
    });
  }

  static toCreateData(
    history: InspectionStatusHistory,
  ): Prisma.InspectionStatusHistoryCreateInput {
    return {
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      changedAt: history.changedAt,
      note: history.note,
      inspectionRequest: {
        connect: { id: history.inspectionRequestId },
      },
      changer: {
        connect: { id: history.changedBy },
      },
    };
  }
}
