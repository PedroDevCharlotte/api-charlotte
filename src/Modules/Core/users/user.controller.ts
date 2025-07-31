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
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { UsersService } from './users.service';
import { UserDto } from './Dto/user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ReqDeleteUserDto } from './Dto/RespUser.dto';
@ApiBearerAuth('Token')

@Controller('user')
export class UserController {
  constructor(private usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('list')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('insert')
  createUser(@Body() createUserDto: UserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('update')
  updateUser( @Body() updateUserDto: UserDto) {
    return this.usersService.update(updateUserDto);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('delete')
  deleteUser(@Body() DeleteUser: ReqDeleteUserDto) {
    return this.usersService.delete(DeleteUser.id);
  }
}
