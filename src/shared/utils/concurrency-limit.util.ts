/**
 * Creates a concurrency-limiting runner that executes async tasks
 * up to a maximum number of concurrent executions.
 *
 * @param concurrency Maximum number of concurrent tasks (e.g. 10)
 * @returns A function that wraps any async task returning a Promise
 */
export function createConcurrencyLimiter(concurrency: number) {
  if (concurrency < 1) {
    throw new Error('Concurrency limit must be at least 1');
  }

  const queue: (() => void)[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const task = queue.shift();
      task?.();
    }
  };

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    activeCount++;
    try {
      return await fn();
    } finally {
      next();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const execute = () => {
        run(fn).then(resolve, reject);
      };

      if (activeCount < concurrency) {
        execute();
      } else {
        queue.push(execute);
      }
    });
  };
}
