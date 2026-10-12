import { InspectionStatusHistory } from '../entities/inspection-status-history.entity';
import { Prisma } from '@prisma/client';
import { StatusHistoryRecord } from '../../presentation/dto/inspection-status-history.response.dto';

export interface IInspectionStatusHistoryRepository {
  save(
    history: InspectionStatusHistory,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  findByRequestId(requestId: string): Promise<InspectionStatusHistory[]>;
  findByRequestIdWithDetails(requestId: string): Promise<StatusHistoryRecord[]>;
}
