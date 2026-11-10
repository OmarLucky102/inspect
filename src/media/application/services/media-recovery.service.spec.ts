import { MediaRecoveryService } from './media-recovery.service';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';

describe('MediaRecoveryService', () => {
  let service: MediaRecoveryService;
  let mockRepository: jest.Mocked<IMediaRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByCaptureSessionId: jest.fn(),
      findByInspectionId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      markStalePendingAsFailed: jest.fn(),
    };

    service = new MediaRecoveryService(mockRepository);
  });

  it('should mark stale pending records as failed on startup', async () => {
    mockRepository.markStalePendingAsFailed.mockResolvedValue(3);

    const count = await service.recoverStalePendingMedia();

    expect(count).toBe(3);
    expect(mockRepository.markStalePendingAsFailed).toHaveBeenCalledWith(
      expect.any(Date),
      'Processing interrupted by server restart or timeout',
    );
  });

  it('should call recoverStalePendingMedia on onApplicationBootstrap hook', async () => {
    mockRepository.markStalePendingAsFailed.mockResolvedValue(0);

    await service.onApplicationBootstrap();

    expect(mockRepository.markStalePendingAsFailed).toHaveBeenCalled();
  });

  it('should handle repository errors gracefully without throwing', async () => {
    mockRepository.markStalePendingAsFailed.mockRejectedValue(
      new Error('Database unavailable'),
    );

    const count = await service.recoverStalePendingMedia();

    expect(count).toBe(0);
  });
});
