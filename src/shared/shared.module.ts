import { Module } from '@nestjs/common';
import { AppLoggerModule } from './logger/logger.module';

@Module({
  imports: [AppLoggerModule],
  exports: [AppLoggerModule],
})
export class SharedModule {}
