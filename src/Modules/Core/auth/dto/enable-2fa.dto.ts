<<<<<<< HEAD
import { ApiProperty } from "@nestjs/swagger";

export class Enable2FADto {
  @ApiProperty()
  userId: number;
  @ApiProperty()
  token: string;
  @ApiProperty()
  twoFactorSecret: string;
  @ApiProperty()
  temp2FASecret: string;
=======
export class Enable2FADto {
  userId: number;
>>>>>>> 6a72b2638daae878e189023d883fb42606cdd829
}
