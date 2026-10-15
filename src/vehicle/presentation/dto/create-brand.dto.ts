import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsArray,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9 _-]+$/, {
    message: 'Code must contain only letters, numbers, spaces, dashes, or underscores',
  })
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models?: string[];
}
