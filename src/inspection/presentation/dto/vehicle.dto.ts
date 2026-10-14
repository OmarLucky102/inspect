import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CaptureMode } from '../../domain/value-objects/capture-mode.enum';

const trimString = ({ value }: { value: unknown }): string | undefined =>
  typeof value === 'string' ? value.trim() : (value as string | undefined);

const trimUpper = ({ value }: { value: unknown }): string | undefined =>
  typeof value === 'string'
    ? value.trim().toUpperCase()
    : (value as string | undefined);

const toNumber = ({ value }: { value: unknown }): number | undefined =>
  value !== undefined && value !== null && value !== ''
    ? Number(value)
    : undefined;

const toBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'boolean') return value;
  return undefined;
};

export class VehicleDto {
  @Transform(trimUpper)
  @IsString({ message: 'VIN must be a string' })
  @MaxLength(25, { message: 'VIN must not exceed 25 characters' })
  vin!: string;

  // Make / Brand
  @ValidateIf((o: VehicleDto) => !o.make)
  @IsNotEmpty({ message: 'Vehicle make/brand ID is required' })
  @IsUUID(4, { message: 'Vehicle make/brand ID must be a valid UUID' })
  brandId?: string;

  @ValidateIf((o: VehicleDto) => !o.brandId)
  @IsNotEmpty({ message: 'Vehicle make ID is required' })
  @IsUUID(4, { message: 'Vehicle make must be a valid UUID' })
  make?: string;

  // Model
  @ValidateIf((o: VehicleDto) => !o.model)
  @IsNotEmpty({ message: 'Vehicle model ID is required' })
  @IsUUID(4, { message: 'Vehicle model ID must be a valid UUID' })
  modelId?: string;

  @ValidateIf((o: VehicleDto) => !o.modelId)
  @IsNotEmpty({ message: 'Vehicle model is required' })
  @IsUUID(4, { message: 'Vehicle model must be a valid UUID' })
  model?: string;

  // Manufacture Year
  @ValidateIf((o: VehicleDto) => o.year === undefined || o.year === null)
  @IsNotEmpty({ message: 'Manufacture year is required' })
  @IsInt({ message: 'Manufacture year must be an integer' })
  @Min(1900, { message: 'Manufacture year must be at least 1900' })
  @Max(new Date().getFullYear() + 2, {
    message: 'Manufacture year cannot be in the future',
  })
  manufactureYear?: number;

  @ValidateIf(
    (o: VehicleDto) =>
      o.manufactureYear === undefined || o.manufactureYear === null,
  )
  @IsNotEmpty({ message: 'Year is required' })
  @IsInt({ message: 'Year must be an integer' })
  @Min(1900, { message: 'Year must be at least 1900' })
  @Max(new Date().getFullYear() + 2, {
    message: 'Year cannot be in the future',
  })
  year?: number;

  // Category
  @ValidateIf((o: VehicleDto) => !o.category)
  @IsNotEmpty({ message: 'Vehicle category ID is required' })
  @IsUUID(4, { message: 'Vehicle category must be a valid UUID' })
  categoryId?: string;

  @ValidateIf((o: VehicleDto) => !o.categoryId)
  @IsNotEmpty({ message: 'Vehicle category is required' })
  @IsUUID(4, { message: 'Vehicle category must be a valid UUID' })
  category?: string;

  // Motor / Engine Number
  @ValidateIf((o: VehicleDto) => !o.motorNumber)
  @IsNotEmpty({ message: 'Engine number is required' })
  @IsString({ message: 'Engine number must be a string' })
  engineNumber?: string;

  @ValidateIf((o: VehicleDto) => !o.engineNumber)
  @IsNotEmpty({ message: 'Motor number is required' })
  @IsString({ message: 'Motor number must be a string' })
  motorNumber?: string;

  // CC Power / Engine CC
  @ValidateIf((o: VehicleDto) => o.ccPower === undefined || o.ccPower === null)
  @IsNotEmpty({ message: 'Engine CC is required' })
  @IsInt({ message: 'Engine CC must be an integer' })
  @Min(1, { message: 'Engine CC must be a positive integer' })
  engineCc?: number;

  @ValidateIf(
    (o: VehicleDto) => o.engineCc === undefined || o.engineCc === null,
  )
  @IsNotEmpty({ message: 'ccPower is required' })
  @IsInt({ message: 'ccPower must be an integer' })
  @Min(1, { message: 'ccPower must be a positive integer' })
  ccPower?: number;

  // Optional fields: Plate Number / License Plate
  @Transform(trimString)
  @IsString({ message: 'Plate number must be a string' })
  @IsOptional()
  plateNumber?: string;

  @Transform(trimString)
  @IsString({ message: 'License plate must be a string' })
  @IsOptional()
  licensePlate?: string;

  // Optional fields: Power / Motor Horsepower
  @Transform(toNumber)
  @IsInt({ message: 'Power must be an integer' })
  @Min(1, { message: 'Power must be a positive integer' })
  @IsOptional()
  power?: number;

  @Transform(toNumber)
  @IsInt({ message: 'Motor horsepower must be an integer' })
  @Min(1, { message: 'Motor horsepower must be a positive integer' })
  @IsOptional()
  motorHorsepower?: number;

  // Optional fields: Mileage
  @Transform(toNumber)
  @IsInt({ message: 'Mileage must be an integer' })
  @Min(0, { message: 'Mileage cannot be negative' })
  @IsOptional()
  mileage?: number;

  // Optional fields: Color / ColorId
  @IsUUID(4, { message: 'Color ID must be a valid UUID' })
  @IsOptional()
  colorId?: string;

  @IsUUID(4, { message: 'Color must be a valid UUID' })
  @IsOptional()
  color?: string;

  // Optional fields: Trim / TrimId
  @IsUUID(4, { message: 'Trim ID must be a valid UUID' })
  @IsOptional()
  trimId?: string;

  @IsUUID(4, { message: 'Trim must be a valid UUID' })
  @IsOptional()
  trim?: string;

  // Optional fields: Transmission Type / TransmissionTypeId
  @IsUUID(4, { message: 'Transmission Type ID must be a valid UUID' })
  @IsOptional()
  transmissionTypeId?: string;

  @IsUUID(4, { message: 'Transmission type must be a valid UUID' })
  @IsOptional()
  transmissionType?: string;

  @IsUUID(4, { message: 'Fuel Type ID must be a valid UUID' })
  @IsOptional()
  fuelTypeId?: string;

  @Transform(toNumber)
  @IsNumber({}, { message: 'Insurance value must be a number' })
  @Min(0, { message: 'Insurance value cannot be negative' })
  @IsOptional()
  insuranceValue?: number;

  @Transform(trimString)
  @IsString({ message: 'Sunroof specification must be a string' })
  @MaxLength(255, {
    message: 'Sunroof specification must not exceed 255 characters',
  })
  @IsOptional()
  sunroofSpecification?: string;

  @Transform(trimString)
  @IsString({ message: 'Side mirrors specification must be a string' })
  @MaxLength(255, {
    message: 'Side mirrors specification must not exceed 255 characters',
  })
  @IsOptional()
  sideMirrors?: string;

  @Transform(trimString)
  @IsString({ message: 'Car interior specification must be a string' })
  @MaxLength(255, {
    message: 'Car interior specification must not exceed 255 characters',
  })
  @IsOptional()
  carInterior?: string;

  @Transform(trimString)
  @IsString({ message: 'Calendar number must be a string' })
  @MaxLength(100, { message: 'Calendar number must not exceed 100 characters' })
  @IsOptional()
  calendarNumber?: string;

  @Transform(trimString)
  @IsString({ message: 'Special instructions must be a string' })
  @MaxLength(1000, {
    message: 'Special instructions must not exceed 1000 characters',
  })
  @IsOptional()
  specialInstructions?: string;

  @IsDateString(
    {},
    { message: 'Registration date must be a valid date string' },
  )
  @IsOptional()
  registrationDate?: Date;

  // Capture settings
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const upper = value.trim().toUpperCase();
      if (upper === 'ADVANCED') return CaptureMode.ADVANCED;
      if (upper === 'STANDARD') return CaptureMode.STANDARD;
    }
    return value as CaptureMode | undefined;
  })
  @IsEnum(CaptureMode, {
    message: 'Capture mode must be standard or advanced',
  })
  @IsOptional()
  captureMode?: CaptureMode;

  @Transform(toBoolean)
  @IsBoolean({ message: 'includeInterior must be a boolean' })
  @IsOptional()
  includeInterior?: boolean;

  // Document upload placeholders
  @IsString({ message: 'Payment receipt image placeholder must be a string' })
  @IsOptional()
  paymentReceiptImage?: string;

  @IsString({ message: 'License front image placeholder must be a string' })
  @IsOptional()
  licenseFrontImage?: string;

  @IsString({ message: 'License back image placeholder must be a string' })
  @IsOptional()
  licenseBackImage?: string;

  // Workflow trigger
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  submit?: boolean;

  // Normalized Getters
  getResolvedBrandId(): string {
    return (this.brandId || this.make || '').trim();
  }

  getResolvedModelId(): string {
    return (this.modelId || this.model || '').trim();
  }

  getResolvedManufactureYear(): number {
    return Number(this.manufactureYear ?? this.year);
  }

  getResolvedCategoryId(): string {
    return (this.categoryId || this.category || '').trim();
  }

  getResolvedEngineNumber(): string {
    return (this.engineNumber || this.motorNumber || '').trim();
  }

  getResolvedEngineCc(): number {
    return Number(this.engineCc ?? this.ccPower);
  }

  getResolvedPlateNumber(): string | undefined {
    const val = this.plateNumber ?? this.licensePlate;
    return val ? val.trim() : undefined;
  }

  getResolvedPower(): number | undefined {
    const val = this.power ?? this.motorHorsepower;
    return val !== undefined && val !== null ? Number(val) : undefined;
  }

  getResolvedColorId(): string | undefined {
    const val = this.colorId ?? this.color;
    return val ? val.trim() : undefined;
  }

  getResolvedTrimId(): string | undefined {
    const val = this.trimId ?? this.trim;
    return val ? val.trim() : undefined;
  }

  getResolvedTransmissionTypeId(): string | undefined {
    const val = this.transmissionTypeId ?? this.transmissionType;
    return val ? val.trim() : undefined;
  }
}
