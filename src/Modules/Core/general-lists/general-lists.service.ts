import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralList } from './Entity/general-list.entity';
import { ListOption } from './Entity/list-option.entity';
import { EntityDefinition } from './Entity/entity.entity';
import { FieldDefinition } from './Entity/field-definition.entity';
import { EntityFieldValue } from './Entity/entity-field-value.entity';
import { CreateGeneralListDto, UpdateGeneralListDto } from './Dto/general-list.dto';

@Injectable()
export class GeneralListsService {
  constructor(
    @InjectRepository(GeneralList)
    private generalListRepository: Repository<GeneralList>,
    @InjectRepository(ListOption)
    private listOptionRepository: Repository<ListOption>,
    @InjectRepository(EntityDefinition)
    private entityDefinitionRepository: Repository<EntityDefinition>,
    @InjectRepository(FieldDefinition)
    private fieldDefinitionRepository: Repository<FieldDefinition>,
    @InjectRepository(EntityFieldValue)
    private entityFieldValueRepository: Repository<EntityFieldValue>,
  ) {}

  /**
   * Crear una nueva lista general
   */
  async create(createDto: CreateGeneralListDto): Promise<GeneralList> {
    // Verificar que el código no exista
    const existing = await this.generalListRepository.findOne({
      where: { code: createDto.code }
    });

    if (existing) {
      throw new BadRequestException(`Ya existe una lista con el código '${createDto.code}'`);
    }

    const list = this.generalListRepository.create(createDto);
    return await this.generalListRepository.save(list);
  }

  /**
   * Obtener todas las listas con filtros
   */
  async findAll(includeOptions = false, category?: string): Promise<GeneralList[]> {
    const queryBuilder = this.generalListRepository.createQueryBuilder('list');

    if (includeOptions) {
      queryBuilder
        .leftJoinAndSelect('list.options', 'options', 'options.isActive = :active', { active: true })
        .orderBy('options.sortOrder', 'ASC');
    }

    if (category) {
      queryBuilder.andWhere('list.category = :category', { category });
    }

    queryBuilder
      .andWhere('list.isActive = :active', { active: true })
      .orderBy('list.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtener una lista por ID
   */
  async findOne(id: number, includeOptions = true): Promise<GeneralList> {
    const queryBuilder = this.generalListRepository.createQueryBuilder('list');

    if (includeOptions) {
      queryBuilder
        .leftJoinAndSelect('list.options', 'options', 'options.isActive = :active', { active: true })
        .orderBy('options.sortOrder', 'ASC');
    }

    const list = await queryBuilder
      .where('list.id = :id', { id })
      .getOne();

    if (!list) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada`);
    }

    return list;
  }

  /**
   * Obtener una lista por código
   */
  async findByCode(code: string, includeOptions = true): Promise<GeneralList> {
    const queryBuilder = this.generalListRepository.createQueryBuilder('list');

    if (includeOptions) {
      queryBuilder
        .leftJoinAndSelect('list.options', 'options', 'options.isActive = :active', { active: true })
        .orderBy('options.sortOrder', 'ASC');
    }

    const list = await queryBuilder
      .where('list.code = :code', { code })
      .andWhere('list.isActive = :active', { active: true })
      .getOne();

    if (!list) {
      throw new NotFoundException(`Lista con código '${code}' no encontrada`);
    }

    return list;
  }

  /**
   * Actualizar una lista
   */
  async update(id: number, updateDto: UpdateGeneralListDto): Promise<GeneralList> {
    const list = await this.findOne(id, false);

    if (list.isSystemList) {
      throw new BadRequestException('No se puede modificar una lista del sistema');
    }

    Object.assign(list, updateDto);
    await this.generalListRepository.save(list);

    return this.findOne(id);
  }

  /**
   * Eliminar una lista (soft delete)
   */
  async remove(id: number): Promise<void> {
    const list = await this.findOne(id, false);

    if (list.isSystemList) {
      throw new BadRequestException('No se puede eliminar una lista del sistema');
    }

    list.isActive = false;
    await this.generalListRepository.save(list);
  }

  /**
   * Obtener listas por categoría
   */
  async findByCategory(category: string): Promise<GeneralList[]> {
    return await this.generalListRepository.find({
      where: { category: category as any, isActive: true },
      relations: ['options'],
      order: { name: 'ASC' }
    });
  }

  /**
   * Obtener opciones de una lista específica
   */
  async getListOptions(listId: number, parentOptionId?: number): Promise<ListOption[]> {
    const queryBuilder = this.listOptionRepository.createQueryBuilder('option')
      .where('option.listId = :listId', { listId })
      .andWhere('option.isActive = :active', { active: true });

    if (parentOptionId !== undefined) {
      queryBuilder.andWhere('option.parentOptionId = :parentOptionId', { parentOptionId });
    } else {
      queryBuilder.andWhere('option.parentOptionId IS NULL');
    }

    return await queryBuilder
      .orderBy('option.sortOrder', 'ASC')
      .addOrderBy('option.displayText', 'ASC')
      .getMany();
  }

  /**
   * Buscar opciones por texto
   */
  async searchOptions(listId: number, searchTerm: string): Promise<ListOption[]> {
    return await this.listOptionRepository
      .createQueryBuilder('option')
      .where('option.listId = :listId', { listId })
      .andWhere('option.isActive = :active', { active: true })
      .andWhere('(option.displayText ILIKE :search OR option.value ILIKE :search)', 
                { search: `%${searchTerm}%` })
      .orderBy('option.sortOrder', 'ASC')
      .addOrderBy('option.displayText', 'ASC')
      .getMany();
  }

  /**
   * Obtener listas relacionadas a una entidad por nombre y valor específico
   * @param entityName - Nombre de la entidad (ej: 'Tickets')
   * @param entityValue - Valor específico en la entidad (ej: 'Soporte') para filtrar campos
   * @param includeOptions - Si incluir las opciones de las listas
   * @param fieldType - Filtro opcional por tipo de campo
   * @returns Lista de listas generales relacionadas con sus campos de definición
   */
  async getListsByEntity(
    entityName: string, 
    entityValue: string, 
    includeOptions = true, 
    fieldType?: string
  ): Promise<any[]> {
    // 1. Buscar la definición de la entidad
    const entity = await this.entityDefinitionRepository.findOne({
      where: { tableName: entityName.toLowerCase(), isActive: true }
    });

    if (!entity) {
      throw new NotFoundException(`Entidad '${entityName}' no encontrada`);
    }

    // 2. Construir el patrón de campo basado en el valor de la entidad (ej: 'soporte_category')
    const fieldPattern = `${entityValue.toLowerCase()}_category`;

    // 3. Obtener las definiciones de campos para esta entidad que coincidan con el patrón
    const queryBuilder = this.fieldDefinitionRepository
      .createQueryBuilder('field')
      .innerJoinAndSelect('field.sourceList', 'list')
      .where('field.entityId = :entityDefId', { entityDefId: entity.id })
      .andWhere('field.fieldName LIKE :fieldPattern', { fieldPattern: `%${fieldPattern}%` })
      .andWhere('field.isActive = :active', { active: true })
      .andWhere('list.isActive = :active', { active: true });

    if (fieldType) {
      queryBuilder.andWhere('field.fieldType = :fieldType', { fieldType });
    }

    if (includeOptions) {
      queryBuilder
        .leftJoinAndSelect('list.options', 'options', 'options.isActive = :active', { active: true })
        .addOrderBy('options.sortOrder', 'ASC');
    }

    queryBuilder.orderBy('field.sortOrder', 'ASC');

    const fieldDefinitions = await queryBuilder.getMany();

    // 4. Formatear la respuesta
    return fieldDefinitions.map(field => ({
      fieldDefinition: {
        id: field.id,
        fieldName: field.fieldName,
        displayName: field.displayName,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        helpText: field.helpText,
        sortOrder: field.sortOrder
      },
      list: {
        id: field.sourceList.id,
        code: field.sourceList.code,
        name: field.sourceList.name,
        description: field.sourceList.description,
        category: field.sourceList.category,
        options: includeOptions ? field.sourceList.options : undefined
      }
    }));
  }

  /**
   * Obtener listas relacionadas a una entidad por nombre y ID específico
   * @param entityName - Nombre de la entidad (ej: 'ticket_type')
   * @param entityId - ID específico en la entidad (ej: 1)
   * @param includeOptions - Si incluir las opciones de las listas
   * @param fieldType - Filtro opcional por tipo de campo
   * @returns Lista de listas generales relacionadas con sus campos de definición
   */
  async getListsByEntityId(
    entityName: string, 
    entityId: number, 
    includeOptions = true, 
    fieldType?: string
  ): Promise<any[]> {
    // 1. Buscar la definición de la entidad
    const entity = await this.entityDefinitionRepository.findOne({
      where: { tableName: entityName, isActive: true }
    });

    if (!entity) {
      throw new NotFoundException(`Entidad '${entityName}' no encontrada`);
    }

    // 2. Obtener las definiciones de campos para esta entidad
    const queryBuilder = this.fieldDefinitionRepository
      .createQueryBuilder('field')
      .innerJoinAndSelect('field.sourceList', 'list')
      .leftJoinAndSelect('field.fieldValues', 'fieldValues', 
        'fieldValues.entityRecordId = :entityRecordId', { entityRecordId: entityId.toString() })
      .where('field.entityId = :entityDefId', { entityDefId: entity.id })
      .andWhere('field.isActive = :active', { active: true })
      .andWhere('list.isActive = :active', { active: true });

    if (fieldType) {
      queryBuilder.andWhere('field.fieldType = :fieldType', { fieldType });
    }

    if (includeOptions) {
      queryBuilder
        .leftJoinAndSelect('list.options', 'options', 'options.isActive = :active', { active: true })
        .addOrderBy('options.sortOrder', 'ASC');
    }

    queryBuilder.orderBy('field.sortOrder', 'ASC');

    const fieldDefinitions = await queryBuilder.getMany();

    // 3. Formatear la respuesta
    return fieldDefinitions.map(field => ({
      fieldDefinition: {
        id: field.id,
        fieldName: field.fieldName,
        displayName: field.displayName,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        helpText: field.helpText,
        sortOrder: field.sortOrder
      },
      list: {
        id: field.sourceList.id,
        code: field.sourceList.code,
        name: field.sourceList.name,
        description: field.sourceList.description,
        category: field.sourceList.category,
        options: includeOptions ? field.sourceList.options : undefined
      },
      currentValue: field.fieldValues && field.fieldValues.length > 0 ? 
        field.fieldValues[0].value : null,
      currentMultipleValues: field.fieldValues && field.fieldValues.length > 0 ? 
        field.fieldValues[0].multipleValues : null
    }));
  }
}
