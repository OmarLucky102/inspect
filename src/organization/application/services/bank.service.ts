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
  code?: string | null;
  email?: string | null;
  phone?: string | null;
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

  // ── Auto-generate Bank Code ───────────────────────────────────────────────
  /**
   * Generates a unique, clean uppercase bank code.
   * - If Latin characters are present: generates an acronym (e.g. "Commercial International Bank" -> "CIB").
   * - If acronym exists or name has no Latin letters (e.g. Arabic names): generates "BNK-001", "BNK-002", etc.
   */
  async generateBankCode(name: string): Promise<string> {
    const trimmed = (name || '').trim();
    const tokens = trimmed.split(/[\s\-_,.]+/).filter(Boolean);
    const stopWords = new Set([
      'AND', '&', 'THE', 'OF', 'FOR', 'DE', 'DU', 'EL', 'AL',
      'BANK', 'BANQUE', 'بنك', 'مصرف',
    ]);

    const latinTokens = tokens
      .filter((t) => /^[a-zA-Z0-9]+$/.test(t))
      .filter((t) => !stopWords.has(t.toUpperCase()));

    let candidateBase = '';
    if (latinTokens.length >= 2) {
      candidateBase = latinTokens
        .map((t) => t[0].toUpperCase())
        .join('')
        .slice(0, 8);
    } else if (latinTokens.length === 1) {
      candidateBase = latinTokens[0].toUpperCase().slice(0, 6);
    } else {
      const anyLatin = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (anyLatin.length >= 2) {
        candidateBase = anyLatin.slice(0, 6);
      }
    }

    if (candidateBase.length >= 2 && /^[A-Z0-9_-]+$/.test(candidateBase)) {
      const existing = await this.bankRepository.findByCode(candidateBase);
      if (!existing) {
        return candidateBase;
      }
      for (let suffix = 2; suffix <= 99; suffix++) {
        const candidateWithSuffix = `${candidateBase.slice(0, 16)}-${suffix}`;
        const match = await this.bankRepository.findByCode(candidateWithSuffix);
        if (!match) {
          return candidateWithSuffix;
        }
      }
    }

    // Fallback: sequential BNK-001, BNK-002, etc.
    const allBanks = await this.bankRepository.findAll();
    let maxNumber = 0;
    const bnkRegex = /^BNK[-_]?0*(\d+)$/i;

    for (const b of allBanks) {
      const match = bnkRegex.exec(b.code.trim());
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `BNK-${String(nextNumber).padStart(3, '0')}`;
  }

  // ── Create Bank ───────────────────────────────────────────────────────────
  async createBank(input: CreateBankInput): Promise<Bank> {
    let finalCode = input.code?.trim().toUpperCase();

    if (!finalCode) {
      finalCode = await this.generateBankCode(input.name);
    } else {
      const existing = await this.bankRepository.findByCode(finalCode);
      if (existing) {
        throw new BankCodeAlreadyExistsException(finalCode);
      }
    }

    const bank = new Bank({
      id: randomUUID(),
      name: input.name.trim(),
      code: finalCode,
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
