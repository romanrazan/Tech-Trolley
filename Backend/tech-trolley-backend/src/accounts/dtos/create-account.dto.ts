import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'Main Cash Drawer' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Account name is required.' })
  @IsNotEmpty({ message: 'Account name is required.' })
  name: string;

  @ApiProperty({ example: 'Cash' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Account type is required.' })
  @IsNotEmpty({ message: 'Account type is required.' })
  type: string;

  @ApiPropertyOptional({ example: 'N/A' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Opening balance cannot be negative.' })
  balance?: number;
}
