import { Role } from '../../domain/value-objects/role.enum';
import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  phone!: string;
  role!: Role;
  isActive!: boolean;
  status!: 'ACTIVE' | 'INACTIVE';
  isEmailVerified!: boolean;
  emailVerifiedAt!: Date | null;
  lastLoginAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
