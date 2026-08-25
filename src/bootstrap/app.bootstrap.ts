import { INestApplication } from '@nestjs/common';
import pinoHttp from 'pino-http';
import helmet from 'helmet';

export function setupMiddlewares(app: INestApplication): void {
    // 1. Helmet for security headers and basic XSS protection
    app.use(helmet());

    // 2. Logger middleware (pino)
    if (process.env.NODE_ENV === 'development') {
        app.use(
            pinoHttp({
                transport: {
                    target: 'pino-pretty',
                    options: { colorize: true },
                },
            }),
        );
    }
    // we will add rate limiting, and other middlewares here later
}
