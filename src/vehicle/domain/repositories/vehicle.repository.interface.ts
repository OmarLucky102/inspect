import { Vehicle } from '../entities/vehicle.entity';

export interface IVehicleRepository {
  findByVin(vin: string): Promise<Vehicle | null>;
  save(vehicle: Vehicle): Promise<void>;
  update(vehicle: Vehicle): Promise<void>;
}
