import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';

@Module({
  providers: [UsersService],
  controllers: [ UserController ],
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([User])],

})
export class UsersModule {  

}
