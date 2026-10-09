import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

export function setupMiddlewares(app: INestApplication): void {
  // Helmet for security headers and basic XSS protection
  app.use(helmet());
  // Parse incoming Cookie headers into req.cookies
  app.use(cookieParser());

  // CORS — required for browser frontends on a different origin (e.g. Vite on :5173).
  // Refresh-token flow uses httpOnly cookies, so credentials must be enabled
  // (which forbids wildcard '*': use an explicit allowlist instead).
  // Override/extend via CORS_ORIGIN env (comma-separated).
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  // Logger is handled globally by nestjs-pino (SharedModule → AppLoggerModule)
  // we will add rate limiting, and other middlewares here later
}
