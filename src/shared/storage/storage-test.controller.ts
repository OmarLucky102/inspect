import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { JwtAuthGuard } from '../../identity/presentation/guards/jwt-auth.guard';
import { S3StorageService } from './s3-storage.service';

/**
 * Temporary test controller to verify that S3StorageService
 * successfully uploads images to SeaweedFS (or S3-compatible storage).
 */
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageTestController {
  constructor(private readonly s3StorageService: S3StorageService) {}

  @Post('test-upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15 MB limit
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadTestImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const extension = this.extractExtension(file);
    const key = `test-uploads/${randomUUID()}.${extension}`;

    const uploadedKey = await this.s3StorageService.upload(
      key,
      file.buffer,
      file.mimetype,
    );

    return {
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        key: uploadedKey,
      },
    };
  }

  private extractExtension(file: Express.Multer.File): string {
    const rawExt = extname(file.originalname).replace(/^\./, '').toLowerCase();
    if (rawExt) {
      return rawExt;
    }
    const subtype = file.mimetype.split('/')[1]?.toLowerCase();
    if (subtype && subtype !== 'jpeg') {
      return subtype === 'svg+xml' ? 'svg' : subtype;
    }
    return 'jpg';
  }
}

