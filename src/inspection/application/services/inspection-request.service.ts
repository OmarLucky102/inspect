import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionRequestRepository } from '../../domain/repositories/inspection-request.repository.interface';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import type { IRequestNumberCounterRepository } from '../../domain/repositories/request-number-counter.repository.interface';
import type { ILocationRepository } from '../../domain/repositories/location.repository.interface';
import type { IVehicleReferenceRepository } from '../../domain/repositories/vehicle-reference.repository.interface';
import type { IVehicleRepository } from '../../../vehicle/domain/repositories/vehicle.repository.interface';
import { BankService } from '../../../organization/application/services/bank.service';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Vehicle } from '../../../vehicle/domain/entities/vehicle.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';
import {
  InvalidReferenceDataException,
  InspectionRequestAlreadyExistsException,
  InspectionRequestNotFoundException,
} from '../../../shared/exceptions/inspection.exceptions';

export interface CreateInspectionRequestInput {
  bankId: string;
  userId: string;
  customer: {
    fullName: string;
    nationalId?: string;
    phone: string;
    email?: string;
  };
  location?: {
    governorateId?: string;
    cityId?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  requestedCompletionDate?: Date;
  notes?: string;
  vehicle?: {
    vin: string;
    plateNumber?: string;
    manufactureYear: number;
    mileage?: number;
    engineNumber: string;
    engineCc?: number;
    power?: number;
    insuranceValue?: number;
    registrationDate?: Date;
    brandId: string;
    modelId: string;
    categoryId: string;
    fuelTypeId?: string;
    transmissionTypeId?: string;
    colorId: string;
    trimId?: string;
  };
}

export interface SubmitInspectionRequestInput {
  bankId: string;
  requestId: string;
  userId: string;
  vehicle: {
    vin: string;
    plateNumber?: string;
    manufactureYear: number;
    mileage?: number;
    engineNumber: string;
    engineCc?: number;
    power?: number;
    insuranceValue?: number;
    registrationDate?: Date;
    brandId: string;
    modelId: string;
    categoryId: string;
    fuelTypeId?: string;
    transmissionTypeId?: string;
    colorId: string;
    trimId?: string;
  };
}

@Injectable()
export class InspectionRequestService {
  constructor(
    @Inject('IInspectionRequestRepository')
    private readonly requestRepository: IInspectionRequestRepository,
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
    @Inject('IRequestNumberCounterRepository')
    private readonly counterRepository: IRequestNumberCounterRepository,
    @Inject('ILocationRepository')
    private readonly locationRepository: ILocationRepository,
    @Inject('IVehicleReferenceRepository')
    private readonly vehicleReferenceRepository: IVehicleReferenceRepository,
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
    private readonly bankService: BankService,
    private readonly prisma: PrismaService, // For transactions
  ) {}

  async createRequest(
    input: CreateInspectionRequestInput,
  ): Promise<InspectionRequest> {
    const bank = await this.bankService.getBankById(input.bankId);

    // Validate location if provided
    if (input.location?.cityId) {
      const city = await this.locationRepository.findCity(
        input.location.cityId,
      );
      if (!city) throw new InvalidReferenceDataException('City not found');
      if (
        input.location.governorateId &&
        city.governorateId !== input.location.governorateId
      ) {
        throw new InvalidReferenceDataException(
          'City does not belong to the specified governorate',
        );
      }
      input.location.governorateId = city.governorateId; // Ensure consistency
    } else if (input.location?.governorateId) {
      const exists = await this.locationRepository.existsGovernorate(
        input.location.governorateId,
      );
      if (!exists)
        throw new InvalidReferenceDataException('Governorate not found');
    }

    // Find or create customer
    let customer = await this.customerRepository.findByBankIdAndPhone(
      input.bankId,
      input.customer.phone,
    );
    if (!customer) {
      customer = new Customer({
        id: randomUUID(),
        bankId: input.bankId,
        fullName: input.customer.fullName,
        nationalId: input.customer.nationalId || null,
        phone: input.customer.phone,
        email: input.customer.email || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.customerRepository.save(customer);
    } else {
      // Update customer details if they changed
      let updated = false;
      if (input.customer.fullName !== customer.fullName) {
        customer = new Customer({
          ...customer,
          fullName: input.customer.fullName,
        } as any);
        updated = true;
      }
      // other fields can be updated similarly...
      if (updated) await this.customerRepository.update(customer);
    }

    let vehicleId: string | null = null;
    let initialStatus = InspectionStatus.DRAFT;

    // Process vehicle if provided
    if (input.vehicle) {
      await this.validateVehicleRefs(input.vehicle);

      const existingOpenRequests =
        await this.requestRepository.findOpenByBankAndVehicleId(
          input.bankId,
          input.vehicle.vin,
        );
      if (existingOpenRequests.length > 0) {
        throw new InspectionRequestAlreadyExistsException(input.vehicle.vin);
      }

      let vehicle = await this.vehicleRepository.findByVin(input.vehicle.vin);
      if (!vehicle) {
        vehicle = new Vehicle({
          id: randomUUID(),
          vin: input.vehicle.vin,
          plateNumber: input.vehicle.plateNumber || null,
          manufactureYear: input.vehicle.manufactureYear,
          mileage: input.vehicle.mileage || null,
          engineNumber: input.vehicle.engineNumber,
          engineCc: input.vehicle.engineCc || null,
          power: input.vehicle.power || null,
          insuranceValue: input.vehicle.insuranceValue || null,
          registrationDate: input.vehicle.registrationDate || null,
          status: 'ACTIVE',
          brandId: input.vehicle.brandId,
          modelId: input.vehicle.modelId,
          categoryId: input.vehicle.categoryId,
          fuelTypeId: input.vehicle.fuelTypeId || null,
          transmissionTypeId: input.vehicle.transmissionTypeId || null,
          colorId: input.vehicle.colorId,
          trimId: input.vehicle.trimId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });
        await this.vehicleRepository.save(vehicle);
      }
      vehicleId = vehicle.id;
      initialStatus = InspectionStatus.PENDING; // Fully specified request
    }

    // Generate request number and save in transaction
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    let request!: InspectionRequest;

    await this.prisma.$transaction(async (tx) => {
      const seq = await this.counterRepository.nextSequence(
        bank.id,
        period,
        tx,
      );
      const requestNumber = `IR-${bank.code}-${period}-${String(seq).padStart(6, '0')}`;

      request = new InspectionRequest({
        id: randomUUID(),
        requestNumber,
        bankId: bank.id,
        vehicleId,
        customerId: customer.id,
        assignedRepresentativeId: null,
        assignedReviewerId: null,
        currentStatus: initialStatus,
        priority: InspectionPriority.MEDIUM,
        governorateId: input.location?.governorateId || null,
        cityId: input.location?.cityId || null,
        latitude: input.location?.latitude || null,
        longitude: input.location?.longitude || null,
        address: input.location?.address || null,
        requestedCompletionDate: input.requestedCompletionDate || null,
        requestedAt: new Date(),
        assignedAt: null,
        completedAt: null,
        notes: input.notes || null,
        createdBy: input.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.requestRepository.save(request, tx);
    });

    return request;
  }

  async submitRequest(
    input: SubmitInspectionRequestInput,
  ): Promise<InspectionRequest> {
    const request = await this.requestRepository.findByIdAndBankId(
      input.requestId,
      input.bankId,
    );
    if (!request) {
      throw new InspectionRequestNotFoundException(input.requestId);
    }

    await this.validateVehicleRefs(input.vehicle);

    const existingOpenRequests =
      await this.requestRepository.findOpenByBankAndVehicleId(
        input.bankId,
        input.vehicle.vin,
      );
    if (existingOpenRequests.some((r) => r.id !== request.id)) {
      throw new InspectionRequestAlreadyExistsException(input.vehicle.vin);
    }

    let vehicle = await this.vehicleRepository.findByVin(input.vehicle.vin);
    if (!vehicle) {
      vehicle = new Vehicle({
        id: randomUUID(),
        vin: input.vehicle.vin,
        plateNumber: input.vehicle.plateNumber || null,
        manufactureYear: input.vehicle.manufactureYear,
        mileage: input.vehicle.mileage || null,
        engineNumber: input.vehicle.engineNumber,
        engineCc: input.vehicle.engineCc || null,
        power: input.vehicle.power || null,
        insuranceValue: input.vehicle.insuranceValue || null,
        registrationDate: input.vehicle.registrationDate || null,
        status: 'ACTIVE',
        brandId: input.vehicle.brandId,
        modelId: input.vehicle.modelId,
        categoryId: input.vehicle.categoryId,
        fuelTypeId: input.vehicle.fuelTypeId || null,
        transmissionTypeId: input.vehicle.transmissionTypeId || null,
        colorId: input.vehicle.colorId,
        trimId: input.vehicle.trimId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      await this.vehicleRepository.save(vehicle);
    }

    request.setVehicle(vehicle.id);
    request.submit(); // Changes status to PENDING and validates

    await this.requestRepository.update(request);

    // Status history append would go here if implemented in the plan

    return request;
  }

  async getRequestById(id: string, bankId: string): Promise<InspectionRequest> {
    const request = await this.requestRepository.findByIdAndBankId(id, bankId);
    if (!request) throw new InspectionRequestNotFoundException(id);
    return request;
  }

  async listRequestsByBank(bankId: string): Promise<InspectionRequest[]> {
    return this.requestRepository.findByBankId(bankId);
  }

  private async validateVehicleRefs(v: { brandId: string; modelId: string; categoryId: string; colorId: string; fuelTypeId?: string; transmissionTypeId?: string; trimId?: string; }): Promise<void> {
    const [brand, model, cat, color, fuel, trans, trim] = await Promise.all([
      this.vehicleReferenceRepository.existsBrand(v.brandId),
      this.vehicleReferenceRepository.existsModel(v.modelId),
      this.vehicleReferenceRepository.existsCategory(v.categoryId),
      this.vehicleReferenceRepository.existsColor(v.colorId),
      v.fuelTypeId
        ? this.vehicleReferenceRepository.existsFuelType(v.fuelTypeId)
        : Promise.resolve(true),
      v.transmissionTypeId
        ? this.vehicleReferenceRepository.existsTransmissionType(
            v.transmissionTypeId,
          )
        : Promise.resolve(true),
      v.trimId
        ? this.vehicleReferenceRepository.existsTrim(v.trimId)
        : Promise.resolve(true),
    ]);

    if (!brand) throw new InvalidReferenceDataException('Brand not found');
    if (!model) throw new InvalidReferenceDataException('Model not found');
    if (!cat) throw new InvalidReferenceDataException('Category not found');
    if (!color) throw new InvalidReferenceDataException('Color not found');
    if (!fuel) throw new InvalidReferenceDataException('Fuel Type not found');
    if (!trans)
      throw new InvalidReferenceDataException('Transmission Type not found');
    if (!trim) throw new InvalidReferenceDataException('Trim not found');
  }
}
