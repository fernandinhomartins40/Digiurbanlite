// ============================================================================
// SERVICE - ATESTADOS E DECLARAÇÕES MÉDICAS
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateAtestadoDTO,
  UpdateAtestadoDTO,
  AtestadoCompletoResponse,
  TipoAtestado,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

// Service para gerenciar atestados médicos

export class AtestadoService {
  /**
   * Emitir atestado médico
   */
  async emitirAtestado(data: CreateAtestadoDTO): Promise<AtestadoCompletoResponse> {
    // Verificar se o atendimento existe e obter a consulta médica
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
      include: {
        consulta: true,
      },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    if (!atendimento.consultaId || !atendimento.consulta) {
      throw new Error('Atendimento sem consulta médica registrada');
    }

    // Calcular data de fim
    const dataFim = new Date(data.dataInicio);
    dataFim.setDate(dataFim.getDate() + data.diasAfastamento);

    // Mapear tipo do DTO para o schema
    let tipoSchema: 'MEDICO' | 'COMPARECIMENTO' | 'ACOMPANHANTE' = 'MEDICO';
    // Assumindo que o tipo vem correto do DTO

    // Criar atestado
    const atestado = await prisma.atestado.create({
      data: {
        consultaId: atendimento.consultaId,
        tipo: tipoSchema,
        cid10: data.cid10,
        diasAfastamento: data.diasAfastamento,
        dataInicio: data.dataInicio,
        dataFim: dataFim,
        observacoes: data.observacoes,
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    return atestado as any;
  }

  /**
   * Atualizar atestado
   */
  async atualizarAtestado(id: string, data: UpdateAtestadoDTO) {
    // Recalcular data de fim se dias de afastamento mudaram
    let dataToUpdate: any = {};

    if (data.cid10 !== undefined) dataToUpdate.cid10 = data.cid10;
    if (data.observacoes !== undefined) dataToUpdate.observacoes = data.observacoes;

    if (data.diasAfastamento !== undefined) {
      dataToUpdate.diasAfastamento = data.diasAfastamento;

      if (data.dataInicio) {
        const dataFim = new Date(data.dataInicio);
        dataFim.setDate(dataFim.getDate() + data.diasAfastamento);
        dataToUpdate.dataInicio = data.dataInicio;
        dataToUpdate.dataFim = dataFim;
      }
    } else if (data.dataInicio !== undefined) {
      dataToUpdate.dataInicio = data.dataInicio;
    }

    return await prisma.atestado.update({
      where: { id },
      data: dataToUpdate,
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });
  }

  /**
   * Buscar atestado completo
   */
  async buscarAtestado(id: string): Promise<AtestadoCompletoResponse> {
    const atestado = await prisma.atestado.findUnique({
      where: { id },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    if (!atestado) {
      throw new Error('Atestado não encontrado');
    }

    return atestado as any;
  }

  /**
   * Listar atestados de um cidadão
   */
  async listarAtestadosCidadao(citizenId: string, filtros?: {
    tipo?: TipoAtestado;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.atestado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        ...(filtros?.tipo && { tipo: filtros.tipo as any }),
        ...(filtros?.dataInicio && {
          dataInicio: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataFim: { lte: filtros.dataFim },
        }),
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  /**
   * Listar atestados de um atendimento
   */
  async listarAtestadosAtendimento(atendimentoId: string) {
    return await prisma.atestado.findMany({
      where: {
        consulta: {
          atendimentoId: atendimentoId,
        },
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  /**
   * Listar atestados emitidos (visão administrativa)
   */
  async listarAtestados(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    tipo?: TipoAtestado;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.atestado.findMany({
      where: {
        ...(filtros.tipo && { tipo: filtros.tipo as any }),
        ...(filtros.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros.dataFim && {
          dataHora: { lte: filtros.dataFim },
        }),
        ...(filtros.unidadeId && {
          consulta: {
            atendimento: {
              unidadeId: filtros.unidadeId,
            },
          },
        }),
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  /**
   * Buscar atestados ativos (vigentes)
   */
  async listarAtestadosAtivos(citizenId?: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return await prisma.atestado.findMany({
      where: {
        dataInicio: { lte: hoje },
        dataFim: { gte: hoje },
        ...(citizenId && {
          consulta: {
            atendimento: {
              citizenId,
            },
          },
        }),
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataFim: 'desc',
      },
    });
  }

  /**
   * Verificar se cidadão está afastado
   */
  async verificarAfastamento(citizenId: string, data?: Date): Promise<{
    afastado: boolean;
    atestados: any[];
    diasRestantes: number;
  }> {
    const dataVerificacao = data || new Date();
    dataVerificacao.setHours(0, 0, 0, 0);

    const atestadosAtivos = await prisma.atestado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        dataInicio: { lte: dataVerificacao },
        dataFim: { gte: dataVerificacao },
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataFim: 'desc',
      },
    });

    const afastado = atestadosAtivos.length > 0;

    let diasRestantes = 0;
    if (afastado) {
      const maiorDataFim = atestadosAtivos[0].dataFim;
      if (maiorDataFim) {
        diasRestantes = Math.ceil(
          (maiorDataFim.getTime() - dataVerificacao.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    return {
      afastado,
      atestados: atestadosAtivos,
      diasRestantes: Math.max(0, diasRestantes),
    };
  }

  /**
   * Obter estatísticas de atestados
   */
  async obterEstatisticas(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const atestados = await prisma.atestado.findMany({
      where: {
        dataHora: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.unidadeId && {
          consulta: {
            atendimento: {
              unidadeId: filtros.unidadeId,
            },
          },
        }),
      },
    });

    const totalAtestados = atestados.length;

    // Por tipo
    const porTipo: Record<string, number> = {};
    atestados.forEach((a) => {
      porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
    });

    // Dias médios de afastamento
    const atestadosComDias = atestados.filter((a) => a.diasAfastamento);
    const mediaDiasAfastamento = atestadosComDias.length > 0
      ? atestadosComDias.reduce((acc, a) => acc + (a.diasAfastamento || 0), 0) / atestadosComDias.length
      : 0;

    // CIDs mais frequentes
    const cidsCount: Record<string, { cid: string; count: number }> = {};
    atestados.forEach((a) => {
      if (a.cid10) {
        if (!cidsCount[a.cid10]) {
          cidsCount[a.cid10] = { cid: a.cid10, count: 0 };
        }
        cidsCount[a.cid10].count++;
      }
    });

    const cidsMaisFrequentes = Object.values(cidsCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAtestados,
      porTipo: Object.entries(porTipo).map(([tipo, count]) => ({ tipo, count })),
      mediaDiasAfastamento: Math.round(mediaDiasAfastamento * 10) / 10,
      totalDiasAfastamento: atestados.reduce((acc, a) => acc + (a.diasAfastamento || 0), 0),
      cidsMaisFrequentes,
    };
  }

  /**
   * Cancelar atestado
   */
  async cancelarAtestado(id: string, motivo: string) {
    return await prisma.atestado.update({
      where: { id },
      data: {
        observacoes: `CANCELADO: ${motivo}`,
      },
    });
  }

  /**
   * Gerar segunda via de atestado
   */
  async gerarSegundaVia(atestadoId: string): Promise<AtestadoCompletoResponse> {
    const atestadoOriginal = await this.buscarAtestado(atestadoId);

    // Adicionar observação sobre segunda via
    await prisma.atestado.update({
      where: { id: atestadoId },
      data: {
        observacoes: atestadoOriginal.observacoes
          ? `${atestadoOriginal.observacoes}\n\nSegunda via emitida em ${new Date().toLocaleDateString('pt-BR')}`
          : `Segunda via emitida em ${new Date().toLocaleDateString('pt-BR')}`,
      },
    });

    return atestadoOriginal;
  }

  /**
   * Buscar histórico de afastamentos do cidadão
   */
  async buscarHistoricoAfastamentos(citizenId: string, ultimos12Meses: boolean = true) {
    const dataInicio = ultimos12Meses
      ? new Date(new Date().setMonth(new Date().getMonth() - 12))
      : undefined;

    const atestados = await prisma.atestado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        ...(dataInicio && {
          dataHora: { gte: dataInicio },
        }),
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataInicio: 'desc',
      },
    });

    const totalDiasAfastamento = atestados.reduce(
      (acc, a) => acc + (a.diasAfastamento || 0),
      0
    );

    const totalAtestados = atestados.length;

    return {
      atestados,
      totalAtestados,
      totalDiasAfastamento,
      periodo: ultimos12Meses ? '12 meses' : 'histórico completo',
    };
  }
}

export default new AtestadoService();
