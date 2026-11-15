import { api, getAccessToken } from '@/lib/api';
import type {
  MediaDto,
  BatchUploadDto,
  UploadImageInput,
  BatchUploadInput,
  UploadVideoInput,
  MediaType,
} from './types';

function unwrap<T>(res: { data: { status: string; data: T } | T }): T {
  const d = res.data as { status?: string; data?: T };
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) {
    return d.data as T;
  }
  return res.data as T;
}

export async function uploadInspectionImage(
  input: UploadImageInput,
  onProgress?: (pct: number) => void,
): Promise<MediaDto> {
  const form = new FormData();
  form.append('file', input.file);
  if (input.captureSessionId) form.append('captureSessionId', input.captureSessionId);
  if (input.categoryId) form.append('categoryId', input.categoryId);
  if (input.sortOrder !== undefined) form.append('sortOrder', String(input.sortOrder));
  if (input.fileHash) form.append('fileHash', input.fileHash);

  const res = await api.post<{ status: string; data: MediaDto }>(
    `/media/inspections/${input.inspectionId}`,
    form,
    {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );
  return unwrap(res);
}

export async function batchUploadInspectionImages(
  input: BatchUploadInput,
  onProgress?: (pct: number) => void,
): Promise<BatchUploadDto> {
  const form = new FormData();
  input.files.forEach((file) => {
    form.append('files', file);
  });
  if (input.captureSessionId) form.append('captureSessionId', input.captureSessionId);
  if (input.categoryId) form.append('categoryId', input.categoryId);

  const res = await api.post<{ status: string; data: BatchUploadDto }>(
    `/media/inspections/${input.inspectionId}/batch`,
    form,
    {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );
  return unwrap(res);
}

export async function uploadInspectionVideo(
  input: UploadVideoInput,
  onProgress?: (pct: number) => void,
): Promise<MediaDto> {
  const form = new FormData();
  form.append('file', input.file);
  if (input.captureSessionId) form.append('captureSessionId', input.captureSessionId);
  if (input.categoryId) form.append('categoryId', input.categoryId);
  if (input.sortOrder !== undefined) form.append('sortOrder', String(input.sortOrder));
  if (input.fileHash) form.append('fileHash', input.fileHash);

  const res = await api.post<{ status: string; data: MediaDto }>(
    `/media/inspections/${input.inspectionId}/video`,
    form,
    {
      headers: { 'Content-Type': undefined },
      timeout: 10 * 60 * 1000, // 10 min — overrides global 15 s timeout for large video uploads
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );
  return unwrap(res);
}

export async function fetchInspectionMedia(
  inspectionId: string,
  type?: MediaType,
): Promise<MediaDto[]> {
  const params = type ? { type } : {};
  const res = await api.get<{ status: string; data: MediaDto[] }>(
    `/media/inspections/${inspectionId}`,
    { params },
  );
  return unwrap(res);
}

export async function fetchMediaById(id: string): Promise<MediaDto> {
  const res = await api.get<{ status: string; data: MediaDto }>(`/media/${id}`);
  return unwrap(res);
}

export function getMediaFileUrl(id: string): string {
  const token = getAccessToken();
  const base = api.defaults.baseURL || '/api/v1';
  return token
    ? `${base}/media/${id}/file?token=${encodeURIComponent(token)}`
    : `${base}/media/${id}/file`;
}
