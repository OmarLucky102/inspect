import { CreateUserUseCase } from './create-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { ToggleUserStatusUseCase } from './toggle-user-status.use-case';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  CannotDeleteSelfException,
  CannotDeactivateSelfException,
  UserAlreadyActiveException,
  UserAlreadyDeactivatedException,
} from '../../../shared/exceptions/user.exceptions';

describe('User Management Use Cases (Clean Architecture)', () => {
  let mockUserRepo: any;
  let mockHashingService: any;

  beforeEach(() => {
    mockUserRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockHashingService = {
      hash: jest.fn().mockResolvedValue('hashed_secret_password'),
      compare: jest.fn().mockResolvedValue(true),
    };
  });

  const createDummyUser = (overrides: Partial<any> = {}) => {
    return new User({
      id: 'target-uuid-1',
      email: 'target@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Target',
      lastName: 'User',
      phone: '+201012345678',
      role: Role.REVIEWER,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('CreateUserUseCase', () => {
    it('successfully creates a user with hashed password and normalized email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(undefined);

      const useCase = new CreateUserUseCase(mockUserRepo, mockHashingService);
      const result = await useCase.execute({
        email: '  NEW_USER@EXAMPLE.COM ',
        password: 'Password123!',
        firstName: ' John ',
        lastName: ' Doe ',
        phone: ' +201122334455 ',
        role: Role.SUPER_ADMIN,
      });

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new_user@example.com');
      expect(mockHashingService.hash).toHaveBeenCalledWith('Password123!');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.email).toBe('new_user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.role).toBe(Role.SUPER_ADMIN);
      expect(result.isActive).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('throws UserAlreadyExistsException if email already taken', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(createDummyUser());

      const useCase = new CreateUserUseCase(mockUserRepo, mockHashingService);
      await expect(
        useCase.execute({
          email: 'target@example.com',
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'User',
          role: Role.USER,
        }),
      ).rejects.toThrow(UserAlreadyExistsException);

      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteUserUseCase', () => {
    it('successfully deletes a user when target is different from actor', async () => {
      const user = createDummyUser({ id: 'target-uuid-1' });
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.delete.mockResolvedValue(undefined);

      const useCase = new DeleteUserUseCase(mockUserRepo);
      await useCase.execute({
        targetUserId: 'target-uuid-1',
        actorUserId: 'admin-actor-uuid',
      });

      expect(mockUserRepo.findById).toHaveBeenCalledWith('target-uuid-1');
      expect(mockUserRepo.delete).toHaveBeenCalledWith('target-uuid-1');
    });

    it('throws CannotDeleteSelfException when actor tries to delete self', async () => {
      const useCase = new DeleteUserUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          targetUserId: 'same-user-uuid',
          actorUserId: 'same-user-uuid',
        }),
      ).rejects.toThrow(CannotDeleteSelfException);

      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });

    it('throws UserNotFoundException when target does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const useCase = new DeleteUserUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          targetUserId: 'non-existent-uuid',
          actorUserId: 'admin-actor-uuid',
        }),
      ).rejects.toThrow(UserNotFoundException);

      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('ToggleUserStatusUseCase', () => {
    it('deactivates an active user', async () => {
      const user = createDummyUser({ isActive: true });
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(undefined);

      const useCase = new ToggleUserStatusUseCase(mockUserRepo);
      const result = await useCase.execute({
        targetUserId: 'target-uuid-1',
        actorUserId: 'admin-actor-uuid',
        action: 'deactivate',
      });

      expect(result.isActive).toBe(false);
      expect(result.status).toBe('INACTIVE');
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('throws CannotDeactivateSelfException when actor tries to deactivate self', async () => {
      const useCase = new ToggleUserStatusUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          targetUserId: 'admin-actor-uuid',
          actorUserId: 'admin-actor-uuid',
          action: 'deactivate',
        }),
      ).rejects.toThrow(CannotDeactivateSelfException);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('activates an inactive user', async () => {
      const user = createDummyUser({ isActive: false });
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(undefined);

      const useCase = new ToggleUserStatusUseCase(mockUserRepo);
      const result = await useCase.execute({
        targetUserId: 'target-uuid-1',
        actorUserId: 'admin-actor-uuid',
        action: 'activate',
      });

      expect(result.isActive).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('throws UserAlreadyActiveException if activating an already active user', async () => {
      const user = createDummyUser({ isActive: true });
      mockUserRepo.findById.mockResolvedValue(user);

      const useCase = new ToggleUserStatusUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          targetUserId: 'target-uuid-1',
          actorUserId: 'admin-actor-uuid',
          action: 'activate',
        }),
      ).rejects.toThrow(UserAlreadyActiveException);
    });

    it('throws UserAlreadyDeactivatedException if deactivating an already inactive user', async () => {
      const user = createDummyUser({ isActive: false });
      mockUserRepo.findById.mockResolvedValue(user);

      const useCase = new ToggleUserStatusUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          targetUserId: 'target-uuid-1',
          actorUserId: 'admin-actor-uuid',
          action: 'deactivate',
        }),
      ).rejects.toThrow(UserAlreadyDeactivatedException);
    });
  });
});
