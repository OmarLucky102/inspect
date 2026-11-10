import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenericUploadMediaDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
