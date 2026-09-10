import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../../auth/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Senior Sales Employee' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'senior.sales@techtrolley.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsEnum(UserRole)
  role: UserRole;
}
