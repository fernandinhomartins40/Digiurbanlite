import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { UnidadesSaudeService } from './unidades.service.js';
import { CreateUnidadeSaudeDto, UpdateUnidadeSaudeDto } from './unidades.dto.js';

@Controller('apps/saude/cadastros/unidades')
@UseGuards(JwtAuthGuard)
export class UnidadesSaudeController {
  constructor(private readonly service: UnidadesSaudeService) {}

  @Post()
  async create(@Body() createDto: CreateUnidadeSaudeDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('tipo') tipo?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (tipo) filters.tipo = tipo;
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateUnidadeSaudeDto) {
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
