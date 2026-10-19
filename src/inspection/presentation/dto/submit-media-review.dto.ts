import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistReviewDecision } from '../../domain/value-objects/checklist-review-decision.enum';

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
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemReviewDto)
  checklistItems?: ChecklistItemReviewDto[];
}
