import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BatchUploadMediaUseCase } from './batch-upload-media.use-case';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import {
  UnsupportedMediaTypeException,
  FileTooLargeException,
  InvalidImageFormatException,
} from '../../../shared/exceptions/media.exceptions';
import {
  InspectionRequestNotFoundException,
  InvalidInspectionRequestStateException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';

describe('BatchUploadMediaUseCase', () => {
  let useCase: BatchUploadMediaUseCase;
  let mediaRepository: any;
  let fileValidator: any;
  let imageProcessor: any;
  let contextValidator: any;
  let s3StorageService: any;

  const mockInspectionId = 'insp-uuid-1111';
  const mockBankId = 'bank-uuid-2222';
  const mockCaptureSessionId = 'session-uuid-3333';
  const mockCategoryId = 'cat-uuid-4444';
  const mockUserId = 'user-uuid-5555';

  const mockActor = {
    id: mockUserId,
    role: Role.REPRESENTATIVE,
  };

  const createMockFile = (
    name: string,
    mime: string = 'image/jpeg',
    size: number = 2048,
  ): Express.Multer.File => ({
    fieldname: 'files',
    originalname: name,
    encoding: '7bit',
    mimetype: mime,
    buffer: Buffer.from(`bytes-for-${name}`),
    size,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  });

  beforeEach(async () => {
    mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    fileValidator = {
      validateImage: jest.fn(),
      extractExtension: jest.fn((f: Express.Multer.File) =>
        f.mimetype === 'image/png' ? 'png' : 'jpg',
      ),
    };

    imageProcessor = {
      process: jest.fn().mockResolvedValue({
        buffer: Buffer.from('processed-webp-bytes'),
        mimeType: 'image/webp',
        extension: 'webp',
        size: 1024,
        width: 1920,
        height: 1080,
      }),
    };

    contextValidator = {
      validateAndResolve: jest.fn().mockResolvedValue({
        inspectionId: mockInspectionId,
        bankId: mockBankId,
        captureSessionId: mockCaptureSessionId,
        categoryId: mockCategoryId,
      }),
    };

    s3StorageService = {
      upload: jest.fn().mockResolvedValue('key'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchUploadMediaUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: 'IFileValidatorService', useValue: fileValidator },
        { provide: 'IImageProcessorService', useValue: imageProcessor },
        {
          provide: InspectionMediaContextValidator,
          useValue: contextValidator,
        },
        { provide: S3StorageService, useValue: s3StorageService },
      ],
    }).compile();

    useCase = module.get<BatchUploadMediaUseCase>(BatchUploadMediaUseCase);
  });

  describe('Batch-Level Validation', () => {
    it('should throw BadRequestException when files array is undefined', async () => {
      await expect(
        useCase.execute(
          undefined,
          { inspectionId: mockInspectionId },
          mockActor,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when files array is empty', async () => {
      await expect(
        useCase.execute([], { inspectionId: mockInspectionId }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when files count exceeds 36', async () => {
      const oversizedFiles = Array.from({ length: 37 }, (_, i) =>
        createMockFile(`photo-${i}.jpg`),
      );

      await expect(
        useCase.execute(
          oversizedFiles,
          { inspectionId: mockInspectionId },
          mockActor,
        ),
      ).rejects.toThrow(
        new BadRequestException('A maximum of 36 images per batch is allowed'),
      );
    });

    it('should reject batch if contextValidator throws InspectionRequestNotFoundException', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestNotFoundException(mockInspectionId),
      );

      await expect(
        useCase.execute(
          [createMockFile('photo.jpg')],
          { inspectionId: mockInspectionId },
          mockActor,
        ),
      ).rejects.toThrow(InspectionRequestNotFoundException);
    });

    it('should reject batch if contextValidator throws InvalidInspectionRequestStateException', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InvalidInspectionRequestStateException(
          'Inspection request is COMPLETED',
        ),
      );

      await expect(
        useCase.execute(
          [createMockFile('photo.jpg')],
          { inspectionId: mockInspectionId },
          mockActor,
        ),
      ).rejects.toThrow(InvalidInspectionRequestStateException);
    });

    it('should reject batch if contextValidator throws InspectionRequestAccessDeniedException', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestAccessDeniedException('Access denied'),
      );

      await expect(
        useCase.execute(
          [createMockFile('photo.jpg')],
          { inspectionId: mockInspectionId },
          mockActor,
        ),
      ).rejects.toThrow(InspectionRequestAccessDeniedException);
    });
  });

  describe('Happy Path — Batch Processing', () => {
    it('should upload a batch of 3 images successfully and return UPLOADED status', async () => {
      const files = [
        createMockFile('front.jpg'),
        createMockFile('rear.jpg'),
        createMockFile('side.png', 'image/png'),
      ];

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId, sortOrder: 0 },
        mockActor,
      );

      expect(result.total).toBe(3);
      expect(result.uploaded).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);

      expect(result.results[0]).toMatchObject({
        status: 'UPLOADED',
        fileName: 'front.webp',
        width: 1920,
        height: 1080,
      });

      expect(mediaRepository.save).toHaveBeenCalledTimes(3);
      expect(s3StorageService.upload).toHaveBeenCalledTimes(3);
      expect(mediaRepository.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('Partial Success & Fault Tolerance', () => {
    it('should handle corrupt image by recording PENDING then FAILED in DB and reporting INVALID_IMAGE', async () => {
      const files = [
        createMockFile('valid-1.jpg'),
        createMockFile('corrupt.jpg'),
        createMockFile('valid-2.jpg'),
      ];

      // Second file triggers Sharp processing failure
      imageProcessor.process.mockImplementation(async (buffer: Buffer) => {
        if (buffer.toString().includes('corrupt.jpg')) {
          throw new InvalidImageFormatException(
            'Input buffer contains unsupported image format',
          );
        }
        return {
          buffer: Buffer.from('processed-webp'),
          mimeType: 'image/webp',
          extension: 'webp',
          size: 500,
          width: 800,
          height: 600,
        };
      });

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.total).toBe(3);
      expect(result.uploaded).toBe(2);
      expect(result.failed).toBe(1);

      const failedItem = result.results.find(
        (r) => r.fileName === 'corrupt.jpg',
      );
      expect(failedItem).toMatchObject({
        status: 'FAILED',
        errorCode: 'INVALID_IMAGE',
        errorMessage: 'Invalid or corrupted image format',
        retryable: false,
      });

      // Verify that corrupt image was initially saved to DB, then updated to FAILED
      expect(mediaRepository.save).toHaveBeenCalledTimes(3);
      expect(mediaRepository.update).toHaveBeenCalledTimes(3);
    });

    it('should reject video files with UNSUPPORTED_MEDIA_TYPE without saving to DB', async () => {
      const files = [
        createMockFile('photo.jpg', 'image/jpeg'),
        createMockFile('walkaround.mp4', 'video/mp4'),
      ];

      fileValidator.validateImage.mockImplementation(
        (file: Express.Multer.File) => {
          if (file.mimetype === 'video/mp4') {
            throw new UnsupportedMediaTypeException(
              'Only image files are allowed on this endpoint',
            );
          }
        },
      );

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.total).toBe(2);
      expect(result.uploaded).toBe(1);
      expect(result.failed).toBe(1);

      const videoResult = result.results.find(
        (r) => r.fileName === 'walkaround.mp4',
      );
      expect(videoResult).toMatchObject({
        status: 'FAILED',
        errorCode: 'UNSUPPORTED_MEDIA_TYPE',
        retryable: false,
      });

      // Video should NOT have a DB record saved
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should reject oversized image with FILE_TOO_LARGE', async () => {
      const files = [createMockFile('huge.jpg')];

      fileValidator.validateImage.mockImplementation(() => {
        throw new FileTooLargeException(
          'Image file size exceeds the limit of 25 MB',
        );
      });

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.failed).toBe(1);
      expect(result.results[0]).toMatchObject({
        status: 'FAILED',
        errorCode: 'FILE_TOO_LARGE',
        retryable: false,
      });
    });

    it('should handle S3 upload failure by marking DB record FAILED and reporting STORAGE_ERROR', async () => {
      const files = [createMockFile('photo.jpg')];
      s3StorageService.upload.mockRejectedValue(
        new Error('SeaweedFS connection timeout'),
      );

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.uploaded).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0]).toMatchObject({
        status: 'FAILED',
        errorCode: 'STORAGE_ERROR',
        errorMessage: 'SeaweedFS connection timeout',
        retryable: true,
      });

      // DB should be saved as PENDING and then updated to FAILED
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should trigger compensating S3 deletion when DB update to UPLOADED fails', async () => {
      const files = [createMockFile('photo.jpg')];
      mediaRepository.update.mockRejectedValue(
        new Error('Database deadlock on commit'),
      );

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.failed).toBe(1);
      expect(result.results[0]).toMatchObject({
        status: 'FAILED',
        errorCode: 'DATABASE_ERROR',
        retryable: true,
      });

      // Verify compensating delete was attempted
      expect(s3StorageService.delete).toHaveBeenCalledTimes(1);
    });

    it('should log ORPHANED_S3_OBJECT if S3 delete fails during compensating cleanup', async () => {
      const files = [createMockFile('photo.jpg')];
      mediaRepository.update.mockRejectedValue(new Error('Database deadlock'));
      s3StorageService.delete.mockRejectedValue(
        new Error('S3 delete network failure'),
      );

      const result = await useCase.execute(
        files,
        { inspectionId: mockInspectionId },
        mockActor,
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].errorCode).toBe('DATABASE_ERROR');
    });
  });
});
