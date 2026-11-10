export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export interface ProcessedVideoResult {
  videoBuffer: Buffer;
  videoMimeType: string;
  videoExtension: string;
  videoSize: number;
  thumbnailBuffer: Buffer;
  thumbnailMimeType: string;
  thumbnailExtension: string;
  thumbnailSize: number;
  duration: number;
  width: number;
  height: number;
}

export interface IVideoProcessorService {
  process(
    inputBuffer: Buffer,
    originalMimeType: string,
  ): Promise<ProcessedVideoResult>;
  probeMetadata(inputBuffer: Buffer): Promise<VideoMetadata>;
}
