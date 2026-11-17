import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsArray,
  IsString,
  MaxLength,
  ArrayMaxSize,
  Matches,
  IsIn,
} from 'class-validator';

export const VALID_MEDIA_TYPES = ['image', 'video'] as const;
export type MediaTypeQuery = (typeof VALID_MEDIA_TYPES)[number];

export class GetInspectionMediaFilterDto {
  @IsOptional()
  @IsIn(VALID_MEDIA_TYPES, {
    message: "Invalid media type. Supported values are 'image' or 'video'.",
  })
  type?: MediaTypeQuery;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @ArrayMaxSize(15, {
    message: 'Cannot request more than 15 checklist items at once',
  })
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    each: true,
    message:
      'Checklist item codes must contain only alphanumeric characters, dashes, or underscores',
  })
  checklistItemCodes?: string[];
}
