import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
