import { Module } from '@nestjs/common';
import { AppLoggerModule } from './logger/logger.module';
import { S3StorageService } from './storage/s3-storage.service';
import { StorageTestController } from './storage/storage-test.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [AppLoggerModule, IdentityModule],
  controllers: [StorageTestController],
  providers: [S3StorageService],
  exports: [AppLoggerModule, S3StorageService],
})
export class SharedModule {}

