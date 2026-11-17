import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadInspectionVideo } from '../api';
import type { UploadVideoInput, MediaDto } from '../types';

export function useUploadVideo(inspectionId: string) {
  const qc = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'done' | 'error'
  >('idle');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopPolling = useCallback(() => {
    // No-op kept for backwards compatibility with wizard callers
  }, []);

  const upload = useCallback(
    async (
      input: Omit<UploadVideoInput, 'inspectionId'>,
    ): Promise<MediaDto> => {
      setStatus('uploading');
      setUploadProgress(0);
      setErrorMessage(null);

      try {
        const dto = await uploadInspectionVideo(
          { ...input, inspectionId },
          (pct) => {
            if (isMountedRef.current) {
              setUploadProgress(Math.min(pct, 95));
            }
          },
        );

        if (!isMountedRef.current) return dto;

        setMediaId(dto.id);
        setStatus('done');
        setUploadProgress(100);
        qc.invalidateQueries({ queryKey: ['inspection-media', inspectionId] });

        return dto;
      } catch (err: any) {
        if (isMountedRef.current) {
          setStatus('error');
          setErrorMessage(
            err?.response?.data?.message || err?.message || 'Upload failed',
          );
        }
        throw err;
      }
    },
    [inspectionId, qc],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setUploadProgress(0);
    setMediaId(null);
    setErrorMessage(null);
  }, []);

  return {
    upload,
    uploadProgress,
    status,
    mediaId,
    errorMessage,
    stopPolling,
    reset,
  };
}
