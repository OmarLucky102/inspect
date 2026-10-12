import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
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
import { UpdateInspectionStatusDto } from '../dto/update-inspection-status.dto';
import { AssignRepresentativeDto } from '../dto/assign-representative.dto';
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
      vehicle: dto.vehicle,
    });

    return {
      status: 'success',
      data: request,
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
      vehicle: dto.vehicle,
    });

    return {
      status: 'success',
      data: request,
    };
  }

  @Get()
  @Roles(Role.MANAGER, Role.REVIEWER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
  async listRequests(@Param('bankId', ParseUUIDPipe) bankId: string) {
    const requests =
      await this.inspectionRequestService.listRequestsByBank(bankId);
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
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.SYSTEM_ADMIN)
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
}
