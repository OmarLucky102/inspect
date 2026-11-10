import { PipeTransform, Injectable, Inject } from '@nestjs/common';
import type { IFileValidatorService } from '../../domain/services/file-validator.service.interface';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    @Inject('IFileValidatorService')
    private readonly fileValidator: IFileValidatorService,
  ) {}

  transform(value: Express.Multer.File | undefined) {
    this.fileValidator.validate(value);
    return value;
  }
}
