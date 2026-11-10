import {
  Injectable,
  Inject,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import type { IMediaRepository } from '../../domain/repositories/media.repository.interface';

@Injectable()
export class MediaRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MediaRecoveryService.name);
  private readonly staleThresholdMinutes = 15;

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.recoverStalePendingMedia();
  }

  async recoverStalePendingMedia(): Promise<number> {
    const staleBefore = new Date(
      Date.now() - this.staleThresholdMinutes * 60 * 1000,
    );
    try {
      const recoveredCount =
        await this.mediaRepository.markStalePendingAsFailed(
          staleBefore,
          'Processing interrupted by server restart or timeout',
        );

      if (recoveredCount > 0) {
        this.logger.warn(
          `Startup crash recovery: Marked ${recoveredCount} stale PENDING media record(s) as FAILED.`,
        );
      } else {
        this.logger.log(
          'Startup crash recovery: No stale PENDING media records found.',
        );
      }

      return recoveredCount;
    } catch (error: any) {
      this.logger.error(
        `Failed to recover stale PENDING media records on startup: ${error?.message || error}`,
        error?.stack,
      );
      return 0;
    }
  }
}
