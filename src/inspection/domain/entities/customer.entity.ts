export interface CustomerProps {
  id: string;
  bankId: string;
  fullName: string;
  nationalId: string | null;
  phone: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  private props: CustomerProps;

  constructor(props: CustomerProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get bankId(): string {
    return this.props.bankId;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get nationalId(): string | null {
    return this.props.nationalId;
  }
  get phone(): string {
    return this.props.phone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
