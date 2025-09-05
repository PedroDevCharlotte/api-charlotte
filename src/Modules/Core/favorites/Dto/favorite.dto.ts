import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ example: 'Documentación interna' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'https://intranet/guia' })
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFavoriteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}

export class FavoriteResponseDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Boolean)
  @IsBoolean()
  active: boolean;

  @ApiProperty({ type: String })
  CreatedAt: Date;

  @ApiProperty({ type: String })
  UpdateAt: Date;
}
