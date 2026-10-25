import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto } from '../dto/login.dto';

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

  it('Login sets refresh_token at /', async () => {
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
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token-123',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('Refresh sets the new cookie at / and passes the incoming refresh token to the service', async () => {
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
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('Logout clears the cookie at /, including when the logout service throws', async () => {
    const req = {
      cookies: {
        refresh_token: 'token-to-logout',
      },
      headers: {},
      secure: false,
    } as unknown as Request;

    // Normal logout case: cookie cleared at /
    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(req, mockRes as unknown as Response);

    expect(result).toEqual({
      status: 'success',
      message: 'Logged out successfully',
    });
    expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/' }),
    );

    // Error case: logout service throws, cookie still cleared at / and error preserved
    mockRes.clearCookie.mockClear();
    authService.logout.mockRejectedValue(new Error('Logout service failure'));

    await expect(
      controller.logout(req, mockRes as unknown as Response),
    ).rejects.toThrow('Logout service failure');

    expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/' }),
    );
  });
});
