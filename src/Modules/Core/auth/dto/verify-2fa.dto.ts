import { IsNumber, IsString } from 'class-validator';

export class Verify2FADto {
  @IsNumber()
  userId: number;

  @IsString()
  token: string;
}
