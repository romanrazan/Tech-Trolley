import {
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAYMENT_METHODS } from '../../accounts/entities/accounts.entity';

export class AddSalePaymentDto {
  @ApiProperty({
    example: 50000,
    description: 'Payment amount received from the customer. Must be positive.',
  })
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'Cash',
    description: 'How the payment was received (e.g. Cash, Bank Transfer).',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(PAYMENT_METHODS)
  paymentMethod: string;

  @ApiProperty({
    example: 'a3f1c2d4-5678-4abc-9def-0123456789ab',
    description:
      'UUID of the financial account that receives this money (inflow). ' +
      'The account balance is increased by the payment amount, atomically ' +
      'with the payment record.',
    format: 'uuid',
  })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({
    example: 'TXN123',
    description: 'Optional external transaction reference.',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    example: '2026-07-26',
    description: 'Payment date (YYYY-MM-DD).',
  })
  @IsString()
  @IsNotEmpty()
  date: string;
}
