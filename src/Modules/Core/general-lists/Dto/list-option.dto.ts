import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, Length, IsHexColor } from 'class-validator';

export class CreateListOptionDto {
  @ApiProperty({ example: 'OPEN' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ example: 'OPEN' })
  @IsString()
  @Length(1, 100)
  value: string;

  @ApiProperty({ example: 'Abierto' })
  @IsString()
  @Length(1, 200)
  displayText: string;

  @ApiProperty({ example: 'Ticket abierto para revisión', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty({ example: '#2196F3', required: false })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiProperty({ example: 'check-circle', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  icon?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parentOptionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class UpdateListOptionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  value?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  displayText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class ListOptionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  listId: number;

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
  parentOptionId: number;

  @ApiProperty()
  metadata: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => [ListOptionResponseDto], required: false })
  childOptions?: ListOptionResponseDto[];

  constructor(option: any) {
    this.id = option.id;
    this.listId = option.listId;
    this.code = option.code;
    this.value = option.value;
    this.displayText = option.displayText;
    this.description = option.description;
    this.color = option.color;
    this.icon = option.icon;
    this.isDefault = option.isDefault;
    this.isActive = option.isActive;
    this.sortOrder = option.sortOrder;
    this.parentOptionId = option.parentOptionId;
    this.metadata = option.metadata;
    this.createdAt = option.createdAt;
    this.updatedAt = option.updatedAt;
    this.childOptions = option.childOptions?.map((child: any) => new ListOptionResponseDto(child));
  }
}
