import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, Length } from 'class-validator';
import { ListCategory } from '../Entity/general-list.entity';
import { ListOptionResponseDto } from './list-option.dto';

export class CreateGeneralListDto {
  @ApiProperty({ example: 'TICKET_STATUS' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ example: 'Estados de Ticket' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ example: 'Lista de estados para tickets', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty({ enum: ListCategory, default: ListCategory.CUSTOM })
  @IsOptional()
  @IsEnum(ListCategory)
  category?: ListCategory;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystemList?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  allowCustomValues?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  parentListId?: number;
}

export class UpdateGeneralListDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ListCategory)
  category?: ListCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowCustomValues?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GeneralListResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ListCategory })
  category: ListCategory;

  @ApiProperty()
  isSystemList: boolean;

  @ApiProperty()
  allowCustomValues: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  parentListId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => [ListOptionResponseDto], required: false })
  options?: ListOptionResponseDto[];

  constructor(list: any) {
    this.id = list.id;
    this.code = list.code;
    this.name = list.name;
    this.description = list.description;
    this.category = list.category;
    this.isSystemList = list.isSystemList;
    this.allowCustomValues = list.allowCustomValues;
    this.isActive = list.isActive;
    this.parentListId = list.parentListId;
    this.createdAt = list.createdAt;
    this.updatedAt = list.updatedAt;
    this.options = list.options?.map((option: any) => new ListOptionResponseDto(option));
  }
}

// ListOptionResponseDto is imported from list-option.dto to avoid duplicate definitions
