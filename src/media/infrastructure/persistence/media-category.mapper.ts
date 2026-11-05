import { MediaCategory } from '../../domain/entities/media-category.entity';
import { MediaCategory as PrismaMediaCategory } from '@prisma/client';

export class MediaCategoryMapper {
  static toDomain(prismaCategory: PrismaMediaCategory): MediaCategory {
    return new MediaCategory({
      id: prismaCategory.id,
      name: prismaCategory.name,
      description: prismaCategory.description,
    });
  }
}
