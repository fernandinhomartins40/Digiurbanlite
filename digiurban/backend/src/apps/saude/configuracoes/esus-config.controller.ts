import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ESusConfigService } from './esus-config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('api/apps/saude/configuracoes/esus')
@UseGuards(JwtAuthGuard)
export class ESusConfigController {
  constructor(private readonly esusConfigService: ESusConfigService) {}

  /**
   * GET /api/apps/saude/configuracoes/esus
   * Obter configuração existente
   */
  @Get()
  async getConfig(@Query('municipioId') municipioId?: string) {
    return this.esusConfigService.findConfig(municipioId);
  }

  /**
   * POST /api/apps/saude/configuracoes/esus
   * Criar nova configuração
   */
  @Post()
  async createConfig(@Body() data: any, @Query('municipioId') municipioId?: string) {
    return this.esusConfigService.upsertConfig(data, municipioId);
  }

  /**
   * PUT /api/apps/saude/configuracoes/esus
   * Atualizar configuração existente
   */
  @Put()
  async updateConfig(@Body() data: any, @Query('municipioId') municipioId?: string) {
    return this.esusConfigService.upsertConfig(data, municipioId);
  }

  /**
   * POST /api/apps/saude/configuracoes/esus/testar
   * Testar conexão com PEC e-SUS
   */
  @Post('testar')
  async testConnection(@Body() data: { urlPEC: string; usuarioAPI: string; senhaAPI: string }) {
    return this.esusConfigService.testConnection(data);
  }

  /**
   * POST /api/apps/saude/configuracoes/esus/sincronizar
   * Sincronizar dados pendentes
   */
  @Post('sincronizar')
  async sincronizarDados(@Query('municipioId') municipioId?: string) {
    return this.esusConfigService.sincronizarDados(municipioId);
  }

  /**
   * GET /api/apps/saude/configuracoes/esus/transmissoes
   * Listar logs de transmissão
   */
  @Get('transmissoes')
  async getTransmissoes(
    @Query('configuracaoId') configuracaoId: string,
    @Query('status') status?: string,
    @Query('tipo') tipo?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.esusConfigService.findTransmissoes(configuracaoId, {
      status,
      tipo,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * POST /api/apps/saude/configuracoes/esus/transmissoes/:id/retentar
   * Retentar transmissão falha
   */
  @Post('transmissoes/:id/retentar')
  async retentarTransmissao(@Param('id') transmissaoId: string) {
    return this.esusConfigService.retentarTransmissao(transmissaoId);
  }
}
