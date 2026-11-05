import { Module } from '@nestjs/common';
import { AppLoggerModule } from './logger/logger.module';
import { S3StorageService } from './storage/s3-storage.service';

@Module({
  imports: [AppLoggerModule],
  controllers: [],
  providers: [S3StorageService],
  exports: [AppLoggerModule, S3StorageService],
})
export class SharedModule {}
