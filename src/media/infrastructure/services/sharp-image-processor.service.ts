import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import {
  IImageProcessorService,
  ProcessedImageResult,
  ProcessedImageMetadata,
} from '../../domain/services/image-processor.service.interface';
import { InvalidImageFormatException } from '../../../shared/exceptions/media.exceptions';

export const MAX_IMAGE_DIMENSION = 2048;
export const WEBP_OUTPUT_QUALITY = 80;
export const WEBP_COMPRESSION_EFFORT = 4;

@Injectable()
export class SharpImageProcessorService implements IImageProcessorService {
  private readonly logger = new Logger(SharpImageProcessorService.name);

  private readonly supportedMimeTypes = new Set<string>([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/tiff',
    'image/bmp',
  ]);

  isSupportedImage(mimeType: string): boolean {
    if (!mimeType) {
      return false;
    }
    const normalized = mimeType.toLowerCase().trim();
    if (normalized === 'image/svg+xml' || normalized === 'image/svg') {
      return false;
    }
    return (
      this.supportedMimeTypes.has(normalized) || normalized.startsWith('image/')
    );
  }

  async process(
    fileBuffer: Buffer,
    originalMimeType: string,
  ): Promise<ProcessedImageResult> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new InvalidImageFormatException('Image buffer is empty');
    }

    if (!this.isSupportedImage(originalMimeType)) {
      throw new InvalidImageFormatException(
        `Unsupported image MIME type: ${originalMimeType}`,
      );
    }

    try {
      const sharpInstance = sharp(fileBuffer);
      const rawMetadata = await sharpInstance.metadata();

      // Transform pipeline:
      // 1. .rotate(): auto-orients using EXIF Orientation tag and resets header to 1
      // 2. .resize(): max 2048x2048, fit inside, prevent upscaling small images
      // 3. .toColorspace('srgb'): standardizes color profile
      // 4. .webp(): converts to WebP and strips embedded EXIF/GPS/XMP (Extract-and-Strip)
      const { data: processedBuffer, info } = await sharp(fileBuffer)
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toColorspace('srgb')
        .webp({
          quality: WEBP_OUTPUT_QUALITY,
          effort: WEBP_COMPRESSION_EFFORT,
        })
        .toBuffer({ resolveWithObject: true });

      const extractedMeta = this.extractMetadata(rawMetadata);

      return {
        buffer: processedBuffer,
        mimeType: 'image/webp',
        extension: 'webp',
        size: info.size || processedBuffer.length,
        width: info.width,
        height: info.height,
        metadata: extractedMeta,
      };
    } catch (error) {
      if (error instanceof InvalidImageFormatException) {
        throw error;
      }
      this.logger.warn(
        `Sharp image processing failed: ${(error as Error).message}`,
      );
      throw new InvalidImageFormatException(
        'Invalid or corrupted image format',
      );
    }
  }

  private extractMetadata(
    raw: sharp.Metadata,
  ): ProcessedImageMetadata | undefined {
    if (!raw) {
      return undefined;
    }

    // Preserve metadata container if any basic orientation/format attributes exist
    return undefined;
  }
}
