import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './Entity/favorite.entity';
import { CreateFavoriteDto, UpdateFavoriteDto } from './Dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async create(userId: number, dto: CreateFavoriteDto): Promise<Favorite> {
    // Validar duplicado por userId y url
    const exists = await this.favoriteRepository.findOne({
      where: { userId, url: dto.url, active: true },
    });
    if (exists) {
      throw new ConflictException('Ya existe un favorito con esa URL para este usuario.');
    }
    const fav = this.favoriteRepository.create({
      userId,
      title: dto.title,
      url: dto.url,
      description: dto.description,
      active: true,
    });
    return await this.favoriteRepository.save(fav);
  }

  async findAllByUser(userId: number): Promise<Favorite[]> {
    return await this.favoriteRepository.find({ where: { userId, active: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number, userId: number): Promise<Favorite> {
    const fav = await this.favoriteRepository.findOne({ where: { id } });
    if (!fav) throw new NotFoundException('Favorite not found');
    if (fav.userId !== userId) throw new ForbiddenException('No tienes permiso');
    return fav;
  }

  async update(id: number, userId: number, dto: UpdateFavoriteDto): Promise<Favorite> {
    const fav = await this.findOne(id, userId);
    if (dto.title !== undefined) fav.title = dto.title;
    if (dto.url !== undefined) fav.url = dto.url;
    if (dto.description !== undefined) fav.description = dto.description;
    if (dto.active !== undefined) fav.active = dto.active;
    return await this.favoriteRepository.save(fav);
  }

  async remove(id: number, userId: number): Promise<void> {
    const fav = await this.findOne(id, userId);
    // soft delete: mark inactive
    fav.active = false;
    await this.favoriteRepository.save(fav);
  }
}
