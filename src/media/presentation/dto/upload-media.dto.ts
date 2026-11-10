import { IsUUID, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadMediaDto {
  @IsUUID()
  inspectionId!: string;

  @IsOptional()
  @IsUUID()
  captureSessionId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  fileHash?: string;
}
