import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleMapper } from '../persistence/vehicle.mapper';

@Injectable()
export class PrismaVehicleRepository implements IVehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByVin(vin: string): Promise<Vehicle | null> {
    const row = await this.prisma.vehicle.findUnique({
      where: { vin },
    });
    return row ? VehicleMapper.toDomain(row) : null;
  }

  async save(vehicle: Vehicle): Promise<void> {
    await this.prisma.vehicle.create({
      data: VehicleMapper.toCreateData(vehicle),
    });
  }

  async update(vehicle: Vehicle): Promise<void> {
    await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: VehicleMapper.toUpdateData(vehicle),
    });
  }
}
