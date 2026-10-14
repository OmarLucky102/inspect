import {
  InspectionPhotoChecklist as PrismaPhotoChecklist,
  Prisma,
} from '@prisma/client';
import {
  InspectionPhotoChecklist,
  CustomPhotoField,
} from '../../domain/entities/inspection-photo-checklist.entity';

export class InspectionPhotoChecklistMapper {
  static toDomain(raw: PrismaPhotoChecklist): InspectionPhotoChecklist {
    let customFields: CustomPhotoField[] = [];
    if (raw.customFields) {
      if (Array.isArray(raw.customFields)) {
        customFields = raw.customFields as unknown as CustomPhotoField[];
      } else if (typeof raw.customFields === 'string') {
        try {
          const parsed: unknown = JSON.parse(raw.customFields);
          if (Array.isArray(parsed)) {
            customFields = parsed as CustomPhotoField[];
          }
        } catch {
          customFields = [];
        }
      }
    }

    return new InspectionPhotoChecklist({
      id: raw.id,
      inspectionRequestId: raw.inspectionRequestId,
      licensePhoto: raw.licensePhoto,
      airbagPhoto: raw.airbagPhoto,
      roofPhoto: raw.roofPhoto,
      odometerPhoto: raw.odometerPhoto,
      chassisPhoto: raw.chassisPhoto,
      customFields,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toCreateData(
    domain: InspectionPhotoChecklist,
  ): Prisma.InspectionPhotoChecklistCreateInput {
    return {
      id: domain.id,
      licensePhoto: domain.licensePhoto,
      airbagPhoto: domain.airbagPhoto,
      roofPhoto: domain.roofPhoto,
      odometerPhoto: domain.odometerPhoto,
      chassisPhoto: domain.chassisPhoto,
      customFields: domain.customFields as unknown as Prisma.InputJsonValue,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      inspectionRequest: {
        connect: { id: domain.inspectionRequestId },
      },
    };
  }

  static toUpdateData(
    domain: InspectionPhotoChecklist,
  ): Prisma.InspectionPhotoChecklistUpdateInput {
    return {
      licensePhoto: domain.licensePhoto,
      airbagPhoto: domain.airbagPhoto,
      roofPhoto: domain.roofPhoto,
      odometerPhoto: domain.odometerPhoto,
      chassisPhoto: domain.chassisPhoto,
      customFields: domain.customFields as unknown as Prisma.InputJsonValue,
      updatedAt: domain.updatedAt,
    };
  }
}
