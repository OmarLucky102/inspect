import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InspectionRequestService } from '../../application/services/inspection-request.service';
import { ChecklistService } from '../../application/services/checklist.service';
import { UpdateInspectionRequestVehicleDto } from '../dto/update-inspection-request-vehicle.dto';
import { VehicleDto } from '../dto/vehicle.dto';
import { CreateInspectionRequestDto } from '../dto/create-inspection-request.dto';
import { SubmitInspectionRequestDto } from '../dto/submit-inspection-request.dto';
import { UpdateInspectionStatusDto } from '../dto/update-inspection-status.dto';
import { AssignRepresentativeDto } from '../dto/assign-representative.dto';
import { UpdatePhotoChecklistDto } from '../dto/update-photo-checklist.dto';
import { SubmitMediaReviewDto } from '../dto/submit-media-review.dto';
import { PriceRevisionDto } from '../dto/price-revision.dto';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InvalidStatusTransitionException } from '../../../shared/exceptions/inspection.exceptions';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { BankMembershipGuard } from '../../../organization/presentation/guards/bank-membership.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';

@Controller('banks/:bankId/inspection-requests')
@UseGuards(JwtAuthGuard, RolesGuard, BankMembershipGuard)
export class InspectionRequestController {
  constructor(
    private readonly inspectionRequestService: InspectionRequestService,
    private readonly checklistService: ChecklistService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async createRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Body() dto: CreateInspectionRequestDto,
    @CurrentUser() user: { sub?: string; id?: string },
  ) {
    const request = await this.inspectionRequestService.createRequest({
      bankId,
      userId: (user.sub || user.id)!,
      customer: dto.customer,
      location: dto.location,
      requestedCompletionDate: dto.requestedCompletionDate,
      notes: dto.notes,
      vehicle: dto.vehicle ? this.mapVehicleDtoToInput(dto.vehicle) : undefined,
    });

    return {
      status: 'success',
      data: request,
    };
  }

  @Put(':id/vehicle')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async setVehicle(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionRequestVehicleDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const v = dto.getVehiclePayload();
    const result = await this.inspectionRequestService.setVehicleInfo({
      bankId,
      requestId: id,
      actor: {
        id: (user.sub || user.id)!,
        role: user.role,
      },
      vehicle: this.mapVehicleDtoToInput(v),
    });

    return {
      status: 'success',
      data: result,
    };
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async submitRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitInspectionRequestDto,
    @CurrentUser() user: { sub?: string; id?: string },
  ) {
    const request = await this.inspectionRequestService.submitRequest({
      bankId,
      requestId: id,
      userId: (user.sub || user.id)!,
      vehicle: this.mapVehicleDtoToInput(dto.vehicle),
    });

    return {
      status: 'success',
      data: request,
    };
  }

  private mapVehicleDtoToInput(v: VehicleDto) {
    return {
      vin: v.vin,
      brandId:
        typeof v.getResolvedBrandId === 'function'
          ? v.getResolvedBrandId()
          : v.brandId || v.make || '',
      modelId:
        typeof v.getResolvedModelId === 'function'
          ? v.getResolvedModelId()
          : v.modelId || v.model || '',
      manufactureYear:
        typeof v.getResolvedManufactureYear === 'function'
          ? v.getResolvedManufactureYear()
          : Number(v.manufactureYear ?? v.year),
      categoryId:
        typeof v.getResolvedCategoryId === 'function'
          ? v.getResolvedCategoryId()
          : v.categoryId || v.category || '',
      engineNumber:
        typeof v.getResolvedEngineNumber === 'function'
          ? v.getResolvedEngineNumber()
          : v.engineNumber || v.motorNumber || '',
      engineCc:
        typeof v.getResolvedEngineCc === 'function'
          ? v.getResolvedEngineCc()
          : Number(v.engineCc ?? v.ccPower),
      plateNumber:
        typeof v.getResolvedPlateNumber === 'function'
          ? v.getResolvedPlateNumber()
          : (v.plateNumber ?? v.licensePlate),
      power:
        typeof v.getResolvedPower === 'function'
          ? v.getResolvedPower()
          : (v.power ?? v.motorHorsepower),
      mileage: v.mileage,
      colorId:
        typeof v.getResolvedColorId === 'function'
          ? v.getResolvedColorId()
          : (v.colorId ?? v.color),
      trimId:
        typeof v.getResolvedTrimId === 'function'
          ? v.getResolvedTrimId()
          : (v.trimId ?? v.trim),
      transmissionTypeId:
        typeof v.getResolvedTransmissionTypeId === 'function'
          ? v.getResolvedTransmissionTypeId()
          : (v.transmissionTypeId ?? v.transmissionType),
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
    };
  }

  @Get()
  @Roles(Role.MANAGER, Role.REVIEWER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async listRequests(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Query('status') status?: string,
  ) {
    const requests = await this.inspectionRequestService.listRequestsByBank(
      bankId,
      status,
    );
    return {
      status: 'success',
      data: requests,
    };
  }

  @Get(':id')
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
  )
  async getRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const request = await this.inspectionRequestService.getRequestDetails(
      id,
      bankId,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: request,
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
  )
  async updateStatus(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionStatusDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const request = await this.inspectionRequestService.updateStatus(
      id,
      bankId,
      dto.status,
      dto.note,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: request,
    };
  }

  @Put(':id/assignment')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async assignRepresentative(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRepresentativeDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const request = await this.inspectionRequestService.assignRepresentative(
      id,
      bankId,
      dto.representativeId,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
      dto.notes,
      dto.captureMode,
    );
    return {
      status: 'success',
      data: request,
    };
  }

  @Get(':id/status-history')
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
  )
  async getStatusHistory(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const history = await this.inspectionRequestService.getStatusHistory(
      id,
      bankId,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: history,
    };
  }

  @Get([':id/photo-checklist', ':id/checklist'])
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
  )
  async getPhotoChecklist(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const checklist = await this.checklistService.getPhotoChecklist(
      bankId,
      id,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: checklist,
    };
  }

  @Put([':id/photo-checklist', ':id/checklist'])
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.REVIEWER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async updatePhotoChecklist(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePhotoChecklistDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const updated = await this.checklistService.updatePhotoChecklist(
      bankId,
      id,
      dto,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: updated,
    };
  }

  @Post(':id/media-review')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async submitMediaReview(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitMediaReviewDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const request = await this.inspectionRequestService.submitMediaReview(
      id,
      bankId,
      dto,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );
    return {
      status: 'success',
      data: request,
    };
  }

  @Post(':id/final-approval')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async finalApprove(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
    @CurrentUser() user?: { sub?: string; id?: string; role?: Role },
  ) {
    const request = await this.inspectionRequestService.superAdminFinalApproval(
      id,
      bankId,
      {
        id: (user?.sub || user?.id)!,
        role: user?.role || Role.SUPER_ADMIN,
      },
      notes,
    );
    return {
      status: 'success',
      data: request,
    };
  }

  @Post(':id/request-price-revision')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async requestPriceRevision(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PriceRevisionDto,
    @CurrentUser() user?: { sub?: string; id?: string; role?: Role },
  ) {
    const request =
      await this.inspectionRequestService.superAdminRequestPriceRevision(
        id,
        bankId,
        dto.revisionNotes,
        {
          id: (user?.sub || user?.id)!,
          role: user?.role || Role.SUPER_ADMIN,
        },
      );
    return {
      status: 'success',
      data: request,
    };
  }

  @Get(':id/report')
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.USER,
    Role.VIEWER,
  )
  async getInspectionReport(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
  ) {
    const details = await this.inspectionRequestService.getRequestDetails(
      id,
      bankId,
      {
        id: (user.sub || user.id)!,
        role: user.role,
      },
    );

    if (details.currentStatus !== InspectionStatus.APPROVED) {
      throw new InvalidStatusTransitionException(
        'Inspection report is locked and will become available once the Super Admin grants final approval.',
      );
    }

    return {
      status: 'success',
      data: {
        requestId: id,
        reportAvailable: true,
        reportTitle: `EuroInspect 360 Inspection Report - ${details.requestNumber}`,
        generatedAt: new Date().toISOString(),
        requestNumber: details.requestNumber,
        customer: details.customer,
        vehicle: details.vehicle,
        marketingValueDecision: details.latestMarketingDecision,
        checklistItems: details.checklistItems,
      },
    };
  }
}
