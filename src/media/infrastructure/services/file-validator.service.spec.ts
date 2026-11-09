import { BadRequestException } from '@nestjs/common';
import {
  FileValidatorService,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from './file-validator.service';
import {
  FileTooLargeException,
  UnsupportedMediaTypeException,
  FileCountLimitExceededException,
} from '../../../shared/exceptions/media.exceptions';

describe('FileValidatorService', () => {
  let service: FileValidatorService;

  beforeEach(() => {
    service = new FileValidatorService();
  });

  const createMockFile = (
    size: number,
    mimetype: string,
    originalname: string = 'test.jpg',
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size,
    buffer: Buffer.alloc(10),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  });

  describe('validate', () => {
    it('should throw BadRequestException if file is undefined', () => {
      expect(() => service.validate(undefined)).toThrow(BadRequestException);
    });

    it('should throw UnsupportedMediaTypeException for non-image and non-video files', () => {
      const pdfFile = createMockFile(1024, 'application/pdf', 'doc.pdf');
      expect(() => service.validate(pdfFile)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('should throw FileTooLargeException if image exceeds 25 MB', () => {
      const oversizedImage = createMockFile(
        MAX_IMAGE_SIZE_BYTES + 1,
        'image/jpeg',
      );
      expect(() => service.validate(oversizedImage)).toThrow(
        FileTooLargeException,
      );
    });

    it('should throw FileTooLargeException if video exceeds 100 MB', () => {
      const oversizedVideo = createMockFile(
        MAX_VIDEO_SIZE_BYTES + 1,
        'video/mp4',
        'clip.mp4',
      );
      expect(() => service.validate(oversizedVideo)).toThrow(
        FileTooLargeException,
      );
    });

    it('should successfully validate valid image within 25 MB', () => {
      const validImage = createMockFile(5 * 1024 * 1024, 'image/jpeg');
      expect(() => service.validate(validImage)).not.toThrow();
    });

    it('should successfully validate valid video within 100 MB', () => {
      const validVideo = createMockFile(
        50 * 1024 * 1024,
        'video/mp4',
        'clip.mp4',
      );
      expect(() => service.validate(validVideo)).not.toThrow();
    });
  });

  describe('validateImage', () => {
    it('should throw BadRequestException if file is undefined', () => {
      expect(() => service.validateImage(undefined)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file buffer is missing', () => {
      const fileWithoutBuffer = {
        ...createMockFile(1024, 'image/jpeg'),
        buffer: undefined as any,
      };
      expect(() => service.validateImage(fileWithoutBuffer)).toThrow(
        BadRequestException,
      );
    });

    it('should throw UnsupportedMediaTypeException if file is a video', () => {
      const videoFile = createMockFile(1024, 'video/mp4', 'test.mp4');
      expect(() => service.validateImage(videoFile)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('should throw UnsupportedMediaTypeException for non-image files', () => {
      const pdfFile = createMockFile(1024, 'application/pdf', 'doc.pdf');
      expect(() => service.validateImage(pdfFile)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('should throw FileTooLargeException if image exceeds 25 MB', () => {
      const oversizedImage = createMockFile(
        MAX_IMAGE_SIZE_BYTES + 1,
        'image/jpeg',
      );
      expect(() => service.validateImage(oversizedImage)).toThrow(
        FileTooLargeException,
      );
    });

    it('should successfully validate valid image within 25 MB', () => {
      const validImage = createMockFile(5 * 1024 * 1024, 'image/png');
      expect(() => service.validateImage(validImage)).not.toThrow();
    });
  });

  describe('validateFiles', () => {
    it('should throw BadRequestException for empty files array', () => {
      expect(() => service.validateFiles([])).toThrow(BadRequestException);
    });

    it('should throw FileCountLimitExceededException when images count exceeds 40', () => {
      const files: Express.Multer.File[] = Array.from({ length: 41 }, (_, i) =>
        createMockFile(1024, 'image/jpeg', `img-${i}.jpg`),
      );
      expect(() => service.validateFiles(files)).toThrow(
        FileCountLimitExceededException,
      );
    });

    it('should throw FileCountLimitExceededException when videos count exceeds 2', () => {
      const files: Express.Multer.File[] = Array.from({ length: 3 }, (_, i) =>
        createMockFile(1024, 'video/mp4', `vid-${i}.mp4`),
      );
      expect(() => service.validateFiles(files)).toThrow(
        FileCountLimitExceededException,
      );
    });

    it('should accept valid files collection within limits', () => {
      const files: Express.Multer.File[] = [
        ...Array.from({ length: 10 }, (_, i) =>
          createMockFile(1024, 'image/jpeg', `img-${i}.jpg`),
        ),
        createMockFile(1024, 'video/mp4', 'walkaround.mp4'),
      ];
      expect(() => service.validateFiles(files)).not.toThrow();
    });
  });

  describe('extractExtension', () => {
    it('should extract extension from filename', () => {
      expect(
        service.extractExtension(createMockFile(10, 'image/png', 'test.png')),
      ).toBe('png');
      expect(
        service.extractExtension(createMockFile(10, 'image/jpeg', 'test.jpeg')),
      ).toBe('jpg');
    });

    it('should infer extension from MIME subtype when filename has no extension', () => {
      expect(
        service.extractExtension(createMockFile(10, 'image/webp', 'blob')),
      ).toBe('webp');
      expect(
        service.extractExtension(createMockFile(10, 'video/quicktime', 'blob')),
      ).toBe('mov');
    });
  });
});
