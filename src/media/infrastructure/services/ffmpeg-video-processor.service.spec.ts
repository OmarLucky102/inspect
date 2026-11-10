import { FfmpegVideoProcessorService } from './ffmpeg-video-processor.service';
import { VideoProcessingException } from '../../../shared/exceptions/media.exceptions';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('fs/promises');

describe('FfmpegVideoProcessorService', () => {
  let service: FfmpegVideoProcessorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FfmpegVideoProcessorService();

    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.mp4')) {
        return Promise.resolve(Buffer.from('mock-compressed-video-bytes'));
      }
      if (filePath.endsWith('.webp')) {
        return Promise.resolve(Buffer.from('mock-thumbnail-webp-bytes'));
      }
      return Promise.resolve(Buffer.from('test-data'));
    });
  });

  const createMockProcess = (
    exitCode: number = 0,
    stdout: string = '',
    stderr: string = '',
  ) => {
    const proc: any = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = jest.fn();

    process.nextTick(() => {
      if (stdout) proc.stdout.emit('data', Buffer.from(stdout));
      if (stderr) proc.stderr.emit('data', Buffer.from(stderr));
      proc.emit('close', exitCode);
    });

    return proc;
  };

  describe('process', () => {
    it('should probe metadata, transcode to 720p H.264 mp4, and generate webp thumbnail', async () => {
      const mockFfprobeOutput = JSON.stringify({
        streams: [{ width: 1920, height: 1080, duration: '12.45' }],
        format: { duration: '12.45' },
      });

      (childProcess.spawn as jest.Mock).mockImplementation((cmd: string) => {
        if (cmd === 'ffprobe') {
          return createMockProcess(0, mockFfprobeOutput);
        }
        if (cmd === 'ffmpeg') {
          return createMockProcess(0, '', '');
        }
        return createMockProcess(0);
      });

      const inputBuffer = Buffer.from('raw-video-bytes');
      const result = await service.process(inputBuffer, 'video/mp4');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(childProcess.spawn).toHaveBeenCalledWith(
        'ffprobe',
        expect.arrayContaining(['-of', 'json']),
        expect.anything(),
      );
      expect(childProcess.spawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-c:v', 'libx264', '-movflags', '+faststart']),
        expect.anything(),
      );
      expect(childProcess.spawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-c:v', 'libwebp', '-ss', '00:00:01.000']),
        expect.anything(),
      );

      expect(result.duration).toBe(12);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.videoMimeType).toBe('video/mp4');
      expect(result.thumbnailMimeType).toBe('image/webp');
      expect(result.videoBuffer.toString()).toBe('mock-compressed-video-bytes');
      expect(result.thumbnailBuffer.toString()).toBe(
        'mock-thumbnail-webp-bytes',
      );

      // Verify temp files cleanup in finally
      expect(fs.unlink).toHaveBeenCalledTimes(3);
    });

    it('should use 00:00:00.000 timestamp for thumbnail when video is shorter than 1s', async () => {
      const shortVideoJson = JSON.stringify({
        streams: [{ width: 640, height: 480, duration: '0.45' }],
      });

      (childProcess.spawn as jest.Mock).mockImplementation((cmd: string) => {
        if (cmd === 'ffprobe') {
          return createMockProcess(0, shortVideoJson);
        }
        return createMockProcess(0);
      });

      await service.process(Buffer.from('short-video'), 'video/mp4');

      expect(childProcess.spawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-ss', '00:00:00.000']),
        expect.anything(),
      );
    });

    it('should throw VideoProcessingException and cleanup temp files when ffmpeg fails', async () => {
      (childProcess.spawn as jest.Mock).mockImplementation((cmd: string) => {
        if (cmd === 'ffprobe') {
          return createMockProcess(0, JSON.stringify({ streams: [{}] }));
        }
        return createMockProcess(1, '', 'Invalid video codec header');
      });

      await expect(
        service.process(Buffer.from('corrupt-bytes'), 'video/mp4'),
      ).rejects.toThrow(VideoProcessingException);

      // Verify cleanup is called even on failure
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should handle spawn error event properly', async () => {
      (childProcess.spawn as jest.Mock).mockImplementation(() => {
        const proc: any = new EventEmitter();
        proc.stdout = new EventEmitter();
        proc.stderr = new EventEmitter();
        proc.kill = jest.fn();
        process.nextTick(() => {
          proc.emit('error', new Error('spawn ENOENT'));
        });
        return proc;
      });

      await expect(
        service.process(Buffer.from('video-bytes'), 'video/mp4'),
      ).rejects.toThrow(VideoProcessingException);
    });
  });

  describe('probeMetadata', () => {
    it('should return parsed width, height, and duration', async () => {
      const mockOutput = JSON.stringify({
        streams: [{ width: 1280, height: 720, duration: '5.2' }],
      });

      (childProcess.spawn as jest.Mock).mockReturnValue(
        createMockProcess(0, mockOutput),
      );

      const metadata = await service.probeMetadata(Buffer.from('test-video'));
      expect(metadata).toEqual({
        width: 1280,
        height: 720,
        duration: 5,
      });
      expect(fs.unlink).toHaveBeenCalled();
    });
  });
});
