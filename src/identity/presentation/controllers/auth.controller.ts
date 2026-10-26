import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import ms, { type StringValue } from 'ms';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenNotFoundException } from '../../../shared/exceptions/auth.exceptions';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string; data: { accessToken: string } }> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? null;

    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );

    this.setRefreshTokenCookie(res, tokens.refreshToken, req);

    return {
      status: 'success',
      data: { accessToken: tokens.accessToken },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string; data: { accessToken: string } }> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? null;
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];

    try {
      if (!refreshToken) {
        throw new RefreshTokenNotFoundException();
      }

      const tokens = await this.authService.refreshTokens(
        refreshToken,
        ip,
        userAgent,
      );

      this.setRefreshTokenCookie(res, tokens.refreshToken, req);

      return {
        status: 'success',
        data: { accessToken: tokens.accessToken },
      };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 401) {
        this.clearRefreshTokenCookie(res, req);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string; message: string }> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];

    try {
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      this.clearRefreshTokenCookie(res, req);
    } catch (error) {
      if (
        error instanceof RefreshTokenNotFoundException ||
        (error instanceof HttpException && error.getStatus() === 401)
      ) {
        this.clearRefreshTokenCookie(res, req);
      }
      throw error;
    }

    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }

  private isSecureRequest(req: Request): boolean {
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }

  private getCookieOptions(secure: boolean, maxAge: number) {
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    };
  }

  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    req: Request,
  ): void {
    const isSecure = this.isSecureRequest(req);
    const maxAge = ms(
      (process.env.JWT_COOKIE_EXPIRES_IN ?? '15d') as StringValue,
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      this.getCookieOptions(isSecure, maxAge),
    );
  }

  private clearRefreshTokenCookie(res: Response, req: Request): void {
    const isSecure = this.isSecureRequest(req);
    res.clearCookie(
      REFRESH_TOKEN_COOKIE,
      this.getCookieOptions(isSecure, 0),
    );
  }
}
