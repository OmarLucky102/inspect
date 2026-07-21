import { INestApplication } from '@nestjs/common';
import pinoHttp from 'pino-http';

export function setupMiddlewares(app: INestApplication): void {
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
    // we will add helmet, rate limiting, and other middlewares here later
}
