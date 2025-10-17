import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './Entity/role.entity';
import { Permission } from '../permissions/Entity/permission.entity';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './Dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // Verificar si ya existe un rol con el mismo nombre
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException('Ya existe un rol con este nombre');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      isActive: createRoleDto.isActive ?? true
    } as any);

    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const perms = await this.permissionRepository.find({ where: createRoleDto.permissions.map((n) => ({ name: n })) });
      (role as any).permissions = perms;
    }

    const saved = await this.roleRepository.save(role as any);
    const loaded = await this.roleRepository.findOne({ where: { id: saved.id }, relations: ['permissions'] });
    if (!loaded) return (saved as unknown) as RoleResponseDto;
    return { ...loaded, permissions: (loaded.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      relations: ['permissions']
    });

    // Map permissions to string[] for compatibility with DTOs
    return roles.map((r) => ({ ...r, permissions: (r.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto));
  }

  async findAllIncludingInactive(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      order: { name: 'ASC' },
      relations: ['permissions']
    });

    return roles.map((r) => ({ ...r, permissions: (r.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto));
  }

  async findOne(id: number): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users', 'permissions']
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // map permissions to names
    return { ...role, permissions: (role.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async findByName(name: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { name, isActive: true },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Rol con nombre '${name}' no encontrado`);
    }

    return { ...role, permissions: (role.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
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

    // Map simple fields first
    if (updateRoleDto.name !== undefined) role.name = updateRoleDto.name;
    if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;
    if (updateRoleDto.isActive !== undefined) role.isActive = updateRoleDto.isActive;

    // If permissions provided (array of names), map to entities
    if (updateRoleDto.permissions) {
      const perms = await this.permissionRepository.find({ where: updateRoleDto.permissions.map((n) => ({ name: n })) });
      (role as any).permissions = perms;
    }

    role.updatedAt = new Date();

    const saved = await this.roleRepository.save(role as any);
    const loaded = await this.roleRepository.findOne({ where: { id: saved.id }, relations: ['permissions'] });
    if (!loaded) return (saved as unknown) as RoleResponseDto;
    return { ...loaded, permissions: (loaded.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
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

  async softDelete(id: number): Promise<RoleResponseDto> {
    const role = await this.findOne(id);
    role.isActive = false;
    role.updatedAt = new Date();

    const saved = await this.roleRepository.save(role as any);
    const loaded = await this.roleRepository.findOne({ where: { id: saved.id }, relations: ['permissions'] });
    if (!loaded) return (saved as unknown) as RoleResponseDto;
    return { ...loaded, permissions: (loaded.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async activate(id: number): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id }, relations: ['permissions'] });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    role.isActive = true;
    role.updatedAt = new Date();

    const saved = await this.roleRepository.save(role as any);
    const loaded = await this.roleRepository.findOne({ where: { id: saved.id }, relations: ['permissions'] });
    if (!loaded) return (saved as unknown) as RoleResponseDto;
    return { ...loaded, permissions: (loaded.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async updatePermissions(id: number, permissions: string[]): Promise<RoleResponseDto> {
    const role = await this.findOne(id);
    // permissions param is array of permission names; map to Permission entities
    const perms = await this.permissionRepository.find({ where: permissions.map((n) => ({ name: n })) });
    (role as any).permissions = perms;
    role.updatedAt = new Date();

    const saved = await this.roleRepository.save(role as any);
    const loaded = await this.roleRepository.findOne({ where: { id: saved.id }, relations: ['permissions'] });
    if (!loaded) return (saved as unknown) as RoleResponseDto;
    return { ...loaded, permissions: (loaded.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto;
  }

  async getRolesByPermission(permission: string): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.isActive = :isActive', { isActive: true })
      .andWhere('permission.name = :permission', { permission })
      .getMany();

    return roles.map((r) => ({ ...r, permissions: (r.permissions || []).map((p: any) => p.name) } as unknown as RoleResponseDto));
  }

  /**
   * Devuelve la entidad Role con relaciones 'permissions' cargadas (Permission[])
   * Útil cuando se necesitan los campos completos de Permission (ej. modulePath)
   */
  async getRoleWithPermissionsEntity(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id }, relations: ['permissions'] });
  }
}
