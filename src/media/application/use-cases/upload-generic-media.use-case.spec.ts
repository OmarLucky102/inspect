import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { UploadGenericMediaUseCase } from './upload-generic-media.use-case';
import { MediaCategory } from '../../domain/entities/media-category.entity';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { StorageOperationException } from '../../../shared/exceptions/storage.exceptions';
import {
  InvalidImageFormatException,
  UnsupportedMediaTypeException,
} from '../../../shared/exceptions/media.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';

describe('UploadGenericMediaUseCase', () => {
  let useCase: UploadGenericMediaUseCase;
  let mediaRepository: any;
  let categoryRepository: any;
  let fileValidator: any;
  let imageProcessor: any;
  let s3StorageService: any;

  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCategoryId = 'c1111111-1111-4111-8111-111111111111';

  const mockActor = {
    id: mockUserId,
    role: Role.USER,
  };

  const mockImageFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-raw-jpeg-bytes'),
    size: 5000,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockVideoFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'clip.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    buffer: Buffer.from('fake-video-bytes'),
    size: 20000,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    categoryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      getOrCreateDefault: jest.fn().mockResolvedValue(
        new MediaCategory({
          id: mockCategoryId,
          name: 'GENERAL',
          description: null,
        }),
      ),
    };

    fileValidator = {
      validate: jest.fn(),
      validateImage: jest.fn(),
      extractExtension: jest.fn((f: Express.Multer.File) =>
        f.mimetype === 'video/mp4' ? 'mp4' : 'jpg',
      ),
    };

    imageProcessor = {
      isSupportedImage: jest.fn(
        (mime: string) => mime?.startsWith('image/') ?? false,
      ),
      process: jest.fn().mockResolvedValue({
        buffer: Buffer.from('optimized-webp-bytes'),
        mimeType: 'image/webp',
        extension: 'webp',
        size: 1200,
        width: 800,
        height: 800,
      }),
    };

    s3StorageService = {
      upload: jest.fn().mockResolvedValue('key'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadGenericMediaUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: 'IMediaCategoryRepository', useValue: categoryRepository },
        { provide: 'IFileValidatorService', useValue: fileValidator },
        { provide: 'IImageProcessorService', useValue: imageProcessor },
        { provide: S3StorageService, useValue: s3StorageService },
      ],
    }).compile();

    useCase = module.get<UploadGenericMediaUseCase>(UploadGenericMediaUseCase);
  });

  describe('Happy Path - Generic Image Upload', () => {
    it('should successfully process image with Sharp, upload WebP to S3, and mark as UPLOADED', async () => {
      const result = await useCase.execute(mockImageFile, {}, mockActor);

      expect(fileValidator.validateImage).toHaveBeenCalledWith(mockImageFile);
      expect(imageProcessor.process).toHaveBeenCalledWith(
        mockImageFile.buffer,
        mockImageFile.mimetype,
      );

      // Verify S3 upload
      expect(s3StorageService.upload).toHaveBeenCalledTimes(1);
      const [uploadedKey, uploadedBuffer, uploadedMime] =
        s3StorageService.upload.mock.calls[0];
      expect(uploadedKey).toMatch(
        new RegExp(`^general/${mockUserId}/[0-9a-f-]+\\.webp$`),
      );
      expect(uploadedBuffer).toEqual(Buffer.from('optimized-webp-bytes'));
      expect(uploadedMime).toBe('image/webp');

      // Verify Media entity was initially saved with PENDING
      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const savedMedia = mediaRepository.save.mock.calls[0][0];
      expect(savedMedia.width).toBe(800);
      expect(savedMedia.height).toBe(800);
      expect(savedMedia.fileSize).toBe(1200);
      expect(savedMedia.mimeType).toBe('image/webp');
      expect(savedMedia.captureSessionId).toBeNull();
      expect(savedMedia.fileName).toBe('avatar.webp');

      // Verify Media entity was updated to UPLOADED
      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      const updatedMedia = mediaRepository.update.mock.calls[0][0];
      expect(updatedMedia.status).toBe(MediaStatus.UPLOADED);

      // Verify returned DTO
      expect(result.status).toBe(MediaStatus.UPLOADED);
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
      expect(result.fileUrl).toBe(uploadedKey);
    });

    it('should resolve custom category when category is provided', async () => {
      const customCatId = 'custom-cat-uuid';
      categoryRepository.findById.mockResolvedValue(
        new MediaCategory({
          id: customCatId,
          name: 'PROFILE_PHOTO',
          description: null,
        }),
      );

      const result = await useCase.execute(
        mockImageFile,
        { category: customCatId },
        mockActor,
      );

      expect(categoryRepository.findById).toHaveBeenCalledWith(customCatId);
      expect(result.categoryId).toBe(customCatId);
    });
  });

  describe('Media Type Enforcement', () => {
    it('should reject video uploads with UnsupportedMediaTypeException', async () => {
      fileValidator.validateImage.mockImplementation(() => {
        throw new UnsupportedMediaTypeException(
          'Only image files are allowed on this endpoint',
        );
      });

      await expect(
        useCase.execute(mockVideoFile, {}, mockActor),
      ).rejects.toThrow(UnsupportedMediaTypeException);

      expect(imageProcessor.process).not.toHaveBeenCalled();
      expect(s3StorageService.upload).not.toHaveBeenCalled();
      expect(mediaRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when file is missing', async () => {
      fileValidator.validateImage.mockImplementation(() => {
        throw new BadRequestException('File is required');
      });

      await expect(useCase.execute(undefined, {}, mockActor)).rejects.toThrow(
        BadRequestException,
      );

      expect(imageProcessor.process).not.toHaveBeenCalled();
      expect(s3StorageService.upload).not.toHaveBeenCalled();
      expect(mediaRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling & Compensation', () => {
    it('should save FAILED record and throw InvalidImageFormatException when Sharp fails', async () => {
      imageProcessor.process.mockRejectedValue(
        new Error('Input buffer contains unsupported image format'),
      );

      await expect(
        useCase.execute(mockImageFile, {}, mockActor),
      ).rejects.toThrow(InvalidImageFormatException);

      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const failedEntity = mediaRepository.save.mock.calls[0][0];
      expect(failedEntity.status).toBe(MediaStatus.FAILED);
      expect(failedEntity.failureReason).toBe(
        'Invalid or corrupted image format',
      );
      expect(s3StorageService.upload).not.toHaveBeenCalled();
    });

    it('should mark media as FAILED and throw StorageOperationException when S3 upload fails', async () => {
      s3StorageService.upload.mockRejectedValue(
        new Error('Connection reset by peer'),
      );

      await expect(
        useCase.execute(mockImageFile, {}, mockActor),
      ).rejects.toThrow(StorageOperationException);

      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      const updatedMedia = mediaRepository.update.mock.calls[0][0];
      expect(updatedMedia.status).toBe(MediaStatus.FAILED);
      expect(updatedMedia.failureReason).toBe('Connection reset by peer');
    });

    it('should trigger compensating S3 deletion if DB update to UPLOADED fails', async () => {
      mediaRepository.update.mockRejectedValue(
        new Error('Database unique constraint or deadlock'),
      );

      await expect(
        useCase.execute(mockImageFile, {}, mockActor),
      ).rejects.toThrow('Database unique constraint or deadlock');

      expect(s3StorageService.upload).toHaveBeenCalledTimes(1);
      const uploadedKey = s3StorageService.upload.mock.calls[0][0];
      expect(s3StorageService.delete).toHaveBeenCalledWith(uploadedKey);
    });
  });
});
