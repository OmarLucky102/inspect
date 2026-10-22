import {
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateSunroofTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;
}
