import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';
import { setupProcessErrorHandlers } from './process/process-error-handlers';
import { setupMiddlewares } from './bootstrap/app.bootstrap';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Catch unexpected errors
  setupProcessErrorHandlers();

  // 1. Create the app
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 2. Set Global Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupMiddlewares(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT') ?? 3000;

  // 3. App Listen!
  await app.listen(port);

  // 4. Log the message
  console.log(
    '\n\x1b[1m\x1b[36m====================================================\x1b[0m',
  );
  console.log(
    `\x1b[1m\x1b[36m    APPLICATION IS RUNNING ON PORT: ${port}         \x1b[0m`,
  );
  console.log(
    '\x1b[1m\x1b[36m====================================================\x1b[0m\n',
  );
}
// `void` marks the floating promise as intentionally not awaited: a rejection
// here is already surfaced by setupProcessErrorHandlers() and must not become an
// unhandled rejection.
void bootstrap();
