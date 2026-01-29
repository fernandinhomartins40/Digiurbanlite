import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ESusConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Buscar configuração existente
   */
  async findConfig(municipioId: string = 'singleton') {
    const config = await this.prisma.configuracaoESUS.findUnique({
      where: { municipioId },
    });

    // Descriptografar senha para exibição (retorna mascarada)
    if (config && config.senhaAPI) {
      return {
        ...config,
        senhaAPI: '••••••••••••', // Não expor senha real
      };
    }

    return config;
  }

  /**
   * Criar ou atualizar configuração
   */
  async upsertConfig(data: any, municipioId: string = 'singleton') {
    // Validações
    if (data.integracaoAtiva && data.tipoIntegracao === 'NENHUMA') {
      throw new BadRequestException(
        'Para ativar a integração, selecione um método válido',
      );
    }

    if (data.tipoIntegracao === 'API_REST') {
      if (!data.urlPEC || !data.usuarioAPI || !data.senhaAPI) {
        throw new BadRequestException(
          'Para API REST, URL, usuário e senha são obrigatórios',
        );
      }

      // Validar URL HTTPS
      if (!data.urlPEC.startsWith('https://')) {
        throw new BadRequestException('A URL do PEC deve usar HTTPS');
      }
    }

    if (['LEDI_THRIFT', 'LEDI_XML'].includes(data.tipoIntegracao)) {
      if (!data.formatoLEDI || !data.versaoLEDI || !data.diretorioExportacao) {
        throw new BadRequestException(
          'Para LEDI, formato, versão e diretório são obrigatórios',
        );
      }
    }

    // Criptografar senha se fornecida e não for a máscara
    let senhaAPI = data.senhaAPI;
    if (senhaAPI && senhaAPI !== '••••••••••••') {
      senhaAPI = await bcrypt.hash(senhaAPI, 10);
    } else if (senhaAPI === '••••••••••••') {
      // Manter senha existente
      const existing = await this.prisma.configuracaoESUS.findUnique({
        where: { municipioId },
      });
      senhaAPI = existing?.senhaAPI;
    }

    // Upsert
    const config = await this.prisma.configuracaoESUS.upsert({
      where: { municipioId },
      create: {
        municipioId,
        integracaoAtiva: data.integracaoAtiva ?? false,
        tipoIntegracao: data.tipoIntegracao ?? 'NENHUMA',
        urlPEC: data.urlPEC,
        usuarioAPI: data.usuarioAPI,
        senhaAPI,
        formatoLEDI: data.formatoLEDI,
        versaoLEDI: data.versaoLEDI,
        diretorioExportacao: data.diretorioExportacao,
        cnesUnidadePrincipal: data.cnesUnidadePrincipal,
        sincronizacaoAutomatica: data.sincronizacaoAutomatica ?? false,
        intervaloSincMinutos: data.intervaloSincMinutos ?? 60,
        logTransmissoes: data.logTransmissoes ?? true,
        retentarEnviosFalhos: data.retentarEnviosFalhos ?? true,
        maxTentativas: data.maxTentativas ?? 3,
        observacoes: data.observacoes,
      },
      update: {
        integracaoAtiva: data.integracaoAtiva,
        tipoIntegracao: data.tipoIntegracao,
        urlPEC: data.urlPEC,
        usuarioAPI: data.usuarioAPI,
        ...(senhaAPI && { senhaAPI }),
        formatoLEDI: data.formatoLEDI,
        versaoLEDI: data.versaoLEDI,
        diretorioExportacao: data.diretorioExportacao,
        cnesUnidadePrincipal: data.cnesUnidadePrincipal,
        sincronizacaoAutomatica: data.sincronizacaoAutomatica,
        intervaloSincMinutos: data.intervaloSincMinutos,
        logTransmissoes: data.logTransmissoes,
        retentarEnviosFalhos: data.retentarEnviosFalhos,
        maxTentativas: data.maxTentativas,
        observacoes: data.observacoes,
      },
    });

    // Retornar sem senha real
    return {
      ...config,
      senhaAPI: config.senhaAPI ? '••••••••••••' : null,
    };
  }

  /**
   * Testar conexão com PEC e-SUS
   */
  async testConnection(data: {
    urlPEC: string;
    usuarioAPI: string;
    senhaAPI: string;
  }) {
    try {
      // 1. Fazer login no PEC
      const loginResponse = await fetch(`${data.urlPEC}/api/recebimento/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: data.usuarioAPI,
          senha: data.senhaAPI,
        }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        return {
          sucesso: false,
          erro: `Falha na autenticação: ${loginResponse.status}`,
          detalhes: errorText,
        };
      }

      // Extrair cookie JSESSIONID
      const cookies = loginResponse.headers.get('set-cookie');
      if (!cookies || !cookies.includes('JSESSIONID')) {
        return {
          sucesso: false,
          erro: 'Autenticação realizada, mas JSESSIONID não foi retornado',
        };
      }

      return {
        sucesso: true,
        detalhes: 'Conexão estabelecida e autenticação bem-sucedida',
        versaoPEC: loginResponse.headers.get('x-esus-version') || 'Não informada',
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: 'Erro ao conectar ao PEC',
        detalhes: error.message,
      };
    }
  }

  /**
   * Sincronizar dados pendentes
   */
  async sincronizarDados(municipioId: string = 'singleton') {
    const config = await this.prisma.configuracaoESUS.findUnique({
      where: { municipioId },
    });

    if (!config || !config.integracaoAtiva) {
      throw new BadRequestException('Integração não está ativa');
    }

    // Buscar registros pendentes de envio
    const registrosPendentes = await this.prisma.transmissaoESUS.findMany({
      where: {
        configuracaoId: config.id,
        status: {
          in: ['PENDENTE', 'AGUARDANDO_RETRY'],
        },
      },
      take: 100, // Limitar para não sobrecarregar
    });

    // Marcar como ENVIANDO
    await this.prisma.transmissaoESUS.updateMany({
      where: {
        id: { in: registrosPendentes.map((r) => r.id) },
      },
      data: {
        status: 'ENVIANDO',
      },
    });

    // Atualizar última sincronização
    await this.prisma.configuracaoESUS.update({
      where: { id: config.id },
      data: {
        ultimaSincronizacao: new Date(),
      },
    });

    return {
      registrosEnviados: registrosPendentes.length,
      proximaSincronizacao: config.sincronizacaoAutomatica
        ? new Date(Date.now() + config.intervaloSincMinutos * 60000)
        : null,
    };
  }

  /**
   * Registrar transmissão
   */
  async registrarTransmissao(data: {
    configuracaoId: string;
    tipo: string;
    fichaId: string;
    entidadeOrigem?: string;
    payloadJSON?: any;
  }) {
    return this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: data.configuracaoId,
        tipo: data.tipo as any,
        fichaId: data.fichaId,
        entidadeOrigem: data.entidadeOrigem,
        payloadJSON: data.payloadJSON,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });
  }

  /**
   * Buscar logs de transmissão
   */
  async findTransmissoes(
    configuracaoId: string,
    filters?: {
      status?: string;
      tipo?: string;
      dataInicio?: Date;
      dataFim?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { configuracaoId };

    if (filters?.status) where.status = filters.status;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.dataInicio || filters?.dataFim) {
      where.dataEnvio = {};
      if (filters.dataInicio) where.dataEnvio.gte = filters.dataInicio;
      if (filters.dataFim) where.dataEnvio.lte = filters.dataFim;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [transmissoes, total] = await Promise.all([
      this.prisma.transmissaoESUS.findMany({
        where,
        orderBy: { dataEnvio: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transmissaoESUS.count({ where }),
    ]);

    // Estatísticas
    const stats = await this.prisma.transmissaoESUS.groupBy({
      by: ['status'],
      where: { configuracaoId },
      _count: true,
    });

    return {
      transmissoes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: stats.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Retentar transmissão falha
   */
  async retentarTransmissao(transmissaoId: string) {
    const transmissao = await this.prisma.transmissaoESUS.findUnique({
      where: { id: transmissaoId },
      include: { configuracao: true },
    });

    if (!transmissao) {
      throw new NotFoundException('Transmissão não encontrada');
    }

    if (transmissao.tentativas >= transmissao.configuracao.maxTentativas) {
      throw new BadRequestException('Número máximo de tentativas excedido');
    }

    // Atualizar status para nova tentativa
    return this.prisma.transmissaoESUS.update({
      where: { id: transmissaoId },
      data: {
        status: 'PENDENTE',
        proximaTentativa: new Date(),
        tentativas: transmissao.tentativas + 1,
      },
    });
  }
}
