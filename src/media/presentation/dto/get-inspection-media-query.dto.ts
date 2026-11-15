import { IsOptional, IsIn } from 'class-validator';

export const VALID_MEDIA_TYPES = ['image', 'video'] as const;
export type MediaTypeQuery = (typeof VALID_MEDIA_TYPES)[number];

export class GetInspectionMediaQueryDto {
  @IsOptional()
  @IsIn(VALID_MEDIA_TYPES, {
    message: "Invalid media type. Supported values are 'image' or 'video'.",
  })
  type?: MediaTypeQuery;
}
