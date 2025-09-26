import { Controller, Post, Body, Get, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { NonConformitiesService } from './non-conformities.service';
import { CreateNonConformityDto, UpdateNonConformityDto, NonConformityResponseDto } from './dto/non-conformity.dto';

@ApiTags('non-conformities')
@Controller('non-conformities')
export class NonConformitiesController {
  constructor(private readonly service: NonConformitiesService) {}

  @Post()
  @ApiResponse({ type: NonConformityResponseDto })
  async create(@Body() createDto: CreateNonConformityDto) {
    const nc = await this.service.create(createDto);
    return new NonConformityResponseDto(nc);
  }

  @Get()
  @ApiResponse({ type: [NonConformityResponseDto] })
  async findAll() {
    const list = await this.service.findAll();
    return list.map(nc => new NonConformityResponseDto(nc));
  }

  @Get(':id')
  @ApiResponse({ type: NonConformityResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const nc = await this.service.findOne(id);
    return new NonConformityResponseDto(nc);
  }

  @Put(':id')
  @ApiResponse({ type: NonConformityResponseDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateNonConformityDto) {
    const nc = await this.service.update(id, updateDto);
    return new NonConformityResponseDto(nc);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/cancel')
  @ApiResponse({ type: NonConformityResponseDto })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string }
  ) {
    const nc = await this.service.cancel(id, body.reason);
    return new NonConformityResponseDto(nc);
  }
}
