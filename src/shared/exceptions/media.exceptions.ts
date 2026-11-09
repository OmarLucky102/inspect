import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InvalidImageFormatException extends BaseException {
  constructor(message: string = 'Invalid or corrupted image format') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class FileTooLargeException extends BaseException {
  constructor(message: string = 'File size exceeds allowed limit') {
    super(message, HttpStatus.PAYLOAD_TOO_LARGE);
  }
}

export class AggregateRequestSizeExceededException extends BaseException {
  constructor(
    message: string = 'Aggregate request payload exceeds allowed limit',
  ) {
    super(message, HttpStatus.PAYLOAD_TOO_LARGE);
  }
}

export class FileCountLimitExceededException extends BaseException {
  constructor(
    message: string = 'Number of uploaded files exceeds allowed limit',
  ) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UnsupportedMediaTypeException extends BaseException {
  constructor(message: string = 'Only image and video files are allowed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
