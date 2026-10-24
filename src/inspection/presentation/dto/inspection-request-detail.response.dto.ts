import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';

export interface InspectionRequestWithRelations {
  id: string;
  requestNumber: string;
  bankId: string;
  customerId?: string;
  vehicleId?: string | null;
  assignedRepresentativeId?: string | null;
  assignedReviewerId?: string | null;
  createdBy?: string;
  currentStatus: InspectionStatus;
  priority: InspectionPriority;
  captureMode?: string;
  includeInterior?: boolean;
  requestedAt: Date;
  requestedCompletionDate: Date | null;
  assignedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  governorateId: string | null;
  cityId: string | null;
  address: string | null;
  latitude: { toNumber?: () => number } | number | null;
  longitude: { toNumber?: () => number } | number | null;
  customer?: {
    id: string;
    fullName: string;
    nationalId: string | null;
    phone: string;
    email: string | null;
  } | null;
  governorate?: { name: string } | null;
  city?: { name: string } | null;
  originalTrim?: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
  } | null;
  vehicle?: {
    id: string;
    vin: string;
    plateNumber: string | null;
    manufactureYear: number;
    mileage: number | null;
    engineNumber: string;
    engineCc: number | null;
    power: number | null;
    insuranceValue: { toNumber?: () => number } | number | null;
    registrationDate: Date | null;
    sunroofSpecification?: string | null;
    sideMirrors?: string | null;
    carInterior?: string | null;
    calendarNumber?: string | null;
    specialInstructions?: string | null;
    brand?: { id: string; name: string } | null;
    model?: { id: string; name: string } | null;
    category?: { id: string; name: string; nameAr?: string | null } | null;
    color?: { id: string; name: string; nameAr?: string | null; hex?: string | null } | null;
    fuelType?: { id: string; name: string; nameAr?: string | null } | null;
    transmissionType?: { id: string; name: string; nameAr?: string | null } | null;
    trim?: { id: string; code?: string; name: string; nameAr?: string | null } | null;
  } | null;
  assignedRepresentative?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;
  assignments?: Array<{
    id: string;
    status: string;
    assignedAt: Date;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    rejectedReason: string | null;
  }>;
  checklistItems?: Array<{
    id: string;
    checklistItemId: string;
    value: string | null;
    notes: string | null;
    completed: boolean;
    completedAt: Date | null;
    reviewDecision?: string | null;
    reviewNotes?: string | null;
    reviewedAt?: Date | null;
    checklistItem?: {
      code: string;
      label: string;
      inputType: string;
      isMandatory: boolean;
    } | null;
  }>;
  photoChecklist?: {
    id: string;
    inspectionRequestId: string;
    licensePhoto: boolean;
    airbagPhoto: boolean;
    roofPhoto: boolean;
    odometerPhoto: boolean;
    chassisPhoto: boolean;
    customFields: unknown;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  marketingDecisions?: Array<{
    id: string;
    estimatedValue: { toNumber?: () => number } | number;
    approved: boolean;
    notes: string | null;
    rejectedReason: string | null;
    decidedAt: Date;
    reviewerId: string;
    reviewer?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
}

export class InspectionRequestDetailResponseDto {
  id!: string;
  requestNumber!: string;
  bankId!: string;
  currentStatus!: InspectionStatus;
  priority!: InspectionPriority;
  captureMode!: string;
  includeInterior!: boolean;
  requestedAt!: Date;
  requestedCompletionDate!: Date | null;
  assignedAt!: Date | null;
  completedAt!: Date | null;
  notes!: string | null;
  assignedRepresentativeId!: string | null;
  assignedReviewerId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  customer!: {
    id: string;
    fullName: string;
    nationalId: string | null;
    phone: string;
    email: string | null;
  } | null;

  location!: {
    governorateId: string | null;
    governorateName: string | null;
    cityId: string | null;
    cityName: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };

  vehicle!: {
    id: string;
    vin: string;
    plateNumber: string | null;
    manufactureYear: number;
    mileage: number | null;
    engineNumber: string;
    engineCc: number | null;
    power: number | null;
    insuranceValue: number | null;
    registrationDate: Date | null;
    sunroofSpecification: string | null;
    sideMirrors: string | null;
    carInterior: string | null;
    calendarNumber: string | null;
    specialInstructions: string | null;
    brand: { id: string; name: string } | null;
    model: { id: string; name: string } | null;
    category: { id: string; name: string; nameAr?: string | null } | null;
    color: { id: string; name: string; nameAr?: string | null; hex?: string | null } | null;
    fuelType: { id: string; name: string; nameAr?: string | null } | null;
    transmissionType: { id: string; name: string; nameAr?: string | null } | null;
    trim: { id: string; code?: string; name: string; nameAr?: string | null } | null;
  } | null;

  originalTrim!: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
  } | null;

  assignedRepresentative!: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;

  activeAssignment!: {
    id: string;
    status: string;
    assignedAt: Date;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    rejectedReason: string | null;
  } | null;

  checklistItems!: Array<{
    id: string;
    checklistItemId: string;
    code: string;
    label: string;
    inputType: string;
    isMandatory: boolean;
    value: string | null;
    notes: string | null;
    completed: boolean;
    completedAt: Date | null;
    reviewDecision: string | null;
    reviewNotes: string | null;
    reviewedAt: Date | null;
  }>;

  canDownloadReport!: boolean;

  latestMarketingDecision!: {
    id: string;
    estimatedValue: number;
    approved: boolean;
    notes: string | null;
    rejectedReason: string | null;
    decidedAt: Date;
    reviewerName: string | null;
  } | null;

  photoChecklist!: {
    id: string;
    inspectionRequestId: string;
    licensePhoto: boolean;
    airbagPhoto: boolean;
    roofPhoto: boolean;
    odometerPhoto: boolean;
    chassisPhoto: boolean;
    customFields: Array<{ id: string; name: string; required: boolean }>;
    createdAt: Date;
    updatedAt: Date;
  } | null;

  static fromPrisma(
    record: InspectionRequestWithRelations,
  ): InspectionRequestDetailResponseDto {
    const activeAssignment =
      record.assignments?.find(
        (a) => a.status === 'PENDING' || a.status === 'ACCEPTED',
      ) ??
      record.assignments?.[0] ??
      null;

    const lat =
      record.latitude != null
        ? typeof record.latitude === 'object' && 'toNumber' in record.latitude
          ? record.latitude.toNumber!()
          : Number(record.latitude)
        : null;

    const lng =
      record.longitude != null
        ? typeof record.longitude === 'object' && 'toNumber' in record.longitude
          ? record.longitude.toNumber!()
          : Number(record.longitude)
        : null;

    const insVal =
      record.vehicle?.insuranceValue != null
        ? typeof record.vehicle.insuranceValue === 'object' &&
          'toNumber' in record.vehicle.insuranceValue
          ? record.vehicle.insuranceValue.toNumber!()
          : Number(record.vehicle.insuranceValue)
        : null;

    return {
      id: record.id,
      requestNumber: record.requestNumber,
      bankId: record.bankId,
      currentStatus: record.currentStatus,
      priority: record.priority,
      captureMode: record.captureMode ?? 'STANDARD',
      includeInterior: record.includeInterior ?? true,
      requestedAt: record.requestedAt,
      requestedCompletionDate: record.requestedCompletionDate,
      assignedAt: record.assignedAt,
      completedAt: record.completedAt,
      notes: record.notes,
      assignedRepresentativeId: record.assignedRepresentativeId ?? null,
      assignedReviewerId: record.assignedReviewerId ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      customer: record.customer
        ? {
            id: record.customer.id,
            fullName: record.customer.fullName,
            nationalId: record.customer.nationalId,
            phone: record.customer.phone,
            email: record.customer.email,
          }
        : null,
      location: {
        governorateId: record.governorateId,
        governorateName: record.governorate?.name ?? null,
        cityId: record.cityId,
        cityName: record.city?.name ?? null,
        address: record.address,
        latitude: lat,
        longitude: lng,
      },
      vehicle: record.vehicle
        ? {
            id: record.vehicle.id,
            vin: record.vehicle.vin,
            plateNumber: record.vehicle.plateNumber,
            manufactureYear: record.vehicle.manufactureYear,
            mileage: record.vehicle.mileage,
            engineNumber: record.vehicle.engineNumber,
            engineCc: record.vehicle.engineCc,
            power: record.vehicle.power,
            insuranceValue: insVal,
            registrationDate: record.vehicle.registrationDate,
            sunroofSpecification: record.vehicle.sunroofSpecification ?? null,
            sideMirrors: record.vehicle.sideMirrors ?? null,
            carInterior: record.vehicle.carInterior ?? null,
            calendarNumber: record.vehicle.calendarNumber ?? null,
            specialInstructions: record.vehicle.specialInstructions ?? null,
            brand: record.vehicle.brand
              ? { id: record.vehicle.brand.id, name: record.vehicle.brand.name }
              : null,
            model: record.vehicle.model
              ? { id: record.vehicle.model.id, name: record.vehicle.model.name }
              : null,
            category: record.vehicle.category
              ? {
                  id: record.vehicle.category.id,
                  name: record.vehicle.category.name,
                  nameAr: (record.vehicle.category as any).nameAr ?? null,
                }
              : null,
            color: record.vehicle.color
              ? {
                  id: record.vehicle.color.id,
                  name: record.vehicle.color.name,
                  nameAr: (record.vehicle.color as any).nameAr ?? null,
                  hex: record.vehicle.color.hex,
                }
              : null,
            fuelType: record.vehicle.fuelType
              ? {
                  id: record.vehicle.fuelType.id,
                  name: record.vehicle.fuelType.name,
                  nameAr: (record.vehicle.fuelType as any).nameAr ?? null,
                }
              : null,
            transmissionType: record.vehicle.transmissionType
              ? {
                  id: record.vehicle.transmissionType.id,
                  name: record.vehicle.transmissionType.name,
                  nameAr: (record.vehicle.transmissionType as any).nameAr ?? null,
                }
              : null,
            trim: record.vehicle.trim
              ? {
                  id: record.vehicle.trim.id,
                  code: (record.vehicle.trim as any).code,
                  name: record.vehicle.trim.name,
                  nameAr: (record.vehicle.trim as any).nameAr ?? null,
                }
              : null,
          }
        : null,
      originalTrim: record.originalTrim
        ? {
            id: record.originalTrim.id,
            code: record.originalTrim.code,
            name: record.originalTrim.name,
            nameAr: record.originalTrim.nameAr ?? null,
          }
        : null,
      assignedRepresentative: record.assignedRepresentative
        ? {
            id: record.assignedRepresentative.id,
            firstName: record.assignedRepresentative.firstName,
            lastName: record.assignedRepresentative.lastName,
            phone: record.assignedRepresentative.phone,
            email: record.assignedRepresentative.email,
          }
        : null,
      activeAssignment: activeAssignment
        ? {
            id: activeAssignment.id,
            status: activeAssignment.status,
            assignedAt: activeAssignment.assignedAt,
            acceptedAt: activeAssignment.acceptedAt,
            rejectedAt: activeAssignment.rejectedAt,
            rejectedReason: activeAssignment.rejectedReason,
          }
        : null,
      checklistItems: (record.checklistItems || []).map((ci) => ({
        id: ci.id,
        checklistItemId: ci.checklistItemId,
        code: ci.checklistItem?.code ?? '',
        label: ci.checklistItem?.label ?? '',
        inputType: ci.checklistItem?.inputType ?? 'TEXT',
        isMandatory: ci.checklistItem?.isMandatory ?? false,
        value: ci.value,
        notes: ci.notes,
        completed: ci.completed,
        completedAt: ci.completedAt,
        reviewDecision: ci.reviewDecision ?? null,
        reviewNotes: ci.reviewNotes ?? null,
        reviewedAt: ci.reviewedAt ?? null,
      })),
      canDownloadReport: record.currentStatus === InspectionStatus.APPROVED,
      latestMarketingDecision: (() => {
        const latest = record.marketingDecisions?.[0];
        if (!latest) return null;
        const val =
          latest.estimatedValue != null
            ? typeof latest.estimatedValue === 'object' &&
              'toNumber' in latest.estimatedValue
              ? (latest.estimatedValue as any).toNumber()
              : Number(latest.estimatedValue)
            : 0;
        return {
          id: latest.id,
          estimatedValue: val,
          approved: latest.approved,
          notes: latest.notes,
          rejectedReason: latest.rejectedReason,
          decidedAt: latest.decidedAt,
          reviewerName: latest.reviewer
            ? `${latest.reviewer.firstName} ${latest.reviewer.lastName}`.trim()
            : null,
        };
      })(),
      photoChecklist: record.photoChecklist
        ? {
            id: record.photoChecklist.id,
            inspectionRequestId: record.photoChecklist.inspectionRequestId,
            licensePhoto: record.photoChecklist.licensePhoto,
            airbagPhoto: record.photoChecklist.airbagPhoto,
            roofPhoto: record.photoChecklist.roofPhoto,
            odometerPhoto: record.photoChecklist.odometerPhoto,
            chassisPhoto: record.photoChecklist.chassisPhoto,
            customFields: Array.isArray(record.photoChecklist.customFields)
              ? (record.photoChecklist.customFields as Array<{
                  id: string;
                  name: string;
                  required: boolean;
                }>)
              : [],
            createdAt: record.photoChecklist.createdAt,
            updatedAt: record.photoChecklist.updatedAt,
          }
        : null,
    };
  }
}
