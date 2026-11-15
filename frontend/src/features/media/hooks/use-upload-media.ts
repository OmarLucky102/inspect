import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadInspectionImage } from '../api';
import type { UploadImageInput } from '../types';

export function useUploadMedia(inspectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<UploadImageInput, 'inspectionId'> & {
        onProgress?: (pct: number) => void;
      },
    ) => uploadInspectionImage({ ...input, inspectionId }, input.onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspection-media', inspectionId] });
    },
    meta: { suppressToast: true },
  });
}
