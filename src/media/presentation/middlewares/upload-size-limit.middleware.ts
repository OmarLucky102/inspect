import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AggregateRequestSizeExceededException } from '../../../shared/exceptions/media.exceptions';
import { MAX_AGGREGATE_REQUEST_SIZE_BYTES } from '../../infrastructure/services/file-validator.service';

@Injectable()
export class UploadSizeLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const contentLength = req.headers['content-length'];

    if (contentLength) {
      const parsedLength = parseInt(contentLength, 10);
      if (
        !Number.isNaN(parsedLength) &&
        parsedLength > MAX_AGGREGATE_REQUEST_SIZE_BYTES
      ) {
        throw new AggregateRequestSizeExceededException(
          `Aggregate request size exceeds the limit of ${MAX_AGGREGATE_REQUEST_SIZE_BYTES / (1024 * 1024)} MB`,
        );
      }
    }

    // Stream byte-counter protection for chunked transfers without prematurely
    // switching the Readable stream into flowing mode via req.on('data').
    let bytesReceived = 0;
    let limitExceeded = false;
    const originalEmit = req.emit;

    req.emit = function (event: string, ...args: any[]) {
      if (event === 'data' && !limitExceeded) {
        const chunk = args[0];
        const chunkSize = Buffer.isBuffer(chunk)
          ? chunk.length
          : typeof chunk === 'string'
            ? Buffer.byteLength(chunk)
            : 0;
        bytesReceived += chunkSize;

        if (bytesReceived > MAX_AGGREGATE_REQUEST_SIZE_BYTES) {
          limitExceeded = true;
          req.destroy(
            new AggregateRequestSizeExceededException(
              `Aggregate request size exceeds the limit of ${MAX_AGGREGATE_REQUEST_SIZE_BYTES / (1024 * 1024)} MB`,
            ),
          );
          return false;
        }
      }
      return originalEmit.apply(this, [event, ...args]);
    };

    next();
  }
}
