import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionRequestRepository } from '../../domain/repositories/inspection-request.repository.interface';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { InspectionRequestMapper } from '../persistence/inspection-request.mapper';
import { Prisma } from '@prisma/client';
import { InspectionRequestWithRelations } from '../../presentation/dto/inspection-request-detail.response.dto';

@Injectable()
export class PrismaInspectionRequestRepository implements IInspectionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<InspectionRequest | null> {
    const row = await this.prisma.inspectionRequest.findUnique({
      where: { id },
    });
    if (!row) return null;
    return InspectionRequestMapper.toDomain(row);
  }

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

  async findByIdWithDetails(
    id: string,
    bankId?: string,
  ): Promise<InspectionRequestWithRelations | null> {
    const row = await this.prisma.inspectionRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        originalTrim: true,
        governorate: true,
        city: true,
        assignedRepresentative: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vehicle: {
          include: {
            brand: true,
            model: true,
            category: true,
            color: true,
            fuelType: true,
            transmissionType: true,
            trim: true,
          },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            representative: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            assigner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        checklistItems: {
          include: {
            checklistItem: true,
          },
        },
        photoChecklist: true,
        marketingDecisions: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { decidedAt: 'desc' },
        },
      },
    });

    if (!row) return null;
    if (bankId && row.bankId !== bankId) return null;
    return row as unknown as InspectionRequestWithRelations;
  }

  async findByBankId(
    bankId: string,
    statusFilter?: string,
  ): Promise<InspectionRequest[]> {
    const statuses = statusFilter
      ? statusFilter
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const rows = await this.prisma.inspectionRequest.findMany({
      where: {
        bankId,
        ...(statuses && statuses.length > 0
          ? { currentStatus: { in: statuses as any[] } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => InspectionRequestMapper.toDomain(r));
  }

  async findOpenByBankAndVehicleId(
    bankId: string,
    vehicleIdOrVin: string,
  ): Promise<InspectionRequest[]> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        vehicleIdOrVin,
      );
    const rows = await this.prisma.inspectionRequest.findMany({
      where: {
        bankId,
        ...(isUuid
          ? {
              OR: [
                { vehicleId: vehicleIdOrVin },
                { vehicle: { vin: vehicleIdOrVin } },
              ],
            }
          : {
              vehicle: { vin: vehicleIdOrVin },
            }),
        currentStatus: {
          notIn: ['COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED'],
        },
      },
    });
    return rows.map((r) => InspectionRequestMapper.toDomain(r));
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
