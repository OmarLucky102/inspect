import { HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../dto/login.dto';
import {
  RefreshTokenNotFoundException,
  RefreshTokenExpiredException,
} from '../../../shared/exceptions/auth.exceptions';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
  };
  let mockRes: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('login', () => {
    it('sets refresh_token at /', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      });

      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const req = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        secure: false,
      } as unknown as Request;

      const result = await controller.login(
        loginDto,
        req,
        mockRes as unknown as Response,
      );

      expect(result).toEqual({
        status: 'success',
        data: { accessToken: 'access-token-123' },
      });
      expect(mockRes.clearCookie).not.toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token-123',
        expect.objectContaining({ path: '/' }),
      );
    });
  });

  describe('refresh', () => {
    it('on success: sets new cookie at /', async () => {
      authService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const req = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        secure: false,
        cookies: {
          refresh_token: 'existing-refresh-token',
        },
      } as unknown as Request;

      const result = await controller.refresh(
        req,
        mockRes as unknown as Response,
      );

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'existing-refresh-token',
        '127.0.0.1',
        null,
      );
      expect(result).toEqual({
        status: 'success',
        data: { accessToken: 'new-access-token' },
      });
      expect(mockRes.clearCookie).not.toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('on 401 error: clears cookie at / and rethrows', async () => {
      const req = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        secure: false,
        cookies: {
          refresh_token: 'expired-token',
        },
      } as unknown as Request;

      authService.refreshTokens.mockRejectedValue(
        new RefreshTokenExpiredException(),
      );

      await expect(
        controller.refresh(req, mockRes as unknown as Response),
      ).rejects.toThrow(RefreshTokenExpiredException);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('on 500 error: does NOT clear cookies and rethrows', async () => {
      const req = {
        ip: '127.0.0.1',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        secure: false,
        cookies: {
          refresh_token: 'valid-token',
        },
      } as unknown as Request;

      authService.refreshTokens.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.refresh(req, mockRes as unknown as Response),
      ).rejects.toThrow('Database connection failed');

      expect(mockRes.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('on success: clears cookie at /', async () => {
      const req = {
        cookies: {
          refresh_token: 'token-to-logout',
        },
        headers: {},
        secure: false,
      } as unknown as Request;

      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(
        req,
        mockRes as unknown as Response,
      );

      expect(result).toEqual({
        status: 'success',
        message: 'Logged out successfully',
      });
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('on 401 (RefreshTokenNotFoundException): clears cookie at / and rethrows', async () => {
      const req = {
        cookies: {
          refresh_token: 'revoked-token',
        },
        headers: {},
        secure: false,
      } as unknown as Request;

      authService.logout.mockRejectedValue(new RefreshTokenNotFoundException());

      await expect(
        controller.logout(req, mockRes as unknown as Response),
      ).rejects.toThrow(RefreshTokenNotFoundException);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('on 500 error: does NOT clear cookies and rethrows', async () => {
      const req = {
        cookies: {
          refresh_token: 'some-token',
        },
        headers: {},
        secure: false,
      } as unknown as Request;

      authService.logout.mockRejectedValue(
        new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      await expect(
        controller.logout(req, mockRes as unknown as Response),
      ).rejects.toThrow('Internal server error');

      expect(mockRes.clearCookie).not.toHaveBeenCalled();
    });
  });
});
