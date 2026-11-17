import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import type { JwtPayload } from '../../../identity/infrastructure/services/jwt-token.service';
import { UploadMediaUseCase } from '../../application/use-cases/upload-media.use-case';
import { UploadGenericMediaUseCase } from '../../application/use-cases/upload-generic-media.use-case';
import { BatchUploadMediaUseCase } from '../../application/use-cases/batch-upload-media.use-case';
import { UploadVideoUseCase } from '../../application/use-cases/upload-video.use-case';
import { GetMediaUseCase } from '../../application/use-cases/get-media.use-case';
import { GetMediaFileUseCase } from '../../application/use-cases/get-media-file.use-case';
import { GetInspectionMediaUseCase } from '../../application/use-cases/get-inspection-media.use-case';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '../../infrastructure/services/file-validator.service';
import { UploadMediaDto } from '../dto/upload-media.dto';
import { GenericUploadMediaDto } from '../dto/generic-upload-media.dto';
import { BatchUploadMediaDto } from '../dto/batch-upload-media.dto';
import { UploadVideoDto } from '../dto/upload-video.dto';
import { GetInspectionMediaFilterDto } from '../dto/get-inspection-media.filter.dto';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly uploadGenericMediaUseCase: UploadGenericMediaUseCase,
    private readonly batchUploadMediaUseCase: BatchUploadMediaUseCase,
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly getMediaUseCase: GetMediaUseCase,
    private readonly getMediaFileUseCase: GetMediaFileUseCase,
    private readonly getInspectionMediaUseCase: GetInspectionMediaUseCase,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
      },
    }),
  )
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: GenericUploadMediaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.uploadGenericMediaUseCase.execute(file, dto, {
      id: user.sub,
      role: user.role as Role,
    });

    return {
      status: 'success',
      data,
    };
  }

  @Post('inspections/:inspectionId')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
      },
    }),
  )
  async uploadInspectionMedia(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: Partial<UploadMediaDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.uploadMediaUseCase.execute(
      file,
      { ...dto, inspectionId },
      { id: user.sub, role: user.role as Role },
    );

    return {
      status: 'success',
      data,
    };
  }

  @Post('inspections/:inspectionId/batch')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
  )
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
      },
    }),
  )
  async uploadInspectionMediaBatch(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() dto: BatchUploadMediaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.batchUploadMediaUseCase.execute(
      files,
      { ...dto, inspectionId },
      { id: user.sub, role: user.role as Role },
    );

    return {
      status: 'success',
      data,
    };
  }

  @Post('inspections/:inspectionId/video')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_VIDEO_SIZE_BYTES,
      },
    }),
  )
  async uploadInspectionVideo(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadVideoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.uploadVideoUseCase.execute(
      file,
      { ...dto, inspectionId },
      { id: user.sub, role: user.role as Role },
    );

    return {
      status: 'success',
      data,
    };
  }

  @Get('inspections/:inspectionId')
  @HttpCode(HttpStatus.OK)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
    Role.VIEWER,
  )
  async getInspectionMedia(
    @Param('inspectionId', ParseUUIDPipe) inspectionId: string,
    @Query() filter: GetInspectionMediaFilterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.getInspectionMediaUseCase.execute(
      inspectionId,
      {
        id: user.sub,
        role: user.role as Role,
      },
      filter,
    );

    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
    Role.VIEWER,
  )
  async getMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.getMediaUseCase.execute(id, {
      id: user.sub,
      role: user.role as Role,
    });

    return {
      status: 'success',
      data,
    };
  }

  @Get(':id/file')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.MANAGER,
    Role.REVIEWER,
    Role.REPRESENTATIVE,
    Role.USER,
    Role.VIEWER,
  )
  async getMediaFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.getMediaFileUseCase.execute(
      id,
      { id: user.sub, role: user.role as Role },
      range,
    );

    res.set({
      'Content-Type': file.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    if (file.contentRange) {
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.set('Content-Range', file.contentRange);
    }

    if (file.contentLength !== undefined) {
      res.set('Content-Length', String(file.contentLength));
    }

    file.stream.pipe(res);
  }
}
