import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, Length } from 'class-validator';
import { ListCategory } from '../Entity/general-list.entity';

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

// Import para evitar circular dependency
export class ListOptionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  displayText: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  metadata: any;

  constructor(option: any) {
    this.id = option.id;
    this.code = option.code;
    this.value = option.value;
    this.displayText = option.displayText;
    this.description = option.description;
    this.color = option.color;
    this.icon = option.icon;
    this.isDefault = option.isDefault;
    this.isActive = option.isActive;
    this.sortOrder = option.sortOrder;
    this.metadata = option.metadata;
  }
}
