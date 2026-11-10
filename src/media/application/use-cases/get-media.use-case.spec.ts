import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { GetMediaUseCase } from './get-media.use-case';
import { Media } from '../../domain/entities/media.entity';
import { PrismaService } from '../../../database/prisma.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';

describe('GetMediaUseCase', () => {
  let useCase: GetMediaUseCase;
  let mediaRepository: any;
  let prisma: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockMedia = new Media({
    id: 'media-1',
    categoryId: 'cat-1',
    uploadedById: mockUserId,
    captureSessionId: mockCaptureSessionId,
    fileName: 'front.jpg',
    fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/media-1.jpg`,
    mimeType: 'image/jpeg',
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMediaUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get<GetMediaUseCase>(GetMediaUseCase);
  });

  it('should successfully return media for assigned representative', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue(mockCaptureSession);

    const result = await useCase.execute('media-1', {
      id: mockUserId,
      role: Role.REPRESENTATIVE,
    });

    expect(result.id).toBe('media-1');
    expect(result.fileName).toBe('front.jpg');
    expect(result.status).toBe(MediaStatus.UPLOADED);
  });

  it('should successfully return media for super admin without tenancy check', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue(mockCaptureSession);

    const result = await useCase.execute('media-1', {
      id: 'admin-id',
      role: Role.SUPER_ADMIN,
    });

    expect(result.id).toBe('media-1');
  });

  it('should throw NotFoundException if media is not found', async () => {
    mediaRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent-id', {
        id: mockUserId,
        role: Role.SUPER_ADMIN,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InspectionRequestAccessDeniedException when representative is not assigned', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue({
      ...mockCaptureSession,
      representativeId: 'other-rep',
      inspectionRequest: {
        ...mockCaptureSession.inspectionRequest,
        assignedRepresentativeId: 'other-rep',
      },
    });

    await expect(
      useCase.execute('media-1', {
        id: 'unassigned-rep',
        role: Role.REPRESENTATIVE,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  it('should throw InspectionRequestAccessDeniedException when manager has no bank membership', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue(mockCaptureSession);
    prisma.bankMembership.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute('media-1', {
        id: 'other-manager',
        role: Role.MANAGER,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  it('should allow manager if active bank membership exists', async () => {
    mediaRepository.findById.mockResolvedValue(mockMedia);
    prisma.captureSession.findUnique.mockResolvedValue(mockCaptureSession);
    prisma.bankMembership.findFirst.mockResolvedValue({
      bankId: mockBankId,
      userId: 'manager-id',
      status: MembershipStatus.ACTIVE,
    });

    const result = await useCase.execute('media-1', {
      id: 'manager-id',
      role: Role.MANAGER,
    });

    expect(result.id).toBe('media-1');
  });
});
