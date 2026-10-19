import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CaptureMode } from '../../domain/value-objects/capture-mode.enum';

export class AssignRepresentativeDto {
  @IsNotEmpty()
  @IsUUID()
  representativeId!: string;

  /**
   * Capture mode for the inspection session.
   * STANDARD = 16 frames, ADVANCED = 32 frames.
   * Defaults to the request's current captureMode if not provided.
   */
  @IsOptional()
  @IsEnum(CaptureMode)
  captureMode?: CaptureMode;

  @IsOptional()
  @IsString()
  notes?: string;
}
