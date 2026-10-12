import { AssignmentStatus } from '../value-objects/assignment-status.enum';

export interface InspectionAssignmentProps {
  id: string;
  inspectionRequestId: string;
  representativeId: string;
  assignedBy: string;
  status: AssignmentStatus;
  rejectedReason: string | null;
  assignedAt: Date;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
}

export class InspectionAssignment {
  private props: InspectionAssignmentProps;

  constructor(props: InspectionAssignmentProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get inspectionRequestId(): string {
    return this.props.inspectionRequestId;
  }

  get representativeId(): string {
    return this.props.representativeId;
  }

  get assignedBy(): string {
    return this.props.assignedBy;
  }

  get status(): AssignmentStatus {
    return this.props.status;
  }

  get rejectedReason(): string | null {
    return this.props.rejectedReason;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get acceptedAt(): Date | null {
    return this.props.acceptedAt;
  }

  get rejectedAt(): Date | null {
    return this.props.rejectedAt;
  }

  public cancel(): void {
    this.props.status = AssignmentStatus.CANCELLED;
  }

  public accept(acceptedAt: Date = new Date()): void {
    this.props.status = AssignmentStatus.ACCEPTED;
    this.props.acceptedAt = acceptedAt;
  }

  public reject(reason: string, rejectedAt: Date = new Date()): void {
    this.props.status = AssignmentStatus.REJECTED;
    this.props.rejectedReason = reason;
    this.props.rejectedAt = rejectedAt;
  }

  public complete(): void {
    this.props.status = AssignmentStatus.COMPLETED;
  }
}
