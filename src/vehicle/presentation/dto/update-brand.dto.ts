import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9 _-]+$/, {
    message: 'Code must contain only letters, numbers, spaces, dashes, or underscores',
  })
  code?: string;
}
