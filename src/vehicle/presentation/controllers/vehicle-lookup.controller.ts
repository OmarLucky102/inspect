import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { PrismaService } from '../../../database/prisma.service';
import { VehicleAdminService } from '../../application/services/vehicle-admin.service';
import { CreateTrimDto } from '../dto/create-trim.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleLookupController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleAdminService: VehicleAdminService,
  ) {}

  @Get('lookups')
  async getAllLookups() {
    const [
      brands,
      categories,
      colors,
      fuelTypes,
      transmissionTypes,
      trims,
      sideMirrorTypes,
      sunroofTypes,
    ] = await Promise.all([
      this.prisma.vehicleBrand.findMany({
        orderBy: { name: 'asc' },
        include: {
          models: {
            orderBy: { name: 'asc' },
          },
        },
      }),
      this.prisma.vehicleCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.color.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.fuelType.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.transmissionType.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.vehicleTrim.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.sideMirrorType.findMany({
        orderBy: { code: 'asc' },
      }),
      this.prisma.sunroofType.findMany({
        orderBy: { code: 'asc' },
      }),
    ]);

    return {
      status: 'success',
      data: {
        brands,
        categories,
        colors,
        fuelTypes,
        transmissionTypes,
        trims,
        sideMirrorTypes,
        sunroofTypes,
      },
    };
  }

  @Get('side-mirrors')
  async getSideMirrors() {
    const sideMirrors = await this.prisma.sideMirrorType.findMany({
      orderBy: { code: 'asc' },
    });
    return {
      status: 'success',
      data: sideMirrors,
    };
  }

  @Get('sunroof-types')
  async getSunroofTypes() {
    const sunroofTypes = await this.prisma.sunroofType.findMany({
      orderBy: { code: 'asc' },
    });
    return {
      status: 'success',
      data: sunroofTypes,
    };
  }

  @Get('brands')
  async getBrands() {
    const brands = await this.prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: brands,
    };
  }

  @Get('brands/:brandId/models')
  async getModelsByBrand(@Param('brandId', ParseUUIDPipe) brandId: string) {
    const models = await this.prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: models,
    };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.prisma.vehicleCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: categories,
    };
  }

  @Get('colors')
  async getColors() {
    const colors = await this.prisma.color.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: colors,
    };
  }

  @Get('fuel-types')
  async getFuelTypes() {
    const fuelTypes = await this.prisma.fuelType.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: fuelTypes,
    };
  }

  @Get('transmission-types')
  async getTransmissionTypes() {
    const transmissionTypes = await this.prisma.transmissionType.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: transmissionTypes,
    };
  }

  @Get('trims')
  async getTrims() {
    const trims = await this.prisma.vehicleTrim.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: trims,
    };
  }

  @Post('trims')
  @HttpCode(HttpStatus.CREATED)
  async createTrim(@Body() dto: CreateTrimDto) {
    const data = await this.vehicleAdminService.createTrim(dto);
    return {
      status: 'success',
      message: 'Trim created successfully',
      data,
    };
  }
}
