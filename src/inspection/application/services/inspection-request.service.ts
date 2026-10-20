import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
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
import type { IMarketingValueDecisionRepository } from '../../domain/repositories/marketing-value-decision.repository.interface';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';
import { InspectionStatusHistory } from '../../domain/entities/inspection-status-history.entity';
import { InspectionAssignment } from '../../domain/entities/inspection-assignment.entity';
import { MarketingValueDecision } from '../../domain/entities/marketing-value-decision.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.enum';
import { MembershipStatus } from '../../../organization/domain/value-objects/membership-status.enum';
import { ChecklistReviewDecision } from '../../domain/value-objects/checklist-review-decision.enum';
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
    @Inject('IMarketingValueDecisionRepository')
    private readonly marketingDecisionRepository: IMarketingValueDecisionRepository,
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
        originalTrimId: input.vehicle?.trimId || null,
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

    if (
      !isGlobalAdmin &&
      input.actor.role !== Role.MANAGER &&
      input.actor.role !== Role.REVIEWER
    ) {
      throw new InspectionRequestAccessDeniedException();
    }

    if (
      request.currentStatus !== InspectionStatus.DRAFT &&
      request.currentStatus !== InspectionStatus.UNDER_REVIEW
    ) {
      throw new InvalidInspectionRequestStateException(
        `Cannot edit vehicle information for an inspection request with status '${request.currentStatus}'. Only DRAFT or UNDER_REVIEW requests can be modified.`,
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
    if (newStatus === InspectionStatus.APPROVED && !isGlobalAdmin) {
      throw new InvalidStatusTransitionException(
        'Only Super Admin or System Admin can grant final approval to an inspection request',
      );
    }

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
          InspectionStatus.PENDING_ASSIGNMENT,
          InspectionStatus.REJECTED,
          InspectionStatus.COMPLETED,
          InspectionStatus.IN_PROGRESS,
        ];
        if (!reviewerAllowed.includes(newStatus)) {
          throw new InvalidStatusTransitionException(
            'Reviewers may only transition requests to PENDING_ASSIGNMENT, REJECTED, COMPLETED, or IN_PROGRESS',
          );
        }
        if (
          (newStatus === InspectionStatus.PENDING_ASSIGNMENT ||
            newStatus === InspectionStatus.REJECTED) &&
          request.currentStatus !== InspectionStatus.PENDING
        ) {
          throw new InvalidStatusTransitionException(
            'Reviewer initial approval or rejection is only permitted on PENDING requests',
          );
        }
      } else if (actor.role === Role.MANAGER) {
        if (request.currentStatus === InspectionStatus.REJECTED) {
          if (
            newStatus !== InspectionStatus.PENDING &&
            newStatus !== InspectionStatus.CANCELLED
          ) {
            throw new InvalidStatusTransitionException(
              'Rejected requests may only be resubmitted to PENDING or CANCELLED',
            );
          }
        } else if (newStatus !== InspectionStatus.CANCELLED) {
          throw new InvalidStatusTransitionException(
            'Bank Managers can only cancel active requests or resubmit rejected requests',
          );
        }
      } else {
        throw new InvalidStatusTransitionException(
          `Users with role '${actor.role}' are not permitted to change inspection request status`,
        );
      }
    }

    const oldStatus = request.currentStatus;

    // Rejection must always carry a reason
    if (newStatus === InspectionStatus.REJECTED && !note?.trim()) {
      throw new InvalidStatusTransitionException(
        'A rejection reason is required when rejecting an inspection request',
      );
    }

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

      // Auto-assign reviewer when a REVIEWER actor approves or rejects
      if (
        (newStatus === InspectionStatus.PENDING_ASSIGNMENT ||
          newStatus === InspectionStatus.REJECTED ||
          newStatus === InspectionStatus.COMPLETED) &&
        actor.role === Role.REVIEWER
      ) {
        await tx.inspectionRequest.update({
          where: { id: request.id },
          data: { assignedReviewerId: actor.id },
        });
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
    captureMode?: CaptureMode,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isAllowed =
      actor.role === Role.SUPER_ADMIN ||
      actor.role === Role.SYSTEM_ADMIN ||
      actor.role === Role.REVIEWER;

    if (!isAllowed) {
      throw new InspectionRequestAccessDeniedException(
        'Only Reviewer, Super Admin, or System Admin can assign representatives. Bank members cannot assign representatives.',
      );
    }

    const request = await this.requestRepository.findById(requestId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (
      request.currentStatus !== InspectionStatus.PENDING_ASSIGNMENT &&
      request.currentStatus !== InspectionStatus.ASSIGNED &&
      request.currentStatus !== InspectionStatus.IN_PROGRESS
    ) {
      if (request.currentStatus === InspectionStatus.PENDING) {
        throw new InvalidAssignmentException(
          'Cannot assign representative to an inspection request with status PENDING. The request must first receive Reviewer Initial Approval.',
        );
      }
      throw new InvalidAssignmentException(
        `Cannot assign representative to an inspection request with status '${request.currentStatus}'. Only PENDING_ASSIGNMENT, ASSIGNED, or IN_PROGRESS requests can be assigned.`,
      );
    }

    // Resolve target User representing the representative
    let targetUserId = representativeId;
    let repDisplayName = '';

    const repRecord = await this.prisma.representative.findUnique({
      where: { id: representativeId },
      include: { user: true },
    });

    if (repRecord) {
      repDisplayName = repRecord.name;
      if (repRecord.userId) {
        targetUserId = repRecord.userId;
      } else {
        // Auto-provision or link User account for this representative
        const email =
          repRecord.email?.trim().toLowerCase() ||
          `${repRecord.representativeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@inspect.local`;

        let existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          const names = repRecord.name.trim().split(' ');
          const firstName = names[0] || 'Representative';
          const lastName =
            names.slice(1).join(' ') || repRecord.representativeId;
          const passwordHash = await bcrypt.hash('Rep@123456!', 10);

          existingUser = await this.prisma.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName,
              phone: repRecord.phone || '+201000000000',
              role: Role.REPRESENTATIVE,
              isActive: true,
              isEmailVerified: true,
            },
          });
        } else if (existingUser.role !== Role.REPRESENTATIVE) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { role: Role.REPRESENTATIVE, isActive: true },
          });
        }

        await this.prisma.representative.update({
          where: { id: repRecord.id },
          data: { userId: existingUser.id },
        });

        targetUserId = existingUser.id;
      }
    }

    // Validate representative role
    const repUser = await this.userService.getUserById(targetUserId);
    if (repUser.role !== Role.REPRESENTATIVE) {
      throw new RepresentativeNotEligibleException(
        `User '${targetUserId}' does not have the REPRESENTATIVE role`,
      );
    }
    if (!repDisplayName) {
      repDisplayName = `${repUser.firstName} ${repUser.lastName}`.trim();
    }

    // Ensure active bank membership for this representative in this bank
    const membership =
      await this.bankMembershipRepository.findByBankIdAndUserId(
        request.bankId,
        targetUserId,
      );
    if (!membership) {
      await this.prisma.bankMembership.create({
        data: {
          bankId: request.bankId,
          userId: targetUserId,
          status: 'ACTIVE' as any,
        },
      });
    } else if (membership.status !== MembershipStatus.ACTIVE) {
      await this.prisma.bankMembership.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE' as any },
      });
    }

    const oldStatus = request.currentStatus;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Cancel previous active assignment
      await this.assignmentRepository.cancelActiveByRequestId(request.id, tx);

      // Create new assignment - automatically accepted as inspection starts directly
      const assignment = new InspectionAssignment({
        id: randomUUID(),
        inspectionRequestId: request.id,
        representativeId: targetUserId,
        assignedBy: actor.id,
        status: AssignmentStatus.ACCEPTED,
        rejectedReason: null,
        assignedAt: now,
        acceptedAt: now,
        rejectedAt: null,
      });
      await this.assignmentRepository.save(assignment, tx);

      // Update request domain entity (assign + optional capture mode override) -> transitions directly to IN_PROGRESS
      request.assign(targetUserId, now);
      if (captureMode !== undefined) {
        request.setCaptureSettings(captureMode, request.includeInterior);
      }
      await this.requestRepository.update(request, tx);

      // Record status history
      const defaultNote =
        oldStatus === InspectionStatus.PENDING_ASSIGNMENT
          ? `Assigned representative ${repDisplayName} — inspection in progress`
          : `Reassigned representative to ${repDisplayName}`;
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: oldStatus,
        toStatus: request.currentStatus,
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

  async listRequestsByBank(
    bankId: string,
    statusFilter?: string,
  ): Promise<InspectionRequest[]> {
    return this.requestRepository.findByBankId(bankId, statusFilter);
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

  async submitMediaReview(
    requestId: string,
    bankId: string,
    dto: {
      verifiedMileage: number;
      proposedMarketingValue: number;
      trimId?: string;
      transmissionTypeId?: string;
      sideMirrors?: string;
      sunroofSpecification?: string;
      notes?: string;
      checklistItems?: Array<{
        checklistItemId: string;
        decision: ChecklistReviewDecision;
        notes?: string;
      }>;
    },
    actor: ActorUser,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;
    if (!isGlobalAdmin && actor.role !== Role.REVIEWER) {
      throw new InspectionRequestAccessDeniedException();
    }

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (request.currentStatus !== InspectionStatus.UNDER_REVIEW) {
      throw new InvalidStatusTransitionException(
        `Media review can only be submitted for requests with status 'UNDER_REVIEW'. Current status is '${request.currentStatus}'.`,
      );
    }

    const hasReshoot = dto.checklistItems?.some(
      (item) => item.decision === ChecklistReviewDecision.RESHOOT,
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Update checklist items with review decisions
      if (dto.checklistItems && dto.checklistItems.length > 0) {
        for (const itemReview of dto.checklistItems) {
          const item =
            await this.inspectionChecklistItemRepository.findByRequestAndItem(
              request.id,
              itemReview.checklistItemId,
            );
          if (item) {
            item.setReviewDecision(itemReview.decision, itemReview.notes);
            await this.inspectionChecklistItemRepository.update(item, tx);
          }
        }
      }

      // 2. If any item needs reshoot, return to IN_PROGRESS
      if (hasReshoot) {
        request.transition(InspectionStatus.IN_PROGRESS);
        await this.requestRepository.update(request, tx);

        const history = new InspectionStatusHistory({
          id: randomUUID(),
          inspectionRequestId: request.id,
          fromStatus: InspectionStatus.UNDER_REVIEW,
          toStatus: InspectionStatus.IN_PROGRESS,
          changedBy: actor.id,
          changedAt: new Date(),
          note: `Reshoot requested: ${dto.notes || 'One or more checklist items require reshooting.'}`,
        });
        await this.statusHistoryRepository.save(history, tx);
      } else {
        // 3. Update vehicle verified mileage & verified specifications
        if (request.vehicleId) {
          const vehicle = await this.vehicleRepository.findById(
            request.vehicleId,
          );
          if (vehicle) {
            vehicle.updateDetails({
              ...(dto.verifiedMileage != null ? { mileage: dto.verifiedMileage } : {}),
              ...(dto.trimId !== undefined ? { trimId: dto.trimId || null } : {}),
              ...(dto.transmissionTypeId !== undefined ? { transmissionTypeId: dto.transmissionTypeId || null } : {}),
              ...(dto.sideMirrors !== undefined ? { sideMirrors: dto.sideMirrors || null } : {}),
              ...(dto.sunroofSpecification !== undefined ? { sunroofSpecification: dto.sunroofSpecification || null } : {}),
            });
            await this.vehicleRepository.update(vehicle);
          }
        }

        // 4. Save proposed Marketing Value
        const decision = new MarketingValueDecision({
          id: randomUUID(),
          inspectionRequestId: request.id,
          estimatedValue: dto.proposedMarketingValue,
          approved: false,
          notes: dto.notes || null,
          rejectedReason: null,
          reviewerId: actor.id,
          decidedAt: new Date(),
        });
        await this.marketingDecisionRepository.save(decision, tx);

        // 5. Update assigned reviewer and transition to COMPLETED
        await tx.inspectionRequest.update({
          where: { id: request.id },
          data: { assignedReviewerId: actor.id },
        });

        request.transition(InspectionStatus.COMPLETED);
        await this.requestRepository.update(request, tx);

        const history = new InspectionStatusHistory({
          id: randomUUID(),
          inspectionRequestId: request.id,
          fromStatus: InspectionStatus.UNDER_REVIEW,
          toStatus: InspectionStatus.COMPLETED,
          changedBy: actor.id,
          changedAt: new Date(),
          note: `Media review completed. Proposed Marketing Value: ${dto.proposedMarketingValue.toLocaleString()} EGP. Awaiting Super Admin final approval.`,
        });
        await this.statusHistoryRepository.save(history, tx);
      }
    });

    return this.getRequestDetails(requestId, bankId, actor);
  }

  async superAdminFinalApproval(
    requestId: string,
    bankId: string,
    actor: ActorUser,
    notes?: string,
    approvedMarketingValue?: number,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;
    if (!isGlobalAdmin) {
      throw new InspectionRequestAccessDeniedException();
    }

    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (request.currentStatus !== InspectionStatus.COMPLETED) {
      throw new InvalidStatusTransitionException(
        `Final approval can only be granted to requests in 'COMPLETED' status. Current status is '${request.currentStatus}'.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Accept latest marketing value decision (and update if overridden by Super Admin)
      const latestDecision =
        await this.marketingDecisionRepository.findLatestByRequestId(
          request.id,
          tx,
        );
      if (latestDecision) {
        if (approvedMarketingValue != null && approvedMarketingValue > 0) {
          latestDecision.updateEstimatedValue(approvedMarketingValue);
        }
        latestDecision.accept();
        await this.marketingDecisionRepository.update(latestDecision, tx);
      }

      // 2. Transition request to APPROVED
      request.transition(InspectionStatus.APPROVED);
      await this.requestRepository.update(request, tx);

      // 3. Record status history
      const effectiveVal = approvedMarketingValue ?? latestDecision?.estimatedValue;
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: InspectionStatus.COMPLETED,
        toStatus: InspectionStatus.APPROVED,
        changedBy: actor.id,
        changedAt: new Date(),
        note: notes
          ? `Final approval granted: ${notes}${effectiveVal ? ` (Authorized value: ${effectiveVal.toLocaleString()} EGP)` : ''}`
          : `Final approval granted. Marketing value ${effectiveVal ? `(${effectiveVal.toLocaleString()} EGP) ` : ''}accepted and inspection report unlocked.`,
      });
      await this.statusHistoryRepository.save(history, tx);
    });

    return this.getRequestDetails(requestId, bankId, actor);
  }

  async superAdminRequestPriceRevision(
    requestId: string,
    bankId: string,
    reason: string,
    actor: ActorUser,
  ): Promise<InspectionRequestDetailResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;
    if (!isGlobalAdmin) {
      throw new InspectionRequestAccessDeniedException();
    }

    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    if (request.currentStatus !== InspectionStatus.COMPLETED) {
      throw new InvalidStatusTransitionException(
        `Price revision can only be requested for requests in 'COMPLETED' status. Current status is '${request.currentStatus}'.`,
      );
    }

    if (!reason?.trim()) {
      throw new InvalidStatusTransitionException(
        'A reason is required when requesting a price revision',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Record rejection reason on latest marketing decision
      const latestDecision =
        await this.marketingDecisionRepository.findLatestByRequestId(
          request.id,
          tx,
        );
      if (latestDecision) {
        latestDecision.rejectRevision(reason.trim());
        await this.marketingDecisionRepository.update(latestDecision, tx);
      }

      // 2. Transition request back to UNDER_REVIEW
      request.transition(InspectionStatus.UNDER_REVIEW);
      await this.requestRepository.update(request, tx);

      // 3. Record status history
      const history = new InspectionStatusHistory({
        id: randomUUID(),
        inspectionRequestId: request.id,
        fromStatus: InspectionStatus.COMPLETED,
        toStatus: InspectionStatus.UNDER_REVIEW,
        changedBy: actor.id,
        changedAt: new Date(),
        note: `Price revision requested by Super Admin: ${reason.trim()}`,
      });
      await this.statusHistoryRepository.save(history, tx);
    });

    return this.getRequestDetails(requestId, bankId, actor);
  }

  async getAnalytics(
    params: { bankId?: string; periodDays?: number },
    actor: ActorUser,
  ) {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;
    const isReviewer = actor.role === Role.REVIEWER;
    const periodDays =
      params.periodDays && params.periodDays > 0 ? params.periodDays : 30;

    let targetBankId: string | undefined = undefined;
    let bankName: string | null = null;
    let isGlobal = false;

    if (isGlobalAdmin) {
      if (params.bankId && params.bankId !== 'all') {
        targetBankId = params.bankId;
        const b = await this.prisma.bank.findUnique({
          where: { id: targetBankId },
          select: { name: true },
        });
        bankName = b?.name || null;
      } else {
        isGlobal = true;
      }
    } else if (isReviewer) {
      const memberships = await this.prisma.bankMembership.findMany({
        where: { userId: actor.id, status: 'ACTIVE' as any },
        select: { bankId: true, bank: { select: { name: true } } },
      });
      const allowedBankIds = memberships.map((m) => m.bankId);

      if (params.bankId && params.bankId !== 'all') {
        if (
          allowedBankIds.length > 0 &&
          !allowedBankIds.includes(params.bankId)
        ) {
          throw new InspectionRequestAccessDeniedException(
            'Access denied. You can only view analytics for your assigned bank.',
          );
        }
        targetBankId = params.bankId;
        const b = await this.prisma.bank.findUnique({
          where: { id: targetBankId },
          select: { name: true },
        });
        bankName = b?.name || null;
      } else {
        if (allowedBankIds.length > 0) {
          targetBankId = allowedBankIds[0];
          const b = memberships.find((m) => m.bankId === targetBankId)?.bank;
          bankName = b?.name || null;
        } else {
          isGlobal = true;
        }
      }
    } else {
      // Bank Admin, Member, Manager, User, Viewer
      const memberships = await this.prisma.bankMembership.findMany({
        where: { userId: actor.id, status: 'ACTIVE' as any },
        select: { bankId: true, bank: { select: { name: true } } },
      });

      if (memberships.length === 0) {
        throw new InspectionRequestAccessDeniedException(
          'No active bank membership found.',
        );
      }

      const allowedBankIds = memberships.map((m) => m.bankId);
      if (params.bankId && params.bankId !== 'all') {
        if (!allowedBankIds.includes(params.bankId)) {
          throw new InspectionRequestAccessDeniedException(
            'Access denied. You cannot view analytics for other banks.',
          );
        }
        targetBankId = params.bankId;
      } else {
        targetBankId = allowedBankIds[0];
      }

      const b = memberships.find((m) => m.bankId === targetBankId)?.bank;
      bankName = b?.name || null;
      isGlobal = false;
    }

    const whereClause: any = {};
    if (targetBankId) {
      whereClause.bankId = targetBankId;
    }

    const requests = await this.prisma.inspectionRequest.findMany({
      where: whereClause,
      include: {
        vehicle: {
          include: {
            category: true,
            brand: true,
            model: true,
          },
        },
        customer: true,
        bank: {
          select: { id: true, name: true },
        },
        marketingDecisions: {
          orderBy: { decidedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRequests = requests.length;
    let pendingInitialApproval = 0;
    let pendingAssignment = 0;
    let inField = 0;
    let underValuationReview = 0;
    let completed = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    let totalValuation = 0;
    let turnaroundTotalDays = 0;
    let turnaroundCount = 0;

    const priorityCounts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    const categoryMap = new Map<
      string,
      { name: string; count: number; totalValuation: number }
    >();

    for (const req of requests) {
      if (priorityCounts[req.priority] !== undefined) {
        priorityCounts[req.priority] += 1;
      }

      switch (req.currentStatus) {
        case InspectionStatus.PENDING:
          pendingInitialApproval += 1;
          break;
        case InspectionStatus.PENDING_ASSIGNMENT:
          pendingAssignment += 1;
          break;
        case InspectionStatus.ASSIGNED:
        case InspectionStatus.IN_PROGRESS:
          inField += 1;
          break;
        case InspectionStatus.UNDER_REVIEW:
          underValuationReview += 1;
          break;
        case InspectionStatus.COMPLETED:
          completed += 1;
          break;
        case InspectionStatus.APPROVED:
          approved += 1;
          break;
        case InspectionStatus.REJECTED:
          rejected += 1;
          break;
        case InspectionStatus.CANCELLED:
          cancelled += 1;
          break;
      }

      const val = req.marketingDecisions[0]?.estimatedValue
        ? Number(req.marketingDecisions[0].estimatedValue)
        : req.vehicle?.insuranceValue
        ? Number(req.vehicle.insuranceValue)
        : 0;

      if (req.currentStatus === InspectionStatus.APPROVED && val > 0) {
        totalValuation += val;
      }

      if (req.currentStatus === InspectionStatus.APPROVED) {
        const finishDate = req.completedAt || req.updatedAt;
        const diffMs = finishDate.getTime() - req.createdAt.getTime();
        const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
        turnaroundTotalDays += diffDays;
        turnaroundCount += 1;
      }

      const catName = req.vehicle?.category?.name || 'Standard';
      const existing = categoryMap.get(catName) || {
        name: catName,
        count: 0,
        totalValuation: 0,
      };
      existing.count += 1;
      if (req.currentStatus === InspectionStatus.APPROVED) {
        existing.totalValuation += val;
      }
      categoryMap.set(catName, existing);
    }

    const activePipeline =
      pendingInitialApproval +
      pendingAssignment +
      inField +
      underValuationReview +
      completed;

    const decisiveTotal = approved + rejected + cancelled;
    const approvalRate =
      decisiveTotal > 0
        ? Math.round((approved / decisiveTotal) * 100)
        : approved > 0
        ? 100
        : 0;

    const averageValuation =
      approved > 0 ? Math.round(totalValuation / approved) : 0;

    const averageTurnaroundDays =
      turnaroundCount > 0
        ? Math.round((turnaroundTotalDays / turnaroundCount) * 10) / 10
        : 0;

    const trendMap = new Map<string, { created: number; approved: number }>();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { created: 0, approved: 0 });
    }

    for (const req of requests) {
      const cKey = req.createdAt.toISOString().slice(0, 10);
      if (trendMap.has(cKey)) {
        trendMap.get(cKey)!.created += 1;
      }
      if (req.currentStatus === InspectionStatus.APPROVED) {
        const aKey = (req.completedAt || req.updatedAt)
          .toISOString()
          .slice(0, 10);
        if (trendMap.has(aKey)) {
          trendMap.get(aKey)!.approved += 1;
        }
      }
    }

    const volumeTrend = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      formattedDate: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      created: counts.created,
      approved: counts.approved,
    }));

    const statusBreakdown = [
      {
        status: 'PENDING',
        label: 'Initial Review',
        count: pendingInitialApproval,
        color: '#f59e0b',
      },
      {
        status: 'PENDING_ASSIGNMENT',
        label: 'Awaiting Rep Assignment',
        count: pendingAssignment,
        color: '#3b82f6',
      },
      {
        status: 'IN_FIELD',
        label: 'Field Inspection',
        count: inField,
        color: '#8b5cf6',
      },
      {
        status: 'UNDER_REVIEW',
        label: 'Media & Pricing Review',
        count: underValuationReview + completed,
        color: '#06b6d4',
      },
      {
        status: 'APPROVED',
        label: 'Final Approved',
        count: approved,
        color: '#10b981',
      },
      {
        status: 'REJECTED_CANCELLED',
        label: 'Rejected / Cancelled',
        count: rejected + cancelled,
        color: '#ef4444',
      },
    ].map((item) => ({
      ...item,
      percentage:
        totalRequests > 0
          ? Math.round((item.count / totalRequests) * 100)
          : 0,
    }));

    const categoryDistribution = Array.from(categoryMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    const checklistItems = await this.prisma.inspectionChecklistItem.findMany({
      where: {
        inspectionRequest: whereClause,
        reviewDecision: { not: null },
      },
      select: { reviewDecision: true },
    });
    const passCount = checklistItems.filter(
      (c) => c.reviewDecision === 'PASS',
    ).length;
    const failCount = checklistItems.filter(
      (c) => c.reviewDecision === 'FAIL',
    ).length;
    const reshootCount = checklistItems.filter(
      (c) => c.reviewDecision === 'RESHOOT',
    ).length;
    const totalReviewed = checklistItems.length;
    const passRate =
      totalReviewed > 0 ? Math.round((passCount / totalReviewed) * 100) : 0;

    const recentRequests = requests.slice(0, 6).map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      status: r.currentStatus,
      priority: r.priority,
      requestedAt: r.requestedAt.toISOString(),
      bankId: r.bankId,
      bankName: r.bank?.name || 'Bank',
      customerName: r.customer?.fullName || 'N/A',
      vehicleDescription: r.vehicle
        ? `${r.vehicle.brand?.name || ''} ${r.vehicle.model?.name || ''} ${
            r.vehicle.manufactureYear || ''
          }`.trim()
        : 'Vehicle info pending',
      marketValue: r.marketingDecisions[0]?.estimatedValue
        ? Number(r.marketingDecisions[0].estimatedValue)
        : undefined,
    }));

    return {
      scope: {
        bankId: targetBankId || null,
        bankName,
        isGlobal,
        periodDays,
      },
      overview: {
        totalRequests,
        activePipeline,
        pendingInitialApproval,
        pendingAssignment,
        inField,
        underValuationReview: underValuationReview + completed,
        completed,
        approved,
        rejected,
        cancelled,
        approvalRate,
        totalValuation,
        averageValuation,
        averageTurnaroundDays,
      },
      statusBreakdown,
      volumeTrend,
      categoryDistribution,
      priorityDistribution: [
        { priority: 'LOW', count: priorityCounts.LOW },
        { priority: 'MEDIUM', count: priorityCounts.MEDIUM },
        { priority: 'HIGH', count: priorityCounts.HIGH },
        { priority: 'URGENT', count: priorityCounts.URGENT },
      ],
      checklistPerformance: {
        totalItemsReviewed: totalReviewed,
        passCount,
        failCount,
        reshootCount,
        passRate,
      },
      recentRequests,
    };
  }
}
