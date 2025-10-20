import { Controller, Post, Body, Get, Param, Put, Delete, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
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
    console.log('🎯 CONTROLLER UPDATE - Request recibido');
    console.log('📊 ID del parámetro:', id);
    console.log('📤 Body recibido:', JSON.stringify(updateDto, null, 2));
    console.log('🔍 typeOptionId en body:', updateDto.typeOptionId);
    
    const nc = await this.service.update(id, updateDto);
    
    console.log('💾 CONTROLLER UPDATE - Respuesta del servicio');
    console.log('🔍 typeOptionId en respuesta:', nc.typeOptionId);
    console.log('🔍 typeOption en respuesta:', nc.typeOption?.id);
    
    const response = new NonConformityResponseDto(nc);
    console.log('📋 CONTROLLER UPDATE - DTO de respuesta creado');
    console.log('🔍 typeOptionId en DTO respuesta:', response.typeOptionId);
    console.log('🔍 typeOption en DTO respuesta:', response.typeOption?.id);
    
    return response;
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

  @Get('next-number/:year')
  async getNextConsecutiveNumber(@Param('year', ParseIntPipe) year: number) {
    const nextNumber = await this.service.getNextConsecutiveNumber(year);
    return { nextNumber };
  } 

  @Get(':id/pdf')
  async generatePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.service.generatePdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="no-conformidad-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }
  
  @Get(':id/pdf2')
  async generatePdfPdfkit(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.service.generatePdfPdfkit(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="no-conformidad-pdfkit-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
