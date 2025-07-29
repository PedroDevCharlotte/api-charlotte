import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from '../auth/Dto/user-login.dto';
import { UserDto } from './Dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // private users: User[] = [
  //   {
  //     id: 1,
  //     firstName: 'CharlotteInc',
  //     password: 'Rx1k9So4q13k0V50k9VHG',
  //   },
  // ];

  async findOne(username: string): Promise<any | undefined> {
    let user: any | undefined;
    try {
      user = await this.userRepository.findOne({ where: { email: username } });
    } catch (error) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
    return this.userRepository.find();
  }

  async findById(userId: number): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { id: userId } });
  async findById(userId: number): Promise<any | undefined> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async create(user: Omit<User, 'userId'>): Promise<any> {
    const resp = { isError: false, message: '', data: {} };
    try {
      const UserToAdd = new User();
      UserToAdd.firstName = user.firstName;
      UserToAdd.lastName = user.lastName;
      UserToAdd.email = user.email;

      // 🔐 Hashear la contraseña antes de guardarla
      const saltRounds = 10;
      UserToAdd.password = await bcrypt.hash(user.password, saltRounds);

      UserToAdd.role = user.role;

      resp.data = await this.userRepository.save(UserToAdd);
    } catch (error) {
      resp.isError = true;
      resp.message = error.message;
    }

    return resp;
  }

  
async update(updateData: Partial<Omit<User, 'userId'>>): Promise<User> {
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
    const isSamePassword = await bcrypt.compare(updateData.password, user.password);
    if (!isSamePassword) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    } else {
      // Si es la misma, eliminamos del update para no rehashearla
      delete updateData.password;
    }
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
