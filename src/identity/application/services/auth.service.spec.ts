/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { AuthService } from './auth.service';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import {
  RefreshTokenExpiredException,
  RefreshTokenReuseDetectedException,
} from '../../../shared/exceptions/auth.exceptions';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
  };
  let mockRefreshTokenRepo: {
    findByTokenHash: jest.Mock;
    revoke: jest.Mock;
    revokeAllForUser: jest.Mock;
    create: jest.Mock;
  };
  let mockBcryptHasher: {
    compare: jest.Mock;
  };
  let mockJwtTokenService: {
    signTokenPair: jest.Mock;
  };
  let mockTokenHasher: {
    hash: jest.Mock;
  };
  let mockPrisma: {
    $transaction: jest.Mock;
  };

  const createTestUser = () =>
    new User({
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hash',
      firstName: 'John',
      lastName: 'Doe',
      phone: '12345678',
      role: Role.USER,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    mockRefreshTokenRepo = {
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      create: jest.fn(),
    };
    mockBcryptHasher = {
      compare: jest.fn(),
    };
    mockJwtTokenService = {
      signTokenPair: jest.fn().mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
    };
    mockTokenHasher = {
      hash: jest.fn((token: string) => `hashed_${token}`),
    };
    mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) =>
        cb({
          refreshToken: {
            update: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({}),
          },
        }),
      ),
    };

    authService = new AuthService(
      mockUserRepo as any,
      mockRefreshTokenRepo as any,
      mockBcryptHasher as any,
      mockJwtTokenService as any,
      mockTokenHasher,
      mockPrisma as any,
    );
  });

  describe('refreshTokens', () => {
    it('expiration-before-reuse: expired token throws RefreshTokenExpiredException and never triggers revoke-all', async () => {
      // Token is both expired and revoked (e.g. via epoch tombstone or past expiry)
      const expiredToken = new RefreshToken({
        id: 'token-expired',
        userId: 'user-123',
        tokenHash: 'hashed_raw-token',
        deviceName: 'Device',
        ipAddress: '127.0.0.1',
        userAgent: null,
        expiresAt: new Date(Date.now() - 10000),
        revokedAt: new Date(Date.now() - 50000),
        createdAt: new Date(Date.now() - 60000),
      });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(expiredToken);

      await expect(
        authService.refreshTokens('raw-token', '127.0.0.1', null),
      ).rejects.toThrow(RefreshTokenExpiredException);

      expect(mockRefreshTokenRepo.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('reuse outside grace: revoked token outside grace period triggers revoke-all and throws RefreshTokenReuseDetectedException', async () => {
      // Token is revoked 60 seconds ago (grace period is 20s), but expiresAt is in the future
      const revokedToken = new RefreshToken({
        id: 'token-reused',
        userId: 'user-123',
        tokenHash: 'hashed_raw-token',
        deviceName: 'Device',
        ipAddress: '127.0.0.1',
        userAgent: null,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 60000),
        createdAt: new Date(Date.now() - 120000),
      });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(revokedToken);

      await expect(
        authService.refreshTokens('raw-token', '127.0.0.1', null),
      ).rejects.toThrow(RefreshTokenReuseDetectedException);

      expect(mockRefreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(
        'user-123',
      );
    });

    it('grace rotation still succeeds: revoked token within grace period rotates successfully', async () => {
      // Token was revoked 2 seconds ago (within 20s grace period), not expired
      const inGraceToken = new RefreshToken({
        id: 'token-in-grace',
        userId: 'user-123',
        tokenHash: 'hashed_raw-token',
        deviceName: 'Device',
        ipAddress: '127.0.0.1',
        userAgent: null,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 2000),
        createdAt: new Date(Date.now() - 10000),
      });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(inGraceToken);
      mockUserRepo.findById.mockResolvedValue(createTestUser());

      const result = await authService.refreshTokens(
        'raw-token',
        '127.0.0.1',
        null,
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockRefreshTokenRepo.revokeAllForUser).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('logout revokes an inactive token: always calls revoke even if token is already inactive', async () => {
      // Inactive token (already revoked from previous rotation)
      const inactiveToken = new RefreshToken({
        id: 'token-inactive',
        userId: 'user-123',
        tokenHash: 'hashed_raw-token',
        deviceName: 'Device',
        ipAddress: '127.0.0.1',
        userAgent: null,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 5000),
        createdAt: new Date(Date.now() - 10000),
      });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue(inactiveToken);

      await authService.logout('raw-token');

      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith(
        'token-inactive',
      );
    });
  });
});
