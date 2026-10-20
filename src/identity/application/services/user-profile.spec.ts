/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserService } from './user.service';
import { UserController } from '../../presentation/controllers/user.controller';
import { UpdateProfileDto } from '../../presentation/dto/update-profile.dto';
import { UserNotFoundException } from '../../../shared/exceptions/user.exceptions';
import {
  ForbiddenException,
  ValidationPipe,
  ArgumentMetadata,
} from '@nestjs/common';

describe('User Profile Domain, Service, Controller & Security Tests', () => {
  const createTestUser = (
    overrides?: Partial<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: Role;
      isActive: boolean;
      isEmailVerified: boolean;
    }>,
  ): User => {
    const now = new Date('2026-01-01T10:00:00.000Z');
    return new User({
      id: overrides?.id ?? 'user-uuid-1',
      email: overrides?.email ?? 'test.user@euroinspect360.com',
      passwordHash: '$2b$10$hashedpasswordstringthatmustnotleak',
      firstName: overrides?.firstName ?? 'Jane',
      lastName: overrides?.lastName ?? 'Doe',
      phone: overrides?.phone ?? '+201012345678',
      role: overrides?.role ?? Role.USER,
      isEmailVerified: overrides?.isEmailVerified ?? true,
      emailVerifiedAt: now,
      isActive: overrides?.isActive ?? true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });
  };

  describe('User Domain Entity updateProfile()', () => {
    it('should successfully update firstName, lastName, and phone and update updatedAt', () => {
      const user = createTestUser();
      const initialUpdatedAt = user.updatedAt;

      user.updateProfile({
        firstName: 'Sarah',
        lastName: 'Connor',
        phone: '+201198765432',
      });

      expect(user.firstName).toBe('Sarah');
      expect(user.lastName).toBe('Connor');
      expect(user.phone).toBe('+201198765432');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        initialUpdatedAt.getTime(),
      );
    });

    it('should trim whitespace from updated fields', () => {
      const user = createTestUser();

      user.updateProfile({
        firstName: '  Alex  ',
        lastName: '  Smith  ',
        phone: '  +201200000000  ',
      });

      expect(user.firstName).toBe('Alex');
      expect(user.lastName).toBe('Smith');
      expect(user.phone).toBe('+201200000000');
    });

    it('should throw an error if firstName is empty after trimming', () => {
      const user = createTestUser();

      expect(() => {
        user.updateProfile({ firstName: '   ' });
      }).toThrow('First name cannot be empty');
    });

    it('should throw an error if lastName is empty after trimming', () => {
      const user = createTestUser();

      expect(() => {
        user.updateProfile({ lastName: '   ' });
      }).toThrow('Last name cannot be empty');
    });

    it('should not alter unchanged properties when updating only phone', () => {
      const user = createTestUser();

      user.updateProfile({ phone: '+201500000000' });

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Doe');
      expect(user.phone).toBe('+201500000000');
      expect(user.email).toBe('test.user@euroinspect360.com');
      expect(user.role).toBe(Role.USER);
    });
  });

  describe('UserService updateProfile()', () => {
    let userService: UserService;
    let mockUserRepo: any;

    beforeEach(() => {
      mockUserRepo = {
        findAll: jest.fn(),
        findById: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      userService = new UserService(mockUserRepo, {} as any);
    });

    it('should update user profile in repository and return updated entity', async () => {
      const existingUser = createTestUser({ id: 'user-1' });
      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue(undefined);

      const result = await userService.updateProfile('user-1', {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        phone: '+201011112222',
      });

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserRepo.update).toHaveBeenCalledWith(existingUser);
      expect(result.firstName).toBe('UpdatedFirst');
      expect(result.lastName).toBe('UpdatedLast');
      expect(result.phone).toBe('+201011112222');
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        userService.updateProfile('non-existent-id', {
          firstName: 'No',
          lastName: 'Body',
        }),
      ).rejects.toThrow(UserNotFoundException);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('UserController (Security, Retrieval & Authorization)', () => {
    let userController: UserController;
    let mockUserService: any;

    beforeEach(() => {
      mockUserService = {
        getUserById: jest.fn(),
        updateProfile: jest.fn(),
        getAllUsers: jest.fn(),
      };

      userController = new UserController(mockUserService);
    });

    it('getMyProfile: should retrieve profile of the authenticated user and NEVER expose passwordHash or user id/UUID', async () => {
      const testUser = createTestUser({ id: 'user-current' });
      mockUserService.getUserById.mockResolvedValue(testUser);

      const response = await userController.getMyProfile({
        sub: 'user-current',
        role: Role.USER,
      });

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-current');
      expect(response.status).toBe('success');
      expect((response.data as any).id).toBeUndefined();
      expect(response.data.email).toBe(testUser.email);
      expect(response.data.firstName).toBe(testUser.firstName);
      expect(response.data.lastName).toBe(testUser.lastName);
      expect(response.data.phone).toBe(testUser.phone);
      expect(response.data.role).toBe(Role.USER);
      expect(response.data.isActive).toBe(true);
      expect(response.data.status).toBe('ACTIVE');
      expect(response.data.isEmailVerified).toBe(true);
      // Security check: passwordHash and id must NOT be in the response
      expect((response.data as any).passwordHash).toBeUndefined();
      expect((response.data as any).refreshTokens).toBeUndefined();
    });

    it('updateMyProfile: should derive user ID strictly from authenticated JWT and never expose user id', async () => {
      const updatedUser = createTestUser({
        id: 'user-current',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        phone: '+201055556666',
      });
      mockUserService.updateProfile.mockResolvedValue(updatedUser);

      const dto: UpdateProfileDto = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        phone: '+201055556666',
      };

      const response = await userController.updateMyProfile(
        { sub: 'user-current', role: Role.USER },
        dto,
      );

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        'user-current',
        dto,
      );
      expect(response.status).toBe('success');
      expect((response.data as any).id).toBeUndefined();
      expect(response.data.firstName).toBe('NewFirst');
      expect(response.data.lastName).toBe('NewLast');
      expect(response.data.phone).toBe('+201055556666');
      expect((response.data as any).passwordHash).toBeUndefined();
    });

    it('getUser(:id): should allow SUPER_ADMIN to retrieve any user profile without exposing user UUID', async () => {
      const targetUser = createTestUser({ id: 'target-user-99' });
      mockUserService.getUserById.mockResolvedValue(targetUser);

      const response = await userController.getUser('target-user-99', {
        sub: 'admin-uuid',
        role: Role.SUPER_ADMIN,
      });

      expect(mockUserService.getUserById).toHaveBeenCalledWith(
        'target-user-99',
      );
      expect(response.status).toBe('success');
      expect((response.data as any).id).toBeUndefined();
      expect(response.data.email).toBe(targetUser.email);
    });

    it('getUsers: should include user id for SuperAdmin system management table', async () => {
      const testUser = createTestUser({ id: 'user-admin-view' });
      mockUserService.getAllUsers.mockResolvedValue([testUser]);

      const response = await userController.getUsers();
      expect(response.status).toBe('success');
      expect(response.data[0].id).toBe('user-admin-view');
    });

    it('getUser(:id): should allow non-admin to retrieve their own user profile', async () => {
      const myUser = createTestUser({ id: 'my-own-uuid' });
      mockUserService.getUserById.mockResolvedValue(myUser);

      const response = await userController.getUser('my-own-uuid', {
        sub: 'my-own-uuid',
        role: Role.REVIEWER,
      });

      expect(mockUserService.getUserById).toHaveBeenCalledWith('my-own-uuid');
      expect(response.status).toBe('success');
      expect((response.data as any).id).toBeUndefined();
      expect(response.data.email).toBe(myUser.email);
    });

    it('getUser(:id): should REJECT cross-user access attempts from non-super-admin with 403 Forbidden', async () => {
      await expect(
        userController.getUser('other-user-uuid', {
          sub: 'attacker-uuid',
          role: Role.USER,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserService.getUserById).not.toHaveBeenCalled();
    });

    it('getUser(:id): should REJECT cross-user access attempts even from Manager or Reviewer roles', async () => {
      await expect(
        userController.getUser('victim-uuid', {
          sub: 'reviewer-uuid',
          role: Role.REVIEWER,
        }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        userController.getUser('victim-uuid', {
          sub: 'manager-uuid',
          role: Role.MANAGER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('UpdateProfileDto Validation & Forbidden Field Enforcement', () => {
    let validator: ValidationPipe;
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateProfileDto,
    };

    beforeEach(() => {
      validator = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
    });

    it('should accept valid profile update input', async () => {
      const validPayload = {
        firstName: 'Kareem',
        lastName: 'Mostafa',
        phone: '+201012345678',
      };

      const result = await validator.transform(validPayload, metadata);
      expect(result).toBeDefined();
      expect(result.firstName).toBe('Kareem');
      expect(result.lastName).toBe('Mostafa');
      expect(result.phone).toBe('+201012345678');
    });

    it('should reject when non-whitelisted / forbidden fields (e.g. role, passwordHash, id) are submitted', async () => {
      const maliciousPayload = {
        firstName: 'Hacker',
        role: 'SUPER_ADMIN', // Forbidden field attempt
        passwordHash: 'injected_hash',
        id: 'different-uuid',
        isActive: true,
        isEmailVerified: true,
      };

      await expect(
        validator.transform(maliciousPayload, metadata),
      ).rejects.toThrow();
    });

    it('should reject empty firstName', async () => {
      const invalidPayload = {
        firstName: '',
      };

      await expect(
        validator.transform(invalidPayload, metadata),
      ).rejects.toThrow();
    });

    it('should reject empty lastName', async () => {
      const invalidPayload = {
        lastName: '',
      };

      await expect(
        validator.transform(invalidPayload, metadata),
      ).rejects.toThrow();
    });

    it('should reject invalid phone format', async () => {
      const invalidPayload = {
        phone: 'not-a-phone-number',
      };

      await expect(
        validator.transform(invalidPayload, metadata),
      ).rejects.toThrow();
    });
  });
});
