import {
  InspectionChecklistItem as PrismaInspectionChecklistItem,
  Prisma,
} from '@prisma/client';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';
import { ChecklistReviewDecision } from '../../domain/value-objects/checklist-review-decision.enum';

export class InspectionChecklistItemMapper {
  static toDomain(
    prismaItem: PrismaInspectionChecklistItem,
  ): InspectionChecklistItem {
    return new InspectionChecklistItem({
      id: prismaItem.id,
      inspectionRequestId: prismaItem.inspectionRequestId,
      checklistItemId: prismaItem.checklistItemId,
      value: prismaItem.value,
      notes: prismaItem.notes,
      completed: prismaItem.completed,
      completedAt: prismaItem.completedAt,
      reviewDecision: (prismaItem.reviewDecision as ChecklistReviewDecision) ?? null,
      reviewNotes: prismaItem.reviewNotes ?? null,
      reviewedAt: prismaItem.reviewedAt ?? null,
    });
  }

  static toCreateData(
    item: InspectionChecklistItem,
  ): Prisma.InspectionChecklistItemCreateInput {
    return {
      id: item.id,
      value: item.value,
      notes: item.notes,
      completed: item.completed,
      completedAt: item.completedAt,
      reviewDecision: item.reviewDecision ?? null,
      reviewNotes: item.reviewNotes ?? null,
      reviewedAt: item.reviewedAt ?? null,
      inspectionRequest: { connect: { id: item.inspectionRequestId } },
      checklistItem: { connect: { id: item.checklistItemId } },
    };
  }

  static toUpdateData(
    item: InspectionChecklistItem,
  ): Prisma.InspectionChecklistItemUpdateInput {
    return {
      value: item.value,
      notes: item.notes,
      completed: item.completed,
      completedAt: item.completedAt,
      reviewDecision: item.reviewDecision ?? null,
      reviewNotes: item.reviewNotes ?? null,
      reviewedAt: item.reviewedAt ?? null,
    };
  }
}
