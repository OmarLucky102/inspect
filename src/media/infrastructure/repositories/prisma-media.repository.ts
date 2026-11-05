import { Injectable } from '@nestjs/common';
import { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { Media } from '../../domain/entities/media.entity';
import { PrismaService } from '../../../database/prisma.service';
import { MediaMapper } from '../persistence/media.mapper';

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Media | null> {
    const row = await this.prisma.media.findUnique({
      where: { id },
    });
    if (!row) return null;
    return MediaMapper.toDomain(row);
  }

  async findByCaptureSessionId(captureSessionId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({
      where: { captureSessionId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(MediaMapper.toDomain);
  }

  async findByInspectionId(inspectionId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({
      where: {
        captureSession: {
          inspectionRequestId: inspectionId,
        },
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(MediaMapper.toDomain);
  }

  async save(media: Media): Promise<void> {
    const data = MediaMapper.toCreateData(media);
    await this.prisma.media.create({ data });
  }

  async update(media: Media): Promise<void> {
    const data = MediaMapper.toUpdateData(media);
    await this.prisma.media.update({
      where: { id: media.id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.media.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });
  }
}
