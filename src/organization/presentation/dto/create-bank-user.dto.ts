import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../../identity/domain/value-objects/role.enum';

// Only bank-level roles are allowed when creating a bank user
const BANK_MEMBER_ROLES = [
  Role.MANAGER,
  Role.REVIEWER,
  Role.USER,
  Role.VIEWER,
  Role.REPRESENTATIVE,
] as const;

export class CreateBankUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(255)
  lastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @MaxLength(20)
  phone!: string;

  @IsEnum(BANK_MEMBER_ROLES, {
    message: `Role must be one of: ${BANK_MEMBER_ROLES.join(', ')}`,
  })
  role!: Role;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
