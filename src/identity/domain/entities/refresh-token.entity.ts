import { randomUUID } from 'crypto';

export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken {
  private props: RefreshTokenProps;

  constructor(props: RefreshTokenProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get deviceName(): string {
    return this.props.deviceName;
  }
  get ipAddress(): string {
    return this.props.ipAddress;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  get isActive(): boolean {
    return !this.isExpired && !this.isRevoked;
  }

  public revoke(): void {
    this.props.revokedAt = new Date();
  }

  public static create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    deviceName: string,
    ipAddress: string,
    userAgent: string | null,
  ): RefreshToken {
    const now = new Date();
    return new RefreshToken({
      id: randomUUID(),
      userId,
      tokenHash,
      deviceName,
      ipAddress,
      userAgent,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });
  }
}
