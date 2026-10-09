export interface ChecklistProps {
  id: string;
  code: string | null;
  bankId: string | null;
  vehicleCategoryId: string | null;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Checklist {
  private props: ChecklistProps;

  constructor(props: ChecklistProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get code(): string | null { return this.props.code; }
  get bankId(): string | null { return this.props.bankId; }
  get vehicleCategoryId(): string | null { return this.props.vehicleCategoryId; }
  get name(): string { return this.props.name; }
  get version(): number { return this.props.version; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
