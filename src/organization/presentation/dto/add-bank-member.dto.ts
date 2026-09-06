import { IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class AddBankMemberDto {
  @IsUUID(4, { message: 'userId must be a valid UUID' })
  @IsNotEmpty({ message: 'userId is required' })
  userId!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
