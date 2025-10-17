import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/Common/Auth/constants';
import { AccountController } from './account.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/Entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule, // Importar UsersModule en lugar de declarar UsersService
    AuthModule,
    RolesModule,
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
  ],
})
export class AccountModule {}
