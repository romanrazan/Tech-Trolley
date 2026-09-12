import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
