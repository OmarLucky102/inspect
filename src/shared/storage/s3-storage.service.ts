import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { StorageOperationException } from '../exceptions/storage.exceptions';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.configService.getOrThrow<string>('S3_ACCESS_KEY');
    const secretAccessKey =
      this.configService.getOrThrow<string>('S3_SECRET_KEY');
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.client.send(command);
      return key;
    } catch (error) {
      this.logger.error(
        `Failed to upload object '${key}' to bucket '${this.bucket}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new StorageOperationException(
        `Failed to upload object: ${(error as Error).message}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete object '${key}' from bucket '${this.bucket}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new StorageOperationException(
        `Failed to delete object: ${(error as Error).message}`,
      );
    }
  }

  async getObject(
    key: string,
    range?: string,
  ): Promise<{
    stream: Readable;
    contentType?: string;
    contentLength?: number;
    contentRange?: string;
  }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: range,
      });

      const response = await this.client.send(command);

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        contentRange: response.ContentRange,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get object '${key}' from bucket '${this.bucket}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new StorageOperationException(
        `Failed to get object: ${(error as Error).message}`,
      );
    }
  }
}
