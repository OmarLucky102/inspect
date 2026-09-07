import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { BcryptHasherService } from '../../infrastructure/services/bcrypt-hasher.service';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
} from '../../../shared/exceptions/user.exceptions';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
}

@Injectable()
export class UserService {
  constructor(
    // We use the string token because interfaces can't be injected directly in NestJS
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly bcryptHasher: BcryptHasherService,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsException(input.email);
    }

    const passwordHash = await this.bcryptHasher.hash(input.password);
    const now = new Date();

    const user = new User({
      id: randomUUID(),
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      isEmailVerified: false,
      emailVerifiedAt: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.userRepository.save(user);
    return user;
  }
}
