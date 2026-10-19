import { ChecklistReviewDecision } from '../value-objects/checklist-review-decision.enum';

export interface InspectionChecklistItemProps {
  id: string;
  inspectionRequestId: string;
  checklistItemId: string;
  value: string | null;
  notes: string | null;
  completed: boolean;
  completedAt: Date | null;
  reviewDecision?: ChecklistReviewDecision | null;
  reviewNotes?: string | null;
  reviewedAt?: Date | null;
}

export class InspectionChecklistItem {
  private props: InspectionChecklistItemProps;

  constructor(props: InspectionChecklistItemProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get inspectionRequestId(): string {
    return this.props.inspectionRequestId;
  }
  get checklistItemId(): string {
    return this.props.checklistItemId;
  }
  get value(): string | null {
    return this.props.value;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get completed(): boolean {
    return this.props.completed;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get reviewDecision(): ChecklistReviewDecision | null | undefined {
    return this.props.reviewDecision;
  }
  get reviewNotes(): string | null | undefined {
    return this.props.reviewNotes;
  }
  get reviewedAt(): Date | null | undefined {
    return this.props.reviewedAt;
  }

  public setReviewDecision(
    decision: ChecklistReviewDecision,
    notes?: string | null,
    reviewedAt: Date = new Date(),
  ): void {
    this.props.reviewDecision = decision;
    this.props.reviewNotes = notes ?? null;
    this.props.reviewedAt = reviewedAt;
  }
}
