import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChecklistService } from '../../application/services/checklist.service';
import { AddChecklistItemDto } from '../dto/add-checklist-item.dto';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { BankMembershipGuard } from '../../../organization/presentation/guards/bank-membership.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';

@Controller('banks/:bankId/checklists')
@UseGuards(JwtAuthGuard, RolesGuard, BankMembershipGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get('category/:categoryId')
  @Roles(Role.MANAGER, Role.REVIEWER, Role.SUPER_ADMIN)
  async getCategoryChecklist(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    const items = await this.checklistService.getChecklistForCategory(bankId, categoryId);
    return {
      status: 'success',
      data: items,
    };
  }

  @Post(':checklistId/items')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  async addCustomItem(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body() dto: AddChecklistItemDto,
  ) {
    const item = await this.checklistService.addCustomItemToChecklist({
      bankId,
      checklistId,
      ...dto,
    });
    return {
      status: 'success',
      data: item,
    };
  }

  @Delete(':checklistId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  async removeCustomItem(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    await this.checklistService.removeCustomItem(bankId, itemId);
  }

  @Get('/requests/:requestId')
  @Roles(Role.MANAGER, Role.REVIEWER, Role.SUPER_ADMIN)
  async getRequestChecklistItems(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    const items = await this.checklistService.getChecklistItemsForRequest(bankId, requestId);
    return {
      status: 'success',
      data: items,
    };
  }
}
