import { Media } from '../../domain/entities/media.entity';
import { Media as PrismaMedia } from '@prisma/client';

export class MediaMapper {
  // Prisma → Domain
  static toDomain(prismaMedia: PrismaMedia): Media {
    return new Media({
      id: prismaMedia.id,
      categoryId: prismaMedia.categoryId,
      uploadedById: prismaMedia.uploadedById,
      captureSessionId: prismaMedia.captureSessionId,
      fileName: prismaMedia.fileName,
      fileUrl: prismaMedia.fileUrl,
      mimeType: prismaMedia.mimeType,
      fileSize: prismaMedia.fileSize,
      fileHash: prismaMedia.fileHash,
      width: prismaMedia.width,
      height: prismaMedia.height,
      duration: prismaMedia.duration,
      sortOrder: prismaMedia.sortOrder,
      status: prismaMedia.status,
      failureReason: prismaMedia.failureReason,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
      deletedAt: prismaMedia.deletedAt,
    });
  }

  // Domain → Prisma Create Data
  static toCreateData(media: Media) {
    return {
      id: media.id,
      categoryId: media.categoryId,
      uploadedById: media.uploadedById,
      captureSessionId: media.captureSessionId,
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      fileHash: media.fileHash,
      width: media.width,
      height: media.height,
      duration: media.duration,
      sortOrder: media.sortOrder,
      status: media.status,
      failureReason: media.failureReason,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      deletedAt: media.deletedAt,
    };
  }

  // Domain → Prisma Update Data
  static toUpdateData(media: Media) {
    return {
      categoryId: media.categoryId,
      captureSessionId: media.captureSessionId,
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      fileHash: media.fileHash,
      width: media.width,
      height: media.height,
      duration: media.duration,
      sortOrder: media.sortOrder,
      status: media.status,
      failureReason: media.failureReason,
      updatedAt: media.updatedAt,
      deletedAt: media.deletedAt,
    };
  }
}
