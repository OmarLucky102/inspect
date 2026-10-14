import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleDto } from './vehicle.dto';

export class UpdateInspectionRequestVehicleDto extends VehicleDto {
  @ValidateNested()
  @Type(() => VehicleDto)
  @IsOptional()
  vehicle?: VehicleDto;

  /**
   * Helper method to extract the vehicle fields whether sent at top level or nested.
   */
  getVehiclePayload(): VehicleDto {
    if (this.vehicle && this.vehicle.vin) {
      return this.vehicle;
    }
    return this;
  }
}
