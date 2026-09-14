import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function setupMiddlewares(app: INestApplication): void {
  // Helmet for security headers and basic XSS protection
  app.use(helmet());
  // Logger is handled globally by nestjs-pino (SharedModule → AppLoggerModule)
  // we will add rate limiting, and other middlewares here later
}
