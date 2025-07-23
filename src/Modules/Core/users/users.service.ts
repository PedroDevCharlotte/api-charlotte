import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';

// This should be a real class/interface representing a user entity
// export type User = {
//   userId: number;
//   username: string;
//   password: string;
// };

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

  async findOne(username: string): Promise<User | undefined> {
    return this.userRepository.find((user) => user.username === username);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.;
  }

  async findById(userId: number): Promise<User | undefined> {
    return this.users.find((user) => user.userId === userId);
  }

  async create(user: Omit<User, 'userId'>): Promise<User> {
    const newUser: User = {
      userId: this.users.length
        ? Math.max(...this.users.map((u) => u.userId)) + 1
        : 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
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
    return user;
  }

  async delete(userId: number): Promise<void> {
    const index = this.users.findIndex((user) => user.userId === userId);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }
    this.users.splice(index, 1);
  }
}
