import { Role } from '../value-objects/role.enum.js';
export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private props: UserProps;
  constructor(props: UserProps) {
    this.props = props;
  }
  //Getters For Props
  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get phone(): string {
    return this.props.phone;
  }
  get role(): Role {
    return this.props.role;
  }
  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }
  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  // Business Rules & Domain Logic
  public activate(): void {
    if (this.props.isActive) {
      throw new Error('User is alredy active');
    }
    this.props.isActive = true;
  }
  public deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('User is already deactivated');
    }
    this.props.isActive = false;
  }

  //change pass for the already Logged in & Forgot Password both
  public changePassword(newPasswordHash: string): void {
    if (this.props.passwordHash === newPasswordHash) {
      throw new Error('New password cannot be the same as the old password');
    }
    this.props.passwordHash = newPasswordHash;
  }
  public changeEmail(newEmail: string): void {
    this.props.email = newEmail;
    this.props.isActive = false;
    this.props.isEmailVerified = false;
    this.props.emailVerifiedAt = null;
  }
}
