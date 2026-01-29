import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { EspecialidadesMedicasService } from './especialidades.service.js';
import { CreateEspecialidadeMedicaDto, UpdateEspecialidadeMedicaDto } from './especialidades.dto.js';

@Controller('apps/saude/cadastros/especialidades')
@UseGuards(JwtAuthGuard)
export class EspecialidadesMedicasController {
  constructor(private readonly service: EspecialidadesMedicasService) {}

  @Post()
  async create(@Body() createDto: CreateEspecialidadeMedicaDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('area') area?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (area) filters.area = area;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateEspecialidadeMedicaDto) {
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
