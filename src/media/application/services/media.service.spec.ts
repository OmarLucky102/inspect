import { Test, TestingModule } from '@nestjs/testing';
import { MediaStatus } from '@prisma/client';
import { MediaService } from './media.service';
import { UploadMediaUseCase } from '../use-cases/upload-media.use-case';
import { GetMediaUseCase } from '../use-cases/get-media.use-case';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { MediaResponseDto } from '../dto/media-response.dto';

describe('MediaService', () => {
  let service: MediaService;
  let uploadMediaUseCase: any;
  let getMediaUseCase: any;

  const mockResponseDto: MediaResponseDto = {
    id: 'media-1',
    categoryId: 'cat-1',
    uploadedById: 'user-1',
    captureSessionId: 'sess-1',
    fileName: 'photo.jpg',
    fileUrl: 'banks/b1/inspections/i1/media-1.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
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

  beforeEach(async () => {
    uploadMediaUseCase = {
      execute: jest.fn().mockResolvedValue(mockResponseDto),
    };
    getMediaUseCase = {
      execute: jest.fn().mockResolvedValue(mockResponseDto),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: UploadMediaUseCase, useValue: uploadMediaUseCase },
        { provide: GetMediaUseCase, useValue: getMediaUseCase },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate uploadMedia to UploadMediaUseCase', async () => {
    const mockFile = {} as Express.Multer.File;
    const dto = { inspectionId: 'i1' };
    const actor = { id: 'user-1', role: Role.REPRESENTATIVE };

    const result = await service.uploadMedia(mockFile, dto, actor);

    expect(uploadMediaUseCase.execute).toHaveBeenCalledWith(
      mockFile,
      dto,
      actor,
    );
    expect(result).toBe(mockResponseDto);
  });

  it('should delegate getMediaById to GetMediaUseCase', async () => {
    const actor = { id: 'user-1', role: Role.REPRESENTATIVE };

    const result = await service.getMediaById('media-1', actor);

    expect(getMediaUseCase.execute).toHaveBeenCalledWith('media-1', actor);
    expect(result).toBe(mockResponseDto);
  });
});
