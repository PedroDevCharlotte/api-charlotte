import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './Entity/banner.entity';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';

import { EntraIdModule } from '../../Services/EntraID/entra-id.module';

@Module({
  imports: [TypeOrmModule.forFeature([Banner]), forwardRef(() => EntraIdModule)],
  providers: [BannersService],
  controllers: [BannersController],
  exports: [BannersService],
})
export class BannersModule {}
