import { SharpImageProcessorService } from './sharp-image-processor.service';
import { InvalidImageFormatException } from '../../../shared/exceptions/media.exceptions';
import sharp from 'sharp';

describe('SharpImageProcessorService', () => {
  let service: SharpImageProcessorService;

  beforeEach(() => {
    service = new SharpImageProcessorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isSupportedImage', () => {
    it('should return true for supported raster image MIME types', () => {
      expect(service.isSupportedImage('image/jpeg')).toBe(true);
      expect(service.isSupportedImage('image/jpg')).toBe(true);
      expect(service.isSupportedImage('image/png')).toBe(true);
      expect(service.isSupportedImage('image/webp')).toBe(true);
      expect(service.isSupportedImage('image/heic')).toBe(true);
      expect(service.isSupportedImage('image/heif')).toBe(true);
      expect(service.isSupportedImage('image/tiff')).toBe(true);
    });

    it('should return false for SVG vector images', () => {
      expect(service.isSupportedImage('image/svg+xml')).toBe(false);
      expect(service.isSupportedImage('image/svg')).toBe(false);
    });

    it('should return false for video MIME types and empty strings', () => {
      expect(service.isSupportedImage('video/mp4')).toBe(false);
      expect(service.isSupportedImage('video/quicktime')).toBe(false);
      expect(service.isSupportedImage('application/pdf')).toBe(false);
      expect(service.isSupportedImage('')).toBe(false);
    });
  });

  describe('process', () => {
    it('should throw InvalidImageFormatException for empty buffer', async () => {
      await expect(
        service.process(Buffer.alloc(0), 'image/jpeg'),
      ).rejects.toThrow(InvalidImageFormatException);
    });

    it('should throw InvalidImageFormatException for unsupported MIME type', async () => {
      const buffer = Buffer.from('some-data');
      await expect(service.process(buffer, 'application/pdf')).rejects.toThrow(
        InvalidImageFormatException,
      );
    });

    it('should throw InvalidImageFormatException for corrupted image buffer', async () => {
      const corruptedBuffer = Buffer.from('not-a-real-image-corrupt-data');
      await expect(
        service.process(corruptedBuffer, 'image/jpeg'),
      ).rejects.toThrow(InvalidImageFormatException);
    });

    it('should optimize image, convert to WebP, and return dimensions', async () => {
      // Create a valid 200x100 test image using sharp
      const testBuffer = await sharp({
        create: {
          width: 200,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await service.process(testBuffer, 'image/jpeg');

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
      expect(result.size).toBeGreaterThan(0);
      expect(Buffer.isBuffer(result.buffer)).toBe(true);

      // Verify the generated buffer is valid WebP with Sharp
      const outputMetadata = await sharp(result.buffer).metadata();
      expect(outputMetadata.format).toBe('webp');
      expect(outputMetadata.width).toBe(200);
      expect(outputMetadata.height).toBe(100);
    });

    it('should downscale oversized images within 2048x2048 maintaining aspect ratio', async () => {
      // Create a large 3000x1500 test image
      const largeBuffer = await sharp({
        create: {
          width: 3000,
          height: 1500,
          channels: 3,
          background: { r: 0, g: 128, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await service.process(largeBuffer, 'image/png');

      expect(result.width).toBe(2048);
      expect(result.height).toBe(1024);
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
    });

    it('should preserve dimensions for small images without enlargement', async () => {
      const smallBuffer = await sharp({
        create: {
          width: 64,
          height: 64,
          channels: 3,
          background: { r: 50, g: 50, b: 50 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await service.process(smallBuffer, 'image/jpeg');

      expect(result.width).toBe(64);
      expect(result.height).toBe(64);
    });
  });
});
