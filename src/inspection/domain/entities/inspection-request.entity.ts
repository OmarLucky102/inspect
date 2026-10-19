import { InspectionStatus } from '../value-objects/inspection-status.enum';
import { InspectionPriority } from '../value-objects/inspection-priority.enum';
import { CaptureMode } from '../value-objects/capture-mode.enum';
import {
  InvalidInspectionRequestStateException,
  VehicleDataRequiredException,
  InvalidStatusTransitionException,
  InvalidAssignmentException,
} from '../../../shared/exceptions/inspection.exceptions';

export interface InspectionRequestProps {
  id: string;
  requestNumber: string;
  bankId: string;
  vehicleId: string | null;
  customerId: string;
  assignedRepresentativeId: string | null;
  assignedReviewerId: string | null;
  currentStatus: InspectionStatus;
  priority: InspectionPriority;
  captureMode?: CaptureMode;
  includeInterior?: boolean;
  governorateId: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  requestedCompletionDate: Date | null;
  requestedAt: Date;
  assignedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InspectionRequest {
  private props: Required<
    Pick<InspectionRequestProps, 'captureMode' | 'includeInterior'>
  > &
    InspectionRequestProps;

  constructor(props: InspectionRequestProps) {
    this.props = {
      ...props,
      captureMode: props.captureMode ?? CaptureMode.STANDARD,
      includeInterior: props.includeInterior ?? true,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get requestNumber(): string {
    return this.props.requestNumber;
  }
  get bankId(): string {
    return this.props.bankId;
  }
  get vehicleId(): string | null {
    return this.props.vehicleId;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get assignedRepresentativeId(): string | null {
    return this.props.assignedRepresentativeId;
  }
  get assignedReviewerId(): string | null {
    return this.props.assignedReviewerId;
  }
  get currentStatus(): InspectionStatus {
    return this.props.currentStatus;
  }
  get priority(): InspectionPriority {
    return this.props.priority;
  }
  get governorateId(): string | null {
    return this.props.governorateId;
  }
  get cityId(): string | null {
    return this.props.cityId;
  }
  get latitude(): number | null {
    return this.props.latitude;
  }
  get longitude(): number | null {
    return this.props.longitude;
  }
  get address(): string | null {
    return this.props.address;
  }
  get requestedCompletionDate(): Date | null {
    return this.props.requestedCompletionDate;
  }
  get requestedAt(): Date {
    return this.props.requestedAt;
  }
  get assignedAt(): Date | null {
    return this.props.assignedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isDraft(): boolean {
    return this.props.currentStatus === InspectionStatus.DRAFT;
  }

  get captureMode(): CaptureMode {
    return this.props.captureMode;
  }

  get includeInterior(): boolean {
    return this.props.includeInterior;
  }

  public setCaptureSettings(
    captureMode?: CaptureMode,
    includeInterior?: boolean,
  ): void {
    if (captureMode !== undefined) {
      this.props.captureMode = captureMode;
    }
    if (includeInterior !== undefined) {
      this.props.includeInterior = includeInterior;
    }
  }

  public setVehicle(vehicleId: string): void {
    this.props.vehicleId = vehicleId;
  }

  public submit(): void {
    if (!this.isDraft) {
      throw new InvalidInspectionRequestStateException(
        'Only draft requests can be submitted',
      );
    }
    if (!this.props.vehicleId) {
      throw new VehicleDataRequiredException();
    }
    this.props.currentStatus = InspectionStatus.PENDING;
  }

  public assign(representativeId: string, assignedAt: Date = new Date()): void {
    if (
      this.props.currentStatus !== InspectionStatus.PENDING_ASSIGNMENT &&
      this.props.currentStatus !== InspectionStatus.ASSIGNED &&
      this.props.currentStatus !== InspectionStatus.IN_PROGRESS
    ) {
      throw new InvalidAssignmentException(
        `Cannot assign representative to an inspection request with status '${this.props.currentStatus}'. Only PENDING_ASSIGNMENT, ASSIGNED, or IN_PROGRESS requests can be assigned.`,
      );
    }
    this.props.assignedRepresentativeId = representativeId;
    this.props.assignedAt = assignedAt;
    this.props.currentStatus = InspectionStatus.IN_PROGRESS;
  }

  public unassign(): void {
    this.props.assignedRepresentativeId = null;
    this.props.assignedAt = null;
    if (
      this.props.currentStatus === InspectionStatus.ASSIGNED ||
      this.props.currentStatus === InspectionStatus.IN_PROGRESS
    ) {
      this.props.currentStatus = InspectionStatus.PENDING_ASSIGNMENT;
    }
  }

  public transition(newStatus: InspectionStatus): void {
    if (this.props.currentStatus === newStatus) {
      return;
    }

    const ALLOWED_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
      [InspectionStatus.DRAFT]: [InspectionStatus.PENDING],
      [InspectionStatus.PENDING]: [
        InspectionStatus.PENDING_ASSIGNMENT,
        InspectionStatus.REJECTED,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.REJECTED]: [
        InspectionStatus.PENDING,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.PENDING_ASSIGNMENT]: [
        InspectionStatus.IN_PROGRESS,
        InspectionStatus.ASSIGNED,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.ASSIGNED]: [
        InspectionStatus.IN_PROGRESS,
        InspectionStatus.PENDING_ASSIGNMENT,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.IN_PROGRESS]: [
        InspectionStatus.UNDER_REVIEW,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.UNDER_REVIEW]: [
        InspectionStatus.COMPLETED,
        InspectionStatus.IN_PROGRESS,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.COMPLETED]: [
        InspectionStatus.APPROVED,
        InspectionStatus.UNDER_REVIEW,
        InspectionStatus.CANCELLED,
      ],
      [InspectionStatus.APPROVED]: [],
      [InspectionStatus.CANCELLED]: [],
    };

    const allowed = ALLOWED_TRANSITIONS[this.props.currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStatusTransitionException(
        `Cannot transition inspection request from status '${this.props.currentStatus}' to '${newStatus}'`,
      );
    }

    if (newStatus === InspectionStatus.PENDING && !this.props.vehicleId) {
      throw new VehicleDataRequiredException();
    }

    this.props.currentStatus = newStatus;
    if (newStatus === InspectionStatus.COMPLETED) {
      this.props.completedAt = new Date();
    }
  }
}
