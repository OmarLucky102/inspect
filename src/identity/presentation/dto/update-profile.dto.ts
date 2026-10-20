import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(255, { message: 'First name cannot exceed 255 characters' })
  firstName?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(255, { message: 'Last name cannot exceed 255 characters' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^[+0-9\s\-()]{7,20}$/, {
    message: 'Please provide a valid phone number (7-20 digits)',
  })
  phone?: string;
}
