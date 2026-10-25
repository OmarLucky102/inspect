import { Role } from '../value-objects/role.enum';
import {
  UserAlreadyActiveException,
  UserAlreadyDeactivatedException,
  SamePasswordException,
} from '../../../shared/exceptions/user.exceptions';

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
      throw new UserAlreadyActiveException(this.props.email);
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }
  public deactivate(): void {
    if (!this.props.isActive) {
      throw new UserAlreadyDeactivatedException(this.props.email);
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  //change pass for the already Logged in & Forgot Password both
  public changePassword(newPasswordHash: string): void {
    if (this.props.passwordHash === newPasswordHash) {
      throw new SamePasswordException();
    }
    this.props.passwordHash = newPasswordHash;
  }
  public changeEmail(newEmail: string): void {
    this.props.email = newEmail;
    this.props.isActive = false;
    this.props.isEmailVerified = false;
    this.props.emailVerifiedAt = null;
  }

  public updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): void {
    if (data.firstName !== undefined) {
      const trimmed = data.firstName.trim();
      if (!trimmed) {
        throw new Error('First name cannot be empty');
      }
      this.props.firstName = trimmed;
    }

    if (data.lastName !== undefined) {
      const trimmed = data.lastName.trim();
      if (!trimmed) {
        throw new Error('Last name cannot be empty');
      }
      this.props.lastName = trimmed;
    }

    if (data.phone !== undefined) {
      const trimmed = data.phone.trim();
      this.props.phone = trimmed;
    }

    this.props.updatedAt = new Date();
  }
}
