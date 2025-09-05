import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto, UpdateFavoriteDto } from './Dto/favorite.dto';
import { Token } from '../../../Common/Decorators/token.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async findAll(@Token('id') userId: number) {
    return await this.favoritesService.findAllByUser(userId);
  }

  @Post()
  async create(@Token('id') userId: number, @Body() dto: CreateFavoriteDto) {
    return await this.favoritesService.create(userId, dto);
  }

  @Get(':id')
  async findOne(@Token('id') userId: number, @Param('id') id: number) {
    return await this.favoritesService.findOne(Number(id), userId);
  }

  @Put(':id')
  async update(@Token('id') userId: number, @Param('id') id: number, @Body() dto: UpdateFavoriteDto) {
    return await this.favoritesService.update(Number(id), userId, dto);
  }

  @Delete(':id')
  async remove(@Token('id') userId: number, @Param('id') id: number) {
    await this.favoritesService.remove(Number(id), userId);
    return { success: true };
  }
}
