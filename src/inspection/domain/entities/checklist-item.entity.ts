import { ChecklistInputType } from '../value-objects/checklist-input-type.enum';

export interface ChecklistItemProps {
  id: string;
  checklistId: string;
  bankId: string | null;
  code: string;
  label: string;
  description: string | null;
  isRequired: boolean;
  isMandatory: boolean;
  weight: number;
  inputType: ChecklistInputType;
  options: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ChecklistItem {
  private props: ChecklistItemProps;

  constructor(props: ChecklistItemProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get checklistId(): string { return this.props.checklistId; }
  get bankId(): string | null { return this.props.bankId; }
  get code(): string { return this.props.code; }
  get label(): string { return this.props.label; }
  get description(): string | null { return this.props.description; }
  get isRequired(): boolean { return this.props.isRequired; }
  get isMandatory(): boolean { return this.props.isMandatory; }
  get weight(): number { return this.props.weight; }
  get inputType(): ChecklistInputType { return this.props.inputType; }
  get options(): string | null { return this.props.options; }
  get sortOrder(): number { return this.props.sortOrder; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }
  
  get isDeleted(): boolean { return this.props.deletedAt !== null; }

  public markAsDeleted(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
  }
}
