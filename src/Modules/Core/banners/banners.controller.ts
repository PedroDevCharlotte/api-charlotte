
import { Controller, Get, Post, Put, Delete, Param, Body, UploadedFile, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto, ReorderBannersDtoArray } from './Dto/banner.dto';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(@Body() body: ReorderBannersDtoArray) {
    return this.bannersService.reorderBanners(body.order);
  }

  @Get()
  async findAll() {
    return this.bannersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(Number(id));
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() body: CreateBannerDto, @UploadedFile() image: any) {
    console.log('Received body:', body);
    console.log('Received file:', image);
    return this.bannersService.create(body, image);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(@Param('id') id: string, @Body() body: UpdateBannerDto, @UploadedFile() image: any) {
    return this.bannersService.update(Number(id), body, image);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.bannersService.remove(Number(id));
  }
}
