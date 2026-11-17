import { ConfigService } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';
import { StorageOperationException } from '../exceptions/storage.exceptions';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('S3StorageService', () => {
  let service: S3StorageService;
  let mockConfigService: Partial<ConfigService>;
  let mockS3Send: jest.Mock;

  const mockEnv: Record<string, string> = {
    S3_ENDPOINT: 'http://localhost:8333',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'inspect-bucket',
    S3_ACCESS_KEY: 'test-access-key',
    S3_SECRET_KEY: 'test-secret-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const val = mockEnv[key];
        if (!val) throw new Error(`Missing ${key}`);
        return val;
      }),
      get: jest.fn(
        (key: string, defaultVal?: string) => mockEnv[key] || defaultVal,
      ) as any,
    };

    mockS3Send = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send,
    }));

    service = new S3StorageService(mockConfigService as ConfigService);
  });

  describe('constructor', () => {
    it('should initialize S3Client with forcePathStyle: true and correct credentials', () => {
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'http://localhost:8333',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
        forcePathStyle: true,
      });
    });
  });

  describe('upload', () => {
    it('should successfully upload buffer and return the object key', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const testBuffer = Buffer.from('fake-image-bytes');
      const key = 'test/photo.jpg';

      const result = await service.upload(key, testBuffer, 'image/jpeg');

      expect(result).toBe(key);
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'inspect-bucket',
        Key: key,
        Body: testBuffer,
        ContentType: 'image/jpeg',
      });
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should throw StorageOperationException if S3Client fails', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('Network error'));
      const testBuffer = Buffer.from('fake-image-bytes');

      await expect(
        service.upload('test/photo.jpg', testBuffer, 'image/jpeg'),
      ).rejects.toThrow(StorageOperationException);
    });
  });

  describe('delete', () => {
    it('should successfully delete an object', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const key = 'test/photo.jpg';

      await service.delete(key);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'inspect-bucket',
        Key: key,
      });
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should throw StorageOperationException if S3Client fails on delete', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('S3 delete failed'));

      await expect(service.delete('test/photo.jpg')).rejects.toThrow(
        StorageOperationException,
      );
    });
  });

  describe('getObject', () => {
    it('should successfully retrieve object stream and metadata', async () => {
      const mockStream = {} as any;
      mockS3Send.mockResolvedValueOnce({
        Body: mockStream,
        ContentType: 'image/webp',
        ContentLength: 4096,
        ContentRange: 'bytes 0-4095/4096',
      });

      const result = await service.getObject('test/photo.webp', 'bytes=0-4095');

      expect(result.stream).toBe(mockStream);
      expect(result.contentType).toBe('image/webp');
      expect(result.contentLength).toBe(4096);
      expect(result.contentRange).toBe('bytes 0-4095/4096');
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'inspect-bucket',
        Key: 'test/photo.webp',
        Range: 'bytes=0-4095',
      });
    });

    it('should throw StorageOperationException if S3Client fails on getObject', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('S3 get failed'));

      await expect(service.getObject('test/photo.webp')).rejects.toThrow(
        StorageOperationException,
      );
    });
  });
});
