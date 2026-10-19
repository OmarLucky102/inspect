import { InspectionChecklistItem } from '../entities/inspection-checklist-item.entity';
import { Prisma } from '@prisma/client';

export interface IInspectionChecklistItemRepository {
  findByRequestId(requestId: string): Promise<InspectionChecklistItem[]>;
  findByRequestAndItem(
    requestId: string,
    checklistItemId: string,
  ): Promise<InspectionChecklistItem | null>;
  bulkCreate(
    items: InspectionChecklistItem[],
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  update(
    item: InspectionChecklistItem,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  bulkUpdate(
    items: InspectionChecklistItem[],
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
