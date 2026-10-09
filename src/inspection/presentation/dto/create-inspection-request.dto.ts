import {
  IsOptional,
  ValidateNested,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerDto } from './customer.dto';
import { VehicleDto } from './vehicle.dto';

class LocationDto {
  @IsUUID(4, { message: 'Governorate ID must be a valid UUID' })
  @IsOptional()
  governorateId?: string;

  @IsUUID(4, { message: 'City ID must be a valid UUID' })
  @IsOptional()
  cityId?: string;

  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsOptional()
  latitude?: number;

  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsOptional()
  longitude?: number;

  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;
}

export class CreateInspectionRequestDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsDateString(
    {},
    { message: 'Requested completion date must be a valid date' },
  )
  @IsOptional()
  requestedCompletionDate?: Date;

  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;

  @ValidateNested()
  @Type(() => VehicleDto)
  @IsOptional()
  vehicle?: VehicleDto;
}
