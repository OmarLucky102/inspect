import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { IdentityModule } from '../identity/identity.module';

// Infrastructure — Repositories & Services
import { PrismaMediaRepository } from './infrastructure/repositories/prisma-media.repository';
import { PrismaMediaCategoryRepository } from './infrastructure/repositories/prisma-media-category.repository';
import { FileValidatorService } from './infrastructure/services/file-validator.service';

// Application — Use Cases & Services
import { UploadMediaUseCase } from './application/use-cases/upload-media.use-case';
import { GetMediaUseCase } from './application/use-cases/get-media.use-case';
import { MediaService } from './application/services/media.service';

// Presentation — Controllers
import { MediaController } from './presentation/controllers/media.controller';

@Module({
  imports: [SharedModule, DatabaseModule, IdentityModule],
  controllers: [MediaController],
  providers: [
    // Repository bindings
    {
      provide: 'IMediaRepository',
      useClass: PrismaMediaRepository,
    },
    {
      provide: 'IMediaCategoryRepository',
      useClass: PrismaMediaCategoryRepository,
    },
    // Service bindings
    {
      provide: 'IFileValidatorService',
      useClass: FileValidatorService,
    },
    // Use cases
    UploadMediaUseCase,
    GetMediaUseCase,
    // Facade service
    MediaService,
  ],
  exports: [
    'IMediaRepository',
    'IMediaCategoryRepository',
    'IFileValidatorService',
    UploadMediaUseCase,
    GetMediaUseCase,
    MediaService,
  ],
})
export class MediaModule {}
