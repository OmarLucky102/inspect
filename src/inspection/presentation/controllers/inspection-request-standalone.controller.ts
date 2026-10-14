import {
  Controller,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InspectionRequestService } from '../../application/services/inspection-request.service';
import { UpdateInspectionRequestVehicleDto } from '../dto/update-inspection-request-vehicle.dto';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { PrismaService } from '../../../database/prisma.service';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';

@Controller('inspection-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionRequestStandaloneController {
  constructor(
    private readonly inspectionRequestService: InspectionRequestService,
    private readonly prisma: PrismaService,
  ) {}

  @Put(':requestId/vehicle')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async setVehicle(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: UpdateInspectionRequestVehicleDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const userId = (user.sub || user.id)!;
    const reqRow = await this.prisma.inspectionRequest.findUnique({
      where: { id: requestId },
      select: { id: true, bankId: true },
    });

    if (!reqRow) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    // Verify bank access if not global admin
    const isGlobalAdmin =
      user.role === Role.SUPER_ADMIN || user.role === Role.SYSTEM_ADMIN;
    if (!isGlobalAdmin) {
      const membership = await this.prisma.bankMembership.findFirst({
        where: {
          bankId: reqRow.bankId,
          userId,
          status: 'ACTIVE',
        },
      });
      if (!membership) {
        throw new InspectionRequestAccessDeniedException();
      }
    }

    const v = dto.getVehiclePayload();
    const result = await this.inspectionRequestService.setVehicleInfo({
      bankId: reqRow.bankId,
      requestId,
      actor: {
        id: userId,
        role: user.role,
      },
      vehicle: {
        vin: v.vin,
        brandId: v.getResolvedBrandId(),
        modelId: v.getResolvedModelId(),
        manufactureYear: v.getResolvedManufactureYear(),
        categoryId: v.getResolvedCategoryId(),
        engineNumber: v.getResolvedEngineNumber(),
        engineCc: v.getResolvedEngineCc(),
        plateNumber: v.getResolvedPlateNumber(),
        power: v.getResolvedPower(),
        mileage: v.mileage,
        colorId: v.getResolvedColorId(),
        trimId: v.getResolvedTrimId(),
        transmissionTypeId: v.getResolvedTransmissionTypeId(),
        fuelTypeId: v.fuelTypeId,
        insuranceValue: v.insuranceValue,
        sunroofSpecification: v.sunroofSpecification,
        sideMirrors: v.sideMirrors,
        carInterior: v.carInterior,
        calendarNumber: v.calendarNumber,
        specialInstructions: v.specialInstructions,
        registrationDate: v.registrationDate,
        captureMode: v.captureMode,
        includeInterior: v.includeInterior,
        submit: v.submit,
      },
    });

    return {
      status: 'success',
      data: result,
    };
  }
}
