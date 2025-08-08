import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketType } from './Entity/ticket-type.entity';
import { CreateTicketTypeDto, UpdateTicketTypeDto } from './Dto/ticket-type.dto';
import type { User } from '../users/Entity/user.entity';

@Injectable()
export class TicketTypesService {
  constructor(
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
  ) {}

  /**
   * Crear un nuevo tipo de ticket
   */
  async create(createTicketTypeDto: CreateTicketTypeDto): Promise<TicketType> {
    // Verificar si ya existe un tipo de ticket con el mismo nombre
    const existingTicketType = await this.ticketTypeRepository.findOne({
      where: { name: createTicketTypeDto.name },
    });

    if (existingTicketType) {
      throw new ConflictException('Ya existe un tipo de ticket con este nombre');
    }

    // Verificar si ya existe un código si se proporciona
    if (createTicketTypeDto.code) {
      const existingCode = await this.ticketTypeRepository.findOne({
        where: { code: createTicketTypeDto.code },
      });

      if (existingCode) {
        throw new ConflictException('Ya existe un tipo de ticket con este código');
      }
    }

    const ticketType = this.ticketTypeRepository.create(createTicketTypeDto);
    return await this.ticketTypeRepository.save(ticketType);
  }

  /**
   * Obtener todos los tipos de ticket activos
   */
  async findAll(): Promise<TicketType[]> {
    return await this.ticketTypeRepository.find({
      where: { isActive: true },
      relations: ['defaultUser', 'supportUsers'],
      order: { priority: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Obtener todos los tipos de ticket incluyendo inactivos
   */
  async findAllIncludingInactive(): Promise<TicketType[]> {
    return await this.ticketTypeRepository.find({
      order: { priority: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Obtener un tipo de ticket por ID
   */
  async findOne(id: number): Promise<TicketType> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id },
      relations: ['defaultUser', 'supportUsers'],
    });

    if (!ticketType) {
      throw new NotFoundException(`Tipo de ticket con ID ${id} no encontrado`);
    }

    return ticketType;
  }

  /**
   * Obtener un tipo de ticket por nombre
   */
  async findByName(name: string): Promise<TicketType> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { name },
    });

    if (!ticketType) {
      throw new NotFoundException(`Tipo de ticket '${name}' no encontrado`);
    }

    return ticketType;
  }

  /**
   * Obtener un tipo de ticket por código
   */
  async findByCode(code: string): Promise<TicketType> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { code },
    });

    if (!ticketType) {
      throw new NotFoundException(`Tipo de ticket con código '${code}' no encontrado`);
    }

    return ticketType;
  }

  /**
   * Actualizar un tipo de ticket
   */
  async update(id: number, updateTicketTypeDto: UpdateTicketTypeDto): Promise<TicketType> {
    const ticketType = await this.findOne(id);

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (updateTicketTypeDto.name && updateTicketTypeDto.name !== ticketType.name) {
      const existingTicketType = await this.ticketTypeRepository.findOne({
        where: { name: updateTicketTypeDto.name },
      });

      if (existingTicketType) {
        throw new ConflictException('Ya existe un tipo de ticket con este nombre');
      }
    }

    // Verificar si el nuevo código ya existe (si se está cambiando)
    if (updateTicketTypeDto.code && updateTicketTypeDto.code !== ticketType.code) {
      const existingCode = await this.ticketTypeRepository.findOne({
        where: { code: updateTicketTypeDto.code },
      });

      if (existingCode) {
        throw new ConflictException('Ya existe un tipo de ticket con este código');
      }
    }

    Object.assign(ticketType, updateTicketTypeDto);
    return await this.ticketTypeRepository.save(ticketType);
  }

  /**
   * Desactivar un tipo de ticket (soft delete)
   */
  async deactivate(id: number): Promise<TicketType> {
    const ticketType = await this.findOne(id);
    ticketType.isActive = false;
    return await this.ticketTypeRepository.save(ticketType);
  }

  /**
   * Activar un tipo de ticket
   */
  async activate(id: number): Promise<TicketType> {
    const ticketType = await this.findOne(id);
    ticketType.isActive = true;
    return await this.ticketTypeRepository.save(ticketType);
  }

  /**
   * Eliminar permanentemente un tipo de ticket
   */
  async remove(id: number): Promise<void> {
    const ticketType = await this.findOne(id);
    
    // TODO: Verificar si hay tickets asociados a este tipo antes de eliminar
    // const ticketsCount = await this.ticketRepository.count({
    //   where: { ticketTypeId: id }
    // });
    // 
    // if (ticketsCount > 0) {
    //   throw new ConflictException(
    //     'No se puede eliminar el tipo de ticket porque tiene tickets asociados'
    //   );
    // }

    await this.ticketTypeRepository.remove(ticketType);
  }

  /**
   * Obtener estadísticas de tipos de ticket
   */
  async getStatistics(): Promise<any> {
    const total = await this.ticketTypeRepository.count();
    const active = await this.ticketTypeRepository.count({
      where: { isActive: true }
    });
    const inactive = total - active;

    return {
      total,
      active,
      inactive
    };
  }

  /**
   * Asignar usuario por defecto a un tipo de ticket
   */
  async setDefaultUser(ticketTypeId: number, userId?: number): Promise<TicketType> {
    const ticketType = await this.findOne(ticketTypeId);
    
    ticketType.defaultUserId = userId || undefined;
    return await this.ticketTypeRepository.save(ticketType);
  }

  /**
   * Obtener el usuario por defecto de un tipo de ticket
   */
  async getDefaultUser(ticketTypeId: number): Promise<any> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: ticketTypeId },
      relations: ['defaultUser'],
    });

    if (!ticketType) {
      throw new NotFoundException(`Tipo de ticket con ID ${ticketTypeId} no encontrado`);
    }

    return ticketType.defaultUser || null;
  }
}
