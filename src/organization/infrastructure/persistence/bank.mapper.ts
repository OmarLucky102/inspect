import { Bank as PrismaBank } from '@prisma/client';
import { Bank } from '../../domain/entities/bank.entity';

export class BankMapper {
  static toDomain(prismaBank: PrismaBank): Bank {
    return new Bank({
      id: prismaBank.id,
      name: prismaBank.name,
      code: prismaBank.code,
      email: prismaBank.email,
      phone: prismaBank.phone,
      isActive: prismaBank.isActive,
      createdAt: prismaBank.createdAt,
      updatedAt: prismaBank.updatedAt,
    });
  }

  static toCreateData(bank: Bank) {
    return {
      id: bank.id,
      name: bank.name,
      code: bank.code,
      email: bank.email,
      phone: bank.phone,
      isActive: bank.isActive,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    };
  }

  static toUpdateData(bank: Bank) {
    return {
      name: bank.name,
      code: bank.code,
      email: bank.email,
      phone: bank.phone,
      isActive: bank.isActive,
      updatedAt: bank.updatedAt,
    };
  }
}
