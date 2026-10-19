import {
  MarketingValueDecision as PrismaMarketingValueDecision,
  Prisma,
} from '@prisma/client';
import { MarketingValueDecision } from '../../domain/entities/marketing-value-decision.entity';

export class MarketingValueDecisionMapper {
  static toDomain(
    prismaRecord: PrismaMarketingValueDecision,
  ): MarketingValueDecision {
    const val =
      prismaRecord.estimatedValue != null
        ? typeof prismaRecord.estimatedValue === 'object' &&
          'toNumber' in prismaRecord.estimatedValue
          ? (prismaRecord.estimatedValue as any).toNumber()
          : Number(prismaRecord.estimatedValue)
        : 0;

    return new MarketingValueDecision({
      id: prismaRecord.id,
      inspectionRequestId: prismaRecord.inspectionRequestId,
      estimatedValue: val,
      approved: prismaRecord.approved,
      notes: prismaRecord.notes,
      rejectedReason: prismaRecord.rejectedReason,
      reviewerId: prismaRecord.reviewerId,
      decidedAt: prismaRecord.decidedAt,
    });
  }

  static toCreateData(
    decision: MarketingValueDecision,
  ): Prisma.MarketingValueDecisionCreateInput {
    return {
      id: decision.id,
      estimatedValue: new Prisma.Decimal(decision.estimatedValue),
      approved: decision.approved,
      notes: decision.notes,
      rejectedReason: decision.rejectedReason,
      decidedAt: decision.decidedAt,
      inspectionRequest: {
        connect: { id: decision.inspectionRequestId },
      },
      reviewer: {
        connect: { id: decision.reviewerId },
      },
    };
  }

  static toUpdateData(
    decision: MarketingValueDecision,
  ): Prisma.MarketingValueDecisionUpdateInput {
    return {
      estimatedValue: new Prisma.Decimal(decision.estimatedValue),
      approved: decision.approved,
      notes: decision.notes,
      rejectedReason: decision.rejectedReason,
      decidedAt: decision.decidedAt,
    };
  }
}
