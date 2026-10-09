import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InspectionRequestService } from '../../application/services/inspection-request.service';
import { CreateInspectionRequestDto } from '../dto/create-inspection-request.dto';
import { SubmitInspectionRequestDto } from '../dto/submit-inspection-request.dto';
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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  async createRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Body() dto: CreateInspectionRequestDto,
    @CurrentUser() user: { sub?: string; id?: string },
  ) {
    const request = await this.inspectionRequestService.createRequest({
      bankId,
      userId: user.sub! || user.id!,
      customer: dto.customer,
      location: dto.location,
      requestedCompletionDate: dto.requestedCompletionDate,
      notes: dto.notes,
      vehicle: dto.vehicle,
    });

    return {
      status: 'success',
      data: request,
    };
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  async submitRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitInspectionRequestDto,
    @CurrentUser() user: { sub?: string; id?: string },
  ) {
    const request = await this.inspectionRequestService.submitRequest({
      bankId,
      requestId: id,
      userId: user.sub! || user.id!,
      vehicle: dto.vehicle,
    });

    return {
      status: 'success',
      data: request,
    };
  }

  @Get()
  async listRequests(@Param('bankId', ParseUUIDPipe) bankId: string) {
    const requests =
      await this.inspectionRequestService.listRequestsByBank(bankId);
    return {
      status: 'success',
      data: requests,
    };
  }

  @Get(':id')
  async getRequest(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const request = await this.inspectionRequestService.getRequestById(
      id,
      bankId,
    );
    return {
      status: 'success',
      data: request,
    };
  }
}
