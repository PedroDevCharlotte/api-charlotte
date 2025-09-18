import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsDateString, Length, IsNumber } from 'class-validator';
import { Classification, Category } from '../Entity/non-conformity.entity';

export class CreateNonConformityDto {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  typeOptionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otherType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  createdAtDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  detectedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  areaOrProcess?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  areaResponsibleId?: number;

  @ApiProperty({ required: false, enum: Classification })
  @IsOptional()
  @IsEnum(Classification)
  classification?: Classification;

  @ApiProperty({ required: false, enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  motiveOptionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otherMotive?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  findingDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cause?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investigationReference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  participants?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasSimilarCases?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  similarCasesDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rootCauseDetermination?: string;
}

export class UpdateNonConformityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  number?: string;
  // ... other fields optional like Create DTO
}

export class NonConformityResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  constructor(nc: any) {
    this.id = nc.id;
    this.number = nc.number;
  }
}
