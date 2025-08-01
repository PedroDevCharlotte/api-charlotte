import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UserDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordResetCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  passwordResetCodeExpiresAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twoFactorSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  temp2FASecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  last2FAVerifiedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trustedDevices?: string[];
}
