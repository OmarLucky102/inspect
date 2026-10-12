import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionStatusHistoryRepository } from '../../domain/repositories/inspection-status-history.repository.interface';
import { InspectionStatusHistory } from '../../domain/entities/inspection-status-history.entity';
import { InspectionStatusHistoryMapper } from '../persistence/inspection-status-history.mapper';
import { Prisma } from '@prisma/client';

import { StatusHistoryRecord } from '../../presentation/dto/inspection-status-history.response.dto';

@Injectable()
export class PrismaInspectionStatusHistoryRepository implements IInspectionStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    history: InspectionStatusHistory,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionStatusHistory.create({
      data: InspectionStatusHistoryMapper.toCreateData(history),
    });
  }

  async findByRequestId(requestId: string): Promise<InspectionStatusHistory[]> {
    const rows = await this.prisma.inspectionStatusHistory.findMany({
      where: { inspectionRequestId: requestId },
      orderBy: { changedAt: 'asc' },
    });
    return rows.map((r) => InspectionStatusHistoryMapper.toDomain(r));
  }

  async findByRequestIdWithDetails(
    requestId: string,
  ): Promise<StatusHistoryRecord[]> {
    const rows = await this.prisma.inspectionStatusHistory.findMany({
      where: { inspectionRequestId: requestId },
      include: {
        changer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { changedAt: 'asc' },
    });
    return rows as unknown as StatusHistoryRecord[];
  }
}
