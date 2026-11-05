import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  MediaStatus,
  CaptureSessionStatus,
  InspectionStatus,
} from '@prisma/client';
import { UploadMediaUseCase } from './upload-media.use-case';
import { MediaCategory } from '../../domain/entities/media-category.entity';
import { PrismaService } from '../../../database/prisma.service';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mediaRepository: any;
  let categoryRepository: any;
  let fileValidator: any;
  let prisma: any;
  let s3StorageService: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockCategoryId = 'c1111111-1111-4111-8111-111111111111';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'car-front.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockInspection = {
    id: mockInspectionId,
    requestNumber: 'REQ-2026-0001',
    bankId: mockBankId,
    assignedRepresentativeId: mockUserId,
    currentStatus: InspectionStatus.IN_PROGRESS,
    bank: { id: mockBankId, name: 'National Bank' },
    captureSessions: [
      {
        id: mockCaptureSessionId,
        inspectionRequestId: mockInspectionId,
        representativeId: mockUserId,
        status: CaptureSessionStatus.IN_PROGRESS,
      },
    ],
  };

  beforeEach(async () => {
    mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    categoryRepository = {
      findById: jest.fn(),
      getOrCreateDefault: jest.fn().mockResolvedValue(
        new MediaCategory({
          id: mockCategoryId,
          name: 'GENERAL',
          description: null,
        }),
      ),
    };

    fileValidator = {
      validate: jest.fn(),
      extractExtension: jest.fn().mockReturnValue('jpg'),
    };

    prisma = {
      inspectionRequest: {
        findUnique: jest.fn(),
      },
      captureSession: {
        findUnique: jest.fn(),
      },
      bankMembership: {
        findFirst: jest.fn(),
      },
    };

    s3StorageService = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadMediaUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: 'IMediaCategoryRepository', useValue: categoryRepository },
        { provide: 'IFileValidatorService', useValue: fileValidator },
        { provide: PrismaService, useValue: prisma },
        { provide: S3StorageService, useValue: s3StorageService },
      ],
    }).compile();

    useCase = module.get<UploadMediaUseCase>(UploadMediaUseCase);
  });

  describe('execute - Happy Path', () => {
    it('should successfully coordinate upload, domain entity creation, and persistence', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
      s3StorageService.upload.mockResolvedValue('key');

      const result = await useCase.execute(
        mockFile,
        { inspectionId: mockInspectionId },
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      expect(fileValidator.validate).toHaveBeenCalledWith(mockFile);
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      expect(s3StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/[a-f0-9-]+\\.jpg$`,
          ),
        ),
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(MediaStatus.UPLOADED);
      expect(result.fileName).toBe('car-front.jpg');
    });
  });

  describe('execute - Validation & Authorization', () => {
    it('should throw when fileValidator rejects file', async () => {
      fileValidator.validate.mockImplementation(() => {
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

    it('should throw InspectionRequestNotFoundException if inspection does not exist', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute(
          mockFile,
          { inspectionId: 'invalid-id' },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InspectionRequestNotFoundException);
    });

    it('should throw InvalidInspectionRequestStateException if inspection is locked', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue({
        ...mockInspection,
        currentStatus: InspectionStatus.COMPLETED,
      });

      await expect(
        useCase.execute(
          mockFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InvalidInspectionRequestStateException);
    });

    it('should throw InspectionRequestAccessDeniedException when representative is not assigned', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue({
        ...mockInspection,
        assignedRepresentativeId: 'someone-else',
        captureSessions: [],
      });

      await expect(
        useCase.execute(
          mockFile,
          { inspectionId: mockInspectionId },
          { id: 'unassigned-rep', role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(InspectionRequestAccessDeniedException);
    });

    it('should throw NotFoundException when specified category does not exist', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          mockFile,
          { inspectionId: mockInspectionId, categoryId: 'non-existing-cat' },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute - Consistency & Rollback', () => {
    it('should mark media as FAILED when S3 upload fails', async () => {
      prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
      s3StorageService.upload.mockRejectedValue(
        new Error('S3 connection timeout'),
      );

      await expect(
        useCase.execute(
          mockFile,
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
      prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
      s3StorageService.upload.mockResolvedValue('key');
      mediaRepository.update.mockRejectedValue(new Error('DB connection drop'));
      s3StorageService.delete.mockResolvedValue(undefined);

      await expect(
        useCase.execute(
          mockFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow('DB connection drop');

      expect(s3StorageService.delete).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^banks/${mockBankId}/inspections/${mockInspectionId}/[a-f0-9-]+\\.jpg$`,
          ),
        ),
      );
    });
  });
});
