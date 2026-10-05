import {
  BankMembership as PrismaBankMembership,
  MembershipStatus as PrismaStatus,
} from '@prisma/client';
import { BankMembership } from '../../domain/entities/bank-membership.entity';
import { MembershipStatus } from '../../domain/value-objects/membership-status.enum';

const PRISMA_TO_DOMAIN: Record<PrismaStatus, MembershipStatus> = {
  [PrismaStatus.PENDING]: MembershipStatus.PENDING,
  [PrismaStatus.ACTIVE]: MembershipStatus.ACTIVE,
  [PrismaStatus.SUSPENDED]: MembershipStatus.SUSPENDED,
  [PrismaStatus.REMOVED]: MembershipStatus.REMOVED,
};

const DOMAIN_TO_PRISMA: Record<MembershipStatus, PrismaStatus> = {
  [MembershipStatus.PENDING]: PrismaStatus.PENDING,
  [MembershipStatus.ACTIVE]: PrismaStatus.ACTIVE,
  [MembershipStatus.SUSPENDED]: PrismaStatus.SUSPENDED,
  [MembershipStatus.REMOVED]: PrismaStatus.REMOVED,
};

export class BankMembershipMapper {
  static toDomain(prisma: PrismaBankMembership): BankMembership {
    return new BankMembership({
      id: prisma.id,
      bankId: prisma.bankId,
      userId: prisma.userId,
      isPrimary: prisma.isPrimary,
      status: PRISMA_TO_DOMAIN[prisma.status],
      joinedAt: prisma.joinedAt,
    });
  }

  static toCreateData(membership: BankMembership) {
    return {
      id: membership.id,
      bankId: membership.bankId,
      userId: membership.userId,
      isPrimary: membership.isPrimary,
      status: DOMAIN_TO_PRISMA[membership.status],
      joinedAt: membership.joinedAt,
    };
  }
}
