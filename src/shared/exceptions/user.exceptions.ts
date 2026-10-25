import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class UserNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `User with identifier '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UserAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends BaseException {
  constructor() {
    super('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }
}

export class UserAlreadyActiveException extends BaseException {
  constructor(email: string) {
    super(
      `User with email '${email}' is already active`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserAlreadyDeactivatedException extends BaseException {
  constructor(email: string) {
    super(
      `User with email '${email}' is already deactivated`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class SamePasswordException extends BaseException {
  constructor() {
    super(
      'New password cannot be the same as the old password',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserAlreadyInactiveException extends UserAlreadyDeactivatedException {}

export class CannotDeleteSelfException extends BaseException {
  constructor() {
    super('You cannot delete your own account', HttpStatus.FORBIDDEN);
  }
}

export class CannotDeactivateSelfException extends BaseException {
  constructor() {
    super('You cannot deactivate your own account', HttpStatus.FORBIDDEN);
  }
}

export class InvalidRoleAssignmentException extends BaseException {
  constructor(role: string) {
    super(`Invalid role assignment: '${role}'`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

