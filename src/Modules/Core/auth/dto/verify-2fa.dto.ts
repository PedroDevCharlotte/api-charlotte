import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class Verify2FADto {
  @IsNumber()  
  @ApiProperty()
  
  userId: number;
  @ApiProperty()

  @IsString()
  token: string;
}

export class setup2FADto {
  @IsNumber()
  @ApiProperty()
  userId: number;
 
}
