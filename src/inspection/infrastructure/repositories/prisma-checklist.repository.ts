import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IChecklistRepository } from '../../domain/repositories/checklist.repository.interface';
import { Checklist } from '../../domain/entities/checklist.entity';
import { ChecklistMapper } from '../persistence/checklist.mapper';

@Injectable()
export class PrismaChecklistRepository implements IChecklistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<Checklist | null> {
    const row = await this.prisma.checklist.findUnique({
      where: { code },
    });
    return row ? ChecklistMapper.toDomain(row) : null;
  }

  async findByCategoryId(categoryId: string): Promise<Checklist[]> {
    const rows = await this.prisma.checklist.findMany({
      where: { vehicleCategoryId: categoryId },
    });
    return rows.map(ChecklistMapper.toDomain);
  }

  async findById(id: string): Promise<Checklist | null> {
    const row = await this.prisma.checklist.findUnique({
      where: { id },
    });
    return row ? ChecklistMapper.toDomain(row) : null;
  }
}
