import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Put,
  Body,
  Param,
  ForbiddenException,
  NotFoundException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { ToggleUserStatusUseCase } from '../../application/use-cases/toggle-user-status.use-case';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from '../../../database/prisma.service';
import {
  BankMembershipAlreadyExistsException,
  InvalidBankMemberRoleException,
} from '../../../shared/exceptions/organization.exceptions';

interface RequestUser {
  sub?: string;
  id?: string;
  email?: string;
  role?: Role;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prisma?: PrismaService,
    private readonly createUserUseCase?: CreateUserUseCase,
    private readonly deleteUserUseCase?: DeleteUserUseCase,
    private readonly toggleUserStatusUseCase?: ToggleUserStatusUseCase,
  ) {}

  @Get('me')
  async getMyProfile(@CurrentUser() currentUser: RequestUser) {
    const userId = currentUser.sub || currentUser.id || '';
    const user = await this.userService.getUserById(userId);
    return {
      status: 'success',
      data: this.toResponse(user),
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @CurrentUser() currentUser: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = currentUser.sub || currentUser.id || '';
    const user = await this.userService.updateProfile(userId, dto);
    return {
      status: 'success',
      data: this.toResponse(user),
    };
  }

  @Get('profile')
  async getProfile(@CurrentUser() currentUser: RequestUser) {
    return this.getMyProfile(currentUser);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() currentUser: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateMyProfile(currentUser, dto);
  }

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      (currentUser.sub || currentUser.id) !== id
    ) {
      throw new ForbiddenException('Cannot access other user profiles');
    }

    if (this.prisma) {
      const userWithBanks = await this.prisma.user.findUnique({
        where: { id },
        include: {
          bankMemberships: {
            include: {
              bank: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      });
      if (!userWithBanks) throw new NotFoundException('User not found');

      return {
        status: 'success',
        data: {
          email: userWithBanks.email,
          firstName: userWithBanks.firstName,
          lastName: userWithBanks.lastName,
          phone: userWithBanks.phone,
          role: userWithBanks.role,
          isActive: userWithBanks.isActive,
          status: userWithBanks.isActive ? 'ACTIVE' : 'INACTIVE',
          isEmailVerified: userWithBanks.isEmailVerified,
          emailVerifiedAt: userWithBanks.emailVerifiedAt,
          lastLoginAt: userWithBanks.lastLoginAt,
          createdAt: userWithBanks.createdAt,
          updatedAt: userWithBanks.updatedAt,
          banks: userWithBanks.bankMemberships.map((bm) => ({
            id: bm.bank.id,
            name: bm.bank.name,
            code: bm.bank.code,
            isPrimary: bm.isPrimary,
            status: bm.status,
          })),
        },
      };
    }

    const user = await this.userService.getUserById(id);
    return {
      status: 'success',
      data: {
        ...this.toResponse(user),
        banks: [],
      },
    };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async getUsers() {
    if (this.prisma) {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          bankMemberships: {
            include: {
              bank: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      });

      return {
        status: 'success',
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          isEmailVerified: user.isEmailVerified,
          emailVerifiedAt: user.emailVerifiedAt,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          banks: user.bankMemberships.map((bm) => ({
            id: bm.bank.id,
            name: bm.bank.name,
            code: bm.bank.code,
            isPrimary: bm.isPrimary,
            status: bm.status,
          })),
        })),
      };
    }

    const users = await this.userService.getAllUsers();
    return {
      status: 'success',
      data: users.map((user) => ({
        id: user.id,
        ...this.toResponse(user),
        banks: [],
      })),
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto) {
    if (!this.createUserUseCase) {
      throw new NotFoundException('CreateUserUseCase not initialized');
    }
    const user = await this.createUserUseCase.execute(dto);
    return {
      status: 'success',
      data: user,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (!this.deleteUserUseCase) {
      throw new NotFoundException('DeleteUserUseCase not initialized');
    }
    const actorId = currentUser.sub || currentUser.id || '';
    await this.deleteUserUseCase.execute({
      targetUserId: id,
      actorUserId: actorId,
    });
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async activateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (!this.toggleUserStatusUseCase) {
      throw new NotFoundException('ToggleUserStatusUseCase not initialized');
    }
    const actorId = currentUser.sub || currentUser.id || '';
    const user = await this.toggleUserStatusUseCase.execute({
      targetUserId: id,
      actorUserId: actorId,
      action: 'activate',
    });
    return {
      status: 'success',
      data: user,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (!this.toggleUserStatusUseCase) {
      throw new NotFoundException('ToggleUserStatusUseCase not initialized');
    }
    const actorId = currentUser.sub || currentUser.id || '';
    const user = await this.toggleUserStatusUseCase.execute({
      targetUserId: id,
      actorUserId: actorId,
      action: 'deactivate',
    });
    return {
      status: 'success',
      data: user,
    };
  }

  @Put(':id/banks')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUserBanks(
    @Param('id') id: string,
    @Body() body: { bankIds: string[]; primaryBankId?: string },
  ) {
    if (!this.prisma) {
      throw new NotFoundException('Database service unavailable');
    }

    const { bankIds = [], primaryBankId } = body;

    // Check target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Platform administrators (SUPER_ADMIN, SYSTEM_ADMIN) manage the entire system globally and cannot be assigned to bank workspaces
    if (
      (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'SYSTEM_ADMIN') &&
      bankIds.length > 0
    ) {
      throw new InvalidBankMemberRoleException(
        targetUser.role,
        `Role '${targetUser.role}' is not allowed for bank members. Platform administrators manage the platform globally and cannot belong to individual bank workspaces.`,
      );
    }

    // Check for duplicate bank IDs in the payload
    const uniqueBankIds = Array.from(new Set(bankIds));
    if (uniqueBankIds.length !== bankIds.length) {
      throw new BankMembershipAlreadyExistsException(
        id,
        undefined,
        'Duplicate bank assignment detected. This user cannot be assigned to the same bank multiple times.',
      );
    }

    // If bankIds are provided, verify all banks exist
    if (uniqueBankIds.length > 0) {
      const existingBanks = await this.prisma.bank.findMany({
        where: { id: { in: uniqueBankIds } },
        select: { id: true },
      });
      if (existingBanks.length !== uniqueBankIds.length) {
        throw new NotFoundException('One or more selected banks do not exist');
      }
    }

    // 1. Fetch current bank memberships
    const currentMemberships = await this.prisma.bankMembership.findMany({
      where: { userId: id },
      include: { bank: { select: { id: true, name: true, code: true } } },
    });

    const currentBankIds = currentMemberships.map((m) => m.bankId);
    const currentPrimary = currentMemberships.find((m) => m.isPrimary)?.bankId;

    // 2. If user is already assigned to the requested bank(s) with no actual change
    const sameCount = currentBankIds.length === bankIds.length;
    const sameBanks =
      sameCount && bankIds.every((bid) => currentBankIds.includes(bid));
    const samePrimary =
      (primaryBankId || undefined) === (currentPrimary || undefined);

    if (currentBankIds.length > 0 && sameBanks && samePrimary) {
      const bankNames = currentMemberships.map((m) => m.bank.name).join(', ');
      throw new BankMembershipAlreadyExistsException(
        id,
        bankIds[0],
        `This user is already assigned to ${bankNames ? `the selected bank (${bankNames})` : 'this bank'}.`,
      );
    }

    // 3. Delete all current bank memberships for this user
    await this.prisma.bankMembership.deleteMany({
      where: { userId: id },
    });

    // 4. Insert new memberships for each selected bank
    if (bankIds.length > 0) {
      await this.prisma.bankMembership.createMany({
        data: bankIds.map((bankId) => ({
          bankId,
          userId: id,
          isPrimary: primaryBankId ? primaryBankId === bankId : false,
          status: 'ACTIVE',
        })),
      });
    }

    // 5. Return updated banks
    const memberships = await this.prisma.bankMembership.findMany({
      where: { userId: id },
      include: { bank: { select: { id: true, name: true, code: true } } },
    });

    return {
      status: 'success',
      data: memberships.map((bm) => ({
        id: bm.bank.id,
        name: bm.bank.name,
        code: bm.bank.code,
        isPrimary: bm.isPrimary,
        status: bm.status,
      })),
    };
  }

  private toResponse(user: User) {
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
