import { useQuery } from '@tanstack/react-query';
import { fetchInspectionMedia } from '../api';
import type { MediaType } from '../types';

export function useInspectionMedia(
  inspectionId: string | undefined,
  type?: MediaType,
) {
  return useQuery({
    queryKey: ['inspection-media', inspectionId, type ?? null],
    queryFn: () => fetchInspectionMedia(inspectionId!, type),
    enabled: !!inspectionId,
    staleTime: 50 * 60 * 1000, // 50 min — keeps cache fresh
    meta: { toastOnError: true },
  });
}
