/**
 * CDN Asset Resolution Helper (Backend)
 * Resolves assets served from Cloudflare R2 / S3 Object Storage CDN.
 */
export function getCdnAsset(path: string, fallback?: string): string {
  const cdnBase =
    process.env.VITE_CDN_URL?.trim() ||
    process.env.CDN_URL?.trim() ||
    process.env.PUBLIC_CDN_URL?.trim();

  if (!cdnBase) {
    return (
      fallback ||
      `https://pub-860509c206114698ad0b355f757c0bf3.r2.dev/${path.replace(/^\/+/, '')}`
    );
  }
  const cleanBase = cdnBase.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}
