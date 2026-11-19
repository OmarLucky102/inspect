import { ReportLanguage } from './report-language.type';

export interface ReportCustomerInfo {
  fullName: string;
  nationalId?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  cityAr?: string | null;
  governorate?: string | null;
  governorateAr?: string | null;
}

export interface ReportVehicleInfo {
  vin: string;
  plateNumber?: string | null;
  manufactureYear: number;
  mileage?: number | null;
  engineNumber: string;
  engineCc?: number | null;
  power?: number | null;
  brandName?: string | null;
  modelName?: string | null;
  trimName?: string | null;
  trimNameAr?: string | null;
  categoryName?: string | null;
  categoryNameAr?: string | null;
  fuelTypeName?: string | null;
  fuelTypeNameAr?: string | null;
  transmissionTypeName?: string | null;
  transmissionTypeNameAr?: string | null;
  colorName?: string | null;
  colorNameAr?: string | null;
  sunroofSpecification?: string | null;
  sideMirrors?: string | null;
  carInterior?: string | null;
  calendarNumber?: string | null;
  specialInstructions?: string | null;
  marketValue?: number | null;
}

export interface ReportChecklistItem {
  code: string;
  label: string;
  labelAr?: string;
  value?: string | null;
  notes?: string | null;
  status: 'PASS' | 'FAIL' | 'REVIEW';
  completed: boolean;
}

export interface ReportMediaItem {
  id: string;
  fileUrl: string;
  mimeType: string;
  checklistItemCode?: string | null;
  sortOrder: number;
  categoryName?: string | null;
  fileName?: string;
}

export interface HydratedReportPhoto {
  id: string;
  url: string;
  title?: string;
  titleAr?: string;
  categoryName?: string | null;
  checklistItemCode?: string | null;
  fileName?: string;
}

export interface ReportPhotoChecklistCustomField {
  id: string;
  name: string;
  required?: boolean;
}

export interface ReportPhotoChecklist {
  licensePhoto: boolean;
  airbagPhoto: boolean;
  roofPhoto: boolean;
  odometerPhoto: boolean;
  chassisPhoto: boolean;
  customFields?: ReportPhotoChecklistCustomField[];
}

export interface InspectionRawData {
  id: string;
  requestNumber: string;
  currentStatus: string;
  bankId: string;
  bankName: string;
  requestedAt: Date;
  completedAt?: Date | null;
  notes?: string | null;
  customer: ReportCustomerInfo;
  vehicle?: ReportVehicleInfo | null;
  marketingDecision?: {
    estimatedValue: number;
    approved: boolean;
    notes?: string | null;
    decidedAt: Date;
    reviewerName?: string | null;
  } | null;
  checklistItems: ReportChecklistItem[];
  photoChecklist?: ReportPhotoChecklist | null;
  media: ReportMediaItem[];
}

export interface ReportRenderData {
  systemId: string;
  reportId: string;
  requestId: string;
  requestNumber: string;
  bankName: string;
  verificationDate: string;
  verificationUrl: string;
  qrCodeDataUri: string;
  generatedAt: string;
  lang: ReportLanguage;
  customer: ReportCustomerInfo;
  vehicle: ReportVehicleInfo;
  checklistItems: ReportChecklistItem[];
  photoChecklist?: ReportPhotoChecklist | null;
  reviewerNotes?: string | null;
  reviewerName?: string | null;
  photos: {
    exterior: string[];
    chassis?: string | null;
    odometer?: string | null;
    roof: string[];
    allInspectionPhotos?: HydratedReportPhoto[];
  };
  logoUrl?: string;
}
