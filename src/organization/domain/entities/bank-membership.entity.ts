import { MembershipStatus } from '../value-objects/membership-status.enum';

export interface BankMembershipProps {
  id: string;
  bankId: string;
  userId: string;
  isPrimary: boolean;
  status: MembershipStatus;
  joinedAt: Date;
}

export class BankMembership {
  private props: BankMembershipProps;

  constructor(props: BankMembershipProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get bankId(): string {
    return this.props.bankId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get isPrimary(): boolean {
    return this.props.isPrimary;
  }
  get status(): MembershipStatus {
    return this.props.status;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  public activate(): void {
    this.props.status = MembershipStatus.ACTIVE;
  }

  public suspend(): void {
    this.props.status = MembershipStatus.SUSPENDED;
  }

  public remove(): void {
    this.props.status = MembershipStatus.REMOVED;
  }
}
