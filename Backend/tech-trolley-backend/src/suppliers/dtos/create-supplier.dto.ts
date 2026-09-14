import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Global Mobile Distributors' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Supplier name is required.' })
  @IsNotEmpty({ message: 'Supplier name is required.' })
  name: string;

  @ApiProperty({ example: '+8801711223344' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Supplier phone is required.' })
  @IsNotEmpty({ message: 'Supplier phone is required.' })
  phone: string;

  @ApiProperty({ example: 'sales@globalmobile.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'Enter a valid supplier email address.' })
  email: string;

  @ApiProperty({ example: 'Motijheel, Dhaka' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Supplier address is required.' })
  @IsNotEmpty({ message: 'Supplier address is required.' })
  address: string;
}
