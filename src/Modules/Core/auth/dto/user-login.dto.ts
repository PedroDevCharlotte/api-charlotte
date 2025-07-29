import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserLoginDto {
  @ApiProperty()
  @IsString()
  email: string;
  @ApiProperty()
  @IsString()
<<<<<<< HEAD
  password: string;
=======
  pass: string;
>>>>>>> 6a72b2638daae878e189023d883fb42606cdd829
}
