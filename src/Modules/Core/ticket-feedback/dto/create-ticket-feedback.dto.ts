import { IsInt, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateTicketFeedbackDto {
  @IsString()
  @Length(1, 64)
  ticketId: string;

  // 0..3 values matching frontend options
  @IsInt()
  @IsIn([0, 1, 2, 3])
  knowledge: number;

  @IsInt()
  @IsIn([0, 1, 2, 3])
  timing: number;

  @IsInt()
  @IsIn([0, 1, 2, 3])
  escalation: number;

  @IsInt()
  @IsIn([0, 1])
  resolved: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
