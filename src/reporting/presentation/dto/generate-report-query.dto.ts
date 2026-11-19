import { IsIn, IsOptional } from 'class-validator';

export class GenerateReportQueryDto {
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang?: 'ar' | 'en';

  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  download?: string;
}
