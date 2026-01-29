import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../infrastructure/auth/jwt-auth.guard.js';
import { ConfiguracoesAtendimentoService } from './configuracoes.service.js';
import { CreateConfiguracaoAtendimentoDto, UpdateConfiguracaoAtendimentoDto } from './configuracoes.dto.js';

@Controller('apps/saude/cadastros/configuracoes')
@UseGuards(JwtAuthGuard)
export class ConfiguracoesAtendimentoController {
  constructor(private readonly service: ConfiguracoesAtendimentoService) {}

  @Post()
  async create(@Body() createDto: CreateConfiguracaoAtendimentoDto) {
    return this.service.create(createDto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('unidade/:unidadeId')
  async findByUnidadeId(@Param('unidadeId') unidadeId: string) {
    return this.service.findByUnidadeId(unidadeId);
  }

  @Post('unidade/:unidadeId')
  async createOrUpdate(
    @Param('unidadeId') unidadeId: string,
    @Body() data: CreateConfiguracaoAtendimentoDto | UpdateConfiguracaoAtendimentoDto,
  ) {
    return this.service.createOrUpdate(unidadeId, data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateConfiguracaoAtendimentoDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
