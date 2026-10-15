import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty({ message: 'Model name is required' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  brandId?: string;
}
