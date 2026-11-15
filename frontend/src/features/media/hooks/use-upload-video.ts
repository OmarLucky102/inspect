import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadInspectionVideo, fetchInspectionMedia } from '../api';
import type { UploadVideoInput } from '../types';

export function useUploadVideo(inspectionId: string) {
  const qc = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'done' | 'error'
  >('idle');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (targetMediaId: string) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 120; // 10 minutes max with backoff

      const checkStatus = async () => {
        if (!isMountedRef.current) return;
        try {
          const items = await fetchInspectionMedia(inspectionId, 'video');
          const videoItem = items.find((m) => m.id === targetMediaId);

          if (!videoItem) {
            if (++attempts >= MAX_ATTEMPTS) {
              setStatus('error');
              setErrorMessage('Video processing timed out.');
              return;
            }
            pollTimerRef.current = setTimeout(checkStatus, 4000);
            return;
          }

          if (videoItem.status === 'UPLOADED') {
            setStatus('done');
            setUploadProgress(100);
            qc.invalidateQueries({ queryKey: ['inspection-media', inspectionId] });
            return;
          }

          if (videoItem.status === 'FAILED') {
            setStatus('error');
            setErrorMessage(videoItem.failureReason || 'Video processing failed.');
            return;
          }

          // Still PENDING
          if (++attempts >= MAX_ATTEMPTS) {
            setStatus('error');
            setErrorMessage('Video processing timed out.');
            return;
          }

          const delay = Math.min(4000 + attempts * 500, 10000);
          pollTimerRef.current = setTimeout(checkStatus, delay);
        } catch {
          if (++attempts >= MAX_ATTEMPTS) {
            setStatus('error');
            setErrorMessage('Failed to poll video processing status.');
            return;
          }
          pollTimerRef.current = setTimeout(checkStatus, 5000);
        }
      };

      pollTimerRef.current = setTimeout(checkStatus, 4000);
    },
    [inspectionId, qc],
  );

  const upload = useCallback(
    async (
      input: Omit<UploadVideoInput, 'inspectionId'>,
    ) => {
      setStatus('uploading');
      setUploadProgress(0);
      setErrorMessage(null);
      stopPolling();

      try {
        const dto = await uploadInspectionVideo(
          { ...input, inspectionId },
          (pct) => {
            if (isMountedRef.current) {
              setUploadProgress(Math.min(pct, 90));
            }
          },
        );

        if (!isMountedRef.current) return dto;

        setMediaId(dto.id);
        if (dto.status === 'UPLOADED') {
          setStatus('done');
          setUploadProgress(100);
          qc.invalidateQueries({ queryKey: ['inspection-media', inspectionId] });
        } else {
          setStatus('processing');
          startPolling(dto.id);
        }
        return dto;
      } catch (err: any) {
        if (isMountedRef.current) {
          setStatus('error');
          setErrorMessage(err?.response?.data?.message || err?.message || 'Upload failed');
        }
        throw err;
      }
    },
    [inspectionId, qc, startPolling, stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setUploadProgress(0);
    setMediaId(null);
    setErrorMessage(null);
  }, [stopPolling]);

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
