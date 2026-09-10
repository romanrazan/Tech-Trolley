import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
