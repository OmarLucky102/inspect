import { InspectionStatus } from '../value-objects/inspection-status.enum';
import { InspectionPriority } from '../value-objects/inspection-priority.enum';
import {
  InvalidInspectionRequestStateException,
  VehicleDataRequiredException,
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
  private props: InspectionRequestProps;

  constructor(props: InspectionRequestProps) {
    this.props = props;
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
}
