import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VehicleDto } from '../../presentation/dto/vehicle.dto';
import { UpdateInspectionRequestVehicleDto } from '../../presentation/dto/update-inspection-request-vehicle.dto';
import { CaptureMode } from '../../domain/value-objects/capture-mode.enum';
import { InspectionRequestService } from './inspection-request.service';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { Vehicle } from '../../../vehicle/domain/entities/vehicle.entity';
import {
  InvalidReferenceDataException,
  InvalidInspectionRequestStateException,
  InspectionRequestAlreadyExistsException,
} from '../../../shared/exceptions/inspection.exceptions';

describe('Step 2: Vehicle Information Validation & Workflow', () => {
  describe('VehicleDto Validation', () => {
    it('should fail validation when required fields are missing', async () => {
      const dto = plainToInstance(VehicleDto, {});
      const errors = await validate(dto);
      const errorProperties = errors.map((e) => e.property);

      expect(errorProperties).toContain('vin');
      expect(errorProperties).toContain('brandId');
      expect(errorProperties).toContain('modelId');
      expect(errorProperties).toContain('categoryId');
      expect(errorProperties).toContain('manufactureYear');
      expect(errorProperties).toContain('engineNumber');
      expect(errorProperties).toContain('engineCc');
    });

    it('should validate with valid required and optional fields using prompt alias names', async () => {
      const payload = {
        vin: '1HGCR2F83HA123456',
        make: '11111111-1111-4111-8111-111111111111',
        model: '22222222-2222-4222-8222-222222222222',
        year: 2023,
        category: '33333333-3333-4333-8333-333333333333',
        motorNumber: 'ENG-998877',
        ccPower: 1600,
        licensePlate: 'ABC 1234',
        motorHorsepower: 150,
        mileage: 25000,
        color: '44444444-4444-4444-8444-444444444444',
        trim: '55555555-5555-4555-8555-555555555555',
        transmissionType: '66666666-6666-4666-8666-666666666666',
        sunroofSpecification: 'Panoramic electric sunroof',
        sideMirrors: 'Foldable with blind spot detection',
        carInterior: 'Leather black',
        calendarNumber: 'CAL-2026-99',
        insuranceValue: 450000.5,
        specialInstructions: 'Inspect front bumper carefully',
        captureMode: 'advanced',
        includeInterior: true,
        paymentReceiptImage: 'placeholder-receipt',
        licenseFrontImage: 'placeholder-front',
        licenseBackImage: 'placeholder-back',
      };

      const dto = plainToInstance(VehicleDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        console.log(
          'VALIDATION ERRORS:',
          JSON.stringify(
            errors.map((e) => ({
              property: e.property,
              constraints: e.constraints,
            })),
            null,
            2,
          ),
        );
      }
      expect(errors.length).toBe(0);

      expect(dto.vin).toBe('1HGCR2F83HA123456');
      expect(dto.getResolvedBrandId()).toBe(
        '11111111-1111-4111-8111-111111111111',
      );
      expect(dto.getResolvedModelId()).toBe(
        '22222222-2222-4222-8222-222222222222',
      );
      expect(dto.getResolvedCategoryId()).toBe(
        '33333333-3333-4333-8333-333333333333',
      );
      expect(dto.getResolvedManufactureYear()).toBe(2023);
      expect(dto.getResolvedEngineNumber()).toBe('ENG-998877');
      expect(dto.getResolvedEngineCc()).toBe(1600);
      expect(dto.getResolvedPlateNumber()).toBe('ABC 1234');
      expect(dto.getResolvedPower()).toBe(150);
      expect(dto.mileage).toBe(25000);
      expect(dto.captureMode).toBe(CaptureMode.ADVANCED);
      expect(dto.includeInterior).toBe(true);
    });

    it('should reject VIN longer than 25 characters', async () => {
      const payload = {
        vin: '123456789012345678901234567', // 27 chars
        brandId: '11111111-1111-4111-8111-111111111111',
        modelId: '22222222-2222-4222-8222-222222222222',
        manufactureYear: 2022,
        categoryId: '33333333-3333-4333-8333-333333333333',
        engineNumber: 'ENG-1',
        engineCc: 1500,
      };
      const dto = plainToInstance(VehicleDto, payload);
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'vin')).toBe(true);
    });

    it('should reject negative mileage or ccPower <= 0', async () => {
      const payload = {
        vin: '1HGCR2F83HA123456',
        brandId: '11111111-1111-4111-8111-111111111111',
        modelId: '22222222-2222-4222-8222-222222222222',
        manufactureYear: 2022,
        categoryId: '33333333-3333-4333-8333-333333333333',
        engineNumber: 'ENG-1',
        engineCc: 0,
        mileage: -10,
      };
      const dto = plainToInstance(VehicleDto, payload);
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('engineCc');
      expect(props).toContain('mileage');
    });

    it('UpdateInspectionRequestVehicleDto should extract nested or flat vehicle payload', () => {
      const flat = plainToInstance(UpdateInspectionRequestVehicleDto, {
        vin: 'VIN123',
        make: '11111111-1111-4111-8111-111111111111',
      });
      expect(flat.getVehiclePayload().vin).toBe('VIN123');

      const nested = plainToInstance(UpdateInspectionRequestVehicleDto, {
        vehicle: {
          vin: 'VIN999',
          brandId: '11111111-1111-4111-8111-111111111111',
        },
      });
      expect(nested.getVehiclePayload().vin).toBe('VIN999');
    });
  });

  describe('InspectionRequestService - setVehicleInfo', () => {
    let service: InspectionRequestService;
    let mockRequestRepo: any;
    let mockVehicleRepo: any;
    let mockVehicleRefRepo: any;
    let mockChecklistRepo: any;
    let mockChecklistItemRepo: any;
    let mockInspChecklistItemRepo: any;
    let mockStatusHistoryRepo: any;
    let mockPrisma: any;

    const bankId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const requestId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
    const brandId = '11111111-1111-4111-8111-111111111111';
    const modelId = '22222222-2222-4222-8222-222222222222';
    const categoryId = '33333333-3333-4333-8333-333333333333';

    beforeEach(() => {
      mockRequestRepo = {
        findById: jest.fn(),
        findByIdAndBankId: jest.fn(),
        findByIdWithDetails: jest.fn(),
        findOpenByBankAndVehicleId: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockVehicleRepo = {
        findByVin: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockVehicleRefRepo = {
        existsBrand: jest.fn().mockResolvedValue(true),
        existsModel: jest.fn().mockResolvedValue(true),
        existsCategory: jest.fn().mockResolvedValue(true),
        existsColor: jest.fn().mockResolvedValue(true),
        existsFuelType: jest.fn().mockResolvedValue(true),
        existsTransmissionType: jest.fn().mockResolvedValue(true),
        existsTrim: jest.fn().mockResolvedValue(true),
      };

      mockChecklistRepo = {
        findByCategoryId: jest.fn().mockResolvedValue([]),
      };
      mockChecklistItemRepo = {
        findMandatoryItems: jest.fn().mockResolvedValue([]),
        findByChecklistId: jest.fn().mockResolvedValue([]),
      };
      mockInspChecklistItemRepo = {
        findByRequestId: jest.fn().mockResolvedValue([]),
        bulkCreate: jest.fn().mockResolvedValue(undefined),
      };
      mockStatusHistoryRepo = {
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPrisma = {
        $transaction: jest.fn((cb) => cb({})),
      };

      service = new InspectionRequestService(
        mockRequestRepo,
        {} as any,
        {} as any,
        {} as any,
        mockVehicleRefRepo,
        mockVehicleRepo,
        mockChecklistRepo,
        mockChecklistItemRepo,
        mockInspChecklistItemRepo,
        mockStatusHistoryRepo,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockPrisma,
      );
    });

    it('should reject if selected model does not belong to selected brand', async () => {
      const draftRequest = new InspectionRequest({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        vehicleId: null,
        customerId: 'cust-1',
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: InspectionStatus.DRAFT,
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
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequestRepo.findByIdAndBankId.mockResolvedValue(draftRequest);
      mockVehicleRefRepo.existsModel.mockResolvedValue(false); // Model does not belong to brand!

      await expect(
        service.setVehicleInfo({
          bankId,
          requestId,
          actor: { id: 'user-1', role: Role.MANAGER },
          vehicle: {
            vin: 'VINTEST1234567890',
            brandId,
            modelId,
            categoryId,
            manufactureYear: 2023,
            engineNumber: 'ENG-1',
            engineCc: 1600,
          },
        }),
      ).rejects.toThrow(InvalidReferenceDataException);

      expect(mockVehicleRefRepo.existsModel).toHaveBeenCalledWith(
        modelId,
        brandId,
      );
    });

    it('should reject modification if request status is not DRAFT (e.g. PENDING)', async () => {
      const pendingRequest = new InspectionRequest({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        vehicleId: 'veh-1',
        customerId: 'cust-1',
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: InspectionStatus.PENDING,
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
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequestRepo.findByIdAndBankId.mockResolvedValue(pendingRequest);

      await expect(
        service.setVehicleInfo({
          bankId,
          requestId,
          actor: { id: 'user-1', role: Role.MANAGER },
          vehicle: {
            vin: 'VINTEST1234567890',
            brandId,
            modelId,
            categoryId,
            manufactureYear: 2023,
            engineNumber: 'ENG-1',
            engineCc: 1600,
          },
        }),
      ).rejects.toThrow(InvalidInspectionRequestStateException);
    });

    it('should reject if another active request with the same VIN already exists in the bank', async () => {
      const draftRequest = new InspectionRequest({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        vehicleId: null,
        customerId: 'cust-1',
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: InspectionStatus.DRAFT,
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
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequestRepo.findByIdAndBankId.mockResolvedValue(draftRequest);
      mockRequestRepo.findOpenByBankAndVehicleId.mockResolvedValue([
        { id: 'another-request-id' },
      ]);

      await expect(
        service.setVehicleInfo({
          bankId,
          requestId,
          actor: { id: 'user-1', role: Role.MANAGER },
          vehicle: {
            vin: 'VINDUPLICATE12345',
            brandId,
            modelId,
            categoryId,
            manufactureYear: 2023,
            engineNumber: 'ENG-1',
            engineCc: 1600,
          },
        }),
      ).rejects.toThrow(InspectionRequestAlreadyExistsException);
    });

    it('should save vehicle, set capture settings, and remain DRAFT when submit is false', async () => {
      const draftRequest = new InspectionRequest({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        vehicleId: null,
        customerId: 'cust-1',
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: InspectionStatus.DRAFT,
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
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequestRepo.findByIdAndBankId.mockResolvedValue(draftRequest);
      mockRequestRepo.findByIdWithDetails.mockResolvedValue({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        currentStatus: InspectionStatus.DRAFT,
        priority: InspectionPriority.MEDIUM,
        requestedAt: new Date(),
        requestedCompletionDate: null,
        assignedAt: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        captureMode: 'STANDARD',
        includeInterior: true,
        vehicle: {
          id: 'v-1',
          vin: 'VINTEST1234567890',
          plateNumber: null,
          manufactureYear: 2023,
          mileage: null,
          engineNumber: 'ENG-1',
          engineCc: 1600,
          power: null,
          insuranceValue: null,
          registrationDate: null,
        },
      });

      const res = await service.setVehicleInfo({
        bankId,
        requestId,
        actor: { id: 'user-1', role: Role.MANAGER },
        vehicle: {
          vin: 'VINTEST1234567890',
          brandId,
          modelId,
          categoryId,
          manufactureYear: 2023,
          engineNumber: 'ENG-1',
          engineCc: 1600,
          captureMode: CaptureMode.STANDARD,
          includeInterior: true,
          submit: false,
        },
      });

      expect(mockVehicleRepo.save).toHaveBeenCalled();
      expect(draftRequest.vehicleId).toBeDefined();
      expect(draftRequest.currentStatus).toBe(InspectionStatus.DRAFT);
      expect(mockStatusHistoryRepo.save).not.toHaveBeenCalled();
      expect(res.currentStatus).toBe(InspectionStatus.DRAFT);
    });

    it('should submit request to PENDING and write status history when submit is true', async () => {
      const draftRequest = new InspectionRequest({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        vehicleId: null,
        customerId: 'cust-1',
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: InspectionStatus.DRAFT,
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
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequestRepo.findByIdAndBankId.mockResolvedValue(draftRequest);
      mockRequestRepo.findByIdWithDetails.mockResolvedValue({
        id: requestId,
        requestNumber: 'IR-TEST-001',
        bankId,
        currentStatus: InspectionStatus.PENDING,
        priority: InspectionPriority.MEDIUM,
        requestedAt: new Date(),
        requestedCompletionDate: null,
        assignedAt: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        captureMode: 'ADVANCED',
        includeInterior: false,
        vehicle: {
          id: 'v-1',
          vin: 'VINTEST1234567890',
          plateNumber: null,
          manufactureYear: 2023,
          mileage: null,
          engineNumber: 'ENG-1',
          engineCc: 1600,
          power: null,
          insuranceValue: null,
          registrationDate: null,
        },
      });

      const res = await service.setVehicleInfo({
        bankId,
        requestId,
        actor: { id: 'user-1', role: Role.MANAGER },
        vehicle: {
          vin: 'VINTEST1234567890',
          brandId,
          modelId,
          categoryId,
          manufactureYear: 2023,
          engineNumber: 'ENG-1',
          engineCc: 1600,
          captureMode: CaptureMode.ADVANCED,
          includeInterior: false,
          submit: true,
        },
      });

      expect(draftRequest.currentStatus).toBe(InspectionStatus.PENDING);
      expect(draftRequest.captureMode).toBe(CaptureMode.ADVANCED);
      expect(draftRequest.includeInterior).toBe(false);
      expect(mockStatusHistoryRepo.save).toHaveBeenCalled();
      expect(res.currentStatus).toBe(InspectionStatus.PENDING);
    });
  });
});
