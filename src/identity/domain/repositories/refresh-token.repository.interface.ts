import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  create(token: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: string): Promise<void>;
  revoke(tokenId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
