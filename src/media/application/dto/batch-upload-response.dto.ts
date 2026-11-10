export type BatchMediaStatus = 'UPLOADED' | 'FAILED';

export type BatchMediaErrorCode =
  | 'INVALID_IMAGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'FILE_TOO_LARGE'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR';

export interface BatchMediaSuccessResult {
  id: string;
  fileName: string;
  fileUrl: string;
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
  errorCode: BatchMediaErrorCode;
  errorMessage: string;
  retryable: boolean;
}

export type BatchMediaItemResult =
  BatchMediaSuccessResult | BatchMediaFailedResult;

export class BatchUploadResponseDto {
  total!: number;
  uploaded!: number;
  failed!: number;
  results!: BatchMediaItemResult[];
}
