import { Module } from '@nestjs/common';
import { ProviderDBService } from './ProviderDB.Service';

@Module({
  imports: [ProviderDBService],
  exports: [ProviderDBService],
})
export class DatabaseModule {}
