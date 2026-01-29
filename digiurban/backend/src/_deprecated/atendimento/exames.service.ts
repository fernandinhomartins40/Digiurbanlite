// ============================================================================
// SERVICE - EXAMES MÉDICOS
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateExameSolicitadoDTO,
  UpdateExameSolicitadoDTO,
  CreateResultadoExameDTO,
  UpdateResultadoExameDTO,
  ExameCompletoResponse,
  StatusExame,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class ExamesService {
  /**
   * Solicitar exame
   */
  async solicitarExame(data: CreateExameSolicitadoDTO): Promise<ExameCompletoResponse> {
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

    // Mapear prioridade do DTO para o schema
    let prioridadeSchema: 'ROTINA' | 'URGENTE' | 'EMERGENCIA' = 'ROTINA';
    if (data.prioridade === 'URGENTE') {
      prioridadeSchema = 'URGENTE';
    } else if (data.prioridade === 'EMERGENCIA') {
      prioridadeSchema = 'EMERGENCIA';
    }

    // Criar solicitação de exame
    const exame = await prisma.exameSolicitado.create({
      data: {
        consultaId: atendimento.consultaId,
        tipoExame: data.nomeExame,
        justificativa: data.justificativa,
        prioridade: prioridadeSchema,
        status: 'SOLICITADO',
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    return exame as any;
  }

  /**
   * Atualizar status do exame
   */
  async atualizarStatus(exameId: string, status: StatusExame, observacoes?: string) {
    // Mapear status do DTO para o schema
    let statusSchema: 'SOLICITADO' | 'AGENDADO' | 'COLETADO' | 'PROCESSANDO' | 'CONCLUIDO' | 'CANCELADO' = 'SOLICITADO';

    if (status === 'SOLICITADO') statusSchema = 'SOLICITADO';
    else if (status === 'COLETADO') statusSchema = 'COLETADO';
    else if (status === 'EM_ANALISE') statusSchema = 'PROCESSANDO';
    else if (status === 'CONCLUIDO') statusSchema = 'CONCLUIDO';
    else if (status === 'CANCELADO') statusSchema = 'CANCELADO';

    const dataUpdate: any = { status: statusSchema };

    if (status === 'CONCLUIDO') {
      dataUpdate.dataResultado = new Date();
    }

    return await prisma.exameSolicitado.update({
      where: { id: exameId },
      data: dataUpdate,
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
   * Registrar coleta de exame
   */
  async registrarColeta(exameId: string, data: {
    dataColeta: Date;
    localColeta?: string;
    profissionalColetaId?: string;
    observacoes?: string;
  }) {
    return await prisma.exameSolicitado.update({
      where: { id: exameId },
      data: {
        status: 'COLETADO',
      },
    });
  }

  /**
   * Adicionar resultado ao exame
   */
  async adicionarResultado(data: CreateResultadoExameDTO) {
    // Atualizar exame com resultado
    const exame = await prisma.exameSolicitado.update({
      where: { id: data.exameId },
      data: {
        resultado: data.valor,
        status: 'CONCLUIDO',
        dataResultado: new Date(),
      },
    });

    return exame;
  }

  /**
   * Atualizar resultado
   */
  async atualizarResultado(id: string, data: UpdateResultadoExameDTO) {
    return await prisma.exameSolicitado.update({
      where: { id },
      data: {
        resultado: data.valor,
      },
    });
  }

  /**
   * Remover resultado
   */
  async removerResultado(id: string) {
    return await prisma.exameSolicitado.update({
      where: { id },
      data: {
        resultado: null,
        status: 'SOLICITADO',
        dataResultado: null,
      },
    });
  }

  /**
   * Buscar exame completo
   */
  async buscarExame(id: string): Promise<ExameCompletoResponse> {
    const exame = await prisma.exameSolicitado.findUnique({
      where: { id },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    if (!exame) {
      throw new Error('Exame não encontrado');
    }

    return exame as any;
  }

  /**
   * Listar exames de um cidadão
   */
  async listarExamesCidadao(citizenId: string, filtros?: {
    status?: StatusExame;
    tipoExame?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.exameSolicitado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        ...(filtros?.status && { status: filtros.status as any }),
        ...(filtros?.tipoExame && { tipoExame: filtros.tipoExame }),
        ...(filtros?.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataHora: { lte: filtros.dataFim },
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
   * Listar exames de um atendimento
   */
  async listarExamesAtendimento(atendimentoId: string) {
    return await prisma.exameSolicitado.findMany({
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
   * Listar exames por status (visão administrativa)
   */
  async listarExamesPorStatus(filtros: {
    unidadeId?: string;
    status?: StatusExame;
    prioridade?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.exameSolicitado.findMany({
      where: {
        ...(filtros.status && { status: filtros.status as any }),
        ...(filtros.prioridade && { prioridade: filtros.prioridade as any }),
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
      orderBy: [
        { prioridade: 'desc' },
        { dataHora: 'asc' },
      ],
    });
  }

  /**
   * Buscar exames pendentes de coleta
   */
  async listarExamesPendentesColeta(unidadeId?: string) {
    return await prisma.exameSolicitado.findMany({
      where: {
        status: 'SOLICITADO',
        ...(unidadeId && {
          consulta: {
            atendimento: {
              unidadeId,
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
      orderBy: [
        { prioridade: 'desc' },
        { dataHora: 'asc' },
      ],
    });
  }

  /**
   * Buscar exames aguardando resultado
   */
  async listarExamesAguardandoResultado(unidadeId?: string) {
    return await prisma.exameSolicitado.findMany({
      where: {
        status: 'COLETADO',
        ...(unidadeId && {
          consulta: {
            atendimento: {
              unidadeId,
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
        dataHora: 'asc',
      },
    });
  }

  /**
   * Obter estatísticas de exames
   */
  async obterEstatisticas(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const exames = await prisma.exameSolicitado.findMany({
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

    const totalExames = exames.length;
    const solicitados = exames.filter((e) => e.status === 'SOLICITADO').length;
    const coletados = exames.filter((e) => e.status === 'COLETADO').length;
    const comResultado = exames.filter((e) => e.status === 'CONCLUIDO').length;
    const cancelados = exames.filter((e) => e.status === 'CANCELADO').length;

    // Tipos de exames mais solicitados
    const tiposCount: Record<string, number> = {};
    exames.forEach((e) => {
      tiposCount[e.tipoExame] = (tiposCount[e.tipoExame] || 0) + 1;
    });

    const tiposMaisSolicitados = Object.entries(tiposCount)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tempo médio para resultado (em dias)
    const examesComResultado = exames.filter(
      (e) => e.dataResultado
    );
    const tempoMedioResultado = examesComResultado.length > 0
      ? examesComResultado.reduce((acc, e) => {
          const dias = Math.ceil(
            (e.dataResultado!.getTime() - e.dataHora.getTime()) / (1000 * 60 * 60 * 24)
          );
          return acc + dias;
        }, 0) / examesComResultado.length
      : 0;

    return {
      totalExames,
      solicitados,
      coletados,
      comResultado,
      cancelados,
      taxaConclusao: totalExames > 0 ? (comResultado / totalExames) * 100 : 0,
      tiposMaisSolicitados,
      tempoMedioResultado: Math.round(tempoMedioResultado * 10) / 10,
    };
  }

  /**
   * Cancelar exame
   */
  async cancelarExame(id: string, motivo: string) {
    return await prisma.exameSolicitado.update({
      where: { id },
      data: {
        status: 'CANCELADO',
      },
    });
  }

  /**
   * Buscar histórico de exames de um tipo específico do cidadão
   */
  async buscarHistoricoExameTipo(citizenId: string, tipoExame: string) {
    return await prisma.exameSolicitado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        tipoExame,
        status: 'CONCLUIDO',
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataResultado: 'desc',
      },
    });
  }
}

export default new ExamesService();
