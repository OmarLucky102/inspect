import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function setupMiddlewares(app: INestApplication): void {
    // Helmet for security headers and basic XSS protection
    app.use(helmet());

    // CORS for the browser frontend (React app served from a different origin)
    app.enableCors({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: false,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // Logger is handled globally by nestjs-pino (SharedModule → AppLoggerModule)
    // we will add rate limiting, and other middlewares here later
}
