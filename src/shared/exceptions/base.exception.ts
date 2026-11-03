import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  public readonly isOperational: boolean;
  public readonly statusText: string;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, statusCode);
    this.isOperational = true;
    this.statusText = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}
