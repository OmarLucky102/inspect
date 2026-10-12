import { InspectionStatus } from '../value-objects/inspection-status.enum';

export interface InspectionStatusHistoryProps {
  id: string;
  inspectionRequestId: string;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  changedBy: string;
  changedAt: Date;
  note: string | null;
}

export class InspectionStatusHistory {
  private props: InspectionStatusHistoryProps;

  constructor(props: InspectionStatusHistoryProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get inspectionRequestId(): string {
    return this.props.inspectionRequestId;
  }

  get fromStatus(): InspectionStatus | null {
    return this.props.fromStatus;
  }

  get toStatus(): InspectionStatus {
    return this.props.toStatus;
  }

  get changedBy(): string {
    return this.props.changedBy;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  get note(): string | null {
    return this.props.note;
  }
}
