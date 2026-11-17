import 'reflect-metadata';
import { InspectionRequestService } from './inspection-request.service';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { Vehicle } from '../../../vehicle/domain/entities/vehicle.entity';
import {
  InvalidStatusTransitionException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { BadRequestException } from '@nestjs/common';

describe('InspectionRequestService - submitMediaReview', () => {
  let service: InspectionRequestService;
  let mockRequestRepo: any;
  let mockVehicleRepo: any;
  let mockStatusHistoryRepo: any;
  let mockMarketingDecisionRepo: any;
  let mockChecklistItemRepo: any;
  let mockPrisma: any;

  const bankId = '11111111-1111-4111-8111-111111111111';
  const requestId = '22222222-2222-4222-8222-222222222222';
  const vehicleId = '33333333-3333-4333-8333-333333333333';
  const reviewerActor = { id: 'reviewer-1', role: Role.REVIEWER };

  const makeVehicle = () =>
    new Vehicle({
      id: vehicleId,
      vin: 'VIN12345678901234',
      plateNumber: '123-ABC',
      manufactureYear: 2022,
      mileage: 10000,
      engineNumber: 'ENG-1',
      engineCc: 1600,
      power: 120,
      insuranceValue: 500000,
      registrationDate: null,
      status: 'ACTIVE',
      brandId: 'brand-1',
      modelId: 'model-1',
      categoryId: 'cat-1',
      fuelTypeId: 'fuel-1',
      transmissionTypeId: null,
      colorId: 'color-1',
      trimId: null,
      sunroofSpecification: null,
      sideMirrors: null,
      carInterior: null,
      calendarNumber: null,
      specialInstructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

  const makeRequest = (status: InspectionStatus = InspectionStatus.UNDER_REVIEW) =>
    new InspectionRequest({
      id: requestId,
      requestNumber: 'REQ-2026-0001',
      bankId,
      vehicleId,
      customerId: 'cust-1',
      assignedRepresentativeId: 'rep-1',
      assignedReviewerId: null,
      currentStatus: status,
      priority: InspectionPriority.MEDIUM,
      governorateId: null,
      cityId: null,
      latitude: null,
      longitude: null,
      address: null,
      requestedCompletionDate: null,
      requestedAt: new Date(),
      assignedAt: new Date(),
      completedAt: null,
      notes: null,
      createdBy: 'creator-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(() => {
    mockRequestRepo = {
      findById: jest.fn(),
      findByIdAndBankId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      findByIdWithDetails: jest.fn(),
    };

    mockVehicleRepo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockStatusHistoryRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockMarketingDecisionRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockChecklistItemRepo = {
      findByRequestAndItem: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      media: {
        count: jest.fn().mockResolvedValue(5), // media exists
      },
      inspectionRequest: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    service = new InspectionRequestService(
      mockRequestRepo,
      {} as any, // customerRepository
      {} as any, // counterRepository
      {} as any, // locationRepository
      {} as any, // vehicleReferenceRepository
      mockVehicleRepo,
      {} as any, // checklistRepository
      {} as any, // checklistItemRepository
      mockChecklistItemRepo,
      mockStatusHistoryRepo,
      {} as any, // assignmentRepository
      mockMarketingDecisionRepo,
      {} as any, // bankMembershipRepository
      {} as any, // userService
      {} as any, // bankService
      mockPrisma,
    );

    // Mock getRequestDetails return
    jest.spyOn(service, 'getRequestDetails').mockImplementation(async () => {
      return { id: requestId, currentStatus: InspectionStatus.COMPLETED } as any;
    });
  });

  it('updates vehicle details including carInterior and transitions to COMPLETED', async () => {
    const request = makeRequest(InspectionStatus.UNDER_REVIEW);
    const vehicle = makeVehicle();

    mockRequestRepo.findByIdAndBankId.mockResolvedValue(request);
    mockVehicleRepo.findById.mockResolvedValue(vehicle);

    const updateDetailsSpy = jest.spyOn(vehicle, 'updateDetails');

    const result = await service.submitMediaReview(
      requestId,
      bankId,
      {
        verifiedMileage: 45000,
        proposedMarketingValue: 720000,
        transmissionTypeId: 'trans-uuid-1',
        sideMirrors: 'ELECTRIC',
        sunroofSpecification: 'PANORAMIC',
        carInterior: 'FACTORY_PAINT',
        notes: 'Verified against photo evidence.',
      },
      reviewerActor,
    );

    expect(result).toBeDefined();
    expect(result.currentStatus).toBe(InspectionStatus.COMPLETED);

    // Verify vehicle details updated with carInterior
    expect(updateDetailsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mileage: 45000,
        transmissionTypeId: 'trans-uuid-1',
        sideMirrors: 'ELECTRIC',
        sunroofSpecification: 'PANORAMIC',
        carInterior: 'FACTORY_PAINT',
      }),
    );
    expect(mockVehicleRepo.update).toHaveBeenCalledWith(vehicle);

    // Verify MarketingValueDecision saved
    expect(mockMarketingDecisionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        inspectionRequestId: requestId,
        estimatedValue: 720000,
        reviewerId: reviewerActor.id,
        approved: false,
      }),
      mockPrisma,
    );

    // Verify request transitioned to COMPLETED
    expect(request.currentStatus).toBe(InspectionStatus.COMPLETED);
    expect(mockRequestRepo.update).toHaveBeenCalledWith(request, mockPrisma);

    // Verify status history saved
    expect(mockStatusHistoryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStatus: InspectionStatus.UNDER_REVIEW,
        toStatus: InspectionStatus.COMPLETED,
        changedBy: reviewerActor.id,
      }),
      mockPrisma,
    );
  });

  it('throws InvalidStatusTransitionException if request is not in UNDER_REVIEW status', async () => {
    const request = makeRequest(InspectionStatus.IN_PROGRESS);
    mockRequestRepo.findByIdAndBankId.mockResolvedValue(request);

    await expect(
      service.submitMediaReview(
        requestId,
        bankId,
        {
          verifiedMileage: 45000,
          proposedMarketingValue: 720000,
          carInterior: 'FACTORY_PAINT',
        },
        reviewerActor,
      ),
    ).rejects.toThrow(InvalidStatusTransitionException);
  });

  it('throws BadRequestException if no media is uploaded for the inspection request', async () => {
    const request = makeRequest(InspectionStatus.UNDER_REVIEW);
    mockRequestRepo.findByIdAndBankId.mockResolvedValue(request);
    mockPrisma.media.count.mockResolvedValue(0); // 0 media files

    await expect(
      service.submitMediaReview(
        requestId,
        bankId,
        {
          verifiedMileage: 45000,
          proposedMarketingValue: 720000,
          carInterior: 'FACTORY_PAINT',
        },
        reviewerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws InspectionRequestAccessDeniedException if actor is not REVIEWER or ADMIN', async () => {
    await expect(
      service.submitMediaReview(
        requestId,
        bankId,
        {
          verifiedMileage: 45000,
          proposedMarketingValue: 720000,
        },
        { id: 'user-1', role: Role.REPRESENTATIVE },
      ),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });
});
