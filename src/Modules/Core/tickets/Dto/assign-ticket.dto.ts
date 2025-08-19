import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignTicketDto {
    @ApiProperty({
        description: 'ID del usuario al que se asignará el ticket',
        type: Number,
    })
  @IsInt()
  @IsPositive()
  assigneeId: number;
}
