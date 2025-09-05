import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntraIdTokenService } from './entra-id-token.service';
import { GraphService } from './graph.service';
import { FilesController } from './files.controller';

@Module({
  imports: [HttpModule],
  providers: [EntraIdTokenService, GraphService],
  controllers: [FilesController],
  exports: [EntraIdTokenService, GraphService],
})
export class EntraIdModule {}
