import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionRequestRepository } from '../../domain/repositories/inspection-request.repository.interface';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { InspectionRequestMapper } from '../persistence/inspection-request.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInspectionRequestRepository implements IInspectionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndBankId(
    id: string,
    bankId: string,
  ): Promise<InspectionRequest | null> {
    const row = await this.prisma.inspectionRequest.findUnique({
      where: { id },
    });
    if (!row || row.bankId !== bankId) return null;
    return InspectionRequestMapper.toDomain(row);
  }

  async findByBankId(bankId: string): Promise<InspectionRequest[]> {
    const rows = await this.prisma.inspectionRequest.findMany({
      where: { bankId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(InspectionRequestMapper.toDomain);
  }

  async findOpenByBankAndVehicleId(
    bankId: string,
    vehicleId: string,
  ): Promise<InspectionRequest[]> {
    const rows = await this.prisma.inspectionRequest.findMany({
      where: {
        bankId,
        vehicleId,
        currentStatus: {
          notIn: ['COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED'],
        },
      },
    });
    return rows.map(InspectionRequestMapper.toDomain);
  }

  async save(
    request: InspectionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionRequest.create({
      data: InspectionRequestMapper.toCreateData(request),
    });
  }

  async update(
    request: InspectionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionRequest.update({
      where: { id: request.id },
      data: InspectionRequestMapper.toUpdateData(request),
    });
  }
}
