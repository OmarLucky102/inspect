import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  UserNotFoundException,
  CannotDeleteSelfException,
} from '../../../shared/exceptions/user.exceptions';

export interface DeleteUserInput {
  targetUserId: string;
  actorUserId: string;
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: DeleteUserInput): Promise<void> {
    if (input.targetUserId === input.actorUserId) {
      throw new CannotDeleteSelfException();
    }

    const user = await this.userRepository.findById(input.targetUserId);
    if (!user) {
      throw new UserNotFoundException(input.targetUserId);
    }

    await this.userRepository.delete(input.targetUserId);
  }
}
