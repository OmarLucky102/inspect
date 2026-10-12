import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';

export class StatusHistoryChangerDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
}

export interface StatusHistoryRecord {
  id: string;
  inspectionRequestId: string;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  changedBy: string;
  note: string | null;
  changedAt: Date;
  changer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export class InspectionStatusHistoryResponseDto {
  id!: string;
  inspectionRequestId!: string;
  fromStatus!: InspectionStatus | null;
  toStatus!: InspectionStatus;
  changedBy!: StatusHistoryChangerDto | string;
  note!: string | null;
  changedAt!: Date;

  static fromPrisma(
    record: StatusHistoryRecord,
  ): InspectionStatusHistoryResponseDto {
    return {
      id: record.id,
      inspectionRequestId: record.inspectionRequestId,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      changedBy: record.changer
        ? {
            id: record.changer.id,
            firstName: record.changer.firstName,
            lastName: record.changer.lastName,
            email: record.changer.email,
          }
        : record.changedBy,
      note: record.note ?? null,
      changedAt: record.changedAt,
    };
  }
}
