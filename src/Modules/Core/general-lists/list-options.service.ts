import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListOption } from './Entity/list-option.entity';
import { GeneralList } from './Entity/general-list.entity';
import { CreateListOptionDto, UpdateListOptionDto } from './Dto/list-option.dto';

@Injectable()
export class ListOptionsService {
  constructor(
    @InjectRepository(ListOption)
    private listOptionRepository: Repository<ListOption>,
    @InjectRepository(GeneralList)
    private generalListRepository: Repository<GeneralList>,
  ) {}

  /**
   * Crear una nueva opción en una lista
   */
  async create(listId: number, createDto: CreateListOptionDto): Promise<ListOption> {
    // Verificar que la lista existe
    const list = await this.generalListRepository.findOne({ where: { id: listId } });
    if (!list) {
      throw new NotFoundException(`Lista con ID ${listId} no encontrada`);
    }

    // Verificar que el código no exista en esta lista
    const existing = await this.listOptionRepository.findOne({
      where: { listId, code: createDto.code }
    });

    if (existing) {
      throw new BadRequestException(`Ya existe una opción con el código '${createDto.code}' en esta lista`);
    }

    // Si es default, quitar default de otras opciones
    if (createDto.isDefault) {
      await this.clearDefaultOptions(listId);
    }

    const option = this.listOptionRepository.create({
      ...createDto,
      listId,
    });

    return await this.listOptionRepository.save(option);
  }

  /**
   * Obtener todas las opciones de una lista
   */
  async findByList(listId: number, includeInactive = false): Promise<ListOption[]> {
    const queryBuilder = this.listOptionRepository.createQueryBuilder('option')
      .leftJoinAndSelect('option.childOptions', 'childOptions', 'childOptions.isActive = :active', { active: true })
      .where('option.listId = :listId', { listId })
      .andWhere('option.parentOptionId IS NULL');

    if (!includeInactive) {
      queryBuilder.andWhere('option.isActive = :active', { active: true });
    }

    return await queryBuilder
      .orderBy('option.sortOrder', 'ASC')
      .addOrderBy('option.displayText', 'ASC')
      .getMany();
  }

  /**
   * Obtener una opción por ID
   */
  async findOne(id: number): Promise<ListOption> {
    const option = await this.listOptionRepository.findOne({
      where: { id },
      relations: ['list', 'childOptions', 'parentOption']
    });

    if (!option) {
      throw new NotFoundException(`Opción con ID ${id} no encontrada`);
    }

    return option;
  }

  /**
   * Obtener opción por código en una lista específica
   */
  async findByCode(listId: number, code: string): Promise<ListOption> {
    const option = await this.listOptionRepository.findOne({
      where: { listId, code, isActive: true }
    });

    if (!option) {
      throw new NotFoundException(`Opción con código '${code}' no encontrada en la lista ${listId}`);
    }

    return option;
  }

  /**
   * Actualizar una opción
   */
  async update(id: number, updateDto: UpdateListOptionDto): Promise<ListOption> {
    const option = await this.findOne(id);

    // Si se establece como default, quitar default de otras opciones
    if (updateDto.isDefault && !option.isDefault) {
      await this.clearDefaultOptions(option.listId);
    }

    Object.assign(option, updateDto);
    await this.listOptionRepository.save(option);

    return this.findOne(id);
  }

  /**
   * Eliminar una opción (soft delete)
   */
  async remove(id: number): Promise<void> {
    const option = await this.findOne(id);
    option.isActive = false;
    await this.listOptionRepository.save(option);
  }

  /**
   * Obtener opciones hijas de una opción padre
   */
  async getChildOptions(parentOptionId: number): Promise<ListOption[]> {
    return await this.listOptionRepository.find({
      where: { parentOptionId, isActive: true },
      order: { sortOrder: 'ASC', displayText: 'ASC' }
    });
  }

  /**
   * Reordenar opciones
   */
  async reorderOptions(listId: number, optionIds: number[]): Promise<void> {
    for (let i = 0; i < optionIds.length; i++) {
      await this.listOptionRepository.update(
        { id: optionIds[i], listId },
        { sortOrder: i + 1 }
      );
    }
  }

  /**
   * Buscar opciones por texto
   */
  async search(listId: number, searchTerm: string): Promise<ListOption[]> {
    return await this.listOptionRepository
      .createQueryBuilder('option')
      .where('option.listId = :listId', { listId })
      .andWhere('option.isActive = :active', { active: true })
      .andWhere('(option.displayText ILIKE :search OR option.value ILIKE :search OR option.code ILIKE :search)', 
                { search: `%${searchTerm}%` })
      .orderBy('option.sortOrder', 'ASC')
      .addOrderBy('option.displayText', 'ASC')
      .getMany();
  }

  /**
   * Obtener la opción por defecto de una lista
   */
  async getDefaultOption(listId: number): Promise<ListOption | null> {
    return await this.listOptionRepository.findOne({
      where: { listId, isDefault: true, isActive: true }
    });
  }

  /**
   * Quitar el flag default de todas las opciones de una lista
   */
  private async clearDefaultOptions(listId: number): Promise<void> {
    await this.listOptionRepository.update(
      { listId, isDefault: true },
      { isDefault: false }
    );
  }
}
