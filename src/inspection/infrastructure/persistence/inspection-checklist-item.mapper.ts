import { InspectionChecklistItem as PrismaInspectionChecklistItem, Prisma } from '@prisma/client';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';

export class InspectionChecklistItemMapper {
  static toDomain(prismaItem: PrismaInspectionChecklistItem): InspectionChecklistItem {
    return new InspectionChecklistItem({
      id: prismaItem.id,
      inspectionRequestId: prismaItem.inspectionRequestId,
      checklistItemId: prismaItem.checklistItemId,
      value: prismaItem.value,
      notes: prismaItem.notes,
      completed: prismaItem.completed,
      completedAt: prismaItem.completedAt,
    });
  }

  static toCreateData(item: InspectionChecklistItem): Prisma.InspectionChecklistItemCreateInput {
    return {
      id: item.id,
      value: item.value,
      notes: item.notes,
      completed: item.completed,
      completedAt: item.completedAt,
      inspectionRequest: { connect: { id: item.inspectionRequestId } },
      checklistItem: { connect: { id: item.checklistItemId } },
    };
  }
}
