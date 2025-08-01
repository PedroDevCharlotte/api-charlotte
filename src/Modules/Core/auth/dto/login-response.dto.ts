import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  department: string;

  @ApiPropertyOptional()
  roleId?: number;

  @ApiPropertyOptional()
  departmentId?: number;
}

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiPropertyOptional()
  requires2FA?: boolean;

  @ApiPropertyOptional()
  register2FA?: boolean;

  @ApiPropertyOptional({ type: UserInfoDto })
  user?: UserInfoDto;
}
