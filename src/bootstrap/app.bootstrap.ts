import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

export function setupMiddlewares(app: INestApplication): void {
  // Helmet for security headers and basic XSS protection
  app.use(helmet());
  // Parse incoming Cookie headers into req.cookies
  app.use(cookieParser());
  // Logger is handled globally by nestjs-pino (SharedModule → AppLoggerModule)
  // we will add rate limiting, and other middlewares here later
}
