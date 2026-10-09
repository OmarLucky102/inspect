import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleDto } from './vehicle.dto';

export class SubmitInspectionRequestDto {
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle!: VehicleDto;
}
