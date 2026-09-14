import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto, LogoutDto } from '../dto/refresh-token.dto';
import { TokenPair } from '../../infrastructure/services/jwt-token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<{ status: string; data: TokenPair }> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? null;

    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );
    return {
      status: 'success',
      data: tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<{ status: string; data: TokenPair }> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? null;

    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      ip,
      userAgent,
    );
    return {
      status: 'success',
      data: tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() logoutDto: LogoutDto,
  ): Promise<{ status: string; message: string }> {
    await this.authService.logout(logoutDto.refreshToken);
    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }
}
