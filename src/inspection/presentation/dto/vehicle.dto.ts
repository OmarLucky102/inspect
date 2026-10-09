import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class VehicleDto {
  @IsString({ message: 'VIN must be a string' })
  vin!: string;

  @IsString({ message: 'Plate number must be a string' })
  @IsOptional()
  plateNumber?: string;

  @IsInt({ message: 'Manufacture year must be an integer' })
  @Min(1900, { message: 'Manufacture year must be valid' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Manufacture year cannot be in the future',
  })
  manufactureYear!: number;

  @IsInt({ message: 'Mileage must be an integer' })
  @Min(0, { message: 'Mileage cannot be negative' })
  @IsOptional()
  mileage?: number;

  @IsString({ message: 'Engine number must be a string' })
  engineNumber!: string;

  @IsInt({ message: 'Engine CC must be an integer' })
  @Min(0, { message: 'Engine CC must be valid' })
  @IsOptional()
  engineCc?: number;

  @IsInt({ message: 'Power must be an integer' })
  @Min(0, { message: 'Power must be valid' })
  @IsOptional()
  power?: number;

  @IsNumber({}, { message: 'Insurance value must be a number' })
  @Min(0, { message: 'Insurance value must be positive' })
  @IsOptional()
  insuranceValue?: number;

  @IsDateString(
    {},
    { message: 'Registration date must be a valid date string' },
  )
  @IsOptional()
  registrationDate?: Date;

  @IsUUID(4, { message: 'Brand ID must be a valid UUID' })
  brandId!: string;

  @IsUUID(4, { message: 'Model ID must be a valid UUID' })
  modelId!: string;

  @IsUUID(4, { message: 'Category ID must be a valid UUID' })
  categoryId!: string;

  @IsUUID(4, { message: 'Fuel Type ID must be a valid UUID' })
  @IsOptional()
  fuelTypeId?: string;

  @IsUUID(4, { message: 'Transmission Type ID must be a valid UUID' })
  @IsOptional()
  transmissionTypeId?: string;

  @IsUUID(4, { message: 'Color ID must be a valid UUID' })
  colorId!: string;

  @IsUUID(4, { message: 'Trim ID must be a valid UUID' })
  @IsOptional()
  trimId?: string;
}
