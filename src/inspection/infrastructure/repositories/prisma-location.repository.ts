import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { ILocationRepository } from '../../domain/repositories/location.repository.interface';

@Injectable()
export class PrismaLocationRepository implements ILocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsGovernorate(id: string): Promise<boolean> {
    const count = await this.prisma.governorate.count({ where: { id } });
    return count > 0;
  }

  async existsCity(id: string): Promise<boolean> {
    const count = await this.prisma.city.count({ where: { id } });
    return count > 0;
  }

  async findCity(
    id: string,
  ): Promise<{ id: string; governorateId: string } | null> {
    const city = await this.prisma.city.findUnique({
      where: { id },
      select: { id: true, governorateId: true },
    });
    return city;
  }
}
