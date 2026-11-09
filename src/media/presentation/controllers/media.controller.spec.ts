import { Test, TestingModule } from '@nestjs/testing';
import { MediaStatus } from '@prisma/client';
import { MediaController } from './media.controller';
import { UploadMediaUseCase } from '../../application/use-cases/upload-media.use-case';
import { UploadGenericMediaUseCase } from '../../application/use-cases/upload-generic-media.use-case';
import { BatchUploadMediaUseCase } from '../../application/use-cases/batch-upload-media.use-case';
import { UploadVideoUseCase } from '../../application/use-cases/upload-video.use-case';
import { GetMediaUseCase } from '../../application/use-cases/get-media.use-case';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { GenericUploadMediaDto } from '../dto/generic-upload-media.dto';
import { BatchUploadMediaDto } from '../dto/batch-upload-media.dto';
import { MediaResponseDto } from '../../application/dto/media-response.dto';
import { BatchUploadResponseDto } from '../../application/dto/batch-upload-response.dto';

describe('MediaController', () => {
  let controller: MediaController;
  let uploadMediaUseCase: any;
  let uploadGenericMediaUseCase: any;
  let batchUploadMediaUseCase: any;
  let uploadVideoUseCase: any;
  let getMediaUseCase: any;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'inspection-photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-bytes'),
    size: 2048,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockResponseDto: MediaResponseDto = {
    id: 'media-uuid-1',
    categoryId: 'cat-uuid-1',
    uploadedById: 'user-uuid-1',
    captureSessionId: 'session-uuid-1',
    fileName: 'inspection-photo.jpg',
    fileUrl: 'banks/bank-1/inspections/insp-1/media-uuid-1.jpg',
    mimeType: 'image/jpeg',
    fileSize: 2048,
    fileHash: null,
    width: null,
    height: null,
    duration: null,
    sortOrder: 0,
    status: MediaStatus.UPLOADED,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    sub: 'user-uuid-1',
    email: 'rep@example.com',
    role: Role.REPRESENTATIVE,
  };

  beforeEach(async () => {
    uploadMediaUseCase = {
      execute: jest.fn(),
    };

    uploadGenericMediaUseCase = {
      execute: jest.fn(),
    };

    batchUploadMediaUseCase = {
      execute: jest.fn(),
    };

    uploadVideoUseCase = {
      execute: jest.fn(),
    };

    getMediaUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: UploadMediaUseCase, useValue: uploadMediaUseCase },
        {
          provide: UploadGenericMediaUseCase,
          useValue: uploadGenericMediaUseCase,
        },
        {
          provide: BatchUploadMediaUseCase,
          useValue: batchUploadMediaUseCase,
        },
        {
          provide: UploadVideoUseCase,
          useValue: uploadVideoUseCase,
        },
        { provide: GetMediaUseCase, useValue: getMediaUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadMedia', () => {
    it('should successfully delegate to uploadGenericMediaUseCase and return wrapped response', async () => {
      uploadGenericMediaUseCase.execute.mockResolvedValue(mockResponseDto);

      const dto: GenericUploadMediaDto = {
        category: 'PROFILE_PHOTO',
        entityType: 'USER_PROFILE',
      };

      const result = await controller.uploadMedia(mockFile, dto, mockUser);

      expect(uploadGenericMediaUseCase.execute).toHaveBeenCalledWith(
        mockFile,
        dto,
        {
          id: mockUser.sub,
          role: mockUser.role,
        },
      );
      expect(result).toEqual({
        status: 'success',
        data: mockResponseDto,
      });
    });
  });

  describe('uploadInspectionMedia', () => {
    it('should attach inspectionId from URL param and delegate to uploadMediaUseCase', async () => {
      uploadMediaUseCase.execute.mockResolvedValue(mockResponseDto);

      const result = await controller.uploadInspectionMedia(
        'insp-1',
        mockFile,
        { sortOrder: 1 },
        mockUser,
      );

      expect(uploadMediaUseCase.execute).toHaveBeenCalledWith(
        mockFile,
        {
          inspectionId: 'insp-1',
          sortOrder: 1,
        },
        { id: mockUser.sub, role: mockUser.role },
      );
      expect(result).toEqual({
        status: 'success',
        data: mockResponseDto,
      });
    });
  });

  describe('uploadInspectionMediaBatch', () => {
    it('should attach inspectionId from URL param and delegate to batchUploadMediaUseCase', async () => {
      const mockBatchResponse: BatchUploadResponseDto = {
        total: 1,
        uploaded: 1,
        failed: 0,
        results: [
          {
            id: 'media-uuid-1',
            fileName: 'inspection-photo.webp',
            fileUrl: 'banks/bank-1/inspections/insp-1/media-uuid-1.webp',
            status: 'UPLOADED',
            mimeType: 'image/webp',
            fileSize: 2048,
            width: 1000,
            height: 800,
          },
        ],
      };

      batchUploadMediaUseCase.execute.mockResolvedValue(mockBatchResponse);

      const dto: BatchUploadMediaDto = {
        sortOrder: 1,
      };

      const result = await controller.uploadInspectionMediaBatch(
        'insp-1',
        [mockFile],
        dto,
        mockUser,
      );

      expect(batchUploadMediaUseCase.execute).toHaveBeenCalledWith(
        [mockFile],
        {
          inspectionId: 'insp-1',
          sortOrder: 1,
        },
        { id: mockUser.sub, role: mockUser.role },
      );
      expect(result).toEqual({
        status: 'success',
        data: mockBatchResponse,
      });
    });
  });

  describe('uploadInspectionVideo', () => {
    it('should attach inspectionId from URL param and delegate to uploadVideoUseCase', async () => {
      uploadVideoUseCase.execute.mockResolvedValue(mockResponseDto);

      const result = await controller.uploadInspectionVideo(
        'insp-1',
        mockFile,
        { sortOrder: 1 },
        mockUser,
      );

      expect(uploadVideoUseCase.execute).toHaveBeenCalledWith(
        mockFile,
        {
          inspectionId: 'insp-1',
          sortOrder: 1,
        },
        { id: mockUser.sub, role: mockUser.role },
      );
      expect(result).toEqual({
        status: 'success',
        data: mockResponseDto,
      });
    });
  });

  describe('getMedia', () => {
    it('should return media metadata by ID', async () => {
      getMediaUseCase.execute.mockResolvedValue(mockResponseDto);

      const result = await controller.getMedia('media-uuid-1', mockUser);

      expect(getMediaUseCase.execute).toHaveBeenCalledWith('media-uuid-1', {
        id: mockUser.sub,
        role: mockUser.role,
      });
      expect(result).toEqual({
        status: 'success',
        data: mockResponseDto,
      });
    });
  });
});
