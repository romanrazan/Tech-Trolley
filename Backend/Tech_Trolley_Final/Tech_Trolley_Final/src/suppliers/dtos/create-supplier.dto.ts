import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Global Mobile Distributors' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+8801711223344' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'sales@globalmobile.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Motijheel, Dhaka' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
