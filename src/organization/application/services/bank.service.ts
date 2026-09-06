import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { IBankRepository } from '../../domain/repositories/bank.repository.interface';
import { IBankMembershipRepository } from '../../domain/repositories/bank-membership.repository.interface';
import { IUserRepository } from '../../../identity/domain/repositories/user.repository.interface';
import { BcryptHasherService } from '../../../identity/infrastructure/services/bcrypt-hasher.service';
import { Bank } from '../../domain/entities/bank.entity';
import { BankMembership } from '../../domain/entities/bank-membership.entity';
import { User } from '../../../identity/domain/entities/user.entity';
import { MembershipStatus } from '../../domain/value-objects/membership-status.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { RoleMapper } from '../../../identity/infrastructure/persistence/role.mapper';
import { BankMembershipMapper } from '../../infrastructure/persistence/bank-membership.mapper';
import { UserMapper } from '../../../identity/infrastructure/persistence/user.mapper';
import {
  BankNotFoundException,
  BankCodeAlreadyExistsException,
  BankMembershipAlreadyExistsException,
  InvalidBankMemberRoleException,
} from '../../../shared/exceptions/organization.exceptions';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
} from '../../../shared/exceptions/user.exceptions';

// Roles that can belong to a bank (SUPER_ADMIN and SYSTEM_ADMIN manage platform, not banks)
const ALLOWED_BANK_MEMBER_ROLES: Role[] = [
  Role.MANAGER,
  Role.REVIEWER,
  Role.USER,
  Role.VIEWER,
  Role.REPRESENTATIVE,
];

export interface CreateBankInput {
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export interface CreateBankUserInput {
  bankId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  isPrimary?: boolean;
}

export interface AddBankMemberInput {
  bankId: string;
  userId: string;
  isPrimary?: boolean;
}

@Injectable()
export class BankService {
  constructor(
    @Inject('IBankRepository')
    private readonly bankRepository: IBankRepository,

    @Inject('IBankMembershipRepository')
    private readonly membershipRepository: IBankMembershipRepository,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    private readonly bcryptHasher: BcryptHasherService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Create Bank ───────────────────────────────────────────────────────────
  async createBank(input: CreateBankInput): Promise<Bank> {
    const existing = await this.bankRepository.findByCode(input.code);
    if (existing) {
      throw new BankCodeAlreadyExistsException(input.code);
    }

    const bank = new Bank({
      id: randomUUID(),
      name: input.name,
      code: input.code.toUpperCase(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.bankRepository.save(bank);
    return bank;
  }

  // ── List Banks ────────────────────────────────────────────────────────────
  async listBanks(): Promise<Bank[]> {
    return this.bankRepository.findAll();
  }

  // ── Get Bank ──────────────────────────────────────────────────────────────
  async getBankById(bankId: string): Promise<Bank> {
    const bank = await this.bankRepository.findById(bankId);
    if (!bank) throw new BankNotFoundException(bankId);
    return bank;
  }

  // ── Create User + Assign to Bank (Atomic) ────────────────────────────────
  async createBankUser(
    input: CreateBankUserInput,
  ): Promise<{ user: User; membership: BankMembership }> {
    // 1. Validate bank exists
    const bank = await this.bankRepository.findById(input.bankId);
    if (!bank) throw new BankNotFoundException(input.bankId);

    // 2. Validate role is allowed for bank members
    if (!ALLOWED_BANK_MEMBER_ROLES.includes(input.role)) {
      throw new InvalidBankMemberRoleException(input.role);
    }

    // 3. Validate email is not taken
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) throw new UserAlreadyExistsException(input.email);

    // 4. Hash password
    const passwordHash = await this.bcryptHasher.hash(input.password);

    const userId = randomUUID();
    const membershipId = randomUUID();
    const now = new Date();

    // 5. Atomic transaction: create user + membership together
    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: RoleMapper.toPrisma(input.role),
          isEmailVerified: false,
          emailVerifiedAt: null,
          isActive: true,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.bankMembership.create({
        data: {
          id: membershipId,
          bankId: input.bankId,
          userId,
          isPrimary: input.isPrimary ?? false,
          status: 'ACTIVE',
          joinedAt: now,
        },
      });
    });

    // 6. Re-fetch from DB and return as domain objects
    const user = await this.userRepository.findById(userId);
    const membership = await this.membershipRepository.findByBankIdAndUserId(
      input.bankId,
      userId,
    );

    return { user: user!, membership: membership! };
  }

  // ── Add Existing User to Bank ────────────────────────────────────────────
  async addBankMember(input: AddBankMemberInput): Promise<BankMembership> {
    // 1. Validate bank exists
    const bank = await this.bankRepository.findById(input.bankId);
    if (!bank) throw new BankNotFoundException(input.bankId);

    // 2. Validate user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new UserNotFoundException(input.userId);

    // 3. Validate role is allowed for bank members
    if (!ALLOWED_BANK_MEMBER_ROLES.includes(user.role)) {
      throw new InvalidBankMemberRoleException(user.role);
    }

    // 4. Check for duplicate membership
    const existing = await this.membershipRepository.findByBankIdAndUserId(
      input.bankId,
      input.userId,
    );
    if (existing) {
      throw new BankMembershipAlreadyExistsException(
        input.userId,
        input.bankId,
      );
    }

    const membership = new BankMembership({
      id: randomUUID(),
      bankId: input.bankId,
      userId: input.userId,
      isPrimary: input.isPrimary ?? false,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
