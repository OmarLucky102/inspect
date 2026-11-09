import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { UploadMediaUseCase } from './upload-media.use-case';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import {
  InvalidImageFormatException,
  UnsupportedMediaTypeException,
} from '../../../shared/exceptions/media.exceptions';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mediaRepository: any;
  let fileValidator: any;
  let imageProcessor: any;
  let contextValidator: any;
  let s3StorageService: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockCategoryId = 'c1111111-1111-4111-8111-111111111111';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockImageFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'car-front.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-raw-jpeg-bytes'),
    size: 5000,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockContext = {
    inspectionId: mockInspectionId,
    bankId: mockBankId,
    captureSessionId: mockCaptureSessionId,
    categoryId: mockCategoryId,
  };

  beforeEach(async () => {
    mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    fileValidator = {
      validateImage: jest.fn(),
      extractExtension: jest.fn(() => 'jpg'),
    };

    imageProcessor = {
      isSupportedImage: jest.fn(
        (mime: string) => mime?.startsWith('image/') ?? false,
      ),
      process: jest.fn().mockResolvedValue({
        buffer: Buffer.from('optimized-webp-bytes'),
        mimeType: 'image/webp',
        extension: 'webp',
        size: 1200,
        width: 1920,
        height: 1080,
      }),
    };

    contextValidator = {
      validateAndResolve: jest.fn().mockResolvedValue(mockContext),
    };

    s3StorageService = {
      upload: jest.fn().mockResolvedValue('key'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadMediaUseCase,
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

    useCase = module.get<UploadMediaUseCase>(UploadMediaUseCase);
  });

  describe('execute - Happy Path (Image Processing & WebP Conversion)', () => {
    it('should process image with Sharp, convert to WebP, and persist dimensions', async () => {
      const result = await useCase.execute(
        mockImageFile,
        { inspectionId: mockInspectionId },
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      expect(fileValidator.validateImage).toHaveBeenCalledWith(mockImageFile);
      expect(contextValidator.validateAndResolve).toHaveBeenCalledWith(
        mockInspectionId,
        undefined,
        undefined,
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );
      expect(imageProcessor.process).toHaveBeenCalledWith(
        mockImageFile.buffer,
        'image/jpeg',
      );

      // S3 upload should receive WebP buffer, webp mimeType, and key ending in .webp
      expect(s3StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/photos/[a-f0-9-]+\\.webp$`,
          ),
        ),
        Buffer.from('optimized-webp-bytes'),
        'image/webp',
      );

      // Initial save should contain width & height from Sharp
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const savedMedia = mediaRepository.save.mock.calls[0][0];
      expect(savedMedia.width).toBe(1920);
      expect(savedMedia.height).toBe(1080);
      expect(savedMedia.mimeType).toBe('image/webp');
      expect(savedMedia.fileName).toBe('car-front.webp');

      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(MediaStatus.UPLOADED);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.mimeType).toBe('image/webp');
    });
  });

  describe('execute - Image Only Enforcement', () => {
    it('should reject non-image file with UnsupportedMediaTypeException', async () => {
      fileValidator.validateImage.mockImplementation(() => {
        throw new UnsupportedMediaTypeException(
          'Only image files are allowed on this endpoint',
        );
      });

      const videoFile = { ...mockImageFile, mimetype: 'video/mp4' };

      await expect(
        useCase.execute(
          videoFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);

      expect(contextValidator.validateAndResolve).not.toHaveBeenCalled();
      expect(imageProcessor.process).not.toHaveBeenCalled();
    });

    it('should throw when file is missing', async () => {
      fileValidator.validateImage.mockImplementation(() => {
        throw new BadRequestException('File is required');
      });

      await expect(
        useCase.execute(
          undefined,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('execute - Corrupted Image Error Handling', () => {
    it('should mark media record as FAILED and throw InvalidImageFormatException when image is corrupted', async () => {
      imageProcessor.process.mockRejectedValue(
        new InvalidImageFormatException(
          'Input buffer contains unsupported image format',
        ),
      );

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(InvalidImageFormatException);

      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const failedMedia = mediaRepository.save.mock.calls[0][0];
      expect(failedMedia.status).toBe(MediaStatus.FAILED);
      expect(failedMedia.failureReason).toBe(
        'Invalid or corrupted image format',
      );

      expect(s3StorageService.upload).not.toHaveBeenCalled();
    });
  });

  describe('execute - Context & Authorization Delegation', () => {
    it('should propagate InspectionRequestNotFoundException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestNotFoundException(mockInspectionId),
      );

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InspectionRequestNotFoundException);
    });

    it('should propagate InvalidInspectionRequestStateException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InvalidInspectionRequestStateException('Inspection is locked'),
      );

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InvalidInspectionRequestStateException);
    });

    it('should propagate InspectionRequestAccessDeniedException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestAccessDeniedException('Access denied'),
      );

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: 'unassigned-rep', role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(InspectionRequestAccessDeniedException);
    });
  });

  describe('execute - Consistency & Rollback', () => {
    it('should mark media as FAILED when S3 upload fails', async () => {
      s3StorageService.upload.mockRejectedValue(
        new Error('S3 connection timeout'),
      );

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(StorageOperationException);

      expect(mediaRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MediaStatus.FAILED,
          failureReason: 'S3 connection timeout',
        }),
      );
    });

    it('should delete S3 object when database update to UPLOADED fails', async () => {
      s3StorageService.upload.mockResolvedValue('key');
      mediaRepository.update.mockRejectedValue(new Error('DB connection drop'));
      s3StorageService.delete.mockResolvedValue(undefined);

      await expect(
        useCase.execute(
          mockImageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow('DB connection drop');

      expect(s3StorageService.delete).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/photos/[a-f0-9-]+\\.webp$`,
          ),
        ),
      );
    });
  });
});
