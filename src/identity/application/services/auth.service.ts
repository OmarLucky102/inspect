import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { BcryptHasherService } from '../../infrastructure/services/bcrypt-hasher.service';
import {
  JwtTokenService,
  TokenPair,
} from '../../infrastructure/services/jwt-token.service';
import { InvalidCredentialsException } from '../../../shared/exceptions/user.exceptions';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly bcryptHasher: BcryptHasherService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair> {
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

    // 4. Sign and return access + refresh token pair
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtTokenService.signTokenPair(payload);
  }
}
