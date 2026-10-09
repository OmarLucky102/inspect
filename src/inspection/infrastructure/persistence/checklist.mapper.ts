import { Checklist as PrismaChecklist, Prisma } from '@prisma/client';
import { Checklist } from '../../domain/entities/checklist.entity';

export class ChecklistMapper {
  static toDomain(prismaChecklist: PrismaChecklist): Checklist {
    return new Checklist({
      id: prismaChecklist.id,
      code: prismaChecklist.code,
      bankId: prismaChecklist.bankId,
      vehicleCategoryId: prismaChecklist.vehicleCategoryId,
      name: prismaChecklist.name,
      version: prismaChecklist.version,
      createdAt: prismaChecklist.createdAt,
      updatedAt: prismaChecklist.updatedAt,
    });
  }

  static toCreateData(checklist: Checklist): Prisma.ChecklistCreateInput {
    return {
      id: checklist.id,
      code: checklist.code,
      name: checklist.name,
      version: checklist.version,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
      ...(checklist.bankId ? { bank: { connect: { id: checklist.bankId } } } : {}),
      ...(checklist.vehicleCategoryId ? { vehicleCategory: { connect: { id: checklist.vehicleCategoryId } } } : {}),
    };
  }
}
