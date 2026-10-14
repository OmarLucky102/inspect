import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionRequestRepository } from '../../domain/repositories/inspection-request.repository.interface';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import type { IRequestNumberCounterRepository } from '../../domain/repositories/request-number-counter.repository.interface';
import type { ILocationRepository } from '../../domain/repositories/location.repository.interface';
import type { IVehicleReferenceRepository } from '../../domain/repositories/vehicle-reference.repository.interface';
import type { IVehicleRepository } from '../../../vehicle/domain/repositories/vehicle.repository.interface';
import type { IChecklistItemRepository } from '../../domain/repositories/checklist-item.repository.interface';
import type { IChecklistRepository } from '../../domain/repositories/checklist.repository.interface';
import type { IInspectionChecklistItemRepository } from '../../domain/repositories/inspection-checklist-item.repository.interface';
import type { IInspectionStatusHistoryRepository } from '../../domain/repositories/inspection-status-history.repository.interface';
import type { IInspectionAssignmentRepository } from '../../domain/repositories/inspection-assignment.repository.interface';
import type { IBankMembershipRepository } from '../../../organization/domain/repositories/bank-membership.repository.interface';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';
import { InspectionStatusHistory } from '../../domain/entities/inspection-status-history.entity';
import { InspectionAssignment } from '../../domain/entities/inspection-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';
import { BankService } from '../../../organization/application/services/bank.service';
import { UserService } from '../../../identity/application/services/user.service';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Vehicle } from '../../../vehicle/domain/entities/vehicle.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';
import { CaptureMode } from '../../domain/value-objects/capture-mode.enum';
import {
  InvalidReferenceDataException,
  InspectionRequestAlreadyExistsException,
  InspectionRequestNotFoundException,
  InvalidInspectionRequestStateException,
  VehicleDataRequiredException,
  InvalidStatusTransitionException,
  InvalidAssignmentException,
  RepresentativeNotEligibleException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { InspectionRequestDetailResponseDto } from '../../presentation/dto/inspection-request-detail.response.dto';
import { InspectionStatusHistoryResponseDto } from '../../presentation/dto/inspection-status-history.response.dto';

export interface VehicleDataInput {
  vin: string;
  brandId: string;
  modelId: string;
  manufactureYear: number;
  categoryId: string;
  engineNumber: string;
  engineCc?: number;
  plateNumber?: string;
  power?: number;
  mileage?: number;
  colorId?: string;
  trimId?: string;
  transmissionTypeId?: string;
  fuelTypeId?: string;
  insuranceValue?: number;
  sunroofSpecification?: string;
  sideMirrors?: string;
  carInterior?: string;
  calendarNumber?: string;
  specialInstructions?: string;
  registrationDate?: Date;
  captureMode?: CaptureMode;
  includeInterior?: boolean;
  submit?: boolean;
}

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
  vehicle?: VehicleDataInput;
}

export interface SubmitInspectionRequestInput {
  bankId: string;
  requestId: string;
  userId: string;
  vehicle: VehicleDataInput;
}

export interface SetVehicleInfoInput {
  bankId: string;
  requestId: string;
  actor: ActorUser;
  vehicle: VehicleDataInput;
}

export interface ActorUser {
  id: string;
  role: Role;
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
    @Inject('IChecklistRepository')
    private readonly checklistRepository: IChecklistRepository,
    @Inject('IChecklistItemRepository')
    private readonly checklistItemRepository: IChecklistItemRepository,
    @Inject('IInspectionChecklistItemRepository')
    private readonly inspectionChecklistItemRepository: IInspectionChecklistItemRepository,
    @Inject('IInspectionStatusHistoryRepository')
    private readonly statusHistoryRepository: IInspectionStatusHistoryRepository,
    @Inject('IInspectionAssignmentRepository')
    private readonly assignmentRepository: IInspectionAssignmentRepository,
    @Inject('IBankMembershipRepository')
    private readonly bankMembershipRepository: IBankMembershipRepository,
    private readonly userService: UserService,
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
      let updated = false;
      if (input.customer.fullName !== customer.fullName) {
        customer = new Customer({
          ...customer,
          fullName: input.customer.fullName,
        } as any);
        updated = true;
      }
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

      const vehicle = await this.findOrCreateOrUpdateVehicle(input.vehicle);
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
        captureMode: input.vehicle?.captureMode ?? CaptureMode.STANDARD,
        includeInterior: input.vehicle?.includeInterior ?? true,
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

      // Record initial status history
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: null,
        toStatus: initialStatus,
        changedBy: input.userId,
        changedAt: now,
        note: 'Inspection request created',
      });
      await this.statusHistoryRepository.save(history, tx);

      // Attach checklist items
      const mandatoryItems =
        await this.checklistItemRepository.findMandatoryItems();
      const mergedItems = new Map<string, any>();

      for (const item of mandatoryItems) {
        mergedItems.set(item.code, item);
      }

      if (input.vehicle?.categoryId) {
        const checklists = await this.checklistRepository.findByCategoryId(
          input.vehicle.categoryId,
        );
        for (const cl of checklists) {
          const items = await this.checklistItemRepository.findByChecklistId(
            cl.id,
          );
          for (const item of items) {
            if (
              (!item.bankId || item.bankId === bank.id) &&
              !mergedItems.has(item.code)
            ) {
              mergedItems.set(item.code, item);
            }
          }
        }
      }

      const inspectionChecklistItems = Array.from(mergedItems.values()).map(
        (item: any) => {
          return new InspectionChecklistItem({
            id: randomUUID(),
            inspectionRequestId: request.id,
            checklistItemId: item.id,
            value: null,
            notes: null,
            completed: false,
            completedAt: null,
          });
        },
      );

      await this.inspectionChecklistItemRepository.bulkCreate(
        inspectionChecklistItems,
        tx,
      );
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

    const vehicle = await this.findOrCreateOrUpdateVehicle(input.vehicle);

    request.setVehicle(vehicle.id);
    if (
      input.vehicle.captureMode !== undefined ||
      input.vehicle.includeInterior !== undefined
    ) {
      request.setCaptureSettings(
        input.vehicle.captureMode,
        input.vehicle.includeInterior,
      );
    }
    request.submit(); // Changes status to PENDING and validates

    await this.prisma.$transaction(async (tx) => {
      await this.requestRepository.update(request, tx);

      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: InspectionStatus.DRAFT,
        toStatus: InspectionStatus.PENDING,
        changedBy: input.userId,
        changedAt: new Date(),
        note: 'Draft request submitted',
      });
      await this.statusHistoryRepository.save(history, tx);
    });

    return request;
  }

  async setVehicleInfo(
    input: SetVehicleInfoInput,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      input.actor.role === Role.SUPER_ADMIN ||
      input.actor.role === Role.SYSTEM_ADMIN;

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(input.requestId)
      : await this.requestRepository.findByIdAndBankId(
          input.requestId,
          input.bankId,
        );

    if (!request) {
      throw new InspectionRequestNotFoundException(input.requestId);
    }

    if (!isGlobalAdmin && input.actor.role !== Role.MANAGER) {
      throw new InspectionRequestAccessDeniedException();
    }

    if (request.currentStatus !== InspectionStatus.DRAFT) {
      throw new InvalidInspectionRequestStateException(
        `Cannot edit vehicle information for an inspection request with status '${request.currentStatus}'. Only DRAFT requests can be modified.`,
      );
    }

    const vData = input.vehicle;
    await this.validateVehicleRefs(vData);

    const existingOpenRequests =
      await this.requestRepository.findOpenByBankAndVehicleId(
        request.bankId,
        vData.vin,
      );
    if (existingOpenRequests.some((r) => r.id !== request.id)) {
      throw new InspectionRequestAlreadyExistsException(vData.vin);
    }

    const vehicle = await this.findOrCreateOrUpdateVehicle(vData);

    request.setVehicle(vehicle.id);
    request.setCaptureSettings(vData.captureMode, vData.includeInterior);

    const shouldSubmit = vData.submit === true;
    if (shouldSubmit) {
      request.submit();
    }

    await this.prisma.$transaction(async (tx) => {
      await this.requestRepository.update(request, tx);

      if (vData.categoryId) {
        const existingItems =
          await this.inspectionChecklistItemRepository.findByRequestId(
            request.id,
          );
        if (existingItems.length === 0) {
          const mandatoryItems =
            await this.checklistItemRepository.findMandatoryItems();
          const mergedItems = new Map<string, any>();
          for (const item of mandatoryItems) {
            mergedItems.set(item.code, item);
          }
          const checklists = await this.checklistRepository.findByCategoryId(
            vData.categoryId,
          );
          for (const cl of checklists) {
            const items = await this.checklistItemRepository.findByChecklistId(
              cl.id,
            );
            for (const item of items) {
              if (
                (!item.bankId || item.bankId === request.bankId) &&
                !mergedItems.has(item.code)
              ) {
                mergedItems.set(item.code, item);
              }
            }
          }

          const checklistEntities = Array.from(mergedItems.values()).map(
            (item: any) =>
              new InspectionChecklistItem({
                id: randomUUID(),
                inspectionRequestId: request.id,
                checklistItemId: item.id,
                value: null,
                notes: null,
                completed: false,
                completedAt: null,
              }),
          );
          if (checklistEntities.length > 0) {
            await this.inspectionChecklistItemRepository.bulkCreate(
              checklistEntities,
              tx,
            );
          }
        }
      }

      if (shouldSubmit) {
        const history = new InspectionStatusHistory({
          id: randomUUID(),
          inspectionRequestId: request.id,
          fromStatus: InspectionStatus.DRAFT,
          toStatus: InspectionStatus.PENDING,
          changedBy: input.actor.id,
          changedAt: new Date(),
          note: 'Vehicle information completed and request submitted',
        });
        await this.statusHistoryRepository.save(history, tx);
      }
    });

    return this.getRequestDetails(request.id, request.bankId, input.actor);
  }

  private async findOrCreateOrUpdateVehicle(
    vData: VehicleDataInput,
  ): Promise<Vehicle> {
    let vehicle = await this.vehicleRepository.findByVin(vData.vin);
    if (!vehicle) {
      vehicle = new Vehicle({
        id: randomUUID(),
        vin: vData.vin,
        plateNumber: vData.plateNumber || null,
        manufactureYear: vData.manufactureYear,
        mileage: vData.mileage ?? null,
        engineNumber: vData.engineNumber,
        engineCc: vData.engineCc ?? null,
        power: vData.power ?? null,
        insuranceValue: vData.insuranceValue ?? null,
        registrationDate: vData.registrationDate ?? null,
        sunroofSpecification: vData.sunroofSpecification || null,
        sideMirrors: vData.sideMirrors || null,
        carInterior: vData.carInterior || null,
        calendarNumber: vData.calendarNumber || null,
        specialInstructions: vData.specialInstructions || null,
        status: 'ACTIVE',
        brandId: vData.brandId,
        modelId: vData.modelId,
        categoryId: vData.categoryId,
        fuelTypeId: vData.fuelTypeId || null,
        transmissionTypeId: vData.transmissionTypeId || null,
        colorId: vData.colorId || null,
        trimId: vData.trimId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      await this.vehicleRepository.save(vehicle);
    } else {
      vehicle.updateDetails({
        plateNumber:
          vData.plateNumber !== undefined
            ? vData.plateNumber || null
            : vehicle.plateNumber,
        manufactureYear: vData.manufactureYear,
        mileage: vData.mileage !== undefined ? vData.mileage : vehicle.mileage,
        engineNumber: vData.engineNumber,
        engineCc:
          vData.engineCc !== undefined ? vData.engineCc : vehicle.engineCc,
        power: vData.power !== undefined ? vData.power : vehicle.power,
        insuranceValue:
          vData.insuranceValue !== undefined
            ? vData.insuranceValue
            : vehicle.insuranceValue,
        registrationDate:
          vData.registrationDate !== undefined
            ? vData.registrationDate
            : vehicle.registrationDate,
        sunroofSpecification:
          vData.sunroofSpecification !== undefined
            ? vData.sunroofSpecification || null
            : vehicle.sunroofSpecification,
        sideMirrors:
          vData.sideMirrors !== undefined
            ? vData.sideMirrors || null
            : vehicle.sideMirrors,
        carInterior:
          vData.carInterior !== undefined
            ? vData.carInterior || null
            : vehicle.carInterior,
        calendarNumber:
          vData.calendarNumber !== undefined
            ? vData.calendarNumber || null
            : vehicle.calendarNumber,
        specialInstructions:
          vData.specialInstructions !== undefined
            ? vData.specialInstructions || null
            : vehicle.specialInstructions,
        brandId: vData.brandId,
        modelId: vData.modelId,
        categoryId: vData.categoryId,
        fuelTypeId:
          vData.fuelTypeId !== undefined
            ? vData.fuelTypeId || null
            : vehicle.fuelTypeId,
        transmissionTypeId:
          vData.transmissionTypeId !== undefined
            ? vData.transmissionTypeId || null
            : vehicle.transmissionTypeId,
        colorId:
          vData.colorId !== undefined ? vData.colorId || null : vehicle.colorId,
        trimId:
          vData.trimId !== undefined ? vData.trimId || null : vehicle.trimId,
      });
      await this.vehicleRepository.update(vehicle);
    }
    return vehicle;
  }

  async getRequestById(id: string, bankId: string): Promise<InspectionRequest> {
    const request = await this.requestRepository.findByIdAndBankId(id, bankId);
    if (!request) throw new InspectionRequestNotFoundException(id);
    return request;
  }

  async getRequestDetails(
    requestId: string,
    bankId: string,
    actor: ActorUser,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const data = await this.requestRepository.findByIdWithDetails(
      requestId,
      isGlobalAdmin ? undefined : bankId,
    );

    if (!data) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (
      actor.role === Role.REPRESENTATIVE &&
      (data.assignedRepresentativeId ?? data.assignedRepresentative?.id) !==
        actor.id
    ) {
      throw new InspectionRequestAccessDeniedException();
    }

    return InspectionRequestDetailResponseDto.fromPrisma(data);
  }

  async updateStatus(
    requestId: string,
    bankId: string,
    newStatus: InspectionStatus,
    note: string | undefined,
    actor: ActorUser,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    // Role-specific transition permissions
    if (!isGlobalAdmin) {
      if (actor.role === Role.REPRESENTATIVE) {
        if (request.assignedRepresentativeId !== actor.id) {
          throw new InspectionRequestAccessDeniedException();
        }
        const repAllowed = [
          InspectionStatus.IN_PROGRESS,
          InspectionStatus.UNDER_REVIEW,
        ];
        if (!repAllowed.includes(newStatus)) {
          throw new InvalidStatusTransitionException(
            'Representatives may only transition assigned requests to IN_PROGRESS or UNDER_REVIEW',
          );
        }
      } else if (actor.role === Role.REVIEWER) {
        const reviewerAllowed = [
          InspectionStatus.COMPLETED,
          InspectionStatus.IN_PROGRESS,
          InspectionStatus.APPROVED,
          InspectionStatus.REJECTED,
        ];
        if (!reviewerAllowed.includes(newStatus)) {
          throw new InvalidStatusTransitionException(
            'Reviewers may only transition requests to COMPLETED, IN_PROGRESS, APPROVED, or REJECTED',
          );
        }
      } else if (actor.role !== Role.MANAGER) {
        throw new InvalidStatusTransitionException(
          `Users with role '${actor.role}' are not permitted to change inspection request status`,
        );
      }
    }

    const oldStatus = request.currentStatus;
    request.transition(newStatus);

    await this.prisma.$transaction(async (tx) => {
      await this.requestRepository.update(request, tx);

      // Handle active assignment lifecycle transitions
      if (newStatus === InspectionStatus.IN_PROGRESS) {
        const activeAssignment =
          await this.assignmentRepository.findActiveByRequestId(request.id, tx);
        if (
          activeAssignment &&
          activeAssignment.status === AssignmentStatus.PENDING
        ) {
          activeAssignment.accept(new Date());
          await this.assignmentRepository.update(activeAssignment, tx);
        }
      } else if (newStatus === InspectionStatus.COMPLETED) {
        const activeAssignment =
          await this.assignmentRepository.findActiveByRequestId(request.id, tx);
        if (activeAssignment) {
          activeAssignment.complete();
          await this.assignmentRepository.update(activeAssignment, tx);
        }
      } else if (newStatus === InspectionStatus.CANCELLED) {
        await this.assignmentRepository.cancelActiveByRequestId(request.id, tx);
      }

      // Record status history
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedBy: actor.id,
        changedAt: new Date(),
        note: note || null,
      });
      await this.statusHistoryRepository.save(history, tx);
    });

    return this.getRequestDetails(requestId, bankId, actor);
  }

  async assignRepresentative(
    requestId: string,
    bankId: string,
    representativeId: string,
    actor: ActorUser,
    notes?: string,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (
      request.currentStatus !== InspectionStatus.PENDING &&
      request.currentStatus !== InspectionStatus.ASSIGNED
    ) {
      throw new InvalidAssignmentException(
        `Cannot assign representative to an inspection request with status '${request.currentStatus}'. Only PENDING or ASSIGNED requests can be assigned.`,
      );
    }

    // Validate representative role
    const repUser = await this.userService.getUserById(representativeId);
    if (repUser.role !== Role.REPRESENTATIVE) {
      throw new RepresentativeNotEligibleException(
        `User '${representativeId}' does not have the REPRESENTATIVE role`,
      );
    }

    // Validate active bank membership
    const membership =
      await this.bankMembershipRepository.findByBankIdAndUserId(
        request.bankId,
        representativeId,
      );
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new RepresentativeNotEligibleException(
        `Representative '${representativeId}' is not an active member of bank '${request.bankId}'`,
      );
    }

    const oldStatus = request.currentStatus;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Cancel previous active assignment
      await this.assignmentRepository.cancelActiveByRequestId(request.id, tx);

      // Create new assignment
      const assignment = new InspectionAssignment({
        id: randomUUID(),
        inspectionRequestId: request.id,
        representativeId: representativeId,
        assignedBy: actor.id,
        status: AssignmentStatus.PENDING,
        rejectedReason: null,
        assignedAt: now,
        acceptedAt: null,
        rejectedAt: null,
      });
      await this.assignmentRepository.save(assignment, tx);

      // Update request domain entity
      request.assign(representativeId, now);
      await this.requestRepository.update(request, tx);

      // Record status history
      const defaultNote =
        oldStatus === InspectionStatus.PENDING
          ? `Assigned representative ${repUser.firstName} ${repUser.lastName}`
          : `Reassigned representative to ${repUser.firstName} ${repUser.lastName}`;
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: oldStatus,
        toStatus: InspectionStatus.ASSIGNED,
        changedBy: actor.id,
        changedAt: now,
        note: notes || defaultNote,
      });
      await this.statusHistoryRepository.save(history, tx);
    });

    return this.getRequestDetails(requestId, bankId, actor);
  }

  async getStatusHistory(
    requestId: string,
    bankId: string,
    actor: ActorUser,
  ): Promise<InspectionStatusHistoryResponseDto[]> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (
      actor.role === Role.REPRESENTATIVE &&
      request.assignedRepresentativeId !== actor.id
    ) {
      throw new InspectionRequestAccessDeniedException();
    }

    const historyRows =
      await this.statusHistoryRepository.findByRequestIdWithDetails(requestId);
    return historyRows.map((r) =>
      InspectionStatusHistoryResponseDto.fromPrisma(r),
    );
  }

  async listRequestsByBank(bankId: string): Promise<InspectionRequest[]> {
    return this.requestRepository.findByBankId(bankId);
  }

  private async validateVehicleRefs(v: {
    brandId: string;
    modelId: string;
    categoryId: string;
    colorId?: string;
    fuelTypeId?: string;
    transmissionTypeId?: string;
    trimId?: string;
  }): Promise<void> {
    const [brand, model, cat, color, fuel, trans, trim] = await Promise.all([
      this.vehicleReferenceRepository.existsBrand(v.brandId),
      this.vehicleReferenceRepository.existsModel(v.modelId, v.brandId),
      this.vehicleReferenceRepository.existsCategory(v.categoryId),
      v.colorId
        ? this.vehicleReferenceRepository.existsColor(v.colorId)
        : Promise.resolve(true),
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
    if (!model)
      throw new InvalidReferenceDataException(
        'Model not found or does not belong to the selected Brand',
      );
    if (!cat) throw new InvalidReferenceDataException('Category not found');
    if (!color) throw new InvalidReferenceDataException('Color not found');
    if (!fuel) throw new InvalidReferenceDataException('Fuel Type not found');
    if (!trans)
      throw new InvalidReferenceDataException('Transmission Type not found');
    if (!trim) throw new InvalidReferenceDataException('Trim not found');
  }
}
