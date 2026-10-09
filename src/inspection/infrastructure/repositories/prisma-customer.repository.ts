import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerMapper } from '../persistence/customer.mapper';

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBankIdAndPhone(
    bankId: string,
    phone: string,
  ): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({
      where: { bankId, phone },
    });
    return row ? CustomerMapper.toDomain(row) : null;
  }

  async save(customer: Customer): Promise<void> {
    await this.prisma.customer.create({
      data: CustomerMapper.toCreateData(customer),
    });
  }

  async update(customer: Customer): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: CustomerMapper.toUpdateData(customer),
    });
  }
}
