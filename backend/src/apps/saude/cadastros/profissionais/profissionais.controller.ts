import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { ProfissionaisSaudeService } from './profissionais.service.js';
import { CreateProfissionalSaudeDto, UpdateProfissionalSaudeDto } from './profissionais.dto.js';

@Controller('apps/saude/cadastros/profissionais')
@UseGuards(JwtAuthGuard)
export class ProfissionaisSaudeController {
  constructor(private readonly service: ProfissionaisSaudeService) {}

  @Post()
  async create(@Body() createDto: CreateProfissionalSaudeDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('categoria') categoria?: string,
    @Query('status') status?: string,
    @Query('especialidade') especialidade?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (categoria) filters.categoria = categoria;
    if (status) filters.status = status;
    if (especialidade) filters.especialidade = especialidade;
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateProfissionalSaudeDto) {
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
