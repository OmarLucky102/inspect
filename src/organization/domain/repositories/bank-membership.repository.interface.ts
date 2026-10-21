import { BankMembership } from '../entities/bank-membership.entity';

export interface IBankMembershipRepository {
  findByBankIdAndUserId(
    bankId: string,
    userId: string,
  ): Promise<BankMembership | null>;
  findAllByBankId(bankId: string): Promise<BankMembership[]>;
  findAllByUserId(userId: string): Promise<BankMembership[]>;
  save(membership: BankMembership): Promise<void>;
  delete(bankId: string, userId: string): Promise<void>;
}
