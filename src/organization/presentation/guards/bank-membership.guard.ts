import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import type { IBankMembershipRepository } from '../../domain/repositories/bank-membership.repository.interface';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../domain/value-objects/membership-status.enum';

@Injectable()
export class BankMembershipGuard implements CanActivate {
  constructor(
    @Inject('IBankMembershipRepository')
    private readonly membershipRepository: IBankMembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { role: string; sub?: string; id?: string }, params: any, body: any, query: any }>();
    const user = request.user;
    const bankId =
      request.params.bankId || request.body.bankId || request.query.bankId;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Super Admins can access everything
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    if (!bankId) {
      throw new ForbiddenException('Bank ID is required for this operation');
    }

    const membership = await this.membershipRepository.findByBankIdAndUserId(
      bankId,
      user.sub! || user.id!,
    );

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException(
        `User is not an active member of bank '${bankId}'`,
      );
    }

    return true;
  }
}
