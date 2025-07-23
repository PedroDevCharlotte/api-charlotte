import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './../../../Common/Auth/auth.guard';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Post('getAllUsers')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get('user/:id')
  getUserById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('user')
  createUser(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put('user/:id')
  updateUser(@Param('id') id: number, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('user/:id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.delete(id);
  }
}
