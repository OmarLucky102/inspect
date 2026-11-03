import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StorageTestController } from './storage-test.controller';
import { S3StorageService } from './s3-storage.service';
import { JwtAuthGuard } from '../../identity/presentation/guards/jwt-auth.guard';

describe('StorageTestController', () => {
  let controller: StorageTestController;
  let s3StorageService: jest.Mocked<S3StorageService>;

  beforeEach(async () => {
    const mockS3StorageService = {
      upload: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageTestController],
      providers: [
        {
          provide: S3StorageService,
          useValue: mockS3StorageService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<StorageTestController>(StorageTestController);
    s3StorageService = module.get(S3StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadTestImage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'car-front.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image-bytes'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('should successfully upload an image and return object key', async () => {
      s3StorageService.upload.mockImplementation(async (key) => key);

      const response = await controller.uploadTestImage(mockFile);

      expect(response.status).toBe('success');
      expect(response.message).toBe('Image uploaded successfully');
      expect(response.data).toEqual({
        key: expect.stringMatching(/^test-uploads\/[a-f0-9-]+\.png$/),
      });

      expect(s3StorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^test-uploads\/[a-f0-9-]+\.png$/),
        mockFile.buffer,
        mockFile.mimetype,
      );
    });

    it('should infer extension from MIME subtype when original filename has no extension', async () => {
      const fileWithoutExt: Express.Multer.File = {
        ...mockFile,
        originalname: 'blob',
        mimetype: 'image/jpeg',
      };

      s3StorageService.upload.mockImplementation(async (key) => key);

      const response = await controller.uploadTestImage(fileWithoutExt);

      expect(response.data).toEqual({
        key: expect.stringMatching(/^test-uploads\/[a-f0-9-]+\.jpg$/),
      });
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      await expect(controller.uploadTestImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadTestImage(undefined)).rejects.toThrow(
        'Image file is required',
      );
    });

    it('should throw BadRequestException when uploaded file is not an image', async () => {
      const nonImageFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
      };

      await expect(controller.uploadTestImage(nonImageFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadTestImage(nonImageFile)).rejects.toThrow(
        'Only image files are allowed',
      );
    });
  });
});
