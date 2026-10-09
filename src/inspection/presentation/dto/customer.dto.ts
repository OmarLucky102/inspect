import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CustomerDto {
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsString({ message: 'National ID must be a string' })
  @IsOptional()
  nationalId?: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Length(8, 20, {
    message: 'Phone number must be between 8 and 20 characters',
  })
  phone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;
}
