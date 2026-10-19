import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class PriceRevisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Revision notes are required when requesting a price revision' })
  revisionNotes!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  targetPriceEstimate?: number;
}
