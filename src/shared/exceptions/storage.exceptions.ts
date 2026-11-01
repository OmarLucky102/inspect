import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class StorageOperationException extends BaseException {
  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, statusCode);
  }
}

