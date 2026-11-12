import 'reflect-metadata';
import { InspectionRequestService } from './inspection-request.service';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import {
  InspectionRequestAccessDeniedException,
  InspectionRequestNotFoundException,
} from '../../../shared/exceptions/inspection.exceptions';

describe('InspectionRequestService - Cross-Bank & Permission Authorization (403 vs 404)', () => {
  let service: InspectionRequestService;
  let mockRequestRepo: any;

  const bankA = '11111111-1111-4111-8111-111111111111';
  const bankB = '22222222-2222-4222-8222-222222222222';
  const reqInBankB = '33333333-3333-4333-8333-333333333333';
  const missingReq = '44444444-4444-4444-8444-444444444444';

  const makeEntity = (id: string, bankId: string, assignedRep: string | null = null) =>
    new InspectionRequest({
      id,
      requestNumber: 'IR-BNKB-001',
      bankId,
      vehicleId: null,
      customerId: 'cust-1',
      assignedRepresentativeId: assignedRep,
      assignedReviewerId: null,
      currentStatus: InspectionStatus.PENDING_ASSIGNMENT,
      priority: InspectionPriority.MEDIUM,
      governorateId: null,
      cityId: null,
      latitude: null,
      longitude: null,
      address: null,
      requestedCompletionDate: null,
      requestedAt: new Date(),
      assignedAt: null,
      completedAt: null,
      notes: null,
      createdBy: 'user-b',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(() => {
    mockRequestRepo = {
      findById: jest.fn(),
      findByIdAndBankId: jest.fn(),
      findByIdWithDetails: jest.fn(),
    };

    service = new InspectionRequestService(
      mockRequestRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('returns 403 Forbidden (not 404) when a Bank A user queries details of a request owned by Bank B', async () => {
    mockRequestRepo.findByIdWithDetails.mockResolvedValue(null);
    mockRequestRepo.findById.mockResolvedValue(makeEntity(reqInBankB, bankB));

    await expect(
      service.getRequestDetails(reqInBankB, bankA, {
        id: 'manager-a',
        role: Role.MANAGER,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  it('returns 404 Not Found when the request does not exist in any bank', async () => {
    mockRequestRepo.findByIdWithDetails.mockResolvedValue(null);
    mockRequestRepo.findById.mockResolvedValue(null);

    await expect(
      service.getRequestDetails(missingReq, bankA, {
        id: 'manager-a',
        role: Role.MANAGER,
      }),
    ).rejects.toThrow(InspectionRequestNotFoundException);
  });

  it('returns 403 Forbidden (not 404) across getRequestById, updateStatus, assignRepresentative, getStatusHistory, and submitMediaReview for cross-bank requests', async () => {
    const bankBEntity = makeEntity(reqInBankB, bankB);
    mockRequestRepo.findByIdAndBankId.mockResolvedValue(null);
    mockRequestRepo.findById.mockResolvedValue(bankBEntity);

    await expect(
      service.getRequestById(reqInBankB, bankA),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);

    await expect(
      service.updateStatus(
        reqInBankB,
        bankA,
        InspectionStatus.IN_PROGRESS,
        undefined,
        { id: 'reviewer-a', role: Role.REVIEWER },
      ),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);

    await expect(
      service.assignRepresentative(
        reqInBankB,
        bankA,
        'rep-1',
        { id: 'reviewer-a', role: Role.REVIEWER },
      ),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);

    await expect(
      service.getStatusHistory(reqInBankB, bankA, {
        id: 'manager-a',
        role: Role.MANAGER,
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);

    await expect(
      service.submitMediaReview(
        reqInBankB,
        bankA,
        { verifiedMileage: 10000, proposedMarketingValue: 500000 },
        { id: 'reviewer-a', role: Role.REVIEWER },
      ),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });

  it('returns 403 Forbidden immediately in setVehicleInfo when actor lacks MANAGER/REVIEWER/ADMIN role', async () => {
    await expect(
      service.setVehicleInfo({
        bankId: bankA,
        requestId: missingReq,
        actor: { id: 'viewer-a', role: Role.VIEWER },
        vehicle: {
          vin: 'VIN1234567890',
          brandId: 'b1',
          modelId: 'm1',
          categoryId: 'c1',
          manufactureYear: 2024,
          engineNumber: 'ENG-1',
          engineCc: 1600,
        },
      }),
    ).rejects.toThrow(InspectionRequestAccessDeniedException);
  });
});

