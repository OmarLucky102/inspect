import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { TokenPair } from '../../infrastructure/services/jwt-token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ status: string; data: TokenPair }> {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return {
      status: 'success',
      data: tokens,
    };
  }
}
