import { MediaCategory } from '../entities/media-category.entity';

export interface IMediaCategoryRepository {
  findById(id: string): Promise<MediaCategory | null>;
  findByName(name: string): Promise<MediaCategory | null>;
  getOrCreateDefault(name?: string): Promise<MediaCategory>;
}
