import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsDateString, Length, IsNumber } from 'class-validator';
import { CreateActionPlanDto, CreateFollowUpDto, UpdateActionPlanDto, UpdateFollowUpDto } from './action-plan.dto';

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  classificationOptionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryOptionId?: number;
 

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
  @IsString()
  otherResponsible?: string;

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
  @IsString()
  otherParticipant?: string;

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  fiveWhysParticipants?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fiveWhysDate?: string;

  @ApiProperty({ required: false, type: [CreateActionPlanDto] })
  @IsOptional()
  @IsArray()
  actionPlans?: CreateActionPlanDto[];

  @ApiProperty({ required: false, type: [CreateFollowUpDto] })
  @IsOptional()
  @IsArray()
  followUps?: CreateFollowUpDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  whyRecords?: any[];
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  classificationOptionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryOptionId?: number;

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
  @IsString()
  otherResponsible?: string;

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
  @IsString()
  otherParticipant?: string;

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  fiveWhysParticipants?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  fiveWhysDate?: string;

  @ApiProperty({ required: false, type: [CreateActionPlanDto] })
  @IsOptional()
  @IsArray()
  actionPlans?: CreateActionPlanDto[];

  @ApiProperty({ required: false, type: [CreateFollowUpDto] })
  @IsOptional()
  @IsArray()
  followUps?: CreateFollowUpDto[];

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
  categoryOption?: any;

  @ApiProperty({ required: false })
  categoryOptionId?: number;

  @ApiProperty({ required: false })
  classification?: string;

  @ApiProperty({ required: false })
  classificationOption?: any;

  
  @ApiProperty({ required: false })
  classificationOptionId?: number;

  @ApiProperty({ required: false })
  areaOrProcess?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  typeOption?: any;

  @ApiProperty({ required: false })
  typeOptionId?: number;

  @ApiProperty({ required: false })
  areaOption?: any;

  @ApiProperty({ required: false })
  motiveOption?: any;

  @ApiProperty({ required: false })
  statusOption?: any;

  // Campos adicionales de la primera tab
  @ApiProperty({ required: false })
  validFrom?: Date;

  @ApiProperty({ required: false })
  validTo?: Date;

  @ApiProperty({ required: false })
  detectedAt?: Date;

  @ApiProperty({ required: false })
  closedAt?: Date;

  @ApiProperty({ required: false })
  createdAtDate?: Date;

  @ApiProperty({ required: false })
  findingDescription?: string;

  @ApiProperty({ required: false })
  cause?: string;

  @ApiProperty({ required: false })
  investigationReference?: string;

  @ApiProperty({ required: false })
  observations?: string;

  @ApiProperty({ required: false })
  reference?: string;

  @ApiProperty({ required: false })
  participants?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otherResponsible?: string;

  @ApiProperty({ required: false })
  otherParticipant?: string;

  @ApiProperty({ required: false })
  fiveWhysParticipants?: any[];

  @ApiProperty({ required: false })
  fiveWhysDate?: string;

  @ApiProperty({ required: false })
  hasSimilarCases?: boolean;

  @ApiProperty({ required: false })
  similarCasesDetails?: string;

  @ApiProperty({ required: false })
  rootCauseDetermination?: string;

  @ApiProperty({ required: false })
  otherType?: string;

  @ApiProperty({ required: false })
  otherMotive?: string;

  @ApiProperty({ required: false, type: [UpdateActionPlanDto] })
  actionPlans?: UpdateActionPlanDto[];

  @ApiProperty({ required: false, type: [UpdateFollowUpDto] })
  followUps?: UpdateFollowUpDto[];

  @ApiProperty({ required: false, isArray: true })
  whyRecords?: any[];

  @ApiProperty({ required: false })
  areaResponsible?: any;

  @ApiProperty({ required: false })
  areaResponsibleId?: number;

  @ApiProperty({ required: false })
  motiveOptionId?: number;

  @ApiProperty({ required: false })
  cancellationReason?: string;

  @ApiProperty({ required: false })
  cancelledAt?: Date;

  constructor(nc: any) {
    this.id = nc.id;
    this.number = nc.number;
    this.title = nc.findingDescription || nc.observations || `No Conformidad ${nc.number}`;
    this.status = nc.status;
    this.type = nc.typeOption?.displayText || nc.typeOption?.value;
    this.category = nc.categoryOption?.displayText || nc.categoryOption?.value;
    this.categoryOptionId = nc.categoryOptionId;
    this.categoryOption = nc.categoryOption;
    this.areaOrProcess = nc.areaOrProcess;
    this.createdAt = nc.createdAt;
    this.updatedAt = nc.updatedAt;
    this.typeOption = nc.typeOption;
    this.typeOptionId = nc.typeOptionId;
    this.areaOption = nc.areaResponsible ? {
      displayText: nc.areaResponsible.firstName + ' ' + nc.areaResponsible.lastName,
      value: nc.areaResponsibleId
    } : null;
    this.motiveOption = nc.motiveOption;
    
    // Mapear todos los campos adicionales de la primera tab
    this.validFrom = nc.validFrom;
    this.validTo = nc.validTo;
    this.detectedAt = nc.detectedAt;
    this.closedAt = nc.closedAt;
    this.createdAtDate = nc.createdAtDate;
    this.classification = nc.classification?.displayText || nc.classification?.value;
    this.classificationOptionId = nc.classificationOptionId;
    this.classificationOption = nc.classificationOption;
    this.findingDescription = nc.findingDescription;
    this.cause = nc.cause;
    this.investigationReference = nc.investigationReference;
    this.observations = nc.observations;
    this.reference = nc.reference;
    this.participants = Array.isArray(nc.participants) ? nc.participants : [];
    this.otherParticipant = nc.otherParticipant;
    this.fiveWhysParticipants = Array.isArray(nc.fiveWhysParticipants) ? nc.fiveWhysParticipants : [];
    this.fiveWhysDate = nc.fiveWhysDate;
    this.hasSimilarCases = nc.hasSimilarCases;
    this.similarCasesDetails = nc.similarCasesDetails;
    this.rootCauseDetermination = nc.rootCauseDetermination;
    this.otherType = nc.otherType;
    this.otherMotive = nc.otherMotive;
    this.otherResponsible = nc.otherResponsible;
    
    // Mapear relaciones con responsables múltiples usando relación directa
    this.actionPlans = Array.isArray(nc.actionPlans) ? nc.actionPlans.map(plan => ({
      ...plan,
      // Mapear responsables múltiples a formato compatible con frontend
      responsibleUsers: plan.responsibles || [],
      // Mantener compatibilidad legacy si es necesario
      responsibleOptionIds: plan.responsibles?.map((user: any) => user.id) || [],
      userIds: plan.responsibles?.map((user: any) => user.id) || []
    })) : []; 
    
    this.followUps = Array.isArray(nc.followUps) ? nc.followUps.map(followUp => ({
      ...followUp,
      // Mapear responsables múltiples a formato compatible con frontend
      responsibleUsers: followUp.responsibles || [],
      // Mantener compatibilidad legacy si es necesario
      responsibleOptionIds: followUp.responsibles?.map((user: any) => user.id) || [],
      userIds: followUp.responsibles?.map((user: any) => user.id) || []
    })) : [];
    this.whyRecords = Array.isArray(nc.whyRecords) ? nc.whyRecords : [];
    
    // Mapear campos adicionales de la entidad
    this.areaResponsible = nc.areaResponsible;
    this.areaResponsibleId = nc.areaResponsibleId;
    this.motiveOptionId = nc.motiveOptionId;
    this.cancellationReason = nc.cancellationReason;
    this.cancelledAt = nc.cancelledAt;
    
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
