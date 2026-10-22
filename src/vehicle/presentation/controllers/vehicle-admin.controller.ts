import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { VehicleAdminService } from '../../application/services/vehicle-admin.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { CreateModelDto } from '../dto/create-model.dto';
import { UpdateModelDto } from '../dto/update-model.dto';
import { CreateColorDto } from '../dto/create-color.dto';
import { UpdateColorDto } from '../dto/update-color.dto';
import { UpdateTrimDto } from '../dto/update-trim.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class VehicleAdminController {
  constructor(private readonly vehicleAdminService: VehicleAdminService) {}

  // ─── Overview Stats ────────────────────────────────────────────────────────
  @Get('admin/overview')
  async getOverview() {
    const data = await this.vehicleAdminService.getOverview();
    return {
      status: 'success',
      data,
    };
  }

  // ─── Brands (Makes) Management ────────────────────────────────────────────
  @Get('admin/brands')
  async getAllBrandsAdmin() {
    const data = await this.vehicleAdminService.getAllBrandsAdmin();
    return {
      status: 'success',
      data,
    };
  }

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  async createBrand(@Body() dto: CreateBrandDto) {
    const data = await this.vehicleAdminService.createBrand(dto);
    return {
      status: 'success',
      message: 'Brand created successfully',
      data,
    };
  }

  @Patch('brands/:id')
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    const data = await this.vehicleAdminService.updateBrand(id, dto);
    return {
      status: 'success',
      message: 'Brand updated successfully',
      data,
    };
  }

  @Delete('brands/:id')
  async deleteBrand(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehicleAdminService.deleteBrand(id);
    return {
      status: 'success',
      message: 'Brand deleted successfully',
    };
  }

  // ─── Models Management ────────────────────────────────────────────────────
  @Post('brands/:brandId/models')
  @HttpCode(HttpStatus.CREATED)
  async createModelForBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Body() dto: CreateModelDto,
  ) {
    const data = await this.vehicleAdminService.createModel(brandId, dto);
    return {
      status: 'success',
      message: 'Model added successfully',
      data,
    };
  }

  @Post('models')
  @HttpCode(HttpStatus.CREATED)
  async createModel(@Body() dto: CreateModelDto) {
    if (!dto.brandId) {
      throw new BadRequestException('brandId is required when creating a model');
    }
    const data = await this.vehicleAdminService.createModel(dto.brandId, dto);
    return {
      status: 'success',
      message: 'Model added successfully',
      data,
    };
  }

  @Patch('models/:id')
  async updateModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModelDto,
  ) {
    const data = await this.vehicleAdminService.updateModel(id, dto);
    return {
      status: 'success',
      message: 'Model updated successfully',
      data,
    };
  }

  @Delete('models/:id')
  async deleteModel(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehicleAdminService.deleteModel(id);
    return {
      status: 'success',
      message: 'Model deleted successfully',
    };
  }

  // ─── Colors Management ────────────────────────────────────────────────────
  @Get('admin/colors')
  async getAllColorsAdmin() {
    const data = await this.vehicleAdminService.getAllColorsAdmin();
    return {
      status: 'success',
      data,
    };
  }

  @Post('colors')
  @HttpCode(HttpStatus.CREATED)
  async createColor(@Body() dto: CreateColorDto) {
    const data = await this.vehicleAdminService.createColor(dto);
    return {
      status: 'success',
      message: 'Color created successfully',
      data,
    };
  }

  @Patch('colors/:id')
  async updateColor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateColorDto,
  ) {
    const data = await this.vehicleAdminService.updateColor(id, dto);
    return {
      status: 'success',
      message: 'Color updated successfully',
      data,
    };
  }

  @Patch('colors/:id/toggle-status')
  async toggleColorStatus(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vehicleAdminService.toggleColorStatus(id);
    return {
      status: 'success',
      message: `Color ${data.isActive ? 'activated' : 'deactivated'} successfully`,
      data,
    };
  }

  @Delete('colors/:id')
  async deleteColor(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehicleAdminService.deleteColor(id);
    return {
      status: 'success',
      message: 'Color deleted successfully',
    };
  }

  // ─── Trims Management ─────────────────────────────────────────────────────
  @Get('admin/trims')
  async getAllTrimsAdmin() {
    const data = await this.vehicleAdminService.getAllTrimsAdmin();
    return {
      status: 'success',
      data,
    };
  }

  @Patch('trims/:id')
  async updateTrim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrimDto,
  ) {
    const data = await this.vehicleAdminService.updateTrim(id, dto);
    return {
      status: 'success',
      message: 'Trim updated successfully',
      data,
    };
  }

  @Patch('trims/:id/toggle-status')
  async toggleTrimStatus(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vehicleAdminService.toggleTrimStatus(id);
    return {
      status: 'success',
      message: `Trim ${data.isActive ? 'activated' : 'deactivated'} successfully`,
      data,
    };
  }

  @Delete('trims/:id')
  async deleteTrim(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehicleAdminService.deleteTrim(id);
    return {
      status: 'success',
      message: 'Trim deleted successfully',
    };
  }
}
