import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { AgendasMedicasService } from './agendas.service.js';
import { CreateAgendaMedicaDto, UpdateAgendaMedicaDto } from './agendas.dto.js';

@Controller('apps/saude/cadastros/agendas')
@UseGuards(JwtAuthGuard)
export class AgendasMedicasController {
  constructor(private readonly service: AgendasMedicasService) {}

  @Post()
  async create(@Body() createDto: CreateAgendaMedicaDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(
    @Query('profissionalId') profissionalId?: string,
    @Query('unidadeId') unidadeId?: string,
    @Query('especialidadeId') especialidadeId?: string,
    @Query('salaId') salaId?: string,
    @Query('turnoId') turnoId?: string,
    @Query('diaSemana') diaSemana?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};

    if (profissionalId) filters.profissionalId = profissionalId;
    if (unidadeId) filters.unidadeId = unidadeId;
    if (especialidadeId) filters.especialidadeId = especialidadeId;
    if (salaId) filters.salaId = salaId;
    if (turnoId) filters.turnoId = turnoId;
    if (diaSemana !== undefined) filters.diaSemana = parseInt(diaSemana, 10);
    if (isActive !== undefined) filters.isActive = isActive === 'true';

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
  async update(@Param('id') id: string, @Body() updateDto: UpdateAgendaMedicaDto) {
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
