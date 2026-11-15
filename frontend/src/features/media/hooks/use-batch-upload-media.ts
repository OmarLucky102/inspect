import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchUploadInspectionImages } from '../api';
import type { BatchUploadInput } from '../types';

export function useBatchUploadMedia(inspectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<BatchUploadInput, 'inspectionId'> & {
        onProgress?: (pct: number) => void;
      },
    ) => batchUploadInspectionImages({ ...input, inspectionId }, input.onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspection-media', inspectionId] });
    },
    meta: { suppressToast: true },
  });
}
