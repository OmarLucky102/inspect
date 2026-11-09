import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { IdentityModule } from '../identity/identity.module';

// Infrastructure — Repositories & Services
import { PrismaMediaRepository } from './infrastructure/repositories/prisma-media.repository';
import { PrismaMediaCategoryRepository } from './infrastructure/repositories/prisma-media-category.repository';
import { FileValidatorService } from './infrastructure/services/file-validator.service';
import { SharpImageProcessorService } from './infrastructure/services/sharp-image-processor.service';

// Presentation — Middlewares
import { UploadSizeLimitMiddleware } from './presentation/middlewares/upload-size-limit.middleware';

// Application — Use Cases & Services
import { UploadMediaUseCase } from './application/use-cases/upload-media.use-case';
import { UploadGenericMediaUseCase } from './application/use-cases/upload-generic-media.use-case';
import { BatchUploadMediaUseCase } from './application/use-cases/batch-upload-media.use-case';
import { UploadVideoUseCase } from './application/use-cases/upload-video.use-case';
import { GetMediaUseCase } from './application/use-cases/get-media.use-case';
import { MediaService } from './application/services/media.service';
import { InspectionMediaContextValidator } from './application/services/inspection-media-context-validator.service';

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
    {
      provide: 'IImageProcessorService',
      useClass: SharpImageProcessorService,
    },
    // Context validator helper
    InspectionMediaContextValidator,
    // Use cases
    UploadMediaUseCase,
    UploadGenericMediaUseCase,
    BatchUploadMediaUseCase,
    UploadVideoUseCase,
    GetMediaUseCase,
    // Facade service
    MediaService,
  ],
  exports: [
    'IMediaRepository',
    'IMediaCategoryRepository',
    'IFileValidatorService',
    'IImageProcessorService',
    InspectionMediaContextValidator,
    UploadMediaUseCase,
    UploadGenericMediaUseCase,
    BatchUploadMediaUseCase,
    UploadVideoUseCase,
    GetMediaUseCase,
    MediaService,
  ],
})
export class MediaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UploadSizeLimitMiddleware).forRoutes(MediaController);
  }
}
