import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { GetInspectionMediaUseCase } from './get-inspection-media.use-case';
import { PrismaService } from '../../../database/prisma.service';
import { InspectionRequestAccessDeniedException } from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';

describe('GetInspectionMediaUseCase', () => {
  let useCase: GetInspectionMediaUseCase;
  let prisma: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';

  const mockInspection = {
    id: mockInspectionId,
    bankId: mockBankId,
    assignedRepresentativeId: mockUserId,
    captureSessions: [{ id: 'session-1', representativeId: mockUserId }],
  };

  const mockMediaRows = [
    {
      id: 'media-1',
      categoryId: 'cat-1',
      uploadedById: mockUserId,
      captureSessionId: 'session-1',
      fileName: 'exterior_front.webp',
      fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/photos/media-1.webp`,
      mimeType: 'image/webp',
      fileSize: 2048,
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
      category: { id: 'cat-1', name: 'EXTERIOR' },
    },
  ];

  beforeEach(async () => {
    prisma = {
      inspectionRequest: {
        findUnique: jest.fn(),
      },
      media: {
        findMany: jest.fn(),
      },
      bankMembership: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInspectionMediaUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get<GetInspectionMediaUseCase>(GetInspectionMediaUseCase);
  });

  it('should successfully return inspection media for super admin', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
    prisma.media.findMany.mockResolvedValue(mockMediaRows);

    const result = await useCase.execute(mockInspectionId, {
      id: 'admin-id',
      role: Role.SUPER_ADMIN,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('media-1');
    expect(result[0].categoryName).toBe('EXTERIOR');
  });

  it('should throw NotFoundException if inspection does not exist', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent-inspection', {
        id: 'admin-id',
        role: Role.SUPER_ADMIN,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should allow reviewer belonging to the inspection bank', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
    prisma.bankMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: MembershipStatus.ACTIVE,
    });
    prisma.media.findMany.mockResolvedValue(mockMediaRows);

    const result = await useCase.execute(mockInspectionId, {
      id: 'reviewer-id',
      role: Role.REVIEWER,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('media-1');
  });

  it('should deny reviewer who is not a member of the bank', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
    prisma.bankMembership.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute(mockInspectionId, {
        id: 'unauthorized-reviewer',
        role: Role.REVIEWER,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  describe('media type filtering', () => {
    beforeEach(() => {
      prisma.inspectionRequest.findUnique.mockResolvedValue(mockInspection);
      prisma.media.findMany.mockResolvedValue(mockMediaRows);
    });

    it('should query images at database level when type is "image"', async () => {
      await useCase.execute(
        mockInspectionId,
        { id: 'admin-id', role: Role.SUPER_ADMIN },
        { type: 'image' },
      );

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mimeType: { startsWith: 'image/' },
            deletedAt: null,
          }),
        }),
      );
    });

    it('should query videos at database level when type is "video"', async () => {
      await useCase.execute(
        mockInspectionId,
        { id: 'admin-id', role: Role.SUPER_ADMIN },
        { type: 'video' },
      );

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mimeType: { startsWith: 'video/' },
            deletedAt: null,
          }),
        }),
      );
    });

    it('should not filter by mimeType when type is omitted/undefined', async () => {
      await useCase.execute(
        mockInspectionId,
        { id: 'admin-id', role: Role.SUPER_ADMIN },
        undefined,
      );

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            mimeType: expect.anything(),
          }),
        }),
      );
    });

    it('should throw BadRequestException (HTTP 400) when type is invalid', async () => {
      await expect(
        useCase.execute(
          mockInspectionId,
          { id: 'admin-id', role: Role.SUPER_ADMIN },
          { type: 'audio' as any },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should query checklist items at database level when checklistItemCodes are provided', async () => {
      await useCase.execute(
        mockInspectionId,
        { id: 'admin-id', role: Role.SUPER_ADMIN },
        { checklistItemCodes: ['odometer_cluster', 'panoramic_roof'] },
      );

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checklistItemCode: { in: ['odometer_cluster', 'panoramic_roof'] },
            deletedAt: null,
          }),
        }),
      );
    });

    it('should filter by both type and checklistItemCodes when both are provided', async () => {
      await useCase.execute(
        mockInspectionId,
        { id: 'admin-id', role: Role.SUPER_ADMIN },
        {
          type: 'image',
          checklistItemCodes: ['odometer_cluster'],
        },
      );

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mimeType: { startsWith: 'image/' },
            checklistItemCode: { in: ['odometer_cluster'] },
            deletedAt: null,
          }),
        }),
      );
    });
  });
});
