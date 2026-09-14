import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Customer name is required.' })
  @IsNotEmpty({ message: 'Customer name is required.' })
  name: string;

  @ApiProperty({ example: '+8801712345678' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Customer phone is required.' })
  @IsNotEmpty({ message: 'Customer phone is required.' })
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const email = value.trim();
    return email === '' ? undefined : email;
  })
  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ example: 'Banani, Dhaka' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const address = value.trim();
    return address === '' ? undefined : address;
  })
  @IsOptional()
  @IsString()
  address?: string;
}
