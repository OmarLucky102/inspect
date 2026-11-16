export type MediaStatus = 'PENDING' | 'UPLOADED' | 'FAILED' | 'DELETED';

export interface MediaDto {
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
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  checklistItemCode?: string | null;
}

export interface BatchMediaSuccessResult {
  id: string;
  fileName: string;
  status: 'UPLOADED';
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
}

export interface BatchMediaFailedResult {
  id?: string;
  fileName: string;
  status: 'FAILED';
  errorCode:
    | 'INVALID_IMAGE'
    | 'UNSUPPORTED_MEDIA_TYPE'
    | 'FILE_TOO_LARGE'
    | 'STORAGE_ERROR'
    | 'DATABASE_ERROR'
    | string;
  errorMessage: string;
  retryable: boolean;
}

export type BatchMediaItemResult =
  BatchMediaSuccessResult | BatchMediaFailedResult;

export interface BatchUploadDto {
  total: number;
  uploaded: number;
  failed: number;
  results: BatchMediaItemResult[];
}

export type MediaType = 'image' | 'video';

export interface UploadImageInput {
  file: File;
  inspectionId: string;
  captureSessionId?: string;
  categoryId?: string;
  sortOrder?: number;
  fileHash?: string;
  checklistItemCode?: string;
}

export interface BatchUploadInput {
  files: File[];
  inspectionId: string;
  captureSessionId?: string;
  categoryId?: string;
}

export interface UploadVideoInput {
  file: File;
  inspectionId: string;
  captureSessionId?: string;
  categoryId?: string;
  sortOrder?: number;
  fileHash?: string;
  checklistItemCode?: string;
}
