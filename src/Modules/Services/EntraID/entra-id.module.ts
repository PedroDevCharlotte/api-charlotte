import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntraIdTokenService } from './entra-id-token.service';
import { GraphService } from './graph.service';

@Module({
  imports: [HttpModule],
  providers: [EntraIdTokenService, GraphService],
  exports: [EntraIdTokenService, GraphService],
})
export class EntraIdModule {}
