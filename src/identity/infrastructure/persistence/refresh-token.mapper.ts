import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshToken as PrismaRefreshToken } from '@prisma/client';

export class RefreshTokenMapper {
  static toDomain(row: PrismaRefreshToken): RefreshToken {
    return new RefreshToken({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      deviceName: row.deviceName,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }

  static toCreateData(token: RefreshToken) {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      deviceName: token.deviceName,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
    };
  }
}
