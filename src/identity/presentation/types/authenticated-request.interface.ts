import type { Request } from 'express';
import type { JwtPayload } from '../../infrastructure/services/jwt-token.service';

/**
 * Express `Request` narrowed with the payload that `JwtAuthGuard` attaches.
 *
 * Declaring it once keeps the guards and the `@CurrentUser()` decorator free of
 * `any`, so `no-unsafe-member-access` / `no-unsafe-return` have a concrete type
 * to work with.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
