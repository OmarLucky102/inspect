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

  async existsModel(id: string, brandId?: string): Promise<boolean> {
    const where: any = { id };
    if (brandId) {
      where.brandId = brandId;
    }
    const count = await this.prisma.vehicleModel.count({ where });
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

  async findBrands(): Promise<
    Array<{ id: string; name: string; code: string | null }>
  > {
    return this.prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findModelsByBrand(
    brandId: string,
  ): Promise<Array<{ id: string; brandId: string; name: string }>> {
    return this.prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
    });
  }

  async findCategories(): Promise<
    Array<{
      id: string;
      name: string;
      nameAr: string | null;
      code: string | null;
    }>
  > {
    return this.prisma.vehicleCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findColors(): Promise<
    Array<{
      id: string;
      name: string;
      nameAr: string | null;
      hex: string | null;
    }>
  > {
    return this.prisma.color.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findFuelTypes(): Promise<
    Array<{ id: string; name: string; nameAr: string | null }>
  > {
    return this.prisma.fuelType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findTransmissionTypes(): Promise<
    Array<{ id: string; name: string; nameAr: string | null }>
  > {
    return this.prisma.transmissionType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findTrims(): Promise<
    Array<{ id: string; code: string; name: string; nameAr: string | null }>
  > {
    return this.prisma.vehicleTrim.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
