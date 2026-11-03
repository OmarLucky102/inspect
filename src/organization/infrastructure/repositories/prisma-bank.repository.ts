import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IBankRepository } from '../../domain/repositories/bank.repository.interface';
import { Bank } from '../../domain/entities/bank.entity';
import { BankMapper } from '../persistence/bank.mapper';

@Injectable()
export class PrismaBankRepository implements IBankRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Bank | null> {
    const row = await this.prisma.bank.findUnique({ where: { id } });
    return row ? BankMapper.toDomain(row) : null;
  }

  async findByCode(code: string): Promise<Bank | null> {
    const row = await this.prisma.bank.findUnique({ where: { code } });
    return row ? BankMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Bank[]> {
    const rows = await this.prisma.bank.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => BankMapper.toDomain(row));
  }

  async save(bank: Bank): Promise<void> {
    await this.prisma.bank.create({ data: BankMapper.toCreateData(bank) });
  }

  async update(bank: Bank): Promise<void> {
    await this.prisma.bank.update({
      where: { id: bank.id },
      data: BankMapper.toUpdateData(bank),
    });
  }
}
