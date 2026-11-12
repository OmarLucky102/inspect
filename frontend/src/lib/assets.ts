/**
 * CDN Asset Resolution Helper
 * Standardizes asset URLs served from Cloudflare R2 / S3 Object Storage CDN.
 */
export function getCdnAsset(path: string, fallback?: string): string {
  const cdnBase = import.meta.env.VITE_CDN_URL?.trim();
  if (!cdnBase) {
    return fallback || `/${path.replace(/^\/+/, '')}`;
  }
  const cleanBase = cdnBase.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}
