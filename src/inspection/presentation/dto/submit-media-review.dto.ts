import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistReviewDecision } from '../../domain/value-objects/checklist-review-decision.enum';
import { VALID_CAR_INTERIOR_CODES } from '../../../vehicle/domain/value-objects/car-interior-condition.enum';

export const VALID_SIDE_MIRROR_CODES = ['MANUAL', 'ELECTRIC'] as const;

export const VALID_SUNROOF_CODES = [
  'NO_SUNROOF',
  'MANUAL',
  'ELECTRIC',
  'PANORAMIC',
  'PANORAMIC_MOONROOF',
  'POP_UP',
  'SLIDING',
  'TILT_AND_SLIDE',
] as const;

export class ChecklistItemReviewDto {
  @IsString()
  checklistItemId!: string;

  @IsEnum(ChecklistReviewDecision)
  decision!: ChecklistReviewDecision;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitMediaReviewDto {
  @IsNumber()
  @IsPositive()
  verifiedMileage!: number;

  @IsNumber()
  @IsPositive()
  proposedMarketingValue!: number;

  @IsOptional()
  @IsUUID()
  transmissionTypeId?: string;

  @IsOptional()
  @IsIn(VALID_SIDE_MIRROR_CODES, {
    message: "sideMirrors must be one of: 'MANUAL', 'ELECTRIC'",
  })
  sideMirrors?: string;

  @IsOptional()
  @IsIn(VALID_SUNROOF_CODES, {
    message: 'sunroofSpecification must match a valid sunroof type code',
  })
  sunroofSpecification?: string;

  @IsOptional()
  @IsIn(VALID_CAR_INTERIOR_CODES, {
    message:
      "carInterior must be one of: 'FACTORY_PAINT', 'INTERNAL_REPAINT', 'PARTIAL_REPAINT'",
  })
  carInterior?: string;

  @IsOptional()
  @IsUUID()
  trimId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemReviewDto)
  checklistItems?: ChecklistItemReviewDto[];
}
