import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class CreateColorDto {
  @IsString()
  @IsNotEmpty({ message: 'Color name is required' })
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Hex must be a valid hex color code (e.g., #FFFFFF or #FFF)',
  })
  hex?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
