import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { isNumber, IsString } from 'class-validator';

export class UserDto {
  @ApiPropertyOptional()
  id?: number;
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsString()
  lastname: string;
  @ApiProperty()
  rol: string[];
  @ApiProperty()
  @IsString()
  email: string;
  @ApiProperty()
  @IsString()
  password?: string;
}
