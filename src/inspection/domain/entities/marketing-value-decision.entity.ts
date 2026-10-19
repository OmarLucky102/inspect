export interface MarketingValueDecisionProps {
  id: string;
  inspectionRequestId: string;
  estimatedValue: number;
  approved: boolean;
  notes: string | null;
  rejectedReason: string | null;
  reviewerId: string;
  decidedAt: Date;
}

export class MarketingValueDecision {
  private props: MarketingValueDecisionProps;

  constructor(props: MarketingValueDecisionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get inspectionRequestId(): string {
    return this.props.inspectionRequestId;
  }
  get estimatedValue(): number {
    return this.props.estimatedValue;
  }
  get approved(): boolean {
    return this.props.approved;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get rejectedReason(): string | null {
    return this.props.rejectedReason;
  }
  get reviewerId(): string {
    return this.props.reviewerId;
  }
  get decidedAt(): Date {
    return this.props.decidedAt;
  }

  public accept(): void {
    this.props.approved = true;
    this.props.rejectedReason = null;
  }

  public rejectRevision(reason: string): void {
    this.props.approved = false;
    this.props.rejectedReason = reason;
  }
}
