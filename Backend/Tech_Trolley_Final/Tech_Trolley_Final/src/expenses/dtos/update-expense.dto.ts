import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExpenseDto {
  @ApiProperty({ example: 'Rent' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'account-uuid' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: '2023-10-26' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'October office rent' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
