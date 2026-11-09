export interface ProcessedImageMetadata {
  capturedAt?: Date;
  latitude?: number;
  longitude?: number;
  cameraMake?: string;
  cameraModel?: string;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  size: number;
  width: number;
  height: number;
  metadata?: ProcessedImageMetadata;
}

export interface IImageProcessorService {
  isSupportedImage(mimeType: string): boolean;
  process(
    fileBuffer: Buffer,
    originalMimeType: string,
  ): Promise<ProcessedImageResult>;
}
