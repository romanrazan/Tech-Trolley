import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy S25 5G' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'brand-uuid' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
