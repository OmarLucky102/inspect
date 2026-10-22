import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateSunroofTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'Sunroof specification name is required' })
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
}
