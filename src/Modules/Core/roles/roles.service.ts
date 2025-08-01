import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './Entity/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './Dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Verificar si ya existe un rol con el mismo nombre
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException('Ya existe un rol con este nombre');
    }

    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findAllIncludingInactive(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users']
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name, isActive: true }
    });

    if (!role) {
      throw new NotFoundException(`Rol con nombre '${name}' no encontrado`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otro rol con ese nombre
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name }
      });

      if (existingRole) {
        throw new ConflictException('Ya existe un rol con este nombre');
      }
    }

    Object.assign(role, updateRoleDto);
    role.updatedAt = new Date();

    return await this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users']
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // Verificar si hay usuarios asignados a este rol
    if (role.users && role.users.length > 0) {
      throw new ConflictException('No se puede eliminar el rol porque tiene usuarios asignados');
    }

    await this.roleRepository.remove(role);
  }

  async softDelete(id: number): Promise<Role> {
    const role = await this.findOne(id);
    role.isActive = false;
    role.updatedAt = new Date();

    return await this.roleRepository.save(role);
  }

  async activate(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id }
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    role.isActive = true;
    role.updatedAt = new Date();

    return await this.roleRepository.save(role);
  }

  async updatePermissions(id: number, permissions: string[]): Promise<Role> {
    const role = await this.findOne(id);
    role.permissions = permissions;
    role.updatedAt = new Date();

    return await this.roleRepository.save(role);
  }

  async getRolesByPermission(permission: string): Promise<Role[]> {
    return await this.roleRepository
      .createQueryBuilder('role')
      .where('role.isActive = :isActive', { isActive: true })
      .andWhere('JSON_SEARCH(role.permissions, "one", :permission) IS NOT NULL', { permission })
      .getMany();
  }
}
