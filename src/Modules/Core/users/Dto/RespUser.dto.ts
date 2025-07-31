import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RespUserDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  role: string;
  @ApiProperty()
  isTwoFactorEnabled: boolean;
  @ApiProperty()
  last2FAVerifiedAt?: Date;
  @ApiPropertyOptional()
  isBlocked?: boolean;
  @ApiPropertyOptional()
  isActive?: boolean;
}

export class ReqDeleteUserDto {
  @ApiProperty()
  id: number;
}
