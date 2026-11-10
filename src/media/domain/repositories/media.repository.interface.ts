import { Media } from '../entities/media.entity';

export interface IMediaRepository {
  findById(id: string): Promise<Media | null>;
  findByCaptureSessionId(captureSessionId: string): Promise<Media[]>;
  findByInspectionId(inspectionId: string): Promise<Media[]>;
  save(media: Media): Promise<void>;
  update(media: Media): Promise<void>;
  delete(id: string): Promise<void>;
  markStalePendingAsFailed(staleBefore: Date, reason: string): Promise<number>;
}
