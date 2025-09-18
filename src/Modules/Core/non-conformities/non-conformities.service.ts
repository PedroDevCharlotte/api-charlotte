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
    return await this.ncRepository.find({ relations: ['actionPlans', 'followUps', 'whyRecords'] });
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
}
