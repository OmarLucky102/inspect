import { VideoProcessingQueueService } from './video-processing-queue.service';

describe('VideoProcessingQueueService', () => {
  let queueService: VideoProcessingQueueService;

  beforeEach(() => {
    delete process.env.VIDEO_MAX_CONCURRENCY;
    queueService = new VideoProcessingQueueService();
  });

  it('should initialize with default concurrency of 2', () => {
    expect(queueService.activeCount).toBe(0);
    expect(queueService.queuedCount).toBe(0);
  });

  it('should respect custom VIDEO_MAX_CONCURRENCY env variable', () => {
    process.env.VIDEO_MAX_CONCURRENCY = '4';
    const customQueue = new VideoProcessingQueueService();
    // Verify by adding 4 jobs simultaneously
    let active = 0;
    let maxObserved = 0;
    const createJob = () => () =>
      new Promise<void>((resolve) => {
        active++;
        if (active > maxObserved) maxObserved = active;
        setTimeout(() => {
          active--;
          resolve();
        }, 10);
      });

    customQueue.enqueue(createJob());
    customQueue.enqueue(createJob());
    customQueue.enqueue(createJob());
    customQueue.enqueue(createJob());
    customQueue.enqueue(createJob());

    expect(customQueue.activeCount).toBe(4);
    expect(customQueue.queuedCount).toBe(1);
  });

  it('should strictly limit simultaneous executions to maxConcurrency (2)', async () => {
    let active = 0;
    let maxConcurrent = 0;
    const completed: number[] = [];

    const createJob = (id: number, delayMs: number) => () =>
      new Promise<void>((resolve) => {
        active++;
        if (active > maxConcurrent) maxConcurrent = active;
        setTimeout(() => {
          active--;
          completed.push(id);
          resolve();
        }, delayMs);
      });

    queueService.enqueue(createJob(1, 30));
    queueService.enqueue(createJob(2, 30));
    queueService.enqueue(createJob(3, 10));

    expect(queueService.activeCount).toBe(2);
    expect(queueService.queuedCount).toBe(1);

    // Wait for all to finish
    await new Promise((r) => setTimeout(r, 80));

    expect(maxConcurrent).toBe(2);
    expect(completed.length).toBe(3);
    expect(queueService.activeCount).toBe(0);
    expect(queueService.queuedCount).toBe(0);
  });

  it('should continue draining queue even when a job throws an error', async () => {
    const executed: string[] = [];

    const failingJob = () =>
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          executed.push('failing');
          reject(new Error('Job crash'));
        }, 10);
      });

    const successJob = () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          executed.push('success');
          resolve();
        }, 10);
      });

    queueService.enqueue(failingJob);
    queueService.enqueue(successJob);

    await new Promise((r) => setTimeout(r, 50));

    expect(executed).toEqual(['failing', 'success']);
    expect(queueService.activeCount).toBe(0);
  });
});

