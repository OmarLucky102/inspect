import { MarketingValueDecision } from '../entities/marketing-value-decision.entity';
import { Prisma } from '@prisma/client';

export interface IMarketingValueDecisionRepository {
  save(
    decision: MarketingValueDecision,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  update(
    decision: MarketingValueDecision,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  findLatestByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MarketingValueDecision | null>;
  findByRequestId(requestId: string): Promise<MarketingValueDecision[]>;
}
