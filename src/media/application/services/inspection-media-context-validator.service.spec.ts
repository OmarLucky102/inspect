import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InspectionStatus, CaptureSessionStatus } from '@prisma/client';
import { InspectionMediaContextValidator } from './inspection-media-context-validator.service';
import { PrismaService } from '../../../database/prisma.service';
import { MediaCategory } from '../../domain/entities/media-category.entity';
import {
  InspectionRequestNotFoundException,
  InvalidInspectionRequestStateException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';

describe('InspectionMediaContextValidator', () => {
  let validator: InspectionMediaContextValidator;
  let prisma: any;
  let categoryRepository: any;

  const mockInspectionId = 'insp-1';
  const mockBankId = 'bank-1';
  const mockRepresentativeId = 'rep-1';
  const mockSessionId = 'session-1';
  const mockCategoryId = 'cat-1';

  const mockInspection = {
    id: mockInspectionId,
    bankId: mockBankId,
    assignedRepresentativeId: mockRepresentativeId,
    currentStatus: InspectionStatus.IN_PROGRESS,
    captureSessions: [
      {
        id: mockSessionId,
        inspectionRequestId: mockInspectionId,
        representativeId: mockRepresentativeId,
        status: CaptureSessionStatus.IN_PROGRESS,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      inspectionRequest: {
        findUnique: jest.fn().mockResolvedValue(mockInspection),
      },
      captureSession: {
        findUnique: jest.fn(),
      },
      bankMembership: {
        findFirst: jest.fn(),
      },
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionMediaContextValidator,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IMediaCategoryRepository', useValue: categoryRepository },
      ],
    }).compile();

    validator = module.get<InspectionMediaContextValidator>(
      InspectionMediaContextValidator,
    );
  });

  it('should successfully resolve context for assigned representative', async () => {
    const result = await validator.validateAndResolve(
      mockInspectionId,
      undefined,
      undefined,
      { id: mockRepresentativeId, role: Role.REPRESENTATIVE },
    );

    expect(result).toEqual({
      inspectionId: mockInspectionId,
      bankId: mockBankId,
      captureSessionId: mockSessionId,
      categoryId: mockCategoryId,
    });
  });

  it('should throw InspectionRequestNotFoundException if inspection does not exist', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue(null);

    await expect(
      validator.validateAndResolve(mockInspectionId, undefined, undefined, {
        id: mockRepresentativeId,
        role: Role.REPRESENTATIVE,
      }),
    ).rejects.toThrow(InspectionRequestNotFoundException);
  });

  it('should throw InvalidInspectionRequestStateException if inspection is locked', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue({
      ...mockInspection,
      currentStatus: InspectionStatus.COMPLETED,
    });

    await expect(
      validator.validateAndResolve(mockInspectionId, undefined, undefined, {
        id: mockRepresentativeId,
        role: Role.REPRESENTATIVE,
      }),
    ).rejects.toThrow(InvalidInspectionRequestStateException);
  });

  it('should throw BadRequestException if capture session does not belong to inspection', async () => {
    prisma.captureSession.findUnique.mockResolvedValue({
      id: 'other-session',
      inspectionRequestId: 'other-inspection',
    });

    await expect(
      validator.validateAndResolve(
        mockInspectionId,
        'other-session',
        undefined,
        { id: mockRepresentativeId, role: Role.REPRESENTATIVE },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if capture session is not found in DB', async () => {
    prisma.captureSession.findUnique.mockResolvedValue(null);

    await expect(
      validator.validateAndResolve(
        mockInspectionId,
        'non-existent-session',
        undefined,
        { id: mockRepresentativeId, role: Role.REPRESENTATIVE },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InspectionRequestAccessDeniedException if representative is not assigned', async () => {
    await expect(
      validator.validateAndResolve(mockInspectionId, undefined, undefined, {
        id: 'unassigned-rep',
        role: Role.REPRESENTATIVE,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  it('should allow SUPER_ADMIN to bypass assignment check', async () => {
    const result = await validator.validateAndResolve(
      mockInspectionId,
      undefined,
      undefined,
      { id: 'admin-1', role: Role.SUPER_ADMIN },
    );

    expect(result.inspectionId).toBe(mockInspectionId);
  });

  it('should allow active bank member to access inspection', async () => {
    prisma.bankMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: MembershipStatus.ACTIVE,
    });

    const result = await validator.validateAndResolve(
      mockInspectionId,
      undefined,
      undefined,
      { id: 'bank-user-1', role: Role.USER },
    );

    expect(result.inspectionId).toBe(mockInspectionId);
  });
});
