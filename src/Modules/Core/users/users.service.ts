import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';
import { isError } from 'util';

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
  }

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
      UserToAdd.password = user.password;
      UserToAdd.role = user.role;
      // Assuming the user entity has a role field
      resp.data = await this.userRepository.save(UserToAdd);
    } catch (error) {
      resp.isError = true;
      resp.message = error.message;
      
    }


    return resp;
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
    
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.userRepository.remove(user);
    } catch (error) {
      throw new NotFoundException(`Error deleting user with id ${userId}`);
    }
  }
}
