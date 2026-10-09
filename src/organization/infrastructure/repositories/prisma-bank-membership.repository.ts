import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IBankMembershipRepository } from '../../domain/repositories/bank-membership.repository.interface';
import { BankMembership } from '../../domain/entities/bank-membership.entity';
import { BankMembershipMapper } from '../persistence/bank-membership.mapper';

@Injectable()
export class PrismaBankMembershipRepository implements IBankMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBankIdAndUserId(
    bankId: string,
    userId: string,
  ): Promise<BankMembership | null> {
    const row = await this.prisma.bankMembership.findUnique({
      where: { bankId_userId: { bankId, userId } },
    });
    return row ? BankMembershipMapper.toDomain(row) : null;
  }

  async findAllByBankId(bankId: string): Promise<BankMembership[]> {
    const rows = await this.prisma.bankMembership.findMany({
      where: { bankId },
      orderBy: { joinedAt: 'desc' },
    });
    return rows.map(row => BankMembershipMapper.toDomain(row));
  }

  async save(membership: BankMembership): Promise<void> {
    await this.prisma.bankMembership.create({
      data: BankMembershipMapper.toCreateData(membership),
    });
  }
}
