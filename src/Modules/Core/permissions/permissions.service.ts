import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './Entity/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(@InjectRepository(Permission) private readonly permRepo: Repository<Permission>) {}

  findAll(): Promise<Permission[]> {
    return this.permRepo.find();
  }

  findOne(id: number): Promise<Permission | null> {
    return this.permRepo.findOne({ where: { id } });
  }

  async create(payload: Partial<Permission>): Promise<Permission> {
    const entity = this.permRepo.create(payload);
    return this.permRepo.save(entity);
  }

  async update(id: number, payload: Partial<Permission>): Promise<Permission> {
    await this.permRepo.update(id, payload);
    return this.findOne(id) as Promise<Permission>;
  }

  async remove(id: number): Promise<void> {
    await this.permRepo.delete(id);
  }
}
