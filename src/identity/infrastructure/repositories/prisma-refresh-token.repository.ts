import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { PrismaService } from '../../../database/prisma.service';
import { RefreshTokenMapper } from '../persistence/refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: RefreshToken): Promise<void> {
    const data = RefreshTokenMapper.toCreateData(token);
    await this.prisma.refreshToken.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row) return null;
    return RefreshTokenMapper.toDomain(row);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          expiresAt: new Date(0),
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: { not: null },
          expiresAt: { gt: new Date(0) },
        },
        data: {
          expiresAt: new Date(0),
        },
      });
    });
  }

  async revoke(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        expiresAt: new Date(0),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
