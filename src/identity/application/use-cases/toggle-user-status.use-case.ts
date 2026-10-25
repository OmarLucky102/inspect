import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  UserNotFoundException,
  CannotDeactivateSelfException,
} from '../../../shared/exceptions/user.exceptions';
import { UserResponseDto } from '../dto/user-response.dto';

export interface ToggleUserStatusInput {
  targetUserId: string;
  actorUserId: string;
  action: 'activate' | 'deactivate';
}

@Injectable()
export class ToggleUserStatusUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ToggleUserStatusInput): Promise<UserResponseDto> {
    if (input.action === 'deactivate' && input.targetUserId === input.actorUserId) {
      throw new CannotDeactivateSelfException();
    }

    const user = await this.userRepository.findById(input.targetUserId);
    if (!user) {
      throw new UserNotFoundException(input.targetUserId);
    }

    if (input.action === 'activate') {
      user.activate();
    } else {
      user.deactivate();
    }

    await this.userRepository.update(user);
    return UserResponseDto.fromDomain(user);
  }
}
