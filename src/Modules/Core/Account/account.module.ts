import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/Common/Auth/constants';
import { AccountController } from './account.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/Entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule, // Importar UsersModule en lugar de declarar UsersService
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
    AuthService
  ],
})
export class AccountModule {}
