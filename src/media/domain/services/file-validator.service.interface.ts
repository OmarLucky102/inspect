export interface IFileValidatorService {
  validate(file?: Express.Multer.File): void;
  extractExtension(file: Express.Multer.File): string;
}
