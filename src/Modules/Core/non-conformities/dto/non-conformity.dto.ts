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
  @Length(1, 50)
  number?: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  actionPlans?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  followUps?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  whyRecords?: any[];
}

export class NonConformityResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  type?: string;

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  areaOrProcess?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  typeOption?: any;

  @ApiProperty({ required: false })
  areaOption?: any;

  @ApiProperty({ required: false })
  motiveOption?: any;

  @ApiProperty({ required: false })
  statusOption?: any;

  constructor(nc: any) {
    this.id = nc.id;
    this.number = nc.number;
    this.title = nc.findingDescription || nc.observations || `No Conformidad ${nc.number}`;
    this.status = nc.status;
    this.type = nc.typeOption?.displayText || nc.typeOption?.value;
    this.category = nc.category;
    this.areaOrProcess = nc.areaOrProcess;
    this.createdAt = nc.createdAt;
    this.updatedAt = nc.updatedAt;
    this.typeOption = nc.typeOption;
    this.areaOption = nc.areaResponsible ? {
      displayText: nc.areaResponsible.firstName + ' ' + nc.areaResponsible.lastName,
      value: nc.areaResponsibleId
    } : null;
    this.motiveOption = nc.motiveOption;
    
    // Crear statusOption basado en el status actual
    this.statusOption = this.getStatusOption(nc.status);
  }

  private getStatusOption(status: string) {
    const statusMap: Record<string, { displayText: string; value: string; color: string }> = {
      'open': { displayText: 'Abierta', value: 'open', color: '#2196F3' },
      'in_progress': { displayText: 'En Seguimiento', value: 'in_progress', color: '#FF9800' },
      'closed': { displayText: 'Cerrada', value: 'closed', color: '#4CAF50' },
      'cancelled': { displayText: 'Cancelada', value: 'cancelled', color: '#9E9E9E' }
    };

    return statusMap[status] || { displayText: status || 'Sin Estado', value: status || '', color: '#9E9E9E' };
  }
}
