import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { SalasConsultoriosService } from './salas.service.js';
import { CreateSalaConsultorioDto, UpdateSalaConsultorioDto } from './salas.dto.js';

@Controller('apps/saude/cadastros/salas')
@UseGuards(JwtAuthGuard)
export class SalasConsultoriosController {
  constructor(private readonly service: SalasConsultoriosService) {}

  @Post()
  async create(@Body() createDto: CreateSalaConsultorioDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('unidadeId') unidadeId?: string,
    @Query('tipo') tipo?: string,
    @Query('ativa') ativa?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (unidadeId) filters.unidadeId = unidadeId;
    if (tipo) filters.tipo = tipo;
    if (ativa !== undefined) filters.ativa = ativa === 'true';
    if (search) filters.search = search;

    return this.service.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSalaConsultorioDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete(':id/hard')
  async hardDelete(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }
}
