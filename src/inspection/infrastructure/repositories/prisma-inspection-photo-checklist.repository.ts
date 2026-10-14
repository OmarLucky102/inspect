import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionPhotoChecklistRepository } from '../../domain/repositories/inspection-photo-checklist.repository.interface';
import { InspectionPhotoChecklist } from '../../domain/entities/inspection-photo-checklist.entity';
import { InspectionPhotoChecklistMapper } from '../persistence/inspection-photo-checklist.mapper';

@Injectable()
export class PrismaInspectionPhotoChecklistRepository implements IInspectionPhotoChecklistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRequestId(
    requestId: string,
  ): Promise<InspectionPhotoChecklist | null> {
    const raw = await this.prisma.inspectionPhotoChecklist.findUnique({
      where: { inspectionRequestId: requestId },
    });
    return raw ? InspectionPhotoChecklistMapper.toDomain(raw) : null;
  }

  async save(checklist: InspectionPhotoChecklist): Promise<void> {
    await this.prisma.inspectionPhotoChecklist.create({
      data: InspectionPhotoChecklistMapper.toCreateData(checklist),
    });
  }

  async upsert(checklist: InspectionPhotoChecklist): Promise<void> {
    const createData = InspectionPhotoChecklistMapper.toCreateData(checklist);
    const updateData = InspectionPhotoChecklistMapper.toUpdateData(checklist);

    await this.prisma.inspectionPhotoChecklist.upsert({
      where: { inspectionRequestId: checklist.inspectionRequestId },
      create: createData,
      update: updateData,
    });
  }
}
