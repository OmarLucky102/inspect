import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { IFileValidatorService } from '../../domain/services/file-validator.service.interface';
import {
  FileTooLargeException,
  UnsupportedMediaTypeException,
  FileCountLimitExceededException,
} from '../../../shared/exceptions/media.exceptions';

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
export const MAX_IMAGES_COUNT = 40;
export const MAX_BATCH_IMAGES_COUNT = 36;
export const MAX_VIDEOS_COUNT = 2;
export const MAX_AGGREGATE_REQUEST_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB

@Injectable()
export class FileValidatorService implements IFileValidatorService {
  validate(file?: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new UnsupportedMediaTypeException(
        'Only image and video files are allowed',
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new FileTooLargeException(
        `Image file size exceeds the limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      throw new FileTooLargeException(
        `Video file size exceeds the limit of ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }
  }

  validateImage(file?: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const isImage = mime.startsWith('image/');

    if (!isImage) {
      throw new UnsupportedMediaTypeException(
        'Only image files are allowed on this endpoint',
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new FileTooLargeException(
        `Image file size exceeds the limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }
  }

  validateVideo(file?: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const isVideo = mime.startsWith('video/');

    if (!isVideo) {
      throw new UnsupportedMediaTypeException(
        'Only video files are allowed on this endpoint',
      );
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      throw new FileTooLargeException(
        `Video file size exceeds the limit of ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }
  }

  validateFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    let imageCount = 0;
    let videoCount = 0;

    for (const file of files) {
      this.validate(file);
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.startsWith('image/')) {
        imageCount++;
      } else if (mime.startsWith('video/')) {
        videoCount++;
      }
    }

    if (imageCount > MAX_IMAGES_COUNT) {
      throw new FileCountLimitExceededException(
        `Image count (${imageCount}) exceeds the maximum allowed limit of ${MAX_IMAGES_COUNT}`,
      );
    }

    if (videoCount > MAX_VIDEOS_COUNT) {
      throw new FileCountLimitExceededException(
        `Video count (${videoCount}) exceeds the maximum allowed limit of ${MAX_VIDEOS_COUNT}`,
      );
    }
  }

  extractExtension(file: Express.Multer.File): string {
    const rawExt = extname(file.originalname || '')
      .replace(/^\./, '')
      .toLowerCase();
    if (rawExt && /^[a-z0-9]+$/.test(rawExt)) {
      return rawExt === 'jpeg' ? 'jpg' : rawExt;
    }

    const subtype = (file.mimetype || '').split('/')[1]?.toLowerCase();
    if (subtype) {
      if (subtype === 'jpeg') return 'jpg';
      if (subtype === 'quicktime') return 'mov';
      if (subtype === 'x-matroska') return 'mkv';
      if (subtype === 'svg+xml') return 'svg';
      return subtype.replace(/[^a-z0-9]/g, '');
    }

    if (file.mimetype?.startsWith('video/')) {
      return 'mp4';
    }

    return 'jpg';
  }
}
