import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import { UserLoginDto } from '../auth/Dto/user-login.dto';
import { UserDto } from './Dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { email: username } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(userId: number): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async create(user: UserDto ): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async update(
    userId: number,
    updateData: Partial<Omit<User, 'userId'>>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async delete(userId: number): Promise<void> {
    const result = await this.userRepository.delete({id: userId });
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
