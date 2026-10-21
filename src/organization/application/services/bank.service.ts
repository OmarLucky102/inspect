import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IBankRepository } from '../../domain/repositories/bank.repository.interface';
import type { IBankMembershipRepository } from '../../domain/repositories/bank-membership.repository.interface';
import { Bank } from '../../domain/entities/bank.entity';
import { BankMembership } from '../../domain/entities/bank-membership.entity';
import { MembershipStatus } from '../../domain/value-objects/membership-status.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { User } from '../../../identity/domain/entities/user.entity';
import { UserService } from '../../../identity/application/services/user.service';
import {
  BankNotFoundException,
  BankCodeAlreadyExistsException,
  BankMembershipAlreadyExistsException,
  InvalidBankMemberRoleException,
} from '../../../shared/exceptions/organization.exceptions';

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

    private readonly userService: UserService,
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

  // ── Create User (via Identity) + Assign to Bank ──────────────────────────
  async createBankUser(
    input: CreateBankUserInput,
  ): Promise<{ user: User; membership: BankMembership }> {
    // 1. Validate bank exists
    await this.ensureBankExists(input.bankId);

    // 2. Validate role is allowed for bank members
    this.validateBankRole(input.role);

    // 3. Find or create the user through Identity abstraction
    let user: User;
    try {
      user = await this.userService.getUserByEmail(input.email);
    } catch {
      user = await this.userService.createUser({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
      });
    }

    // 4. Check if membership already exists for this specific bank
    const existing = await this.membershipRepository.findByBankIdAndUserId(
      input.bankId,
      user.id,
    );
    if (existing) {
      throw new BankMembershipAlreadyExistsException(
        user.id,
        input.bankId,
      );
    }

    // 5. Create the bank membership
    const membership = this.buildMembership(
      input.bankId,
      user.id,
      input.isPrimary,
    );
    await this.membershipRepository.save(membership);

    return { user, membership };
  }

  // ── Add Existing User to Bank ────────────────────────────────────────────
  async addBankMember(input: AddBankMemberInput): Promise<BankMembership> {
    // 1. Validate bank exists
    await this.ensureBankExists(input.bankId);

    // 2. Validate user exists (userService.getUserById throws if not found)
    const user = await this.userService.getUserById(input.userId);

    // 3. Validate role is allowed for bank members
    this.validateBankRole(user.role);

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

    const membership = this.buildMembership(
      input.bankId,
      input.userId,
      input.isPrimary,
    );
    await this.membershipRepository.save(membership);
    return membership;
  }

  // ── Remove User from Bank ────────────────────────────────────────────────
  async removeBankMember(bankId: string, userId: string): Promise<void> {
    await this.ensureBankExists(bankId);
    await this.membershipRepository.delete(bankId, userId);
  }

  // ── Assign User to Multiple Banks ────────────────────────────────────────
  async assignUserToBanks(
    userId: string,
    bankIds: string[],
    primaryBankId?: string,
  ): Promise<BankMembership[]> {
    const user = await this.userService.getUserById(userId);
    this.validateBankRole(user.role);

    const currentMemberships = await this.membershipRepository.findAllByUserId(userId);
    const targetSet = new Set(bankIds);

    // Remove memberships not in targetSet
    for (const cur of currentMemberships) {
      if (!targetSet.has(cur.bankId)) {
        await this.membershipRepository.delete(cur.bankId, userId);
      }
    }

    // Add new memberships
    const result: BankMembership[] = [];
    for (const bankId of bankIds) {
      await this.ensureBankExists(bankId);
      const isPrimary = primaryBankId ? primaryBankId === bankId : false;
      const existing = await this.membershipRepository.findByBankIdAndUserId(bankId, userId);
      if (!existing) {
        const membership = this.buildMembership(bankId, userId, isPrimary);
        await this.membershipRepository.save(membership);
        result.push(membership);
      } else {
        result.push(existing);
      }
    }

    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private async ensureBankExists(bankId: string): Promise<void> {
    const bank = await this.bankRepository.findById(bankId);
    if (!bank) throw new BankNotFoundException(bankId);
  }

  private validateBankRole(role: Role): void {
    if (!ALLOWED_BANK_MEMBER_ROLES.includes(role)) {
      throw new InvalidBankMemberRoleException(role);
    }
  }

  private buildMembership(
    bankId: string,
    userId: string,
    isPrimary?: boolean,
  ): BankMembership {
    return new BankMembership({
      id: randomUUID(),
      bankId,
      userId,
      isPrimary: isPrimary ?? false,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });
  }
}
