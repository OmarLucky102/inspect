import { User } from '../../domain/entities/user.entity';
import { User as PrismaUser } from '@prisma/client';
import { RoleMapper } from './role.mapper';

export class UserMapper {
  // Prisma → Domain

  static toDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      phone: prismaUser.phone,
      role: RoleMapper.toDomain(prismaUser.role),
      isEmailVerified: prismaUser.isEmailVerified,
      emailVerifiedAt: prismaUser.emailVerifiedAt,
      isActive: prismaUser.isActive,
      lastLoginAt: prismaUser.lastLoginAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
  // Domain → Prisma Create Data
  static toCreateData(user: User) {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: RoleMapper.toPrisma(user.role),
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Domain → Prisma Update Data
  static toUpdateData(user: User) {
    return {
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: RoleMapper.toPrisma(user.role),
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  }
}
