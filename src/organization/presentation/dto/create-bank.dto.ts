import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateBankDto {
  @IsString()
  @IsNotEmpty({ message: 'Bank name is required' })
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  @MaxLength(20)
  @Matches(/^[A-Z0-9_-]+$/i, {
    message: 'Code must contain only letters, numbers, dashes, or underscores',
  })
  code!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
