import { Customer as PrismaCustomer, Prisma } from '@prisma/client';
import { Customer } from '../../domain/entities/customer.entity';

export class CustomerMapper {
  static toDomain(prismaCustomer: PrismaCustomer): Customer {
    return new Customer({
      id: prismaCustomer.id,
      bankId: prismaCustomer.bankId,
      fullName: prismaCustomer.fullName,
      nationalId: prismaCustomer.nationalId,
      phone: prismaCustomer.phone,
      email: prismaCustomer.email,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    });
  }

  static toCreateData(customer: Customer): Prisma.CustomerCreateInput {
    return {
      id: customer.id,
      fullName: customer.fullName,
      nationalId: customer.nationalId,
      phone: customer.phone,
      email: customer.email,
      bank: { connect: { id: customer.bankId } },
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  static toUpdateData(customer: Customer): Prisma.CustomerUpdateInput {
    return {
      fullName: customer.fullName,
      nationalId: customer.nationalId,
      phone: customer.phone,
      email: customer.email,
      updatedAt: customer.updatedAt,
    };
  }
}
