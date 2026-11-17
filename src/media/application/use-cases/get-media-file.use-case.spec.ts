import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { GetMediaFileUseCase } from './get-media-file.use-case';
import { Media } from '../../domain/entities/media.entity';
import { PrismaService } from '../../../database/prisma.service';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';

describe('GetMediaFileUseCase', () => {
  let useCase: GetMediaFileUseCase;
  let mediaRepository: any;
  let prisma: any;
  let s3StorageService: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockMedia = new Media({
    id: 'media-1',
    categoryId: 'cat-1',
    uploadedById: mockUserId,
    captureSessionId: mockCaptureSessionId,
    fileName: 'front.webp',
    fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/media-1.webp`,
    mimeType: 'image/webp',
    fileSize: 1024,
    fileHash: null,
    width: 1920,
    height: 1080,
    duration: null,
    sortOrder: 0,
    status: MediaStatus.UPLOADED,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const mockCaptureSession = {
    id: mockCaptureSessionId,
    representativeId: mockUserId,
    inspectionRequest: {
      id: mockInspectionId,
      bankId: mockBankId,
      assignedRepresentativeId: mockUserId,
    },
  };

  beforeEach(async () => {
    mediaRepository = {
      findById: jest.fn(),
    };

    prisma = {
      captureSession: {
        findUnique: jest.fn(),
      },
      bankMembership: {
        findFirst: jest.fn(),
      },
    };

    s3StorageService = {
      getObject: jest.fn().mockResolvedValue({
        stream: {} as any,
        contentType: 'image/webp',
        contentLength: 1024,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMediaFileUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: PrismaService, useValue: prisma },
        { provide: S3StorageService, useValue: s3StorageService },
      ],
    }).compile();

    useCase = module.get<GetMediaFileUseCase>(GetMediaFileUseCase);
  });

  it('should successfully stream media file for authorized user', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue(mockCaptureSession);

    const result = await useCase.execute('media-1', {
      id: mockUserId,
      role: Role.REPRESENTATIVE,
    });

    expect(result.contentType).toBe('image/webp');
    expect(result.contentLength).toBe(1024);
    expect(result.fileName).toBe('front.webp');
    expect(s3StorageService.getObject).toHaveBeenCalledWith(
      mockMedia.fileUrl,
      undefined,
    );
  });

  it('should throw NotFoundException if media not found', async () => {
    mediaRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing-media', {
        id: mockUserId,
        role: Role.SUPER_ADMIN,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InspectionRequestAccessDeniedException if representative is not assigned', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue({
      ...mockCaptureSession,
      representativeId: 'different-rep',
      inspectionRequest: {
        ...mockCaptureSession.inspectionRequest,
        assignedRepresentativeId: 'different-rep',
      },
    });

    await expect(
      useCase.execute('media-1', {
        id: 'unassigned-rep',
        role: Role.REPRESENTATIVE,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });
});
