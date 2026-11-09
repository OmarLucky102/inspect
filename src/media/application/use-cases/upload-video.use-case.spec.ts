import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { UploadVideoUseCase } from './upload-video.use-case';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import { UnsupportedMediaTypeException } from '../../../shared/exceptions/media.exceptions';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';

describe('UploadVideoUseCase', () => {
  let useCase: UploadVideoUseCase;
  let mediaRepository: any;
  let fileValidator: any;
  let contextValidator: any;
  let s3StorageService: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockCategoryId = 'c1111111-1111-4111-8111-111111111111';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockVideoFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'walkaround.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    buffer: Buffer.from('fake-video-binary-data'),
    size: 25 * 1024 * 1024,
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
      validateVideo: jest.fn(),
      extractExtension: jest.fn(() => 'mp4'),
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
        UploadVideoUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: 'IFileValidatorService', useValue: fileValidator },
        {
          provide: InspectionMediaContextValidator,
          useValue: contextValidator,
        },
        { provide: S3StorageService, useValue: s3StorageService },
      ],
    }).compile();

    useCase = module.get<UploadVideoUseCase>(UploadVideoUseCase);
  });

  describe('execute - Happy Path (Raw Video Upload to S3)', () => {
    it('should validate video, save PENDING record, upload to S3, and mark UPLOADED', async () => {
      const result = await useCase.execute(
        mockVideoFile,
        { inspectionId: mockInspectionId },
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      expect(fileValidator.validateVideo).toHaveBeenCalledWith(mockVideoFile);
      expect(contextValidator.validateAndResolve).toHaveBeenCalledWith(
        mockInspectionId,
        undefined,
        undefined,
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      // Verify S3 upload receives raw video buffer and key in videos/ folder
      expect(s3StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/videos/[a-f0-9-]+\\.mp4$`,
          ),
        ),
        mockVideoFile.buffer,
        'video/mp4',
      );

      // Width and height should be null (no Sharp processing)
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const savedMedia = mediaRepository.save.mock.calls[0][0];
      expect(savedMedia.width).toBeNull();
      expect(savedMedia.height).toBeNull();
      expect(savedMedia.duration).toBeNull();
      expect(savedMedia.mimeType).toBe('video/mp4');
      expect(savedMedia.fileName).toBe('walkaround.mp4');

      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(MediaStatus.UPLOADED);
      expect(result.mimeType).toBe('video/mp4');
    });
  });

  describe('execute - Video Only Enforcement', () => {
    it('should reject non-video files with UnsupportedMediaTypeException', async () => {
      fileValidator.validateVideo.mockImplementation(() => {
        throw new UnsupportedMediaTypeException(
          'Only video files are allowed on this endpoint',
        );
      });

      const imageFile = { ...mockVideoFile, mimetype: 'image/jpeg' };

      await expect(
        useCase.execute(
          imageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);

      expect(contextValidator.validateAndResolve).not.toHaveBeenCalled();
      expect(s3StorageService.upload).not.toHaveBeenCalled();
    });

    it('should throw when file is missing', async () => {
      fileValidator.validateVideo.mockImplementation(() => {
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

  describe('execute - Context & Authorization Delegation', () => {
    it('should propagate InspectionRequestNotFoundException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestNotFoundException(mockInspectionId),
      );

      await expect(
        useCase.execute(
          mockVideoFile,
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
          mockVideoFile,
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
          mockVideoFile,
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
          mockVideoFile,
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
          mockVideoFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow('DB connection drop');

      expect(s3StorageService.delete).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/videos/[a-f0-9-]+\\.mp4$`,
          ),
        ),
      );
    });
  });
});
