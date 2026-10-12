import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { PrismaService } from '../../../database/prisma.service';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('governorates')
  async getGovernorates() {
    const governorates = await this.prisma.governorate.findMany({
      where: { isActive: true },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      status: 'success',
      data: governorates,
    };
  }
}
