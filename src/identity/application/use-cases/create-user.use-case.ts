import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IHashingService } from '../../domain/services/hashing.service.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserAlreadyExistsException } from '../../../shared/exceptions/user.exceptions';
import { UserResponseDto } from '../dto/user-response.dto';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashingService')
    private readonly hashingService: IHashingService,
  ) {}

  async execute(input: CreateUserInput): Promise<UserResponseDto> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new UserAlreadyExistsException(normalizedEmail);
    }

    const passwordHash = await this.hashingService.hash(input.password);
    const now = new Date();

    const user = new User({
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: (input.phone || '').trim(),
      role: input.role,
      isEmailVerified: true,
      emailVerifiedAt: now,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.userRepository.save(user);
    return UserResponseDto.fromDomain(user);
  }
}
