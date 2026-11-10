import { createConcurrencyLimiter } from './concurrency-limit.util';

describe('createConcurrencyLimiter', () => {
  it('should throw an error if concurrency is less than 1', () => {
    expect(() => createConcurrencyLimiter(0)).toThrow(
      'Concurrency limit must be at least 1',
    );
    expect(() => createConcurrencyLimiter(-5)).toThrow(
      'Concurrency limit must be at least 1',
    );
  });

  it('should execute tasks without exceeding the concurrency limit', async () => {
    const limit = createConcurrencyLimiter(3);
    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createTask = (id: number, delayMs: number) => () =>
      limit(async () => {
        activeTasks++;
        if (activeTasks > maxActiveTasks) {
          maxActiveTasks = activeTasks;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        activeTasks--;
        return id;
      });

    const tasks = [
      createTask(1, 30),
      createTask(2, 30),
      createTask(3, 30),
      createTask(4, 20),
      createTask(5, 20),
      createTask(6, 10),
    ];

    const results = await Promise.all(tasks.map((t) => t()));

    expect(results).toEqual([1, 2, 3, 4, 5, 6]);
    expect(maxActiveTasks).toBeLessThanOrEqual(3);
  });

  it('should continue processing remaining tasks when one task fails', async () => {
    const limit = createConcurrencyLimiter(2);

    const task1 = limit(async () => 'success-1');
    const task2 = limit(async () => {
      throw new Error('task-failed');
    });
    const task3 = limit(async () => 'success-3');

    const results = await Promise.allSettled([task1, task2, task3]);

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'success-1' });
    expect(results[1]).toEqual({
      status: 'rejected',
      reason: expect.any(Error),
    });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'success-3' });
  });
});
