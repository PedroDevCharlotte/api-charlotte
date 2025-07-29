<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class Verify2FADto {
  @IsNumber()  
  @ApiProperty()
  
  userId: number;
  @ApiProperty()
=======
import { IsNumber, IsString } from 'class-validator';

export class Verify2FADto {
  @IsNumber()
  userId: number;
>>>>>>> 6a72b2638daae878e189023d883fb42606cdd829

  @IsString()
  token: string;
}
