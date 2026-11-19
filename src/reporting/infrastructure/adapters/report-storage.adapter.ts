import { Injectable, Logger } from '@nestjs/common';
import {
  IReportStorageService,
  StorageFileResult,
} from '../../domain/interfaces/report-storage.interface';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';

@Injectable()
export class ReportStorageAdapter implements IReportStorageService {
  private readonly logger = new Logger(ReportStorageAdapter.name);

  constructor(private readonly s3StorageService: S3StorageService) {}

  async getFileBuffer(key: string): Promise<StorageFileResult> {
    try {
      const response = await this.s3StorageService.getObject(key);
      const chunks: Buffer[] = [];

      for await (const chunk of response.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      return {
        buffer,
        mimeType: response.contentType,
        size: response.contentLength ?? buffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve storage file for key '${key}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
