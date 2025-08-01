import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './Entity/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from './Dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    // Verificar si ya existe un departamento con el mismo nombre o código
    const existingDepartment = await this.departmentRepository.findOne({
      where: [
        { name: createDepartmentDto.name },
        ...(createDepartmentDto.code ? [{ code: createDepartmentDto.code }] : [])
      ]
    });

    if (existingDepartment) {
      if (existingDepartment.name === createDepartmentDto.name) {
        throw new ConflictException('Ya existe un departamento con este nombre');
      }
      if (existingDepartment.code === createDepartmentDto.code) {
        throw new ConflictException('Ya existe un departamento con este código');
      }
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return await this.departmentRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findAllIncludingInactive(): Promise<Department[]> {
    return await this.departmentRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['users', 'manager']
    });

    if (!department) {
      throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
    }

    return department;
  }

  async findByCode(code: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { code, isActive: true }
    });

    if (!department) {
      throw new NotFoundException(`Departamento con código '${code}' no encontrado`);
    }

    return department;
  }

  async findByName(name: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { name, isActive: true }
    });

    if (!department) {
      throw new NotFoundException(`Departamento con nombre '${name}' no encontrado`);
    }

    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);

    // Si se está actualizando el nombre o código, verificar que no exista otro departamento con esos valores
    if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
      const existingByName = await this.departmentRepository.findOne({
        where: { name: updateDepartmentDto.name }
      });

      if (existingByName) {
        throw new ConflictException('Ya existe un departamento con este nombre');
      }
    }

    if (updateDepartmentDto.code && updateDepartmentDto.code !== department.code) {
      const existingByCode = await this.departmentRepository.findOne({
        where: { code: updateDepartmentDto.code }
      });

      if (existingByCode) {
        throw new ConflictException('Ya existe un departamento con este código');
      }
    }

    Object.assign(department, updateDepartmentDto);
    department.updatedAt = new Date();

    return await this.departmentRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['users']
    });

    if (!department) {
      throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
    }

    // Verificar si hay usuarios asignados a este departamento
    if (department.users && department.users.length > 0) {
      throw new ConflictException('No se puede eliminar el departamento porque tiene usuarios asignados');
    }

    await this.departmentRepository.remove(department);
  }

  async softDelete(id: number): Promise<Department> {
    const department = await this.findOne(id);
    department.isActive = false;
    department.updatedAt = new Date();

    return await this.departmentRepository.save(department);
  }

  async activate(id: number): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id }
    });

    if (!department) {
      throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
    }

    department.isActive = true;
    department.updatedAt = new Date();

    return await this.departmentRepository.save(department);
  }

  async setManager(departmentId: number, managerId: number): Promise<Department> {
    const department = await this.findOne(departmentId);
    department.managerId = managerId;
    department.updatedAt = new Date();

    return await this.departmentRepository.save(department);
  }

  async removeManager(departmentId: number): Promise<Department> {
    const department = await this.findOne(departmentId);
    department.managerId = null;
    department.updatedAt = new Date();

    return await this.departmentRepository.save(department);
  }

  async getDepartmentsByManager(managerId: number): Promise<Department[]> {
    return await this.departmentRepository.find({
      where: { managerId, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async getDepartmentHierarchy(): Promise<Department[]> {
    return await this.departmentRepository.find({
      where: { isActive: true },
      relations: ['manager'],
      order: { name: 'ASC' }
    });
  }
}
