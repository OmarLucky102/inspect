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
import { BankService } from '../../application/services/bank.service';
import { CreateBankDto } from '../dto/create-bank.dto';
import { CreateBankUserDto } from '../dto/create-bank-user.dto';
import { AddBankMemberDto } from '../dto/add-bank-member.dto';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';

@Controller('banks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBank(@Body() dto: CreateBankDto) {
    const bank = await this.bankService.createBank({
      name: dto.name,
      code: dto.code,
      email: dto.email,
      phone: dto.phone,
    });

    return {
      status: 'success',
      data: {
        id: bank.id,
        name: bank.name,
        code: bank.code,
        email: bank.email,
        phone: bank.phone,
        isActive: bank.isActive,
        createdAt: bank.createdAt,
      },
    };
  }

  @Get()
  async listBanks() {
    const banks = await this.bankService.listBanks();
    return {
      status: 'success',
      data: banks.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        email: b.email,
        phone: b.phone,
        isActive: b.isActive,
        createdAt: b.createdAt,
      })),
    };
  }

  @Get(':bankId')
  async getBank(@Param('bankId', ParseUUIDPipe) bankId: string) {
    const bank = await this.bankService.getBankById(bankId);
    return {
      status: 'success',
      data: {
        id: bank.id,
        name: bank.name,
        code: bank.code,
        email: bank.email,
        phone: bank.phone,
        isActive: bank.isActive,
        createdAt: bank.createdAt,
      },
    };
  }

  @Post(':bankId/users')
  @HttpCode(HttpStatus.CREATED)
  async createBankUser(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Body() dto: CreateBankUserDto,
  ) {
    const { user, membership } = await this.bankService.createBankUser({
      bankId,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      isPrimary: dto.isPrimary,
    });

    return {
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        membership: {
          id: membership.id,
          bankId: membership.bankId,
          userId: membership.userId,
          isPrimary: membership.isPrimary,
          status: membership.status,
          joinedAt: membership.joinedAt,
        },
      },
    };
  }

  @Post(':bankId/members')
  @HttpCode(HttpStatus.CREATED)
  async addBankMember(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Body() dto: AddBankMemberDto,
  ) {
    const membership = await this.bankService.addBankMember({
      bankId,
      userId: dto.userId,
      isPrimary: dto.isPrimary,
    });

    return {
      status: 'success',
      data: {
        id: membership.id,
        bankId: membership.bankId,
        userId: membership.userId,
        isPrimary: membership.isPrimary,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
    };
  }
}
