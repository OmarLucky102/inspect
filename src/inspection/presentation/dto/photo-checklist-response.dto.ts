import { InspectionPhotoChecklist } from '../../domain/entities/inspection-photo-checklist.entity';

export interface CustomPhotoFieldResponse {
  id: string;
  name: string;
  required: boolean;
}

export class PhotoChecklistResponseDto {
  id!: string;
  inspectionRequestId!: string;
  licensePhoto!: boolean;
  airbagPhoto!: boolean;
  roofPhoto!: boolean;
  odometerPhoto!: boolean;
  chassisPhoto!: boolean;
  customFields!: CustomPhotoFieldResponse[];
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(
    domain: InspectionPhotoChecklist,
  ): PhotoChecklistResponseDto {
    return {
      id: domain.id,
      inspectionRequestId: domain.inspectionRequestId,
      licensePhoto: domain.licensePhoto,
      airbagPhoto: domain.airbagPhoto,
      roofPhoto: domain.roofPhoto,
      odometerPhoto: domain.odometerPhoto,
      chassisPhoto: domain.chassisPhoto,
      customFields: domain.customFields,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
