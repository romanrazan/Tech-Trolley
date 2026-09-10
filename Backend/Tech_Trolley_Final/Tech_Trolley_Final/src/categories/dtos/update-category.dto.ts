import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Mobile Phones' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
