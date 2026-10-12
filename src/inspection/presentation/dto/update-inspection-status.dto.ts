import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';

export class UpdateInspectionStatusDto {
  @IsNotEmpty()
  @IsEnum(InspectionStatus)
  status!: InspectionStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
