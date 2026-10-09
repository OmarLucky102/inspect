import { ChecklistItem as PrismaChecklistItem, Prisma } from '@prisma/client';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';
import { ChecklistInputType } from '../../domain/value-objects/checklist-input-type.enum';

export class ChecklistItemMapper {
  static toDomain(prismaItem: PrismaChecklistItem): ChecklistItem {
    return new ChecklistItem({
      id: prismaItem.id,
      checklistId: prismaItem.checklistId,
      bankId: prismaItem.bankId,
      code: prismaItem.code,
      label: prismaItem.label,
      description: prismaItem.description,
      isRequired: prismaItem.isRequired,
      isMandatory: prismaItem.isMandatory,
      weight: prismaItem.weight,
      inputType: prismaItem.inputType as ChecklistInputType,
      options: prismaItem.options,
      sortOrder: prismaItem.sortOrder,
      isActive: prismaItem.isActive,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
      deletedAt: prismaItem.deletedAt,
    });
  }

  static toCreateData(item: ChecklistItem): Prisma.ChecklistItemCreateInput {
    return {
      id: item.id,
      code: item.code,
      label: item.label,
      description: item.description,
      isRequired: item.isRequired,
      isMandatory: item.isMandatory,
      weight: item.weight,
      inputType: item.inputType,
      options: item.options,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
      checklist: { connect: { id: item.checklistId } },
      ...(item.bankId ? { bank: { connect: { id: item.bankId } } } : {}),
    };
  }

  static toUpdateData(item: ChecklistItem): Prisma.ChecklistItemUpdateInput {
    return {
      label: item.label,
      description: item.description,
      isRequired: item.isRequired,
      isMandatory: item.isMandatory,
      weight: item.weight,
      inputType: item.inputType,
      options: item.options,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }
}
