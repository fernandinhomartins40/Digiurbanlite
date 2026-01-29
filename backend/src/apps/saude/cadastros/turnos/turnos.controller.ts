import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { TurnosTrabalhoService } from './turnos.service.js';
import { CreateTurnoTrabalhoDto, UpdateTurnoTrabalhoDto } from './turnos.dto.js';

@Controller('apps/saude/cadastros/turnos')
@UseGuards(JwtAuthGuard)
export class TurnosTrabalhoController {
  constructor(private readonly service: TurnosTrabalhoService) {}

  @Post()
  async create(@Body() createDto: CreateTurnoTrabalhoDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('ativo') ativo?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (ativo !== undefined) filters.ativo = ativo === 'true';
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateTurnoTrabalhoDto) {
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
