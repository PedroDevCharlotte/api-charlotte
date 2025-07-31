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
}
