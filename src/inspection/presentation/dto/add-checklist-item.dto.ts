import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ChecklistInputType } from '../../domain/value-objects/checklist-input-type.enum';

export class AddChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsEnum(ChecklistInputType)
  @IsOptional()
  inputType?: ChecklistInputType;

  @IsString()
  @IsOptional()
  options?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
