import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';
import { setupProcessErrorHandlers } from './config/process-error-handlers';

async function bootstrap() {
  // Catch unexpected errors
  setupProcessErrorHandlers();
  // Catch Promise Rejection
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
