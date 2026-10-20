import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ForbiddenException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../../domain/entities/user.entity';

interface RequestUser {
  sub?: string;
  id?: string;
  email?: string;
  role?: Role;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

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

    const user = await this.userService.getUserById(id);
    return {
      status: 'success',
      data: this.toResponse(user),
    };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async getUsers() {
    const users = await this.userService.getAllUsers();
    return {
      status: 'success',
      data: users.map((user) => ({
        id: user.id,
        ...this.toResponse(user),
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
