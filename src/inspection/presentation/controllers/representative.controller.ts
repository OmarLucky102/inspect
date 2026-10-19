import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { RepresentativeService } from '../../application/services/representative.service';
import { CreateRepresentativeDto } from '../dto/create-representative.dto';
import { UpdateRepresentativeDto } from '../dto/update-representative.dto';

@Controller('representatives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
export class RepresentativeController {
  constructor(
    private readonly representativeService: RepresentativeService,
  ) {}

  @Get('overview')
  async getOverview() {
    const data = await this.representativeService.getOverview();
    return {
      status: 'success',
      data,
    };
  }

  @Get('next-id')
  async getNextId(@Query('governorateId') governorateId?: string) {
    const nextId =
      await this.representativeService.generateNextRepresentativeId(
        governorateId,
      );
    return {
      status: 'success',
      data: { nextId },
    };
  }

  @Get()
  async getRepresentatives(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('locationName') locationName?: string,
  ) {
    const parsedIsActive =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    const data = await this.representativeService.findAll({
      search,
      isActive: parsedIsActive,
      governorateId,
      cityId,
      locationName,
    });

    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  async getRepresentativeById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.representativeService.findById(id);
    return {
      status: 'success',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRepresentative(@Body() dto: CreateRepresentativeDto) {
    const data = await this.representativeService.create(dto);
    return {
      status: 'success',
      message: 'Representative created successfully',
      data,
    };
  }

  @Patch(':id')
  async updateRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRepresentativeDto,
  ) {
    const data = await this.representativeService.update(id, dto);
    return {
      status: 'success',
      message: 'Representative updated successfully',
      data,
    };
  }

  @Patch(':id/toggle-status')
  async toggleRepresentativeStatus(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.representativeService.toggleStatus(id);
    return {
      status: 'success',
      message: `Representative is now ${data.isActive ? 'active' : 'inactive'}`,
      data,
    };
  }

  @Delete(':id')
  async deleteRepresentative(@Param('id', ParseUUIDPipe) id: string) {
    await this.representativeService.delete(id);
    return {
      status: 'success',
      message: 'Representative deleted successfully',
    };
  }
}
