export interface BankProps {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Bank {
  private props: BankProps;

  constructor(props: BankProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get email(): string | null {
    return this.props.email;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public activate(): void {
    this.props.isActive = true;
  }
}
