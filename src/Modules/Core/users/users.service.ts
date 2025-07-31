import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import { UserLoginDto } from '../auth/Dto/user-login.dto';
import { UserDto } from './Dto/user.dto';
import * as bcrypt from 'bcrypt';
import { RespUserDto } from './Dto/RespUser.dto';
import { isError } from 'util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { email: username } });
  }

  async findAll(): Promise<any> {
    let response = {
      users: [] as RespUserDto[],
      isError: false,
      errorMessage: '',
    };

    try {
      let users = await this.userRepository.find();
      response.users = users.map((user) => {
        const respUser = new RespUserDto();
        respUser.id = user.id;
        respUser.firstName = user.firstName;
        respUser.lastName = user.lastName;
        respUser.email = user.email;
        respUser.role = user.role;
        respUser.isTwoFactorEnabled = user.isTwoFactorEnabled;
        respUser.last2FAVerifiedAt = user.last2FAVerifiedAt;
        respUser.isBlocked = user.isBlocked || false;
        respUser.isActive = user.isActive || false;

        return respUser;
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      // throw new NotFoundException('Users not found');
    }

    return response;
  }

  async findById(userId: number): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async create(user: UserDto): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async update(updateData: UserDto): Promise<User> {
    const userId = updateData.id;
    if (!userId) {
      throw new NotFoundException('User ID is required for update');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si se proporciona una nueva contraseña, verificar si cambió
    if (updateData.password) {
      const isSamePassword = await bcrypt.compare(
        updateData.password,
        user.password,
      );
      if (!isSamePassword) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(
          updateData.password,
          saltRounds,
        );
      } else {
        // Si es la misma, eliminamos del update para no rehashearla
        delete updateData.password;
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  // async delete(userId: number): Promise<void> {
  //   const user = await this.findById(userId);
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   Object.assign(user, updateData);
  //   return this.userRepository.save(user);
  // }

  async delete(userId: number): Promise<void> {
    const result = await this.userRepository.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async updateTwoFactorSecret(
    userId: number,
    twoFactorSecret: string,
    isTemp: boolean,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (isTemp) {
      user.temp2FASecret = twoFactorSecret;
    } else {
      user.temp2FASecret = '';
      user.twoFactorSecret = twoFactorSecret;
    }
    return this.userRepository.save(user);
  }

  async updateLast2FAVerifiedAt(userId: number, date: Date): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.last2FAVerifiedAt = date;
    return this.userRepository.save(user);
  }

  async enableTwoFactor(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isTwoFactorEnabled = true;
    user.last2FAVerifiedAt = new Date(); // Set current date as last verified
    return this.userRepository.save(user);
  }

  async disableTwoFactor(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = ''; // Clear the secret when disabling 2FA

    return this.userRepository.save(user);
  }
}
