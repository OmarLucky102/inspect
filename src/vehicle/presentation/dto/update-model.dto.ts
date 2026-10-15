import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateModelDto {
  @IsString()
  @IsNotEmpty({ message: 'Model name is required' })
  @MaxLength(100)
  name!: string;
}
