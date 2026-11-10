import { UploadSizeLimitMiddleware } from './upload-size-limit.middleware';
import { AggregateRequestSizeExceededException } from '../../../shared/exceptions/media.exceptions';
import { MAX_AGGREGATE_REQUEST_SIZE_BYTES } from '../../infrastructure/services/file-validator.service';
import { EventEmitter } from 'events';

describe('UploadSizeLimitMiddleware', () => {
  let middleware: UploadSizeLimitMiddleware;

  beforeEach(() => {
    middleware = new UploadSizeLimitMiddleware();
  });

  it('should allow requests within aggregate content-length limit', () => {
    const req: any = {
      headers: {
        'content-length': String(10 * 1024 * 1024),
      },
      on: jest.fn(),
      removeListener: jest.fn(),
      destroy: jest.fn(),
    };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.destroy).not.toHaveBeenCalled();
  });

  it('should throw AggregateRequestSizeExceededException when content-length exceeds limit', () => {
    const req: any = {
      headers: {
        'content-length': String(MAX_AGGREGATE_REQUEST_SIZE_BYTES + 1),
      },
      on: jest.fn(),
      removeListener: jest.fn(),
      destroy: jest.fn(),
    };
    const res: any = {};
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(
      AggregateRequestSizeExceededException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should abort and destroy stream when incoming chunked data exceeds limit', () => {
    const emitter = new EventEmitter() as any;
    emitter.headers = {};
    emitter.destroy = jest.fn();

    const res: any = {};
    const next = jest.fn();

    middleware.use(emitter, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Emit chunk larger than aggregate limit
    const hugeChunk = Buffer.alloc(MAX_AGGREGATE_REQUEST_SIZE_BYTES + 10);
    emitter.emit('data', hugeChunk);

    expect(emitter.destroy).toHaveBeenCalledTimes(1);
    expect(emitter.destroy).toHaveBeenCalledWith(
      expect.any(AggregateRequestSizeExceededException),
    );
  });
});
