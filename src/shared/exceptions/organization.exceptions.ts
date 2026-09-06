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
  constructor(userId: string, bankId: string) {
    super(
      `User '${userId}' is already a member of bank '${bankId}'`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidBankMemberRoleException extends BaseException {
  constructor(role: string) {
    super(
      `Role '${role}' is not allowed for bank members. Allowed roles: MANAGER, REVIEWER, USER, VIEWER, REPRESENTATIVE`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
