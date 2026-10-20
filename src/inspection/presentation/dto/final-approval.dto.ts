import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class FinalApprovalDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  approvedMarketingValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
