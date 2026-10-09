export interface InspectionChecklistItemProps {
  id: string;
  inspectionRequestId: string;
  checklistItemId: string;
  value: string | null;
  notes: string | null;
  completed: boolean;
  completedAt: Date | null;
}

export class InspectionChecklistItem {
  private props: InspectionChecklistItemProps;

  constructor(props: InspectionChecklistItemProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get inspectionRequestId(): string { return this.props.inspectionRequestId; }
  get checklistItemId(): string { return this.props.checklistItemId; }
  get value(): string | null { return this.props.value; }
  get notes(): string | null { return this.props.notes; }
  get completed(): boolean { return this.props.completed; }
  get completedAt(): Date | null { return this.props.completedAt; }
}
