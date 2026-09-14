import { Injectable, Inject } from '@nestjs/common';
import UAParser from 'ua-parser-js';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { BcryptHasherService } from '../../infrastructure/services/bcrypt-hasher.service';
import {
  JwtTokenService,
  TokenPair,
} from '../../infrastructure/services/jwt-token.service';
import { TokenHasherService } from '../../infrastructure/services/token-hasher.service';
import { InvalidCredentialsException } from '../../../shared/exceptions/user.exceptions';
import {
  RefreshTokenNotFoundException,
  RefreshTokenExpiredException,
  RefreshTokenReuseDetectedException,
} from '../../../shared/exceptions/auth.exceptions';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly bcryptHasher: BcryptHasherService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly tokenHasher: TokenHasherService,
    private readonly prisma: PrismaService,
  ) {}

  async login(
    email: string,
    password: string,
    ip: string,
    userAgent: string | null,
  ): Promise<TokenPair> {
    // 1. Find the user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 2. Check account is active
    if (!user.isActive) {
      throw new InvalidCredentialsException();
    }

    // 3. Compare the provided password against the stored hash
    const isPasswordValid = await this.bcryptHasher.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // 4. Sign token pair
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.jwtTokenService.signTokenPair(payload);

    // 5. Persist the refresh token
    const refreshTokenEntity = this.createRefreshTokenEntity(
      user.id,
      tokens.refreshToken,
      ip,
      userAgent,
    );
    await this.refreshTokenRepository.create(refreshTokenEntity);

    return tokens;
  }

  async refreshTokens(
    refreshTokenValue: string,
    ip: string,
    userAgent: string | null,
  ): Promise<TokenPair> {
    // 1. Hash the incoming token and look it up
    const tokenHash = this.tokenHasher.hash(refreshTokenValue);
    const existingToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    // 2. If token not found → it was never issued or already deleted
    if (!existingToken) {
      throw new RefreshTokenNotFoundException();
    }

    // 3. REUSE DETECTION: if the token is revoked, it means someone
    //    tried to use a token that was already rotated. This is a
    //    potential breach — revoke all tokens for this user.
    if (existingToken.isRevoked) {
      await this.refreshTokenRepository.revokeAllForUser(existingToken.userId);
      throw new RefreshTokenReuseDetectedException();
    }

    // 4. If the token is expired, revoke it and reject
    if (existingToken.isExpired) {
      await this.refreshTokenRepository.revoke(existingToken.id);
      throw new RefreshTokenExpiredException();
    }

    // 5. Token is valid — look up user
    const user = await this.userRepository.findById(existingToken.userId);
    if (!user || !user.isActive) {
      await this.refreshTokenRepository.revokeAllForUser(existingToken.userId);
      throw new InvalidCredentialsException();
    }

    // 6. Rotate: atomically revoke old + create new inside a transaction
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newTokens = this.jwtTokenService.signTokenPair(payload);
    const newRefreshTokenEntity = this.createRefreshTokenEntity(
      user.id,
      newTokens.refreshToken,
      ip,
      userAgent,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date() },
      });

      const data = {
        id: newRefreshTokenEntity.id,
        userId: newRefreshTokenEntity.userId,
        tokenHash: newRefreshTokenEntity.tokenHash,
        deviceName: newRefreshTokenEntity.deviceName,
        ipAddress: newRefreshTokenEntity.ipAddress,
        userAgent: newRefreshTokenEntity.userAgent,
        expiresAt: newRefreshTokenEntity.expiresAt,
        revokedAt: newRefreshTokenEntity.revokedAt,
        createdAt: newRefreshTokenEntity.createdAt,
      };
      await tx.refreshToken.create({ data });
    });

    return newTokens;
  }

  async logout(refreshTokenValue: string): Promise<void> {
    const tokenHash = this.tokenHasher.hash(refreshTokenValue);
    const existingToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new RefreshTokenNotFoundException();
    }

    // If already revoked or expired, still return 200 (idempotent)
    if (!existingToken.isActive) {
      return;
    }

    await this.refreshTokenRepository.revoke(existingToken.id);
  }

  private createRefreshTokenEntity(
    userId: string,
    rawToken: string,
    ip: string,
    userAgent: string | null,
  ): RefreshToken {
    const tokenHash = this.tokenHasher.hash(rawToken);
    const expiresInMs = this.parseExpiresIn(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );
    const expiresAt = new Date(Date.now() + expiresInMs);

    const deviceName = userAgent
      ? this.extractDeviceName(userAgent)
      : 'Unknown Device';

    return RefreshToken.create(
      userId,
      tokenHash,
      expiresAt,
      deviceName,
      ip,
      userAgent,
    );
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // default 7 days
    }
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return num * (multipliers[unit] ?? multipliers.d);
  }

  private extractDeviceName(userAgent: string): string {
    try {
      const parser = new UAParser.UAParser(userAgent);
      const result = parser.getResult();
      const browser = result.browser.name ?? '';
      const os = result.os.name ?? '';
      return `${os} ${browser}`.trim() || 'Unknown Device';
    } catch {
      return 'Unknown Device';
    }
  }
}
