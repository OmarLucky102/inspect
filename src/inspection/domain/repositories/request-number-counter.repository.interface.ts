import { Prisma } from '@prisma/client';

export interface IRequestNumberCounterRepository {
  nextSequence(
    bankId: string,
    period: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;
}
