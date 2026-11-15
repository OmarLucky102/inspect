import { MediaStatus } from '@prisma/client';
import { Media } from '../../domain/entities/media.entity';

export class MediaResponseDto {
  id!: string;
  categoryId!: string;
  uploadedById!: string;
  captureSessionId!: string | null;
  fileName!: string;
  mimeType!: string;
  fileSize!: number;
  fileHash!: string | null;
  width!: number | null;
  height!: number | null;
  duration!: number | null;
  sortOrder!: number;
  status!: MediaStatus;
  failureReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  categoryName?: string;

  static fromDomain(media: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = media.id;
    dto.categoryId = media.categoryId;
    dto.uploadedById = media.uploadedById;
    dto.captureSessionId = media.captureSessionId;
    dto.fileName = media.fileName;
    dto.mimeType = media.mimeType;
    dto.fileSize = media.fileSize;
    dto.fileHash = media.fileHash;
    dto.width = media.width;
    dto.height = media.height;
    dto.duration = media.duration;
    dto.sortOrder = media.sortOrder;
    dto.status = media.status;
    dto.failureReason = media.failureReason;
    dto.createdAt = media.createdAt;
    dto.updatedAt = media.updatedAt;
    if ((media as any).category?.name) {
      dto.categoryName = (media as any).category.name;
    }
    return dto;
  }

  static fromPrisma(media: {
    id: string;
    categoryId: string;
    uploadedById: string;
    captureSessionId: string | null;
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileHash: string | null;
    width: number | null;
    height: number | null;
    duration: number | null;
    sortOrder: number;
    status: MediaStatus;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = media.id;
    dto.categoryId = media.categoryId;
    dto.uploadedById = media.uploadedById;
    dto.captureSessionId = media.captureSessionId;
    dto.fileName = media.fileName;
    dto.mimeType = media.mimeType;
    dto.fileSize = media.fileSize;
    dto.fileHash = media.fileHash;
    dto.width = media.width;
    dto.height = media.height;
    dto.duration = media.duration;
    dto.sortOrder = media.sortOrder;
    dto.status = media.status;
    dto.failureReason = media.failureReason;
    dto.createdAt = media.createdAt;
    dto.updatedAt = media.updatedAt;
    if ((media as any).category?.name) {
      dto.categoryName = (media as any).category.name;
    }
    return dto;
  }
}
