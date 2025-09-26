import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonConformity } from './Entity/non-conformity.entity';
import { CreateNonConformityDto, UpdateNonConformityDto } from './dto/non-conformity.dto';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private ncRepository: Repository<NonConformity>,
  ) {}

  async create(createDto: CreateNonConformityDto): Promise<NonConformity> {
  const nc = this.ncRepository.create(createDto as any) as unknown as NonConformity;
  return (await this.ncRepository.save(nc as any)) as NonConformity;
  }

  async findAll(): Promise<NonConformity[]> {
    return await this.ncRepository.find({
      select: ['id', 'number', 'status', 'createdAt', 'updatedAt'], // Eliminado 'title' porque no existe en la entidad
      relations: ['actionPlans', 'followUps'],
    });
  }

  async findOne(id: number): Promise<NonConformity> {
    const nc = await this.ncRepository.findOne({ where: { id }, relations: ['actionPlans', 'followUps', 'whyRecords'] });
    if (!nc) throw new NotFoundException('NonConformity not found');
    return nc;
  }

  async update(id: number, updateDto: UpdateNonConformityDto): Promise<NonConformity> {
    const nc = await this.findOne(id);
    Object.assign(nc, updateDto as any);
    await this.ncRepository.save(nc);
    return nc;
  }

  async remove(id: number): Promise<void> {
    const nc = await this.findOne(id);
    await this.ncRepository.remove(nc);
  }

  async getNextConsecutiveNumber(year: number): Promise<string> {
    // Obtener los últimos 2 dígitos del año
    const yearSuffix = year.toString().slice(-2);
    const prefix = `NC-${yearSuffix}`;
     
    // Buscar el último número consecutivo del año actual con el nuevo formato
    const lastNC = await this.ncRepository
      .createQueryBuilder('nc')
      .where('nc.number LIKE :pattern', { pattern: `${prefix}-%` })
      .orderBy('nc.number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastNC && lastNC.number) {
      // Extraer el número consecutivo del formato NC-YY-XX
      const parts = lastNC.number.split('-');
      if (parts.length === 3) {
        const lastConsecutive = parseInt(parts[2], 10);
        nextNumber = lastConsecutive + 1;
      }
    }
    
    // Formatear con ceros a la izquierda (2 dígitos)
    const formattedNumber = nextNumber.toString().padStart(2, '0');
    return `${prefix}-${formattedNumber}`;
  }

  async cancel(id: number, reason: string): Promise<NonConformity> {
    // Buscar la no conformidad
    const nc = await this.findOne(id);
    
    // Actualizar el estado a cancelado y agregar la razón
    nc.status = 'cancelled';
    nc.cancellationReason = reason; 
    nc.cancelledAt = new Date();
    
    // Guardar los cambios
    return await this.ncRepository.save(nc);
  }
}
