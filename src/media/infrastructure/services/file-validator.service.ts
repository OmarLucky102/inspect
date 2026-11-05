import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { IFileValidatorService } from '../../domain/services/file-validator.service.interface';

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

@Injectable()
export class FileValidatorService implements IFileValidatorService {
  validate(file?: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const mime = file.mimetype.toLowerCase();
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new BadRequestException('Only image and video files are allowed');
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `Image file size exceeds the limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      throw new BadRequestException(
        `Video file size exceeds the limit of ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }
  }

  extractExtension(file: Express.Multer.File): string {
    const rawExt = extname(file.originalname).replace(/^\./, '').toLowerCase();
    if (rawExt && /^[a-z0-9]+$/.test(rawExt)) {
      return rawExt === 'jpeg' ? 'jpg' : rawExt;
    }

    const subtype = file.mimetype.split('/')[1]?.toLowerCase();
    if (subtype) {
      if (subtype === 'jpeg') return 'jpg';
      if (subtype === 'quicktime') return 'mov';
      if (subtype === 'x-matroska') return 'mkv';
      if (subtype === 'svg+xml') return 'svg';
      return subtype.replace(/[^a-z0-9]/g, '');
    }

    return 'jpg';
  }
}
