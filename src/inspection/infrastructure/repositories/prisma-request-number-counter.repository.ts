import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IRequestNumberCounterRepository } from '../../domain/repositories/request-number-counter.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaRequestNumberCounterRepository implements IRequestNumberCounterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextSequence(
    bankId: string,
    period: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = tx || this.prisma;

    // We retry up to 3 times for P2002 (Unique Constraint Violation) on upsert races
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await db.requestNumberCounter.upsert({
          where: {
            bankId_period: {
              bankId,
              period,
            },
          },
          update: {
            lastNumber: {
              increment: 1,
            },
          },
          create: {
            bankId,
            period,
            lastNumber: 1,
          },
        });
        return result.lastNumber;
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          retries--;
          if (retries === 0) throw error;
        } else {
          throw error;
        }
      }
    }
    throw new Error(
      'Failed to generate next sequence due to concurrency issues',
    );
  }
}
