export interface IFileValidatorService {
  validate(file?: Express.Multer.File): void;
  validateImage(file?: Express.Multer.File): void;
  validateVideo(file?: Express.Multer.File): void;
  validateFiles?(files: Express.Multer.File[]): void;
  extractExtension(file: Express.Multer.File): string;
}
