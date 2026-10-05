import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface JwtPayload {
  sub: string; //User id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

//when user login we will create this
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService, //Create and verify jwt
    private readonly configService: ConfigService, //Get the secret key
  ) {}

  signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.getExpiry('JWT_EXPIRES_IN'),
    });
  }

  signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.getExpiry('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  /**
   * Reads an expiry such as "15m" or "7d" from config and narrows it to the
   * `ms.StringValue` union that `jsonwebtoken` expects, without `as any`.
   */
  private getExpiry(key: string): StringValue {
    return this.configService.getOrThrow<string>(key) as StringValue;
  }

  signTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
