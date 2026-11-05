import { Injectable } from '@nestjs/common';
import { IMediaCategoryRepository } from '../../domain/repositories/media-category.repository.interface';
import { MediaCategory } from '../../domain/entities/media-category.entity';
import { PrismaService } from '../../../database/prisma.service';
import { MediaCategoryMapper } from '../persistence/media-category.mapper';

@Injectable()
export class PrismaMediaCategoryRepository implements IMediaCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MediaCategory | null> {
    const row = await this.prisma.mediaCategory.findUnique({
      where: { id },
    });
    if (!row) return null;
    return MediaCategoryMapper.toDomain(row);
  }

  async findByName(name: string): Promise<MediaCategory | null> {
    const row = await this.prisma.mediaCategory.findUnique({
      where: { name },
    });
    if (!row) return null;
    return MediaCategoryMapper.toDomain(row);
  }

  async getOrCreateDefault(name: string = 'GENERAL'): Promise<MediaCategory> {
    const row = await this.prisma.mediaCategory.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: 'Default inspection media category',
      },
    });
    return MediaCategoryMapper.toDomain(row);
  }
}
