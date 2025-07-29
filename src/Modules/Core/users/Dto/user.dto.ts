import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { isNumber, IsString } from 'class-validator';

<<<<<<< HEAD
export class UserDto {
=======
export class User {
>>>>>>> 6a72b2638daae878e189023d883fb42606cdd829
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
  password: string;
}
