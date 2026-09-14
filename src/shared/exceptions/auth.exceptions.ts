import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class RefreshTokenNotFoundException extends BaseException {
  constructor() {
    super('Refresh token not found', HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenExpiredException extends BaseException {
  constructor() {
    super('Refresh token has expired', HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenRevokedException extends BaseException {
  constructor() {
    super(
      'Refresh token has been revoked. All sessions have been terminated.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class RefreshTokenReuseDetectedException extends BaseException {
  constructor() {
    super(
      'Refresh token reuse detected. All sessions have been terminated.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
