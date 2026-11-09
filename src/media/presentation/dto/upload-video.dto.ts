import { IsUUID, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadVideoDto {
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
