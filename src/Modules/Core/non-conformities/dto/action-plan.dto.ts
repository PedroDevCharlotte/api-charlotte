import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString, IsNumber } from 'class-validator';

export class CreateActionPlanDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  commitmentDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, description: 'ID del usuario responsable individual (para compatibilidad)' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ required: false, description: 'Array de IDs de usuarios responsables' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];
}

export class UpdateActionPlanDto extends CreateActionPlanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class CreateFollowUpDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  verifiedBy?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  verifiedByOther?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isEffective?: boolean;

  @ApiProperty({ required: false, description: 'Array de IDs de usuarios responsables' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];
}

export class UpdateFollowUpDto extends CreateFollowUpDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  id?: number;
}