import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IVehicleReferenceRepository } from '../../domain/repositories/vehicle-reference.repository.interface';

@Injectable()
export class PrismaVehicleReferenceRepository implements IVehicleReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsBrand(id: string): Promise<boolean> {
    const count = await this.prisma.vehicleBrand.count({ where: { id } });
    return count > 0;
  }

  async existsModel(id: string): Promise<boolean> {
    const count = await this.prisma.vehicleModel.count({ where: { id } });
    return count > 0;
  }

  async existsCategory(id: string): Promise<boolean> {
    const count = await this.prisma.vehicleCategory.count({ where: { id } });
    return count > 0;
  }

  async existsColor(id: string): Promise<boolean> {
    const count = await this.prisma.color.count({ where: { id } });
    return count > 0;
  }

  async existsFuelType(id: string): Promise<boolean> {
    const count = await this.prisma.fuelType.count({ where: { id } });
    return count > 0;
  }

  async existsTransmissionType(id: string): Promise<boolean> {
    const count = await this.prisma.transmissionType.count({ where: { id } });
    return count > 0;
  }

  async existsTrim(id: string): Promise<boolean> {
    const count = await this.prisma.vehicleTrim.count({ where: { id } });
    return count > 0;
  }
}
