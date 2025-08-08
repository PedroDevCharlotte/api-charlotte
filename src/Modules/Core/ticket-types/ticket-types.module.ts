import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTypesService } from './ticket-types.service';
import { TicketTypesController } from './ticket-types.controller';
import { TicketType } from './Entity/ticket-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketType])],
  controllers: [TicketTypesController],
  providers: [TicketTypesService],
  exports: [TicketTypesService, TypeOrmModule],
})
export class TicketTypesModule {}
