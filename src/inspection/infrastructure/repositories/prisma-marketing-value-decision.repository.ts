import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IMarketingValueDecisionRepository } from '../../domain/repositories/marketing-value-decision.repository.interface';
import { MarketingValueDecision } from '../../domain/entities/marketing-value-decision.entity';
import { MarketingValueDecisionMapper } from '../persistence/marketing-value-decision.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaMarketingValueDecisionRepository
  implements IMarketingValueDecisionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async save(
    decision: MarketingValueDecision,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.marketingValueDecision.create({
      data: MarketingValueDecisionMapper.toCreateData(decision),
    });
  }

  async update(
    decision: MarketingValueDecision,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.marketingValueDecision.update({
      where: { id: decision.id },
      data: MarketingValueDecisionMapper.toUpdateData(decision),
    });
  }

  async findLatestByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MarketingValueDecision | null> {
    const db = tx || this.prisma;
    const row = await db.marketingValueDecision.findFirst({
      where: { inspectionRequestId: requestId },
      orderBy: { decidedAt: 'desc' },
    });
    return row ? MarketingValueDecisionMapper.toDomain(row) : null;
  }

  async findByRequestId(requestId: string): Promise<MarketingValueDecision[]> {
    const rows = await this.prisma.marketingValueDecision.findMany({
      where: { inspectionRequestId: requestId },
      orderBy: { decidedAt: 'desc' },
    });
    return rows.map((r) => MarketingValueDecisionMapper.toDomain(r));
  }
}
