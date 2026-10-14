import { randomUUID } from 'crypto';
import { InvalidDynamicChecklistFieldException } from '../../../shared/exceptions/inspection.exceptions';

export interface CustomPhotoField {
  id: string;
  name: string;
  required: boolean;
}

export interface InspectionPhotoChecklistProps {
  id: string;
  inspectionRequestId: string;
  licensePhoto: boolean;
  airbagPhoto: boolean;
  roofPhoto: boolean;
  odometerPhoto: boolean;
  chassisPhoto: boolean;
  customFields: CustomPhotoField[];
  createdAt: Date;
  updatedAt: Date;
}

export class InspectionPhotoChecklist {
  private props: InspectionPhotoChecklistProps;

  constructor(props: InspectionPhotoChecklistProps) {
    this.props = {
      ...props,
      customFields: props.customFields || [],
    };
  }

  static createDefault(inspectionRequestId: string): InspectionPhotoChecklist {
    const now = new Date();
    return new InspectionPhotoChecklist({
      id: randomUUID(),
      inspectionRequestId,
      licensePhoto: true,
      airbagPhoto: true,
      roofPhoto: true,
      odometerPhoto: true,
      chassisPhoto: true,
      customFields: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get inspectionRequestId(): string {
    return this.props.inspectionRequestId;
  }

  get licensePhoto(): boolean {
    return this.props.licensePhoto;
  }

  get airbagPhoto(): boolean {
    return this.props.airbagPhoto;
  }

  get roofPhoto(): boolean {
    return this.props.roofPhoto;
  }

  get odometerPhoto(): boolean {
    return this.props.odometerPhoto;
  }

  get chassisPhoto(): boolean {
    return this.props.chassisPhoto;
  }

  get customFields(): CustomPhotoField[] {
    return [...this.props.customFields];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(params: {
    licensePhoto?: boolean;
    airbagPhoto?: boolean;
    roofPhoto?: boolean;
    odometerPhoto?: boolean;
    chassisPhoto?: boolean;
    customFields?: Array<{ id?: string; name: string; required?: boolean }>;
  }): void {
    if (params.licensePhoto !== undefined) {
      this.props.licensePhoto = Boolean(params.licensePhoto);
    }
    if (params.airbagPhoto !== undefined) {
      this.props.airbagPhoto = Boolean(params.airbagPhoto);
    }
    if (params.roofPhoto !== undefined) {
      this.props.roofPhoto = Boolean(params.roofPhoto);
    }
    if (params.odometerPhoto !== undefined) {
      this.props.odometerPhoto = Boolean(params.odometerPhoto);
    }
    if (params.chassisPhoto !== undefined) {
      this.props.chassisPhoto = Boolean(params.chassisPhoto);
    }

    if (params.customFields !== undefined) {
      this.props.customFields = this.sanitizeAndValidateCustomFields(
        params.customFields,
      );
    }

    this.props.updatedAt = new Date();
  }

  private sanitizeAndValidateCustomFields(
    fields: Array<{ id?: string; name: string; required?: boolean }>,
  ): CustomPhotoField[] {
    if (!Array.isArray(fields)) {
      throw new InvalidDynamicChecklistFieldException(
        'Custom fields must be an array',
      );
    }

    const seenNames = new Set<string>();

    return fields.map((f, index) => {
      if (!f || typeof f !== 'object') {
        throw new InvalidDynamicChecklistFieldException(
          `Custom field at index ${index} must be an object`,
        );
      }

      if (typeof f.name !== 'string') {
        throw new InvalidDynamicChecklistFieldException(
          `Custom category name at index ${index} must be a string`,
        );
      }

      const trimmedName = f.name.trim();
      if (trimmedName.length === 0) {
        throw new InvalidDynamicChecklistFieldException(
          `Custom category name at index ${index} cannot be empty`,
        );
      }

      if (trimmedName.length > 100) {
        throw new InvalidDynamicChecklistFieldException(
          `Custom category name '${trimmedName}' exceeds maximum length of 100 characters`,
        );
      }

      const lowerName = trimmedName.toLowerCase();
      if (seenNames.has(lowerName)) {
        throw new InvalidDynamicChecklistFieldException(
          `Duplicate custom category name '${trimmedName}'`,
        );
      }
      seenNames.add(lowerName);

      return {
        id: f.id || randomUUID(),
        name: trimmedName,
        // All toggles default to "Yes" (true) unless explicitly set
        required: f.required !== undefined ? Boolean(f.required) : true,
      };
    });
  }
}
