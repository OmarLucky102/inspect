/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('PrismaRefreshTokenRepository', () => {
  let repository: PrismaRefreshTokenRepository;
  let mockPrisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) =>
        cb(mockPrisma),
      ),
    };

    repository = new PrismaRefreshTokenRepository(
      mockPrisma as unknown as PrismaService,
    );
  });

  describe('revoke', () => {
    it('revoke writes the tombstone: sets revokedAt to now and expiresAt to epoch tombstone', async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await repository.revoke('token-123');

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: {
          revokedAt: expect.any(Date),
          expiresAt: new Date(0),
        },
      });
    });
  });

  describe('revokeAllForUser', () => {
    it('revokeAllForUser expires all unexpired tokens and preserves existing revocation timestamps', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await repository.revokeAllForUser('user-123');

      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // 1. Sets revokedAt and expiresAt for active tokens
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
          expiresAt: new Date(0),
        },
      });

      // 2. Sets expiresAt for already revoked tokens without overwriting existing revokedAt
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revokedAt: { not: null },
          expiresAt: { gt: new Date(0) },
        },
        data: {
          expiresAt: new Date(0),
        },
      });
    });
  });
});
