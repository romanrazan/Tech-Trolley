import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { UserRole } from '../../auth/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Sales Employee' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'sales@techtrolley.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TempPass123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SALESPERSON })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
