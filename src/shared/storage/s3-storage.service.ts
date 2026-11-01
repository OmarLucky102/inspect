import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
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

  async getPresignedUrl(
    key: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for key '${key}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new StorageOperationException(
        `Failed to generate presigned URL: ${(error as Error).message}`,
      );
    }
  }
}

