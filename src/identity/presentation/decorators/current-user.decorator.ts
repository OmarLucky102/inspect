import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../infrastructure/services/jwt-token.service';

/**
 * Extracts the authenticated user's JWT payload from the request.
 *
 * @example
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * getMe(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
