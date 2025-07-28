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

@Controller('user')
export class UserController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Post('list')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('insert')
  createUser(@Body() createUserDto: UserDto) {
    return this.usersService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put('update/:id')
  updateUser(@Param('id') id: number, @Body() updateUserDto: UserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('delete/:id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.delete(id);
  }
}
