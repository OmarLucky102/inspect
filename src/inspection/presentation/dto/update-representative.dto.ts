import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsEmail,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class UpdateRepresentativeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Representative code must contain only letters, numbers, hyphens, or underscores (e.g. REP-001 or REP001)',
  })
  representativeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'governorateId must be a valid UUID' })
  governorateId?: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'cityId must be a valid UUID' })
  cityId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  branchName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId?: string | null;
}
