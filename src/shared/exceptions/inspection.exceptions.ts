import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InspectionRequestNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Inspection request with ID '${id}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class InspectionRequestAlreadyExistsException extends BaseException {
  constructor(vin: string) {
    super(
      `An active inspection request for VIN '${vin}' already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidInspectionRequestStateException extends BaseException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class VehicleDataRequiredException extends BaseException {
  constructor() {
    super(
      'Vehicle data is required to submit an inspection request',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidReferenceDataException extends BaseException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
