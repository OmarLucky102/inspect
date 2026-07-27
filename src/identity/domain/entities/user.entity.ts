export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  roles: string[];
}

export class User {
  private _id: string;
  private _email: string;
  private _passwordHash: string;
  private _isActive: boolean;
  private _roles: string[];

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._isActive = props.isActive;
    this._roles = props.roles;
  }

  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get passwordHash(): string { return this._passwordHash; }
  get isActive(): boolean { return this._isActive; }
  get roles(): string[] { return this._roles; }

  // ----------------------------------------------------
  // Business Rules & Domain Logic
  // ----------------------------------------------------

  public activate(): void {
    if (this._isActive) {
      throw new Error('User is already active');
    }
    this._isActive = true;
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new Error('User is already deactivated');
    }
    this._isActive = false;
  }

  public changePassword(newPasswordHash: string): void {
    if (this._passwordHash === newPasswordHash) {
      throw new Error('New password cannot be the same as the old password');
    }
    this._passwordHash = newPasswordHash;
  }

  public changeEmail(newEmail: string): void {
    //value object can add email validation here 
    this._email = newEmail;
    
    //when email chnge can deactivate account
    this._isActive = false;
  }

  public hasRole(role: string): boolean {
    return this._roles.includes(role);
  }

//   public hasPermission(permission: string): boolean {
//     //example for linkeing in future 
//     const adminPermissions = ['manage_users', 'delete_records'];
//     if (this.hasRole('admin') && adminPermissions.includes(permission)) {
//       return true;
//     }
//     return false;
//   }
}
