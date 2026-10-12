import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignRepresentativeDto {
  @IsNotEmpty()
  @IsUUID()
  representativeId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
