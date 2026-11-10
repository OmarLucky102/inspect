import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import {
  IVideoProcessorService,
  ProcessedVideoResult,
  VideoMetadata,
} from '../../domain/services/video-processor.service.interface';
import { VideoProcessingException } from '../../../shared/exceptions/media.exceptions';

@Injectable()
export class FfmpegVideoProcessorService implements IVideoProcessorService {
  private readonly logger = new Logger(FfmpegVideoProcessorService.name);

  async process(
    inputBuffer: Buffer,
    originalMimeType?: string,
  ): Promise<ProcessedVideoResult> {
    void originalMimeType;
    const id = randomUUID();
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `inspect_vid_${id}_in.tmp`);
    const outputPath = path.join(tempDir, `inspect_vid_${id}_out.mp4`);
    const thumbPath = path.join(tempDir, `inspect_vid_${id}_thumb.webp`);

    try {
      // 1. Write incoming buffer to temporary file for seeking/ffprobe
      await fs.writeFile(inputPath, inputBuffer);

      // 2. Probe metadata (dimensions & duration)
      const metadata = await this.probeFileMetadata(inputPath);

      // 3. Transcode video to 720p H.264/AAC with faststart for instant web streaming
      await this.transcodeToWebMp4(inputPath, outputPath);

      // 4. Extract 1s snapshot as WebP thumbnail
      await this.extractWebpThumbnail(inputPath, thumbPath, metadata.duration);

      // 5. Read back output buffers
      const [videoBuffer, thumbnailBuffer] = await Promise.all([
        fs.readFile(outputPath),
        fs.readFile(thumbPath),
      ]);

      return {
        videoBuffer,
        videoMimeType: 'video/mp4',
        videoExtension: 'mp4',
        videoSize: videoBuffer.length,
        thumbnailBuffer,
        thumbnailMimeType: 'image/webp',
        thumbnailExtension: 'webp',
        thumbnailSize: thumbnailBuffer.length,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error: any) {
      this.logger.error(
        `FFmpeg processing failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof VideoProcessingException) {
        throw error;
      }
      throw new VideoProcessingException(
        `Video processing failed: ${error.message || 'unknown error'}`,
      );
    } finally {
      // 6. Guarantee cleanup of all temporary files
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {}),
        fs.unlink(thumbPath).catch(() => {}),
      ]);
    }
  }

  async probeMetadata(inputBuffer: Buffer): Promise<VideoMetadata> {
    const tempPath = path.join(
      os.tmpdir(),
      `inspect_probe_${randomUUID()}.tmp`,
    );
    try {
      await fs.writeFile(tempPath, inputBuffer);
      return await this.probeFileMetadata(tempPath);
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  }

  private async probeFileMetadata(filePath: string): Promise<VideoMetadata> {
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,duration:format=duration',
      '-of',
      'json',
      filePath,
    ];

    const { stdout } = await this.runProcess('ffprobe', args);
    try {
      const parsed = JSON.parse(stdout);
      const stream = parsed?.streams?.[0] || {};
      const format = parsed?.format || {};

      const width = Number(stream.width) || 1280;
      const height = Number(stream.height) || 720;
      const rawDuration =
        parseFloat(stream.duration) || parseFloat(format.duration) || 0;
      const duration = Math.max(0, Math.round(rawDuration));

      return { width, height, duration };
    } catch (parseError: any) {
      this.logger.warn(`Failed to parse ffprobe json: ${parseError.message}`);
      return { width: 1280, height: 720, duration: 0 };
    }
  }

  private async transcodeToWebMp4(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const args = [
      '-nostdin',
      '-y',
      '-threads',
      '0',
      '-i',
      inputPath,
      '-vf',
      "scale='min(1280,iw)':-2",
      '-c:v',
      'libx264',
      '-crf',
      '25',
      '-preset',
      'veryfast',
      '-maxrate',
      '2M',
      '-bufsize',
      '4M',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    await this.runProcess('ffmpeg', args, 300000);
  }

  private async extractWebpThumbnail(
    inputPath: string,
    outputPath: string,
    durationSec: number,
  ): Promise<void> {
    const timestamp = durationSec >= 1 ? '00:00:01.000' : '00:00:00.000';
    const args = [
      '-nostdin',
      '-y',
      '-threads',
      '0',
      '-ss',
      timestamp,
      '-i',
      inputPath,
      '-vframes',
      '1',
      '-vf',
      "scale='min(800,iw)':-2",
      '-c:v',
      'libwebp',
      '-q:v',
      '80',
      outputPath,
    ];

    await this.runProcess('ffmpeg', args, 30000);
  }

  private runProcess(
    command: string,
    args: string[],
    timeoutMs = 300000,
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(
          new VideoProcessingException(
            `${command} timed out after ${timeoutMs / 1000}s`,
          ),
        );
      }, timeoutMs);

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(
          new VideoProcessingException(
            `Failed to execute ${command}: ${err.message}`,
          ),
        );
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(
            new VideoProcessingException(
              `${command} failed with exit code ${code}: ${stderr || stdout}`,
            ),
          );
        }
      });
    });
  }
}
