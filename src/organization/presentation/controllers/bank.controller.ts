import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BankService } from '../../application/services/bank.service';
import { CreateBankDto } from '../dto/create-bank.dto';
import { CreateBankUserDto } from '../dto/create-bank-user.dto';
import { AddBankMemberDto } from '../dto/add-bank-member.dto';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';

import { PrismaService } from '../../../database/prisma.service';

@Controller('banks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankController {
  constructor(
    private readonly bankService: BankService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-banks')
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.USER,
    Role.VIEWER,
    Role.REPRESENTATIVE,
    Role.SUPER_ADMIN,
  )
  async getMyBanks(@CurrentUser() user: any) {
    if (user.role === Role.SUPER_ADMIN) {
      const banks = await this.bankService.listBanks();
      return { status: 'success', data: banks };
    }
    const memberships = await this.prisma.bankMembership.findMany({
      where: { userId: user.sub || user.id },
      include: { bank: true },
    });
    return {
      status: 'success',
      data: memberships.map((m) => m.bank),
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
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

  @Get('generate-code')
  @Roles(Role.SUPER_ADMIN)
  async generateCode(@Query('name') name?: string) {
    const code = await this.bankService.generateBankCode(name || '');
    return {
      status: 'success',
      data: { code },
    };
  }

  @Get(':bankId')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
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

  @Get(':bankId/members')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.REVIEWER)
  async getBankMembers(@Param('bankId', ParseUUIDPipe) bankId: string) {
    const memberships = await this.prisma.bankMembership.findMany({
      where: { bankId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      status: 'success',
      data: memberships.map((m) => ({
        ...m.user,
        membershipId: m.id,
        isPrimary: m.isPrimary,
        status: m.status,
      })),
    };
  }

  @Delete(':bankId/members/:userId')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async removeBankMember(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.bankService.removeBankMember(bankId, userId);
    return {
      status: 'success',
      message: 'User removed from bank successfully',
    };
  }
}
