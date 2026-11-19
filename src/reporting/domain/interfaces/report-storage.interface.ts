export const REPORT_STORAGE_SERVICE = Symbol('REPORT_STORAGE_SERVICE');

export interface StorageFileResult {
  buffer: Buffer;
  mimeType?: string;
  size?: number;
}

export interface IReportStorageService {
  getFileBuffer(key: string): Promise<StorageFileResult>;
}
