import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserNotFoundException } from '../../../shared/exceptions/user.exceptions';

@Injectable()
export class UserService {
  constructor(
    // We use the string token because interfaces can't be injected directly in NestJS
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

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
}
