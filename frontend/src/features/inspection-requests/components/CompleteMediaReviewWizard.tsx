import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
  useMemo,
} from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileImage,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Car,
  Armchair,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileCheck2,
  RotateCcw,
  Gauge,
  ShieldAlert,
  Sun,
  Binary,
  FileText,
  Play,
  Check,
  UploadCloud,
  Info,
} from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { cn } from '@/lib/cn';
import { useBatchUploadMedia } from '@/features/media/hooks/use-batch-upload-media';
import { useUploadVideo } from '@/features/media/hooks/use-upload-video';
import { useUploadMedia } from '@/features/media/hooks/use-upload-media';
import { useInspectionMedia } from '@/features/media/hooks/use-inspection-media';
import { getMediaFileUrl } from '@/features/media/api';
import {
  fetchInspectionPhotoChecklist,
} from '@/features/inspection-requests/api';

export interface UploadedFileItem {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
  type: string;
  progress: number; // 0 to 100
  status: 'staged' | 'uploading' | 'completed' | 'error';
  uploadedAt: Date;
  mediaId?: string;
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
  isRemote?: boolean;
}

export interface ChecklistItemDef {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'safety' | 'body' | 'mechanical';
  icon: React.ComponentType<{ className?: string }>;
  suggestedAngle: string;
}

const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: 'license_plate',
    title: 'License Plate (Front & Rear)',
    description:
      'Crisp image showing legal registration plates, characters, and state seal.',
    category: 'legal',
    icon: FileText,
    suggestedAngle: 'Front or Rear bumper level',
  },
  {
    id: 'odometer_cluster',
    title: 'Odometer & Instrument Cluster',
    description:
      'Lit instrument cluster with engine running or ignition ON showing digital mileage.',
    category: 'mechanical',
    icon: Gauge,
    suggestedAngle: 'Dashboard direct angle',
  },
  {
    id: 'airbag_steering',
    title: 'Airbag & Steering Assembly',
    description:
      'Steering wheel hub, driver airbag module, and center horn pad alignment.',
    category: 'safety',
    icon: ShieldAlert,
    suggestedAngle: 'Driver seat viewpoint',
  },
  {
    id: 'panoramic_roof',
    title: 'Panoramic Roof / Sunroof',
    description:
      'Glass integrity, weatherstripping rubber seals, and sliding track operation.',
    category: 'body',
    icon: Sun,
    suggestedAngle: 'Overhead roof view',
  },
  {
    id: 'chassis_vin',
    title: 'Chassis VIN Stamping',
    description:
      'Manufacturer stamped VIN plate on chassis firewall or door B-pillar.',
    category: 'legal',
    icon: Binary,
    suggestedAngle: 'Close-up with clear macro focus',
  },
  {
    id: 'other',
    title: 'Other',
    description:
      'Any additional, optional, or supporting evidence photos.',
    category: 'body',
    icon: FileText,
    suggestedAngle: 'Clear contextual shot',
  },
];

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface CompleteMediaReviewWizardProps {
  /** Optional custom trigger node. If omitted, default "Complete Media Review" button is rendered */
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open change callback */
  onOpenChange?: (open: boolean) => void;
  /** Request reference identifier */
  requestId?: string;
  /** Direct UUID of the inspection request */
  inspectionId?: string;
  /** Bank ID for submitting review */
  bankId?: string;
  /** Vehicle model or title */
  vehicleName?: string;
  /** Initial vehicle mileage */
  initialMileage?: number | null;
  /** Fired when files are added or removed */
  onMediaChange?: (hasMedia: boolean, totalCount: number) => void;
  /** Fired when review submission succeeds */
  onCompleted?: (result: {
    exteriorPhotos: UploadedFileItem[];
    exteriorVideo: UploadedFileItem | null;
    interiorPhotos: UploadedFileItem[];
    interiorVideo: UploadedFileItem | null;
    checklistItems: Record<string, UploadedFileItem | null>;
  }) => void;
}

export function CompleteMediaReviewWizard({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  requestId = 'REQ-2026-8842',
  inspectionId,
  bankId,
  vehicleName = 'Vehicle Inspection',
  onMediaChange,
  onCompleted,
}: CompleteMediaReviewWizardProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      controlledOnOpenChange?.(next);
    },
    [isControlled, controlledOnOpenChange],
  );

  // Wizard Step Navigation State: 1 = Exterior, 2 = Interior, 3 = Checklist Items
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Local media state
  const [exteriorPhotos, setExteriorPhotos] = useState<UploadedFileItem[]>([]);
  const [exteriorVideo, setExteriorVideo] = useState<UploadedFileItem | null>(
    null,
  );

  const [interiorPhotos, setInteriorPhotos] = useState<UploadedFileItem[]>([]);
  const [interiorVideo, setInteriorVideo] = useState<UploadedFileItem | null>(
    null,
  );

  const activeInspectionId = inspectionId || requestId;
  const queryClient = useQueryClient();
  const { data: existingMedia } = useInspectionMedia(activeInspectionId);

  // Real API hooks
  const batchUploader = useBatchUploadMedia(activeInspectionId);
  const singleImageUploader = useUploadMedia(activeInspectionId);
  const exteriorVideoUploader = useUploadVideo(activeInspectionId);
  const interiorVideoUploader = useUploadVideo(activeInspectionId);

  // Fetch checklist config if bankId is available
  const { data: photoChecklist } = useQuery({
    queryKey: ['inspection-photo-checklist', bankId, activeInspectionId],
    queryFn: () => fetchInspectionPhotoChecklist(bankId!, activeInspectionId),
    enabled: !!bankId && !!activeInspectionId,
  });

  const activeChecklistItems = useMemo<ChecklistItemDef[]>(() => {
    if (!photoChecklist) return CHECKLIST_ITEMS;

    const items: ChecklistItemDef[] = [];
    if (photoChecklist.licensePhoto !== false) {
      const match = CHECKLIST_ITEMS.find((c) => c.id === 'license_plate');
      if (match) items.push(match);
    }
    if (photoChecklist.odometerPhoto !== false) {
      const match = CHECKLIST_ITEMS.find((c) => c.id === 'odometer_cluster');
      if (match) items.push(match);
    }
    if (photoChecklist.airbagPhoto !== false) {
      const match = CHECKLIST_ITEMS.find((c) => c.id === 'airbag_steering');
      if (match) items.push(match);
    }
    if (photoChecklist.roofPhoto !== false) {
      const match = CHECKLIST_ITEMS.find((c) => c.id === 'panoramic_roof');
      if (match) items.push(match);
    }
    if (photoChecklist.chassisPhoto !== false) {
      const match = CHECKLIST_ITEMS.find((c) => c.id === 'chassis_vin');
      if (match) items.push(match);
    }

    if (Array.isArray(photoChecklist.customFields)) {
      photoChecklist.customFields.forEach((cf) => {
        items.push({
          id: `custom_${cf.id}`,
          title: cf.name,
          description: cf.required
            ? 'Required custom evidence photo.'
            : 'Optional custom photo.',
          category: 'body',
          icon: FileCheck2,
          suggestedAngle: 'Clear contextual shot',
        });
      });
    }

    const otherMatch = CHECKLIST_ITEMS.find((c) => c.id === 'other');
    if (otherMatch) items.push(otherMatch);

    return items;
  }, [photoChecklist]);

  const [checklistFiles, setChecklistFiles] = useState<
    Record<string, UploadedFileItem | null>
  >(() => {
    const initial: Record<string, UploadedFileItem | null> = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initial[item.id] = null;
    });
    return initial;
  });

  // UI Flow States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  // Track all created blob URLs so we can safely revoke them
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());
  // Track active AbortControllers so in-flight requests can be aborted on deletion or unmount
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const registerBlobUrl = useCallback((url: string) => {
    activeBlobUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url?: string | null) => {
    if (!url) return;
    if (activeBlobUrlsRef.current.has(url) || url.startsWith('blob:')) {
      activeBlobUrlsRef.current.delete(url);
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    }
  }, []);

  // Clean up remaining object URLs and abort in-flight requests when component unmounts
  useEffect(() => {
    const urls = activeBlobUrlsRef.current;
    const abortControllers = abortControllersRef.current;
    return () => {
      abortControllers.forEach((controller) => {
        try {
          controller.abort();
        } catch {
          // no-op
        }
      });
      abortControllers.clear();

      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // no-op
        }
      });
      urls.clear();
    };
  }, []);

  // Synchronize exterior video uploader state
  useEffect(() => {
    if (exteriorVideoUploader.status === 'uploading') {
      setExteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              progress: exteriorVideoUploader.uploadProgress,
              status: 'uploading',
            }
          : null,
      );
    } else if (exteriorVideoUploader.status === 'processing') {
      setExteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              progress: 95,
              status: 'uploading',
              mediaId: exteriorVideoUploader.mediaId || prev.mediaId,
            }
          : null,
      );
    } else if (exteriorVideoUploader.status === 'done') {
      setExteriorVideo((prev) => {
        if (!prev) return null;
        if (
          prev.previewUrl &&
          (!prev.isRemote || prev.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(prev.previewUrl);
        }
        return {
          ...prev,
          progress: 100,
          status: 'completed',
          mediaId: exteriorVideoUploader.mediaId || prev.mediaId,
          previewUrl: exteriorVideoUploader.mediaId
            ? getMediaFileUrl(exteriorVideoUploader.mediaId)
            : prev.previewUrl,
          file: undefined,
          isRemote: true,
        };
      });
    } else if (exteriorVideoUploader.status === 'error') {
      setExteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              errorMessage:
                exteriorVideoUploader.errorMessage || 'Video processing failed',
              retryable: true,
            }
          : null,
      );
    }
  }, [
    exteriorVideoUploader.status,
    exteriorVideoUploader.uploadProgress,
    exteriorVideoUploader.mediaId,
    exteriorVideoUploader.errorMessage,
    revokeBlobUrl,
  ]);

  // Synchronize interior video uploader state
  useEffect(() => {
    if (interiorVideoUploader.status === 'uploading') {
      setInteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              progress: interiorVideoUploader.uploadProgress,
              status: 'uploading',
            }
          : null,
      );
    } else if (interiorVideoUploader.status === 'processing') {
      setInteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              progress: 95,
              status: 'uploading',
              mediaId: interiorVideoUploader.mediaId || prev.mediaId,
            }
          : null,
      );
    } else if (interiorVideoUploader.status === 'done') {
      setInteriorVideo((prev) => {
        if (!prev) return null;
        if (
          prev.previewUrl &&
          (!prev.isRemote || prev.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(prev.previewUrl);
        }
        return {
          ...prev,
          progress: 100,
          status: 'completed',
          mediaId: interiorVideoUploader.mediaId || prev.mediaId,
          previewUrl: interiorVideoUploader.mediaId
            ? getMediaFileUrl(interiorVideoUploader.mediaId)
            : prev.previewUrl,
          file: undefined,
          isRemote: true,
        };
      });
    } else if (interiorVideoUploader.status === 'error') {
      setInteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              errorMessage:
                interiorVideoUploader.errorMessage || 'Video processing failed',
              retryable: true,
            }
          : null,
      );
    }
  }, [
    interiorVideoUploader.status,
    interiorVideoUploader.uploadProgress,
    interiorVideoUploader.mediaId,
    interiorVideoUploader.errorMessage,
    revokeBlobUrl,
  ]);

  // Hydrate already-uploaded photos and videos from backend on mount or refresh
  useEffect(() => {
    if (!existingMedia || existingMedia.length === 0) return;

    // 1. Exterior Photos
    setExteriorPhotos((prev) => {
      const existingMediaIds = new Set(
        prev.map((p) => p.mediaId).filter(Boolean),
      );
      const remoteItems: UploadedFileItem[] = existingMedia
        .filter(
          (m) =>
            m.status === 'UPLOADED' &&
            m.mimeType.startsWith('image/') &&
            (m.categoryName === 'EXTERIOR' ||
              (!m.categoryName && prev.length === 0)),
        )
        .filter((m) => !existingMediaIds.has(m.id))
        .map((m) => ({
          id: `remote_${m.id}`,
          previewUrl: getMediaFileUrl(m.id),
          name: m.fileName,
          sizeFormatted: formatBytes(m.fileSize),
          type: m.mimeType,
          progress: 100,
          status: 'completed' as const,
          uploadedAt: new Date(m.createdAt),
          mediaId: m.id,
          isRemote: true,
        }));

      if (remoteItems.length === 0) return prev;
      return [...prev, ...remoteItems];
    });

    // 2. Exterior Video
    setExteriorVideo((prev) => {
      if (prev && !prev.isRemote) return prev;
      const remoteVideo = existingMedia.find(
        (m) =>
          m.status === 'UPLOADED' &&
          m.mimeType.startsWith('video/') &&
          (m.categoryName === 'EXTERIOR' || !m.categoryName),
      );
      if (!remoteVideo) return prev;
      return {
        id: `remote_v_${remoteVideo.id}`,
        previewUrl: getMediaFileUrl(remoteVideo.id),
        name: remoteVideo.fileName,
        sizeFormatted: formatBytes(remoteVideo.fileSize),
        type: remoteVideo.mimeType,
        progress: 100,
        status: 'completed' as const,
        uploadedAt: new Date(remoteVideo.createdAt),
        mediaId: remoteVideo.id,
        isRemote: true,
      };
    });

    // 3. Interior Photos
    setInteriorPhotos((prev) => {
      const existingMediaIds = new Set(
        prev.map((p) => p.mediaId).filter(Boolean),
      );
      const remoteItems: UploadedFileItem[] = existingMedia
        .filter(
          (m) =>
            m.status === 'UPLOADED' &&
            m.mimeType.startsWith('image/') &&
            m.categoryName === 'INTERIOR',
        )
        .filter((m) => !existingMediaIds.has(m.id))
        .map((m) => ({
          id: `remote_${m.id}`,
          previewUrl: getMediaFileUrl(m.id),
          name: m.fileName,
          sizeFormatted: formatBytes(m.fileSize),
          type: m.mimeType,
          progress: 100,
          status: 'completed' as const,
          uploadedAt: new Date(m.createdAt),
          mediaId: m.id,
          isRemote: true,
        }));

      if (remoteItems.length === 0) return prev;
      return [...prev, ...remoteItems];
    });

    // 4. Interior Video
    setInteriorVideo((prev) => {
      if (prev && !prev.isRemote) return prev;
      const remoteVideo = existingMedia.find(
        (m) =>
          m.status === 'UPLOADED' &&
          m.mimeType.startsWith('video/') &&
          m.categoryName === 'INTERIOR',
      );
      if (!remoteVideo) return prev;
      return {
        id: `remote_v_${remoteVideo.id}`,
        previewUrl: getMediaFileUrl(remoteVideo.id),
        name: remoteVideo.fileName,
        sizeFormatted: formatBytes(remoteVideo.fileSize),
        type: remoteVideo.mimeType,
        progress: 100,
        status: 'completed' as const,
        uploadedAt: new Date(remoteVideo.createdAt),
        mediaId: remoteVideo.id,
        isRemote: true,
      };
    });

    // 5. Checklist Items (Exact checklistItemCode matching)
    setChecklistFiles((prev) => {
      const updated = { ...prev };
      let changed = false;

      const remoteChecklistMedia = existingMedia.filter(
        (m) =>
          m.status === 'UPLOADED' &&
          (m.categoryName === 'CHECKLIST' || !!m.checklistItemCode),
      );

      for (const m of remoteChecklistMedia) {
        if (!m.checklistItemCode) continue;
        const slotKey = m.checklistItemCode;
        if (
          slotKey in updated &&
          (!updated[slotKey] || updated[slotKey]?.isRemote)
        ) {
          if (updated[slotKey]?.mediaId === m.id) continue;
          updated[slotKey] = {
            id: `remote_chk_${m.id}`,
            previewUrl: getMediaFileUrl(m.id),
            name: m.fileName,
            sizeFormatted: formatBytes(m.fileSize),
            type: m.mimeType,
            progress: 100,
            status: 'completed' as const,
            uploadedAt: new Date(m.createdAt),
            mediaId: m.id,
            isRemote: true,
          };
          changed = true;
        }
      }

      return changed ? updated : prev;
    });
  }, [existingMedia]);

  // Derived counts for staged and completed items
  const exteriorStagedCount = useMemo(
    () =>
      exteriorPhotos.filter(
        (p) => (p.status === 'staged' || p.status === 'error') && p.file,
      ).length,
    [exteriorPhotos],
  );
  const exteriorCompletedCount = useMemo(
    () => exteriorPhotos.filter((p) => p.status === 'completed').length,
    [exteriorPhotos],
  );
  const isExteriorVideoStaged = useMemo(
    () =>
      !!exteriorVideo &&
      (exteriorVideo.status === 'staged' ||
        (exteriorVideo.status === 'error' && !!exteriorVideo.file)),
    [exteriorVideo],
  );
  const totalStep1Staged =
    exteriorStagedCount + (isExteriorVideoStaged ? 1 : 0);

  const interiorStagedCount = useMemo(
    () =>
      interiorPhotos.filter(
        (p) => (p.status === 'staged' || p.status === 'error') && p.file,
      ).length,
    [interiorPhotos],
  );
  const interiorCompletedCount = useMemo(
    () => interiorPhotos.filter((p) => p.status === 'completed').length,
    [interiorPhotos],
  );
  const isInteriorVideoStaged = useMemo(
    () =>
      !!interiorVideo &&
      (interiorVideo.status === 'staged' ||
        (interiorVideo.status === 'error' && !!interiorVideo.file)),
    [interiorVideo],
  );
  const totalStep2Staged =
    interiorStagedCount + (isInteriorVideoStaged ? 1 : 0);

  const checklistStagedCount = useMemo(
    () =>
      Object.values(checklistFiles).filter(
        (c) => c && (c.status === 'staged' || c.status === 'error') && c.file,
      ).length,
    [checklistFiles],
  );
  const checklistUploadedCount = useMemo(
    () =>
      Object.values(checklistFiles).filter((c) => c?.status === 'completed')
        .length,
    [checklistFiles],
  );

  const isAllChecklistCompleted = useMemo(() => {
    if (activeChecklistItems.length === 0) return false;
    return activeChecklistItems.every(
      (item) => checklistFiles[item.id]?.status === 'completed',
    );
  }, [activeChecklistItems, checklistFiles]);

  // Notify parent component whenever media files are successfully uploaded
  useEffect(() => {
    const totalCount =
      exteriorCompletedCount +
      interiorCompletedCount +
      checklistUploadedCount +
      (exteriorVideo?.status === 'completed' ? 1 : 0) +
      (interiorVideo?.status === 'completed' ? 1 : 0);
    onMediaChange?.(totalCount > 0, totalCount);
  }, [
    exteriorCompletedCount,
    interiorCompletedCount,
    checklistUploadedCount,
    exteriorVideo?.status,
    interiorVideo?.status,
    onMediaChange,
  ]);

  // --- Step 1 Handlers ---
  const [isUploadingExterior, setIsUploadingExterior] = useState(false);

  const handleExteriorPhotosDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setValidationError(null);

      const validFiles: File[] = [];
      for (const f of acceptedFiles) {
        if (!f.type.startsWith('image/')) {
          setValidationError(`File "${f.name}" is not a supported image.`);
          return;
        }
        if (f.size > 25 * 1024 * 1024) {
          setValidationError(`File "${f.name}" exceeds the 25 MB limit.`);
          return;
        }
        validFiles.push(f);
      }

      if (exteriorPhotos.length + validFiles.length > 36) {
        setValidationError('Maximum 36 photos allowed in this batch.');
        return;
      }

      const newItems: UploadedFileItem[] = validFiles.map((file) => ({
        id: `ext_p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: registerBlobUrl(URL.createObjectURL(file)),
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        type: file.type,
        progress: 0,
        status: 'staged',
        uploadedAt: new Date(),
      }));

      setExteriorPhotos((prev) => [...prev, ...newItems]);
    },
    [exteriorPhotos.length, registerBlobUrl],
  );

  const uploadStagedExteriorPhotos = useCallback(async (): Promise<boolean> => {
    const staged = exteriorPhotos.filter(
      (p) => (p.status === 'staged' || p.status === 'error') && p.file,
    );
    if (staged.length === 0) return true;

    setIsUploadingExterior(true);
    setValidationError(null);

    const abortController = new AbortController();
    staged.forEach((s) =>
      abortControllersRef.current.set(s.id, abortController),
    );

    setExteriorPhotos((prev) =>
      prev.map((item) =>
        staged.some((s) => s.id === item.id)
          ? {
              ...item,
              status: 'uploading',
              progress: 10,
              errorMessage: undefined,
            }
          : item,
      ),
    );

    try {
      const filesToUpload = staged.map((s) => s.file!);
      const res = await batchUploader.mutateAsync({
        files: filesToUpload,
        categoryId: 'EXTERIOR',
        signal: abortController.signal,
        onProgress: (pct) => {
          const capped = Math.min(pct, 90);
          setExteriorPhotos((prev) =>
            prev.map((item) =>
              staged.some((s) => s.id === item.id)
                ? { ...item, progress: capped }
                : item,
            ),
          );
        },
      });

      let allSucceeded = true;
      setExteriorPhotos((prev) =>
        prev.map((item) => {
          const matchIndex = staged.findIndex((s) => s.id === item.id);
          if (matchIndex === -1) return item;
          const resItem = res.results?.[matchIndex];
          if (!resItem) return { ...item, progress: 100, status: 'completed' };

          if (resItem.status === 'UPLOADED') {
            if (
              item.previewUrl &&
              (!item.isRemote || item.previewUrl.startsWith('blob:'))
            ) {
              revokeBlobUrl(item.previewUrl);
            }
            return {
              ...item,
              previewUrl: getMediaFileUrl(resItem.id),
              file: undefined,
              progress: 100,
              status: 'completed',
              mediaId: resItem.id,
              isRemote: true,
            };
          }
          allSucceeded = false;
          return {
            ...item,
            status: 'error',
            errorCode: (resItem as any).errorCode,
            errorMessage: (resItem as any).errorMessage || 'Upload failed',
            retryable: (resItem as any).retryable ?? true,
          };
        }),
      );
      return allSucceeded;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload exterior photos';
      setValidationError(msg);
      setExteriorPhotos((prev) =>
        prev.map((item) =>
          staged.some((s) => s.id === item.id)
            ? { ...item, status: 'error', errorMessage: msg, retryable: true }
            : item,
        ),
      );
      return false;
    } finally {
      staged.forEach((s) => abortControllersRef.current.delete(s.id));
      setIsUploadingExterior(false);
    }
  }, [batchUploader, exteriorPhotos, revokeBlobUrl]);

  const retryExteriorPhoto = useCallback(
    async (id: string) => {
      const target = exteriorPhotos.find((p) => p.id === id);
      if (!target || !target.file) return;

      const abortController = new AbortController();
      abortControllersRef.current.set(id, abortController);

      setExteriorPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'uploading',
                progress: 10,
                errorMessage: undefined,
              }
            : p,
        ),
      );
      try {
        const res = await singleImageUploader.mutateAsync({
          file: target.file,
          categoryId: 'EXTERIOR',
          signal: abortController.signal,
          onProgress: (pct) => {
            setExteriorPhotos((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: pct } : p)),
            );
          },
        });

        if (
          target.previewUrl &&
          (!target.isRemote || target.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(target.previewUrl);
        }

        setExteriorPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'completed',
                  progress: 100,
                  mediaId: res.id,
                  previewUrl: getMediaFileUrl(res.id),
                  file: undefined,
                  isRemote: true,
                }
              : p,
          ),
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Retry failed';
        setExteriorPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'error', errorMessage: msg, retryable: true }
              : p,
          ),
        );
      } finally {
        abortControllersRef.current.delete(id);
      }
    },
    [exteriorPhotos, revokeBlobUrl, singleImageUploader],
  );

  const [isUploadingExteriorVideo, setIsUploadingExteriorVideo] =
    useState(false);

  const handleExteriorVideoDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setValidationError(null);

      if (!file.type.startsWith('video/')) {
        setValidationError('File must be a supported video format.');
        return;
      }
      if (file.size > 250 * 1024 * 1024) {
        setValidationError('Video exceeds 250 MB size limit.');
        return;
      }

      if (
        exteriorVideo &&
        (!exteriorVideo.isRemote ||
          exteriorVideo.previewUrl.startsWith('blob:'))
      ) {
        revokeBlobUrl(exteriorVideo.previewUrl);
      }
      const item: UploadedFileItem = {
        id: `ext_v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: registerBlobUrl(URL.createObjectURL(file)),
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        type: file.type,
        progress: 0,
        status: 'staged',
        uploadedAt: new Date(),
      };
      setExteriorVideo(item);
    },
    [exteriorVideo, registerBlobUrl, revokeBlobUrl],
  );

  const uploadExteriorVideo = useCallback(async (): Promise<boolean> => {
    if (
      !exteriorVideo ||
      !exteriorVideo.file ||
      exteriorVideo.status === 'completed'
    ) {
      return true;
    }
    setIsUploadingExteriorVideo(true);
    setValidationError(null);

    const abortController = new AbortController();
    abortControllersRef.current.set(exteriorVideo.id, abortController);

    setExteriorVideo((prev) =>
      prev
        ? {
            ...prev,
            status: 'uploading',
            progress: 10,
            errorMessage: undefined,
          }
        : null,
    );
    try {
      const dto = await exteriorVideoUploader.upload({
        file: exteriorVideo.file,
        categoryId: 'EXTERIOR',
        signal: abortController.signal,
      });

      if (
        exteriorVideo.previewUrl &&
        (!exteriorVideo.isRemote ||
          exteriorVideo.previewUrl.startsWith('blob:'))
      ) {
        revokeBlobUrl(exteriorVideo.previewUrl);
      }

      setExteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
              mediaId: dto.id,
              previewUrl: getMediaFileUrl(dto.id),
              file: undefined,
              isRemote: true,
            }
          : null,
      );
      return true;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Exterior video upload failed';
      setValidationError(msg);
      setExteriorVideo((prev) =>
        prev
          ? { ...prev, status: 'error', errorMessage: msg, retryable: true }
          : null,
      );
      return false;
    } finally {
      abortControllersRef.current.delete(exteriorVideo.id);
      setIsUploadingExteriorVideo(false);
    }
  }, [exteriorVideo, exteriorVideoUploader, revokeBlobUrl]);

  const retryExteriorVideo = useCallback(async () => {
    if (!exteriorVideo || !exteriorVideo.file) return;
    await uploadExteriorVideo();
  }, [exteriorVideo, uploadExteriorVideo]);

  const uploadStep1Media = useCallback(async (): Promise<boolean> => {
    let allOk = true;
    const stagedPhotos = exteriorPhotos.filter(
      (p) => (p.status === 'staged' || p.status === 'error') && p.file,
    );
    if (stagedPhotos.length > 0) {
      const photosOk = await uploadStagedExteriorPhotos();
      if (!photosOk) allOk = false;
    }
    if (
      exteriorVideo &&
      (exteriorVideo.status === 'staged' || exteriorVideo.status === 'error') &&
      exteriorVideo.file
    ) {
      const videoOk = await uploadExteriorVideo();
      if (!videoOk) allOk = false;
    }
    return allOk;
  }, [
    exteriorPhotos,
    uploadStagedExteriorPhotos,
    exteriorVideo,
    uploadExteriorVideo,
  ]);

  const removeExteriorPhoto = useCallback(
    (id: string) => {
      const target = exteriorPhotos.find((p) => p.id === id);
      if (target) {
        if (target.status === 'uploading') {
          abortControllersRef.current.get(id)?.abort();
          abortControllersRef.current.delete(id);
        }
        if (!target.isRemote || target.previewUrl.startsWith('blob:')) {
          revokeBlobUrl(target.previewUrl);
        }
      }
      setExteriorPhotos((prev) => prev.filter((p) => p.id !== id));
    },
    [exteriorPhotos, revokeBlobUrl],
  );

  const removeExteriorVideo = useCallback(() => {
    if (exteriorVideo) {
      if (exteriorVideo.status === 'uploading') {
        abortControllersRef.current.get(exteriorVideo.id)?.abort();
        abortControllersRef.current.delete(exteriorVideo.id);
      }
      exteriorVideoUploader.reset();
      if (
        !exteriorVideo.isRemote ||
        exteriorVideo.previewUrl.startsWith('blob:')
      ) {
        revokeBlobUrl(exteriorVideo.previewUrl);
      }
      setExteriorVideo(null);
    }
  }, [exteriorVideo, exteriorVideoUploader, revokeBlobUrl]);

  // --- Step 2 Handlers ---
  const [isUploadingInterior, setIsUploadingInterior] = useState(false);

  const handleInteriorPhotosDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setValidationError(null);

      const validFiles: File[] = [];
      for (const f of acceptedFiles) {
        if (!f.type.startsWith('image/')) {
          setValidationError(`File "${f.name}" is not a supported image.`);
          return;
        }
        if (f.size > 25 * 1024 * 1024) {
          setValidationError(`File "${f.name}" exceeds 25 MB limit.`);
          return;
        }
        validFiles.push(f);
      }

      if (interiorPhotos.length + validFiles.length > 36) {
        setValidationError('Maximum 36 photos allowed per batch.');
        return;
      }

      const newItems: UploadedFileItem[] = validFiles.map((file) => ({
        id: `int_p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: registerBlobUrl(URL.createObjectURL(file)),
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        type: file.type,
        progress: 0,
        status: 'staged',
        uploadedAt: new Date(),
      }));

      setInteriorPhotos((prev) => [...prev, ...newItems]);
    },
    [interiorPhotos.length, registerBlobUrl],
  );

  const uploadStagedInteriorPhotos = useCallback(async (): Promise<boolean> => {
    const staged = interiorPhotos.filter(
      (p) => (p.status === 'staged' || p.status === 'error') && p.file,
    );
    if (staged.length === 0) return true;

    setIsUploadingInterior(true);
    setValidationError(null);

    const abortController = new AbortController();
    staged.forEach((s) =>
      abortControllersRef.current.set(s.id, abortController),
    );

    setInteriorPhotos((prev) =>
      prev.map((item) =>
        staged.some((s) => s.id === item.id)
          ? {
              ...item,
              status: 'uploading',
              progress: 10,
              errorMessage: undefined,
            }
          : item,
      ),
    );

    try {
      const filesToUpload = staged.map((s) => s.file!);
      const res = await batchUploader.mutateAsync({
        files: filesToUpload,
        categoryId: 'INTERIOR',
        signal: abortController.signal,
        onProgress: (pct) => {
          const capped = Math.min(pct, 90);
          setInteriorPhotos((prev) =>
            prev.map((item) =>
              staged.some((s) => s.id === item.id)
                ? { ...item, progress: capped }
                : item,
            ),
          );
        },
      });

      let allSucceeded = true;
      setInteriorPhotos((prev) =>
        prev.map((item) => {
          const matchIndex = staged.findIndex((s) => s.id === item.id);
          if (matchIndex === -1) return item;
          const resItem = res.results?.[matchIndex];
          if (!resItem) return { ...item, progress: 100, status: 'completed' };

          if (resItem.status === 'UPLOADED') {
            if (
              item.previewUrl &&
              (!item.isRemote || item.previewUrl.startsWith('blob:'))
            ) {
              revokeBlobUrl(item.previewUrl);
            }
            return {
              ...item,
              previewUrl: getMediaFileUrl(resItem.id),
              file: undefined,
              progress: 100,
              status: 'completed',
              mediaId: resItem.id,
              isRemote: true,
            };
          }
          allSucceeded = false;
          return {
            ...item,
            status: 'error',
            errorCode: (resItem as any).errorCode,
            errorMessage: (resItem as any).errorMessage || 'Upload failed',
            retryable: (resItem as any).retryable ?? true,
          };
        }),
      );
      return allSucceeded;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload interior photos';
      setValidationError(msg);
      setInteriorPhotos((prev) =>
        prev.map((item) =>
          staged.some((s) => s.id === item.id)
            ? { ...item, status: 'error', errorMessage: msg, retryable: true }
            : item,
        ),
      );
      return false;
    } finally {
      staged.forEach((s) => abortControllersRef.current.delete(s.id));
      setIsUploadingInterior(false);
    }
  }, [batchUploader, interiorPhotos, revokeBlobUrl]);

  const retryInteriorPhoto = useCallback(
    async (id: string) => {
      const target = interiorPhotos.find((p) => p.id === id);
      if (!target || !target.file) return;

      const abortController = new AbortController();
      abortControllersRef.current.set(id, abortController);

      setInteriorPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'uploading',
                progress: 10,
                errorMessage: undefined,
              }
            : p,
        ),
      );
      try {
        const res = await singleImageUploader.mutateAsync({
          file: target.file,
          categoryId: 'INTERIOR',
          signal: abortController.signal,
          onProgress: (pct) => {
            setInteriorPhotos((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: pct } : p)),
            );
          },
        });

        if (
          target.previewUrl &&
          (!target.isRemote || target.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(target.previewUrl);
        }

        setInteriorPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'completed',
                  progress: 100,
                  mediaId: res.id,
                  previewUrl: getMediaFileUrl(res.id),
                  file: undefined,
                  isRemote: true,
                }
              : p,
          ),
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Retry failed';
        setInteriorPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'error', errorMessage: msg, retryable: true }
              : p,
          ),
        );
      } finally {
        abortControllersRef.current.delete(id);
      }
    },
    [interiorPhotos, revokeBlobUrl, singleImageUploader],
  );

  const [isUploadingInteriorVideo, setIsUploadingInteriorVideo] =
    useState(false);

  const handleInteriorVideoDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
        setValidationError('File must be a supported video format.');
        return;
      }
      if (file.size > 250 * 1024 * 1024) {
        setValidationError('Video exceeds 250 MB size limit.');
        return;
      }

      if (
        interiorVideo &&
        (!interiorVideo.isRemote ||
          interiorVideo.previewUrl.startsWith('blob:'))
      ) {
        revokeBlobUrl(interiorVideo.previewUrl);
      }
      const item: UploadedFileItem = {
        id: `int_v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: registerBlobUrl(URL.createObjectURL(file)),
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        type: file.type,
        progress: 0,
        status: 'staged',
        uploadedAt: new Date(),
      };
      setInteriorVideo(item);
    },
    [interiorVideo, registerBlobUrl, revokeBlobUrl],
  );

  const uploadInteriorVideo = useCallback(async (): Promise<boolean> => {
    if (
      !interiorVideo ||
      !interiorVideo.file ||
      interiorVideo.status === 'completed'
    ) {
      return true;
    }
    setIsUploadingInteriorVideo(true);
    setValidationError(null);

    const abortController = new AbortController();
    abortControllersRef.current.set(interiorVideo.id, abortController);

    setInteriorVideo((prev) =>
      prev
        ? {
            ...prev,
            status: 'uploading',
            progress: 10,
            errorMessage: undefined,
          }
        : null,
    );
    try {
      const dto = await interiorVideoUploader.upload({
        file: interiorVideo.file,
        categoryId: 'INTERIOR',
        signal: abortController.signal,
      });

      if (
        interiorVideo.previewUrl &&
        (!interiorVideo.isRemote ||
          interiorVideo.previewUrl.startsWith('blob:'))
      ) {
        revokeBlobUrl(interiorVideo.previewUrl);
      }

      setInteriorVideo((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
              mediaId: dto.id,
              previewUrl: getMediaFileUrl(dto.id),
              file: undefined,
              isRemote: true,
            }
          : null,
      );
      return true;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Interior video upload failed';
      setValidationError(msg);
      setInteriorVideo((prev) =>
        prev
          ? { ...prev, status: 'error', errorMessage: msg, retryable: true }
          : null,
      );
      return false;
    } finally {
      abortControllersRef.current.delete(interiorVideo.id);
      setIsUploadingInteriorVideo(false);
    }
  }, [interiorVideo, interiorVideoUploader, revokeBlobUrl]);

  const retryInteriorVideo = useCallback(async () => {
    if (!interiorVideo || !interiorVideo.file) return;
    await uploadInteriorVideo();
  }, [interiorVideo, uploadInteriorVideo]);

  const uploadStep2Media = useCallback(async (): Promise<boolean> => {
    let allOk = true;
    const stagedPhotos = interiorPhotos.filter(
      (p) => (p.status === 'staged' || p.status === 'error') && p.file,
    );
    if (stagedPhotos.length > 0) {
      const photosOk = await uploadStagedInteriorPhotos();
      if (!photosOk) allOk = false;
    }
    if (
      interiorVideo &&
      (interiorVideo.status === 'staged' || interiorVideo.status === 'error') &&
      interiorVideo.file
    ) {
      const videoOk = await uploadInteriorVideo();
      if (!videoOk) allOk = false;
    }
    return allOk;
  }, [
    interiorPhotos,
    uploadStagedInteriorPhotos,
    interiorVideo,
    uploadInteriorVideo,
  ]);

  const removeInteriorPhoto = useCallback(
    (id: string) => {
      const target = interiorPhotos.find((p) => p.id === id);
      if (target) {
        if (target.status === 'uploading') {
          abortControllersRef.current.get(id)?.abort();
          abortControllersRef.current.delete(id);
        }
        if (!target.isRemote || target.previewUrl.startsWith('blob:')) {
          revokeBlobUrl(target.previewUrl);
        }
      }
      setInteriorPhotos((prev) => prev.filter((p) => p.id !== id));
    },
    [interiorPhotos, revokeBlobUrl],
  );

  const removeInteriorVideo = useCallback(() => {
    if (interiorVideo) {
      if (interiorVideo.status === 'uploading') {
        abortControllersRef.current.get(interiorVideo.id)?.abort();
        abortControllersRef.current.delete(interiorVideo.id);
      }
      interiorVideoUploader.reset();
      if (
        !interiorVideo.isRemote ||
        interiorVideo.previewUrl.startsWith('blob:')
      ) {
        revokeBlobUrl(interiorVideo.previewUrl);
      }
      setInteriorVideo(null);
    }
  }, [interiorVideo, interiorVideoUploader, revokeBlobUrl]);

  // --- Step 3 Handlers (Checklist Items) ---
  const [isUploadingChecklist, setIsUploadingChecklist] = useState(false);

  const handleChecklistDrop = useCallback(
    (itemId: string, files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setValidationError('File must be an image or video.');
        return;
      }
      if (file.size > 25 * 1024 * 1024 && file.type.startsWith('image/')) {
        setValidationError('Checklist photo exceeds 25 MB limit.');
        return;
      }

      if (
        checklistFiles[itemId] &&
        (!checklistFiles[itemId]!.isRemote ||
          checklistFiles[itemId]!.previewUrl.startsWith('blob:'))
      ) {
        revokeBlobUrl(checklistFiles[itemId]!.previewUrl);
      }

      const item: UploadedFileItem = {
        id: `chk_${itemId}_${Date.now()}`,
        file,
        previewUrl: registerBlobUrl(URL.createObjectURL(file)),
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        type: file.type,
        progress: 0,
        status: 'staged',
        uploadedAt: new Date(),
      };

      setChecklistFiles((prev) => ({ ...prev, [itemId]: item }));
    },
    [checklistFiles, registerBlobUrl, revokeBlobUrl],
  );

  const uploadStagedChecklistItems = useCallback(async (): Promise<boolean> => {
    const stagedEntries = Object.entries(checklistFiles).filter(
      ([_, item]) =>
        item &&
        (item.status === 'staged' || item.status === 'error') &&
        item.file,
    );
    if (stagedEntries.length === 0) return true;

    setIsUploadingChecklist(true);
    let allOk = true;

    for (const [itemId, item] of stagedEntries) {
      if (!item || !item.file) continue;

      const abortController = new AbortController();
      abortControllersRef.current.set(item.id, abortController);

      setChecklistFiles((prev) => {
        const cur = prev[itemId];
        if (!cur) return prev;
        return {
          ...prev,
          [itemId]: {
            ...cur,
            status: 'uploading',
            progress: 15,
            errorMessage: undefined,
          },
        };
      });

      try {
        const res = await singleImageUploader.mutateAsync({
          file: item.file,
          categoryId: 'CHECKLIST',
          checklistItemCode: itemId,
          signal: abortController.signal,
          onProgress: (pct) => {
            setChecklistFiles((prev) => {
              const cur = prev[itemId];
              if (!cur) return prev;
              return { ...prev, [itemId]: { ...cur, progress: pct } };
            });
          },
        });

        if (
          item.previewUrl &&
          (!item.isRemote || item.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(item.previewUrl);
        }

        setChecklistFiles((prev) => {
          const cur = prev[itemId];
          if (!cur) return prev;
          return {
            ...prev,
            [itemId]: {
              ...cur,
              status: 'completed',
              progress: 100,
              mediaId: res.id,
              previewUrl: getMediaFileUrl(res.id),
              file: undefined,
              isRemote: true,
            },
          };
        });
      } catch (err: any) {
        allOk = false;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Checklist photo upload failed';
        setChecklistFiles((prev) => {
          const cur = prev[itemId];
          if (!cur) return prev;
          return {
            ...prev,
            [itemId]: {
              ...cur,
              status: 'error',
              errorMessage: msg,
              retryable: true,
            },
          };
        });
      } finally {
        abortControllersRef.current.delete(item.id);
      }
    }

    setIsUploadingChecklist(false);
    return allOk;
  }, [checklistFiles, revokeBlobUrl, singleImageUploader]);

  const retryChecklistItem = useCallback(
    async (itemId: string) => {
      const item = checklistFiles[itemId];
      if (!item || !item.file) return;

      const abortController = new AbortController();
      abortControllersRef.current.set(item.id, abortController);

      setChecklistFiles((prev) => {
        const cur = prev[itemId];
        if (!cur) return prev;
        return {
          ...prev,
          [itemId]: {
            ...cur,
            status: 'uploading',
            progress: 10,
            errorMessage: undefined,
          },
        };
      });

      try {
        const res = await singleImageUploader.mutateAsync({
          file: item.file,
          categoryId: 'CHECKLIST',
          checklistItemCode: itemId,
          signal: abortController.signal,
          onProgress: (pct) => {
            setChecklistFiles((prev) => {
              const cur = prev[itemId];
              if (!cur) return prev;
              return { ...prev, [itemId]: { ...cur, progress: pct } };
            });
          },
        });

        if (
          item.previewUrl &&
          (!item.isRemote || item.previewUrl.startsWith('blob:'))
        ) {
          revokeBlobUrl(item.previewUrl);
        }

        setChecklistFiles((prev) => {
          const cur = prev[itemId];
          if (!cur) return prev;
          return {
            ...prev,
            [itemId]: {
              ...cur,
              status: 'completed',
              progress: 100,
              mediaId: res.id,
              previewUrl: getMediaFileUrl(res.id),
              file: undefined,
              isRemote: true,
            },
          };
        });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Checklist retry failed';
        setChecklistFiles((prev) => {
          const cur = prev[itemId];
          if (!cur) return prev;
          return {
            ...prev,
            [itemId]: {
              ...cur,
              status: 'error',
              errorMessage: msg,
              retryable: true,
            },
          };
        });
      } finally {
        abortControllersRef.current.delete(item.id);
      }
    },
    [checklistFiles, revokeBlobUrl, singleImageUploader],
  );

  const removeChecklistItem = useCallback(
    (itemId: string) => {
      const target = checklistFiles[itemId];
      if (target) {
        if (target.status === 'uploading') {
          abortControllersRef.current.get(target.id)?.abort();
          abortControllersRef.current.delete(target.id);
        }
        if (!target.isRemote || target.previewUrl.startsWith('blob:')) {
          revokeBlobUrl(target.previewUrl);
        }
      }
      setChecklistFiles((prev) => ({ ...prev, [itemId]: null }));
    },
    [checklistFiles, revokeBlobUrl],
  );

  // --- Step Navigation & Validation ---
  const handleNext = async () => {
    setValidationError(null);
    if (currentStep === 1) {
      // Upload staged Step 1 media (photos + optional video) if any were selected
      const hasStagedStep1 =
        exteriorPhotos.some(
          (p) => p.status === 'staged' || p.status === 'error',
        ) ||
        (exteriorVideo &&
          (exteriorVideo.status === 'staged' ||
            exteriorVideo.status === 'error'));

      if (hasStagedStep1) {
        const ok = await uploadStep1Media();
        if (!ok) return;
      }

      if (
        exteriorVideo &&
        (exteriorVideo.status === 'uploading' ||
          exteriorVideoUploader.status === 'uploading')
      ) {
        setValidationError(
          'Exterior video is still uploading. Please wait until it completes or remove it.',
        );
        return;
      }
      if (exteriorVideo && exteriorVideo.status !== 'completed') {
        setValidationError(
          'Exterior video must be successfully uploaded before continuing, or remove it.',
        );
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Upload staged Step 2 media (photos + optional video) if any were selected
      const hasStagedStep2 =
        interiorPhotos.some(
          (p) => p.status === 'staged' || p.status === 'error',
        ) ||
        (interiorVideo &&
          (interiorVideo.status === 'staged' ||
            interiorVideo.status === 'error'));

      if (hasStagedStep2) {
        const ok = await uploadStep2Media();
        if (!ok) return;
      }

      if (
        interiorVideo &&
        (interiorVideo.status === 'uploading' ||
          interiorVideoUploader.status === 'uploading')
      ) {
        setValidationError(
          'Interior video is still uploading. Please wait or remove it.',
        );
        return;
      }
      if (interiorVideo && interiorVideo.status !== 'completed') {
        setValidationError(
          'Interior video must be successfully uploaded before continuing, or remove it.',
        );
        return;
      }

      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmitReview = async () => {
    setValidationError(null);

    // 1. Upload any staged checklist photos before final submission
    const hasStagedChecklist = Object.values(checklistFiles).some(
      (c) => c && (c.status === 'staged' || c.status === 'error') && c.file,
    );
    if (hasStagedChecklist) {
      const checklistOk = await uploadStagedChecklistItems();
      if (!checklistOk) {
        setValidationError(
          'Some checklist photos failed to upload. Please retry before submitting.',
        );
        return;
      }
    }

    // 2. Upload any staged exterior photos/video if pending
    const hasStagedStep1 =
      exteriorPhotos.some((p) => p.status === 'staged' || p.status === 'error') ||
      (exteriorVideo && (exteriorVideo.status === 'staged' || exteriorVideo.status === 'error'));
    if (hasStagedStep1) {
      const step1Ok = await uploadStep1Media();
      if (!step1Ok) {
        setValidationError(
          'Some exterior media failed to upload. Please retry or remove them.',
        );
        return;
      }
    }

    // 3. Upload any staged interior photos/video if pending
    const hasStagedStep2 =
      interiorPhotos.some((p) => p.status === 'staged' || p.status === 'error') ||
      (interiorVideo && (interiorVideo.status === 'staged' || interiorVideo.status === 'error'));
    if (hasStagedStep2) {
      const step2Ok = await uploadStep2Media();
      if (!step2Ok) {
        setValidationError(
          'Some interior media failed to upload. Please retry or remove them.',
        );
        return;
      }
    }

    if (exteriorVideo && exteriorVideo.status !== 'completed') {
      setValidationError(
        'Exterior video must be fully uploaded before submitting review, or remove it.',
      );
      return;
    }

    if (interiorVideo && interiorVideo.status !== 'completed') {
      setValidationError(
        'Interior video must be fully uploaded before submitting review, or remove it.',
      );
      return;
    }

    const isUploadingAny =
      isUploadingExterior ||
      isUploadingExteriorVideo ||
      isUploadingInterior ||
      isUploadingInteriorVideo ||
      isUploadingChecklist ||
      exteriorPhotos.some((p) => p.status === 'uploading') ||
      interiorPhotos.some((p) => p.status === 'uploading') ||
      (interiorVideo && interiorVideo.status === 'uploading') ||
      Object.values(checklistFiles).some((c) => c?.status === 'uploading');

    if (isUploadingAny) {
      setValidationError(
        'Please wait until all uploads finish before submitting.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      setIsSubmittedSuccessfully(true);
      queryClient.invalidateQueries({ queryKey: ['inspection-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['inspection-request-detail', activeInspectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inspection-media', activeInspectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inspection-evidence-media', activeInspectionId],
      });

      onCompleted?.({
        exteriorPhotos,
        exteriorVideo,
        interiorPhotos,
        interiorVideo,
        checklistItems: checklistFiles,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to complete media review';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetWizard = () => {
    abortControllersRef.current.forEach((controller) => {
      try {
        controller.abort();
      } catch {
        // no-op
      }
    });
    abortControllersRef.current.clear();

    activeBlobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    });
    activeBlobUrlsRef.current.clear();
    setCurrentStep(1);
    setExteriorPhotos([]);
    setExteriorVideo(null);
    setInteriorPhotos([]);
    setInteriorVideo(null);
    setChecklistFiles(() => {
      const initial: Record<string, UploadedFileItem | null> = {};
      CHECKLIST_ITEMS.forEach((item) => {
        initial[item.id] = null;
      });
      return initial;
    });
    setValidationError(null);
    setIsSubmittedSuccessfully(false);
  };

  // Checklist statistics
  const totalPhotosCount =
    exteriorPhotos.length + interiorPhotos.length + checklistUploadedCount;
  const totalVideosCount = (exteriorVideo ? 1 : 0) + (interiorVideo ? 1 : 0);

  return (
    <>
      {/* Liquid Glass Optical Filters Definition */}
      <svg
        className="pointer-events-none absolute -z-50 h-0 w-0 opacity-0 overflow-hidden"
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0 }}
      >
        <defs>
          <filter
            id="container-glass"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.008"
              numOctaves="2"
              seed="92"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blur"
              scale="38"
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp"
            />
            <feGaussianBlur in="disp" stdDeviation="0.02" result="smooth" />
          </filter>
          <filter
            id="btn-glass"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.012"
              numOctaves="2"
              seed="42"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blur"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <GlassButton
              intent="emerald"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:rotate-90"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              }
              showChevron
            >
              Complete Media Review
            </GlassButton>
          )}
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-white dark:bg-[#0c1017] text-neutral-900 dark:text-neutral-100 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
        >
          {/* Top Header */}
          <SheetHeader className="px-4 py-4 pe-12 sm:px-6 sm:py-5 sm:pe-14 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 backdrop-blur-md shrink-0">
            <div className="flex flex-col gap-1 text-start">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileCheck2 className="size-3.5" />
                  Multi-Step Inspection Wizard
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {requestId}
                </span>
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Complete Media Review
              </SheetTitle>
              <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                {vehicleName} • Batch upload exterior/interior visual evidence
                and review checklist items.
              </SheetDescription>
            </div>

            {/* Stepper Progress Bar */}
            {!isSubmittedSuccessfully && (
              <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 cursor-pointer border',
                      currentStep === 1
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : exteriorCompletedCount > 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
                          : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        currentStep === 1
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                          : exteriorCompletedCount > 0
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500',
                      )}
                    >
                      {exteriorCompletedCount > 0 ? (
                        <Check className="size-4 stroke-[2.5]" />
                      ) : (
                        <Car className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                        Step 1
                      </p>
                      <p className="truncate text-xs font-bold">
                        Exterior Media
                      </p>
                    </div>
                  </button>

                  {/* Step 2 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 cursor-pointer border',
                      currentStep === 2
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : interiorCompletedCount > 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
                          : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        currentStep === 2
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                          : interiorCompletedCount > 0
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500',
                      )}
                    >
                      {interiorCompletedCount > 0 ? (
                        <Check className="size-4 stroke-[2.5]" />
                      ) : (
                        <Armchair className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                        Step 2
                      </p>
                      <p className="truncate text-xs font-bold">
                        Interior Media
                      </p>
                    </div>
                  </button>

                  {/* Step 3 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 cursor-pointer border',
                      currentStep === 3
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : isAllChecklistCompleted || checklistUploadedCount > 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
                          : 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        currentStep === 3
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                          : isAllChecklistCompleted || checklistUploadedCount > 0
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500',
                      )}
                    >
                      {isAllChecklistCompleted || checklistUploadedCount > 0 ? (
                        <Check className="size-4 stroke-[2.5]" />
                      ) : (
                        <ClipboardCheck className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                        Step 3
                      </p>
                      <p className="truncate text-xs font-bold">
                        Checklist Items
                      </p>
                    </div>
                  </button>
                </div>

                {/* Progress Line */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
                    style={{
                      width:
                        currentStep === 1
                          ? '33%'
                          : currentStep === 2
                            ? '66%'
                            : '100%',
                    }}
                  />
                </div>
              </div>
            )}
          </SheetHeader>

          {/* Scrollable Wizard Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {validationError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300 animate-in fade-in-0 duration-200">
                <AlertCircle className="size-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-800 dark:text-rose-200">
                    Required Action
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    {validationError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* STEP 1: EXTERIOR MEDIA */}
            {currentStep === 1 && !isSubmittedSuccessfully && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Car className="size-5 text-emerald-500" />
                    Step 1: Exterior Photos & Video
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Upload photos of vehicle exterior angles (Optional).
                    Exterior walkaround video is also optional.
                  </p>
                </div>

                {/* 1. Batch Exterior Photos Dropzone (Liquid Glass) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      <FileImage className="size-4 text-emerald-500" />
                      Exterior Photos (Batch Selection)
                    </label>
                    <span className="text-xs font-medium text-neutral-500">
                      {exteriorCompletedCount} uploaded
                      {exteriorStagedCount > 0
                        ? ` · ${exteriorStagedCount} staged`
                        : ''}
                    </span>
                  </div>

                  <BatchPhotosDropzone
                    onDrop={handleExteriorPhotosDrop}
                    badgeText="Multi-photo selection enabled"
                    emptyText="Drag & drop exterior photos here, or click to browse"
                    acceptSubtext="Supports JPG, PNG, WEBP, HEIC (Unlimited batch files)"
                  />

                  {/* Uploaded Photos Grid */}
                  {exteriorPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {exteriorPhotos.map((photo) => (
                        <PhotoThumbnailCard
                          key={photo.id}
                          item={photo}
                          onRemove={() => removeExteriorPhoto(photo.id)}
                          onRetry={() => retryExteriorPhoto(photo.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Exterior Video Dropzone (OPTIONAL, Liquid Glass) */}
                <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-emerald-500" />
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Exterior Walkaround Video
                      </label>
                      <span className="inline-flex items-center rounded-md bg-neutral-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border border-neutral-500/20">
                        Optional
                      </span>
                    </div>
                    {exteriorVideo && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Video ready
                      </span>
                    )}
                  </div>

                  {!exteriorVideo ? (
                    <SingleVideoDropzone
                      onDrop={handleExteriorVideoDrop}
                      isRequired={false}
                      emptyTitle="Upload 360 Walkaround Video"
                      emptySubtitle="Continuous video recording circling the entire vehicle exterior (Optional)"
                    />
                  ) : (
                    <VideoCard
                      item={exteriorVideo}
                      isRequired={false}
                      onRemove={removeExteriorVideo}
                      onRetry={retryExteriorVideo}
                    />
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: INTERIOR MEDIA */}
            {currentStep === 2 && !isSubmittedSuccessfully && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Armchair className="size-5 text-teal-500" />
                    Step 2: Interior Cabin & Cargo Media
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Capture the front console, upholstery, rear seats,
                    and cargo area (Optional). Interior video is also optional.
                  </p>
                </div>

                {/* 1. Batch Interior Photos Dropzone (Liquid Glass) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      <FileImage className="size-4 text-teal-500" />
                      Interior Photos (Batch Selection)
                    </label>
                    <span className="text-xs font-medium text-neutral-500">
                      {interiorCompletedCount} uploaded
                      {interiorStagedCount > 0
                        ? ` · ${interiorStagedCount} staged`
                        : ''}
                    </span>
                  </div>

                  <BatchPhotosDropzone
                    onDrop={handleInteriorPhotosDrop}
                    badgeText="Cabin & upholstery gallery"
                    emptyText="Drag & drop interior photos here, or click to browse"
                    acceptSubtext="Upload steering wheel, infotainment, leather condition, and trunk"
                  />

                  {/* Uploaded Interior Photos Grid */}
                  {interiorPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {interiorPhotos.map((photo) => (
                        <PhotoThumbnailCard
                          key={photo.id}
                          item={photo}
                          onRemove={() => removeInteriorPhoto(photo.id)}
                          onRetry={() => retryInteriorPhoto(photo.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Interior Video Dropzone (OPTIONAL, Liquid Glass) */}
                <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-teal-500" />
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Interior Cabin Video
                      </label>
                      <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        Optional
                      </span>
                    </div>
                    {interiorVideo && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Uploaded
                      </span>
                    )}
                  </div>

                  {!interiorVideo ? (
                    <SingleVideoDropzone
                      onDrop={handleInteriorVideoDrop}
                      isRequired={false}
                      emptyTitle="Optional 360 Interior Video Pan"
                      emptySubtitle="Continuous video pan through cockpit, roof liner, and center console"
                    />
                  ) : (
                    <VideoCard
                      item={interiorVideo}
                      isRequired={false}
                      onRemove={removeInteriorVideo}
                      onRetry={retryInteriorVideo}
                    />
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: INSPECTION CHECKLIST ITEMS */}
            {currentStep === 3 && !isSubmittedSuccessfully && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <ClipboardCheck className="size-5 text-emerald-500" />
                      Step 3: Specific Checklist Item Dropzones
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Drop a single dedicated inspection image next to each
                      specific compliance component.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {checklistUploadedCount} / {activeChecklistItems.length}
                    </span>
                    <span>Items Documented</span>
                  </div>
                </div>

                {/* Mandatory Checklist Requirement Warning Banner */}
                {checklistUploadedCount < activeChecklistItems.length ? (
                  <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-900 dark:text-blue-200">
                    <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <span className="font-semibold">Checklist Photos (Optional):</span>{' '}
                      You can upload photos for any of the {activeChecklistItems.length} checklist items ({checklistUploadedCount} uploaded).
                      You can upload partial checklist items or proceed without uploading all of them.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      All {activeChecklistItems.length} checklist items are documented and verified. You may now complete and submit the review.
                    </span>
                  </div>
                )}

                {/* Checklist rows */}
                <div className="space-y-3">
                  {activeChecklistItems.map((item) => {
                    const uploaded = checklistFiles[item.id];
                    const ItemIcon = item.icon;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-200',
                          uploaded
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
                        )}
                      >
                        {/* Left: Item Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                              uploaded
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                            )}
                          >
                            {uploaded?.status === 'completed' ? (
                              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ItemIcon className="size-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                {item.title}
                              </span>
                              {uploaded ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Verified
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-400">
                                  Angle: {item.suggestedAngle}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Right: Inline Single-File Dropzone or Uploaded Preview */}
                        <div className="w-full sm:w-auto shrink-0">
                          {!uploaded ? (
                            <ChecklistInlineDropzone
                              onDrop={(files) =>
                                handleChecklistDrop(item.id, files)
                              }
                            />
                          ) : (
                            <ChecklistUploadedInlineCard
                              item={uploaded}
                              onRemove={() => removeChecklistItem(item.id)}
                              onRetry={() => retryChecklistItem(item.id)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUCCESS / SUBMITTED SUMMARY STATE */}
            {isSubmittedSuccessfully && (
              <div className="py-6 flex flex-col items-center text-center animate-in zoom-in-95 fade-in-0 duration-400">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30">
                  <Sparkles className="size-8" />
                </div>

                <h3 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
                  Media Review Uploaded Successfully!
                </h3>
                <p className="mt-1 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
                  All visual evidence for{' '}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {vehicleName}
                  </span>{' '}
                  has been uploaded to the backend and recorded.
                </p>

                {/* Statistics Summary Cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 text-start">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-semibold">
                        Total Photos
                      </span>
                      <FileImage className="size-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                      {totalPhotosCount}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {exteriorPhotos.length} exterior, {interiorPhotos.length}{' '}
                      interior, {checklistUploadedCount} checklist
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 text-start">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-semibold">Videos</span>
                      <Video className="size-4 text-teal-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                      {totalVideosCount}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Exterior (Required) {interiorVideo ? '+ Interior' : ''}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 text-start">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-xs font-semibold">
                        Checklist Items
                      </span>
                      <ClipboardCheck className="size-4 text-cyan-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                      {checklistUploadedCount} / {activeChecklistItems.length}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {checklistUploadedCount === activeChecklistItems.length
                        ? '100% item coverage'
                        : `${activeChecklistItems.length - checklistUploadedCount} pending item`}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-8 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetWizard}
                    className="rounded-xl cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="size-4" />
                    Reset & Upload Another
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="px-6"
                  >
                    Close Drawer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Navigation Footer */}
          {!isSubmittedSuccessfully && (
            <SheetFooter className="px-4 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 backdrop-blur-md flex flex-row flex-wrap items-center justify-between gap-2 shrink-0">
              <div>
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-xl cursor-pointer gap-1.5 text-xs"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                    Back
                  </Button>
                ) : (
                  <span className="text-xs text-neutral-400">Step 1 of 3</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStep === 1 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploadingExterior || isUploadingExteriorVideo}
                    onClick={handleNext}
                    className="gap-1.5 text-xs px-5"
                  >
                    {isUploadingExterior || isUploadingExteriorVideo ? (
                      <>
                        <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Uploading Step 1 Media...</span>
                      </>
                    ) : totalStep1Staged > 0 ? (
                      <>
                        <span>Upload & Continue to Step 2</span>
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </>
                    ) : (
                      <>
                        <span>Continue to Step 2</span>
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploadingInterior || isUploadingInteriorVideo}
                    onClick={handleNext}
                    className="gap-1.5 text-xs px-5"
                  >
                    {isUploadingInterior || isUploadingInteriorVideo ? (
                      <>
                        <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Uploading Step 2 Media...</span>
                      </>
                    ) : totalStep2Staged > 0 ? (
                      <>
                        <span>Upload & Continue to Step 3</span>
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </>
                    ) : (
                      <>
                        <span>Continue to Step 3</span>
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    type="button"
                    disabled={isSubmitting || isUploadingChecklist}
                    onClick={handleSubmitReview}
                    className="rounded-xl text-white cursor-pointer gap-2 text-xs px-6 shadow-md font-semibold transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                  >
                    {isSubmitting || isUploadingChecklist ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>
                          {isUploadingChecklist
                            ? 'Uploading Checklist...'
                            : 'Submitting Review...'}
                        </span>
                      </>
                    ) : checklistStagedCount > 0 ? (
                      <>
                        <UploadCloud className="size-4" />
                        <span>
                          Upload Checklist & Submit ({checklistUploadedCount + checklistStagedCount}/{activeChecklistItems.length})
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>
                          {checklistUploadedCount > 0
                            ? `Submit Media Review (${checklistUploadedCount} checklist photos)`
                            : 'Submit Media Review'}
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// =========================================================================
// SUBCOMPONENTS: Dropzones, Thumbnails, and Cards (Liquid Glass)
// =========================================================================

/**
 * Batch Photos Dropzone (Liquid Glass Effect)
 */
function BatchPhotosDropzone({
  onDrop,
  badgeText,
  emptyText,
  acceptSubtext,
}: {
  onDrop: (files: File[]) => void;
  badgeText: string;
  emptyText: string;
  acceptSubtext: string;
}) {
  const inputId = useId();
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
      },
      multiple: true,
    });

  return (
    <div
      {...getRootProps()}
      data-drag-active={isDragActive}
      className={cn(
        'glassContainer group relative flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none transition-all duration-300',
        isDragActive &&
          'ring-2 ring-emerald-500/60 shadow-xl shadow-emerald-500/20',
        isDragReject && 'border-rose-500/80 bg-rose-500/10',
      )}
    >
      <input id={inputId} {...getInputProps()} />

      {/* Central Liquid Glass Add Button */}
      <div className="relative mb-3 flex items-center justify-center">
        <button
          type="button"
          tabIndex={-1}
          className="glassBtn group-hover:scale-110 active:scale-95 transition-transform duration-300 pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-700 dark:text-emerald-300 drop-shadow-sm transition-transform duration-300 group-hover:rotate-90"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-sm font-bold text-neutral-900 dark:text-white transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
          {isDragActive
            ? 'Release to drop photos into liquid glass vault'
            : emptyText}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
          {acceptSubtext}
        </p>
      </div>

      <span className="relative z-10 mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-white/10 shadow-xs border border-white/60 dark:border-white/10 backdrop-blur-md">
        <Sparkles className="size-3 text-emerald-500" />
        {badgeText}
      </span>
    </div>
  );
}

/**
 * Single Video Dropzone (Liquid Glass Effect)
 */
function SingleVideoDropzone({
  onDrop,
  isRequired,
  emptyTitle,
  emptySubtitle,
}: {
  onDrop: (files: File[]) => void;
  isRequired: boolean;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  const inputId = useId();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm', '.avi'],
    },
    multiple: false,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      data-drag-active={isDragActive}
      data-variant={isRequired ? 'video-required' : 'video-optional'}
      className={cn(
        'glassContainer group relative flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none transition-all duration-300',
        isDragActive &&
          'ring-2 ring-emerald-500/60 shadow-xl shadow-emerald-500/20',
      )}
    >
      <input id={inputId} {...getInputProps()} />

      {/* Central Liquid Glass Button with Plus / Video */}
      <div className="relative mb-3 flex items-center justify-center">
        <button
          type="button"
          tabIndex={-1}
          className={cn(
            'glassBtn group-hover:scale-110 active:scale-95 transition-transform duration-300 pointer-events-none',
            isRequired
              ? 'after:ring-1 after:ring-rose-500/40'
              : 'after:ring-1 after:ring-teal-500/40',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'drop-shadow-sm transition-transform duration-300 group-hover:scale-110',
              isRequired
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-teal-600 dark:text-teal-300',
            )}
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-sm font-bold text-neutral-900 dark:text-white transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">
          {isDragActive ? 'Release to upload video' : emptyTitle}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
          {emptySubtitle}
        </p>
      </div>

      <span
        className={cn(
          'relative z-10 mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-xs backdrop-blur-md border',
          isRequired
            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
        )}
      >
        <Video className="size-3" />
        Supports MP4, MOV, WEBM (Up to 250MB)
      </span>
    </div>
  );
}

/**
 * Thumbnail Card for Batch Photos
 */
function PhotoThumbnailCard({
  item,
  onRemove,
  onRetry,
}: {
  item: UploadedFileItem;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const isUploading = item.status === 'uploading';
  const isError = item.status === 'error';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs transition-all hover:shadow-md">
      {/* Image Preview */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 backdrop-blur-2xs">
            <div className="w-full max-w-[80%] space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-white">
                {item.progress}%
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-emerald-400 transition-all duration-200"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/85 p-2 text-center text-white backdrop-blur-2xs">
            <AlertCircle className="size-5 text-rose-400 mb-1" />
            <span className="text-[10px] font-semibold text-rose-200 line-clamp-2">
              {item.errorMessage || 'Failed'}
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="mt-1.5 rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
        >
          <Trash2 className="size-3.5" />
        </button>

        {/* Staged Badge */}
        {item.status === 'staged' && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-amber-500/90 text-white px-1.5 py-0.5 text-[9px] font-bold shadow-xs">
            Staged
          </span>
        )}

        {/* Done Checkmark badge */}
        {item.status === 'completed' && (
          <span className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
            <Check className="size-3 stroke-[2.5]" />
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="p-2 text-start">
        <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          {item.name}
        </p>
        <p className="text-[10px] font-mono text-neutral-400">
          {item.status === 'error'
            ? 'Upload error'
            : item.status === 'staged'
              ? `${item.sizeFormatted} · Pending upload`
              : item.isRemote
                ? 'Uploaded'
                : item.sizeFormatted}
        </p>
      </div>
    </div>
  );
}

/**
 * Card for Uploaded Video
 */
function VideoCard({
  item,
  isRequired,
  onRemove,
  onRetry,
}: {
  item: UploadedFileItem;
  isRequired: boolean;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const isUploading = item.status === 'uploading';
  const isError = item.status === 'error';
  const isProcessing = item.progress >= 90 && item.status === 'uploading';
  const isStaged = item.status === 'staged';
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white overflow-hidden shadow-inner">
          {!videoError ? (
            <video
              src={item.previewUrl}
              preload="metadata"
              className="h-full w-full object-cover opacity-60 pointer-events-none"
              muted
              playsInline
              onError={() => setVideoError(true)}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isUploading && !isProcessing ? (
              <span className="text-[10px] font-mono font-bold text-white">
                {item.progress}%
              </span>
            ) : isProcessing ? (
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isError ? (
              <AlertCircle className="size-5 text-rose-400" />
            ) : isStaged ? (
              <span className="text-[10px] font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-md">
                Staged
              </span>
            ) : (
              <Play className="size-5 text-white/90 fill-white/80" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-start">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">
              {item.name}
            </p>
            {isRequired && (
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/20">
                Required
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
            {item.sizeFormatted} •{' '}
            {isError
              ? item.errorMessage || 'Upload failed'
              : isProcessing
                ? 'Processing on server…'
                : isUploading
                  ? `Uploading ${item.progress}%`
                  : isStaged
                    ? 'Staged (pending step upload)'
                    : 'Ready for review'}
          </p>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {item.status === 'completed' && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3.5" />
            Uploaded
          </span>
        )}
        {isStaged && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="size-3.5" />
            Staged
          </span>
        )}
        {isError && onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-8 rounded-lg text-xs text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/40 cursor-pointer gap-1"
          >
            <RotateCcw className="size-3" />
            <span>Retry</span>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="h-8 rounded-lg text-xs text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/40 cursor-pointer gap-1"
        >
          <Trash2 className="size-3.5" />
          <span>Remove</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * Checklist Inline Single-File Dropzone (Liquid Glass Effect)
 */
function ChecklistInlineDropzone({
  onDrop,
}: {
  onDrop: (files: File[]) => void;
}) {
  const inputId = useId();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
      'video/*': ['.mp4', '.mov'],
    },
    multiple: false,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'glassPill group flex items-center justify-center gap-2 px-3 py-1.5 transition-all duration-200 cursor-pointer select-none text-xs font-semibold',
        isDragActive
          ? 'scale-105 border-emerald-500/80 shadow-md shadow-emerald-500/20 text-emerald-700 dark:text-emerald-300'
          : 'hover:scale-[1.03] text-neutral-700 dark:text-neutral-200',
      )}
    >
      <input id={inputId} {...getInputProps()} />
      <span className="flex size-5 items-center justify-center rounded-full bg-white/40 dark:bg-white/10 shadow-inner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:rotate-90 text-emerald-600 dark:text-emerald-400"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </span>
      <span className="relative z-10 text-[11px] font-bold">
        {isDragActive ? 'Drop file' : 'Add media'}
      </span>
    </div>
  );
}

/**
 * Checklist Uploaded Inline Card (Mini thumbnail + checkmark + remove)
 */
function ChecklistUploadedInlineCard({
  item,
  onRemove,
  onRetry,
}: {
  item: UploadedFileItem;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const isUploading = item.status === 'uploading';
  const isError = item.status === 'error';
  const isStaged = item.status === 'staged';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border p-1.5 shadow-2xs',
        isError
          ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40'
          : isStaged
            ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20'
            : 'border-emerald-500/30 bg-white dark:bg-neutral-800/80',
      )}
    >
      <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-[9px] font-mono font-bold text-white">
              {item.progress}%
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 max-w-[110px] text-start">
        <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          {item.name}
        </p>
        <p className="text-[10px] font-mono text-neutral-400">
          {isError ? 'Failed' : isStaged ? 'Staged' : item.sizeFormatted}
        </p>
      </div>

      {item.status === 'completed' && (
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      )}
      {isStaged && (
        <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Staged
        </span>
      )}
      {isUploading && (
        <div className="size-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent shrink-0" />
      )}
      {isError && (
        <div className="flex items-center gap-1">
          <span title={item.errorMessage}>
            <AlertCircle className="size-4 text-rose-500 shrink-0" />
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] font-bold text-amber-600 underline cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-rose-500/10 hover:text-rose-600 transition-colors ml-1"
        title="Remove item"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
