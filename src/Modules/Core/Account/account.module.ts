import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/Common/Auth/constants';
import { AccountController } from './account.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/Entity/user.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
   
  ],
  controllers: [AccountController],
  providers: [AccountService,
    UsersService,
    AuthService

    // AuthService
  ],
  
})
export class AccountModule {}
