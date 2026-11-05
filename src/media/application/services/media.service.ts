import { Injectable } from '@nestjs/common';
import {
  UploadMediaUseCase,
  UploadMediaActor,
} from '../use-cases/upload-media.use-case';
import {
  GetMediaUseCase,
  GetMediaActor,
} from '../use-cases/get-media.use-case';
import { UploadMediaDto } from '../../presentation/dto/upload-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly getMediaUseCase: GetMediaUseCase,
  ) {}

  async uploadMedia(
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
    actor: UploadMediaActor,
  ): Promise<MediaResponseDto> {
    return this.uploadMediaUseCase.execute(file, dto, actor);
  }

  async getMediaById(
    mediaId: string,
    actor: GetMediaActor,
  ): Promise<MediaResponseDto> {
    return this.getMediaUseCase.execute(mediaId, actor);
  }
}
