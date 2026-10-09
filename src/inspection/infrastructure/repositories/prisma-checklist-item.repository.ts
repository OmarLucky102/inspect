import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IChecklistItemRepository } from '../../domain/repositories/checklist-item.repository.interface';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';
import { ChecklistItemMapper } from '../persistence/checklist-item.mapper';

@Injectable()
export class PrismaChecklistItemRepository implements IChecklistItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ChecklistItem | null> {
    const row = await this.prisma.checklistItem.findUnique({
      where: { id },
    });
    return row ? ChecklistItemMapper.toDomain(row) : null;
  }

  async findByChecklistId(checklistId: string): Promise<ChecklistItem[]> {
    const rows = await this.prisma.checklistItem.findMany({
      where: { 
        checklistId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(ChecklistItemMapper.toDomain);
  }

  async findMandatoryItems(): Promise<ChecklistItem[]> {
    const rows = await this.prisma.checklistItem.findMany({
      where: { 
        isMandatory: true,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(ChecklistItemMapper.toDomain);
  }

  async save(item: ChecklistItem): Promise<void> {
    await this.prisma.checklistItem.create({
      data: ChecklistItemMapper.toCreateData(item),
    });
  }

  async update(item: ChecklistItem): Promise<void> {
    await this.prisma.checklistItem.update({
      where: { id: item.id },
      data: ChecklistItemMapper.toUpdateData(item),
    });
  }
}
