import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NonConformitiesService } from './non-conformities.service';
import { NonConformitiesController } from './non-conformities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    require('./Entity/non-conformity.entity').NonConformity, 
    require('./Entity/action-plan.entity').ActionPlan, 
    require('./Entity/follow-up.entity').FollowUp, 
    require('./Entity/why-record.entity').WhyRecord,
    require('../users/Entity/user.entity').User
  ])],
  controllers: [NonConformitiesController],
  providers: [NonConformitiesService],
  exports: [NonConformitiesService],
})
export class NonConformitiesModule {}
