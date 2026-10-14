import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomPhotoFieldDto {
  @IsUUID(4, { message: 'Custom field ID must be a valid UUID' })
  @IsOptional()
  id?: string;

  @IsString({ message: 'Custom category name must be a string' })
  @IsNotEmpty({ message: 'Custom category name cannot be empty' })
  @MaxLength(100, {
    message: 'Custom category name must not exceed 100 characters',
  })
  name!: string;

  @IsBoolean({ message: 'Custom category requirement must be a boolean' })
  required!: boolean;
}

export class UpdatePhotoChecklistDto {
  @IsBoolean({ message: 'License photo requirement must be a boolean' })
  @IsOptional()
  licensePhoto?: boolean;

  @IsBoolean({ message: 'Airbag photo requirement must be a boolean' })
  @IsOptional()
  airbagPhoto?: boolean;

  @IsBoolean({ message: 'Roof photo requirement must be a boolean' })
  @IsOptional()
  roofPhoto?: boolean;

  @IsBoolean({ message: 'Odometer photo requirement must be a boolean' })
  @IsOptional()
  odometerPhoto?: boolean;

  @IsBoolean({ message: 'Chassis photo requirement must be a boolean' })
  @IsOptional()
  chassisPhoto?: boolean;

  @IsArray({ message: 'Custom photo categories must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CustomPhotoFieldDto)
  @IsOptional()
  customFields?: CustomPhotoFieldDto[];
}
