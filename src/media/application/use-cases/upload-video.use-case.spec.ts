import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaStatus } from '@prisma/client';
import { UploadVideoUseCase } from './upload-video.use-case';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';
import { UnsupportedMediaTypeException } from '../../../shared/exceptions/media.exceptions';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidInspectionRequestStateException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionMediaContextValidator } from '../services/inspection-media-context-validator.service';
import { VideoProcessingQueueService } from '../../infrastructure/services/video-processing-queue.service';
import { Media } from '../../domain/entities/media.entity';

describe('UploadVideoUseCase', () => {
  let useCase: UploadVideoUseCase;
  let mediaRepository: any;
  let fileValidator: any;
  let videoProcessor: any;
  let contextValidator: any;
  let s3StorageService: any;
  let queueService: any;

  const mockBankId = 'e4b09c8e-5b12-4c28-9844-0a3791e84321';
  const mockInspectionId = '8f7b539a-6a71-41e9-9a74-b5650bf69947';
  const mockCategoryId = 'c1111111-1111-4111-8111-111111111111';
  const mockUserId = 'u2222222-2222-4222-8222-222222222222';
  const mockCaptureSessionId = 's3333333-3333-4333-8333-333333333333';

  const mockVideoFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'walkaround.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    buffer: Buffer.from('fake-video-binary-data'),
    size: 25 * 1024 * 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockContext = {
    inspectionId: mockInspectionId,
    bankId: mockBankId,
    captureSessionId: mockCaptureSessionId,
    categoryId: mockCategoryId,
  };

  beforeEach(async () => {
    mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    fileValidator = {
      validateVideo: jest.fn(),
    };

    videoProcessor = {
      process: jest.fn().mockResolvedValue({
        videoBuffer: Buffer.from('compressed-video-data'),
        videoMimeType: 'video/mp4',
        videoExtension: 'mp4',
        videoSize: 10 * 1024 * 1024,
        thumbnailBuffer: Buffer.from('thumbnail-webp-data'),
        thumbnailMimeType: 'image/webp',
        thumbnailExtension: 'webp',
        thumbnailSize: 50 * 1024,
        duration: 45,
        width: 1280,
        height: 720,
      }),
      probeMetadata: jest.fn(),
    };

    contextValidator = {
      validateAndResolve: jest.fn().mockResolvedValue(mockContext),
    };

    s3StorageService = {
      upload: jest.fn().mockResolvedValue('key'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    queueService = {
      enqueue: jest.fn((job: () => Promise<void>) => {
        // In tests we can choose whether to synchronously trigger or let tests trigger
        void job();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadVideoUseCase,
        { provide: 'IMediaRepository', useValue: mediaRepository },
        { provide: 'IFileValidatorService', useValue: fileValidator },
        { provide: 'IVideoProcessorService', useValue: videoProcessor },
        {
          provide: InspectionMediaContextValidator,
          useValue: contextValidator,
        },
        { provide: S3StorageService, useValue: s3StorageService },
        { provide: VideoProcessingQueueService, useValue: queueService },
      ],
    }).compile();

    useCase = module.get<UploadVideoUseCase>(UploadVideoUseCase);
  });

  describe('execute - Instant Response & Enqueue (< 500ms)', () => {
    it('should immediately save PENDING record, enqueue background job, and return 201 response', async () => {
      const result = await useCase.execute(
        mockVideoFile,
        { inspectionId: mockInspectionId },
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      // Instant response checks
      expect(fileValidator.validateVideo).toHaveBeenCalledWith(mockVideoFile);
      expect(contextValidator.validateAndResolve).toHaveBeenCalledWith(
        mockInspectionId,
        undefined,
        undefined,
        { id: mockUserId, role: Role.REPRESENTATIVE },
      );

      expect(mediaRepository.save).toHaveBeenCalledTimes(1);
      const savedMedia = mediaRepository.save.mock.calls[0][0];
      expect(savedMedia.status).toBe(MediaStatus.PENDING);
      expect(savedMedia.fileUrl).toMatch(
        new RegExp(
          `^banks/${mockBankId}/inspections/${mockInspectionId}/videos/[a-f0-9-]+\\.mp4$`,
        ),
      );

      // Verify returned DTO is in PENDING state immediately
      expect(result.status).toBe(MediaStatus.PENDING);
      expect(result.fileUrl).toBe(savedMedia.fileUrl);

      // Verify job was enqueued
      expect(queueService.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('processVideoInBackground - Asynchronous Worker Execution', () => {
    it('should transcode video, upload video & thumb to S3, and update status to UPLOADED with metadata', async () => {
      const mediaId = 'test-media-id';
      const mockMedia = new Media({
        id: mediaId,
        categoryId: mockCategoryId,
        uploadedById: mockUserId,
        captureSessionId: mockCaptureSessionId,
        fileName: 'walkaround.mp4',
        fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        mimeType: 'video/mp4',
        fileSize: 25 * 1024 * 1024,
        fileHash: null,
        width: null,
        height: null,
        duration: null,
        sortOrder: 0,
        status: MediaStatus.PENDING,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mediaRepository.findById.mockResolvedValue(mockMedia);

      await useCase.processVideoInBackground({
        mediaId,
        fileBuffer: mockVideoFile.buffer,
        fileMimeType: 'video/mp4',
        fileName: 'walkaround.mp4',
        videoObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        thumbObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}_thumb.webp`,
      });

      expect(videoProcessor.process).toHaveBeenCalledWith(
        mockVideoFile.buffer,
        'video/mp4',
      );

      // Verify S3 uploads for both video and thumbnail
      expect(s3StorageService.upload).toHaveBeenCalledWith(
        `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        Buffer.from('compressed-video-data'),
        'video/mp4',
      );
      expect(s3StorageService.upload).toHaveBeenCalledWith(
        `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}_thumb.webp`,
        Buffer.from('thumbnail-webp-data'),
        'image/webp',
      );

      // Verify DB update
      expect(mediaRepository.update).toHaveBeenCalledTimes(1);
      const updatedMedia = mediaRepository.update.mock.calls[0][0];
      expect(updatedMedia.status).toBe(MediaStatus.UPLOADED);
      expect(updatedMedia.duration).toBe(45);
      expect(updatedMedia.width).toBe(1280);
      expect(updatedMedia.height).toBe(720);
      expect(updatedMedia.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should purge uploaded video from S3 and mark FAILED if thumbnail upload fails', async () => {
      const mediaId = 'test-media-id-fail';
      const mockMedia = new Media({
        id: mediaId,
        categoryId: mockCategoryId,
        uploadedById: mockUserId,
        captureSessionId: mockCaptureSessionId,
        fileName: 'walkaround.mp4',
        fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        mimeType: 'video/mp4',
        fileSize: 25 * 1024 * 1024,
        fileHash: null,
        width: null,
        height: null,
        duration: null,
        sortOrder: 0,
        status: MediaStatus.PENDING,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mediaRepository.findById.mockResolvedValue(mockMedia);

      // First upload (video) succeeds, second upload (thumbnail) fails
      s3StorageService.upload
        .mockResolvedValueOnce('video-key')
        .mockRejectedValueOnce(new Error('S3 thumbnail network error'));

      await useCase.processVideoInBackground({
        mediaId,
        fileBuffer: mockVideoFile.buffer,
        fileMimeType: 'video/mp4',
        fileName: 'walkaround.mp4',
        videoObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        thumbObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}_thumb.webp`,
      });

      // Verify S3 rollback purged the video object
      expect(s3StorageService.delete).toHaveBeenCalledWith(
        `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
      );

      // Verify DB marked as FAILED with error message
      expect(mediaRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MediaStatus.FAILED,
          failureReason: 'S3 thumbnail network error',
        }),
      );
    });

    it('should catch video processor failure, mark FAILED, and not throw unhandled rejection', async () => {
      const mediaId = 'test-media-transcode-fail';
      const mockMedia = new Media({
        id: mediaId,
        categoryId: mockCategoryId,
        uploadedById: mockUserId,
        captureSessionId: mockCaptureSessionId,
        fileName: 'corrupt.mp4',
        fileUrl: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
        mimeType: 'video/mp4',
        fileSize: 25 * 1024 * 1024,
        fileHash: null,
        width: null,
        height: null,
        duration: null,
        sortOrder: 0,
        status: MediaStatus.PENDING,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mediaRepository.findById.mockResolvedValue(mockMedia);
      videoProcessor.process.mockRejectedValue(
        new Error('FFmpeg processing error: invalid codec'),
      );

      // Must NOT throw
      await expect(
        useCase.processVideoInBackground({
          mediaId,
          fileBuffer: mockVideoFile.buffer,
          fileMimeType: 'video/mp4',
          fileName: 'corrupt.mp4',
          videoObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}.mp4`,
          thumbObjectKey: `banks/${mockBankId}/inspections/${mockInspectionId}/videos/${mediaId}_thumb.webp`,
        }),
      ).resolves.toBeUndefined();

      expect(s3StorageService.upload).not.toHaveBeenCalled();
      expect(mediaRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MediaStatus.FAILED,
          failureReason: 'FFmpeg processing error: invalid codec',
        }),
      );
    });
  });

  describe('execute - Synchronous Pre-validation Failures', () => {
    it('should reject non-video files with UnsupportedMediaTypeException immediately', async () => {
      fileValidator.validateVideo.mockImplementation(() => {
        throw new UnsupportedMediaTypeException(
          'Only video files are allowed on this endpoint',
        );
      });

      const imageFile = { ...mockVideoFile, mimetype: 'image/jpeg' };

      await expect(
        useCase.execute(
          imageFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);

      expect(contextValidator.validateAndResolve).not.toHaveBeenCalled();
      expect(mediaRepository.save).not.toHaveBeenCalled();
      expect(queueService.enqueue).not.toHaveBeenCalled();
    });

    it('should throw when file is missing', async () => {
      fileValidator.validateVideo.mockImplementation(() => {
        throw new BadRequestException('File is required');
      });

      await expect(
        useCase.execute(
          undefined,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate InspectionRequestNotFoundException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestNotFoundException(mockInspectionId),
      );

      await expect(
        useCase.execute(
          mockVideoFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InspectionRequestNotFoundException);
    });

    it('should propagate InvalidInspectionRequestStateException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InvalidInspectionRequestStateException('Inspection is locked'),
      );

      await expect(
        useCase.execute(
          mockVideoFile,
          { inspectionId: mockInspectionId },
          { id: mockUserId, role: Role.SUPER_ADMIN },
        ),
      ).rejects.toThrow(InvalidInspectionRequestStateException);
    });

    it('should propagate InspectionRequestAccessDeniedException from contextValidator', async () => {
      contextValidator.validateAndResolve.mockRejectedValue(
        new InspectionRequestAccessDeniedException('Access denied'),
      );

      await expect(
        useCase.execute(
          mockVideoFile,
          { inspectionId: mockInspectionId },
          { id: 'unassigned-rep', role: Role.REPRESENTATIVE },
        ),
      ).rejects.toThrow(InspectionRequestAccessDeniedException);
    });
  });
});
