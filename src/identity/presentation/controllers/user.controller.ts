import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from '../../application/services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);

    // Convert to a plain object and remove password before sending to the client
    // For a cleaner approach long term, map this to a UserResponseDto
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return userResponse;
  }
}
