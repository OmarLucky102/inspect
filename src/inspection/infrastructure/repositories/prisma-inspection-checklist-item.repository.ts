import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionChecklistItemRepository } from '../../domain/repositories/inspection-checklist-item.repository.interface';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';
import { InspectionChecklistItemMapper } from '../persistence/inspection-checklist-item.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInspectionChecklistItemRepository implements IInspectionChecklistItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRequestId(requestId: string): Promise<InspectionChecklistItem[]> {
    const rows = await this.prisma.inspectionChecklistItem.findMany({
      where: { inspectionRequestId: requestId },
      include: {
        checklistItem: true,
      },
      orderBy: {
        checklistItem: { sortOrder: 'asc' },
      },
    });
    return rows.map(InspectionChecklistItemMapper.toDomain);
  }

  async findByRequestAndItem(requestId: string, checklistItemId: string): Promise<InspectionChecklistItem | null> {
    const row = await this.prisma.inspectionChecklistItem.findUnique({
      where: {
        inspectionRequestId_checklistItemId: {
          inspectionRequestId: requestId,
          checklistItemId,
        },
      },
    });
    return row ? InspectionChecklistItemMapper.toDomain(row) : null;
  }

  async bulkCreate(items: InspectionChecklistItem[], tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx || this.prisma;
    if (items.length === 0) return;

    await db.inspectionChecklistItem.createMany({
      data: items.map(item => ({
        id: item.id,
        inspectionRequestId: item.inspectionRequestId,
        checklistItemId: item.checklistItemId,
        value: item.value,
        notes: item.notes,
        completed: item.completed,
        completedAt: item.completedAt,
      })),
      skipDuplicates: true,
    });
  }
}
