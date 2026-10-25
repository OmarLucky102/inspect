import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BankNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Bank with identifier '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class BankCodeAlreadyExistsException extends BaseException {
  constructor(code: string) {
    super(`A bank with code '${code}' already exists`, HttpStatus.CONFLICT);
  }
}

export class BankMembershipAlreadyExistsException extends BaseException {
  constructor(userId?: string, bankId?: string, customMessage?: string) {
    super(
      customMessage || 'This user is already assigned to this bank.',
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidBankMemberRoleException extends BaseException {
  constructor(role: string, customMessage?: string) {
    super(
      customMessage ||
        `Role '${role}' is not allowed for bank members. Platform roles (SUPER_ADMIN, SYSTEM_ADMIN) cannot belong to a bank workspace.`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
