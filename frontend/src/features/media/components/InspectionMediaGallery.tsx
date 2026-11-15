import { useState } from 'react';
import {
  FileImage,
  Video,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { useInspectionMedia } from '../hooks/use-inspection-media';
import { getMediaFileUrl } from '../api';
import type { MediaDto, MediaType } from '../types';

interface InspectionMediaGalleryProps {
  inspectionId: string;
}

export function InspectionMediaGallery({ inspectionId }: InspectionMediaGalleryProps) {
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaDto | null>(null);

  const queryType = filterType === 'all' ? undefined : filterType;
  const { data: mediaItems = [], isLoading, isError, error, refetch } = useInspectionMedia(
    inspectionId,
    queryType,
  );

  const images = mediaItems.filter((item) => item.mimeType.startsWith('image/'));
  const videos = mediaItems.filter((item) => item.mimeType.startsWith('video/'));

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <h3 className="text-base font-bold text-ink">Inspection Media Evidence</h3>
          <p className="text-xs text-ink-mute mt-0.5">
            Photos, 360 walkaround videos, and checklist documentation uploaded for this inspection.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-bone p-1 border border-hairline">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`cursor-pointer px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-white text-ink shadow-2xs font-bold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            All ({mediaItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('image')}
            className={`cursor-pointer flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'image'
                ? 'bg-white text-ink shadow-2xs font-bold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <FileImage className="size-3.5 text-emerald-600" />
            Photos ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('video')}
            className={`cursor-pointer flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'video'
                ? 'bg-white text-ink shadow-2xs font-bold'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Video className="size-3.5 text-rose-500" />
            Videos ({videos.length})
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="size-8 animate-spin text-accent mb-2" />
          <p className="text-xs font-medium text-ink-mute">Loading inspection media evidence…</p>
        </div>
      )}

      {/* Error View */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="size-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-rose-900">Failed to load media</h4>
          <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">
            {(error as any)?.message || 'Could not retrieve media files for this inspection.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 cursor-pointer inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && mediaItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hairline bg-bone/40 p-12 text-center">
          <div className="size-12 rounded-2xl bg-white border border-hairline flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <FileImage className="size-6 text-ink-mute" />
          </div>
          <h4 className="text-sm font-semibold text-ink">No media uploaded yet</h4>
          <p className="text-xs text-ink-mute mt-1 max-w-sm mx-auto">
            {filterType === 'all'
              ? 'Photos and videos captured by the representative or uploaded from dashboard will appear here.'
              : `No ${filterType === 'image' ? 'photos' : 'videos'} found for this inspection.`}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && !isError && mediaItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {mediaItems.map((item) => {
            const isVideo = item.mimeType.startsWith('video/');
            const isPending = item.status === 'PENDING';
            const isFailed = item.status === 'FAILED';
            const displayUrl = getMediaFileUrl(item.id);

            return (
              <div
                key={item.id}
                onClick={() => !isPending && !isFailed && setSelectedMedia(item)}
                className={`group relative overflow-hidden rounded-xl border border-hairline bg-white shadow-2xs transition-all hover:shadow-md ${
                  !isPending && !isFailed ? 'cursor-pointer hover:border-accent' : ''
                }`}
              >
                {/* Media Container */}
                <div className="relative aspect-4/3 w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <video
                      src={displayUrl}
                      preload="metadata"
                      className="h-full w-full object-cover opacity-80"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={displayUrl}
                      alt={item.fileName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Video Icon Badge */}
                  {isVideo && !isPending && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="size-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                        <Play className="size-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Processing Overlay */}
                  {isPending && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-2 text-center text-white">
                      <Loader2 className="size-5 animate-spin text-accent mb-1" />
                      <span className="text-[10px] font-semibold">Processing video…</span>
                    </div>
                  )}

                  {/* Failed Overlay */}
                  {isFailed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 p-2 text-center text-white">
                      <AlertCircle className="size-5 text-rose-400 mb-1" />
                      <span className="text-[10px] font-semibold text-rose-200">
                        {item.failureReason || 'Failed'}
                      </span>
                    </div>
                  )}

                  {/* Expand icon on hover */}
                  {!isPending && !isFailed && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-md p-1 text-white backdrop-blur-xs">
                      <Maximize2 className="size-3.5" />
                    </div>
                  )}
                </div>

                {/* Caption / Meta */}
                <div className="p-2 text-start">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-ink" title={item.fileName}>
                      {item.fileName}
                    </p>
                    {item.status === 'UPLOADED' && (
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] font-mono text-ink-mute">
                    <span>{(item.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    {item.categoryName && (
                      <span className="rounded bg-bone px-1 py-0.2 font-sans font-medium text-[9px] text-ink-soft truncate max-w-[80px]">
                        {item.categoryName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Lightbox / Preview Modal */}
      {selectedMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedMedia.fileName}</p>
                <p className="text-xs text-neutral-400 font-mono">
                  {(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB • {selectedMedia.mimeType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMediaFileUrl(selectedMedia.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:text-white transition-colors"
                  title="Open original in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="cursor-pointer rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div className="flex-1 flex items-center justify-center p-2 bg-black min-h-[300px] max-h-[75vh]">
              {selectedMedia.mimeType.startsWith('video/') ? (
                <video
                  src={getMediaFileUrl(selectedMedia.id)}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg"
                />
              ) : (
                <img
                  src={getMediaFileUrl(selectedMedia.id)}
                  alt={selectedMedia.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
