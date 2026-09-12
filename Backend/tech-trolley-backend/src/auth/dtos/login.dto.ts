import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@techtrolley.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
