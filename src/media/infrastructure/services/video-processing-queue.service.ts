import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VideoProcessingQueueService {
  private readonly logger = new Logger(VideoProcessingQueueService.name);
  private readonly maxConcurrency: number;
  private activeJobs = 0;
  private readonly queue: Array<() => Promise<void>> = [];

  constructor() {
    const envConcurrency = Number(process.env.VIDEO_MAX_CONCURRENCY);
    this.maxConcurrency =
      !isNaN(envConcurrency) && envConcurrency > 0 ? envConcurrency : 2;
  }

  enqueue(job: () => Promise<void>): void {
    this.queue.push(job);
    this.processNext();
  }

  get activeCount(): number {
    return this.activeJobs;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  private processNext(): void {
    if (this.activeJobs >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const nextJob = this.queue.shift();
    if (!nextJob) {
      return;
    }

    this.activeJobs++;

    Promise.resolve()
      .then(() => nextJob())
      .catch((error: any) => {
        this.logger.error(
          `Unhandled error in queued video processing job: ${error?.message || error}`,
          error?.stack,
        );
      })
      .finally(() => {
        this.activeJobs--;
        this.processNext();
      });
  }
}

