import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShopDto {
  @ApiProperty({ example: 'Tech Trolley' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'BDT' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
