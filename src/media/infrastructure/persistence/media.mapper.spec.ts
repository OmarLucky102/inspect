import { MediaStatus } from '@prisma/client';
import { MediaMapper } from './media.mapper';
import { Media } from '../../domain/entities/media.entity';

describe('MediaMapper', () => {
  const now = new Date();
  const mockPrismaMedia = {
    id: 'm1',
    categoryId: 'c1',
    uploadedById: 'u1',
    captureSessionId: 's1',
    fileName: 'photo.jpg',
    fileUrl: 'banks/b1/inspections/i1/m1.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
    fileHash: 'hash123',
    width: 1920,
    height: 1080,
    duration: null,
    sortOrder: 0,
    status: MediaStatus.UPLOADED,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  it('should map from Prisma to Domain entity', () => {
    const domain = MediaMapper.toDomain(mockPrismaMedia);

    expect(domain).toBeInstanceOf(Media);
    expect(domain.id).toBe('m1');
    expect(domain.fileName).toBe('photo.jpg');
    expect(domain.status).toBe(MediaStatus.UPLOADED);
  });

  it('should map from Domain to Prisma create data', () => {
    const domain = MediaMapper.toDomain(mockPrismaMedia);
    const createData = MediaMapper.toCreateData(domain);

    expect(createData.id).toBe('m1');
    expect(createData.fileUrl).toBe('banks/b1/inspections/i1/m1.jpg');
    expect(createData.status).toBe(MediaStatus.UPLOADED);
  });

  it('should map from Domain to Prisma update data', () => {
    const domain = MediaMapper.toDomain(mockPrismaMedia);
    domain.markFailed('Network error');

    const updateData = MediaMapper.toUpdateData(domain);

    expect(updateData.status).toBe(MediaStatus.FAILED);
    expect(updateData.failureReason).toBe('Network error');
  });
});
