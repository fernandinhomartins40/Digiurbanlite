// ============================================================================
// SERVICE - ENCAMINHAMENTOS MÉDICOS
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateEncaminhamentoDTO,
  UpdateEncaminhamentoDTO,
  EncaminhamentoCompletoResponse,
  StatusEncaminhamento,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class EncaminhamentoService {
  /**
   * Criar encaminhamento médico
   */
  async criarEncaminhamento(data: CreateEncaminhamentoDTO): Promise<EncaminhamentoCompletoResponse> {
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
    let prioridadeSchema: 'ROTINA' | 'PRIORIDADE' | 'URGENCIA' = 'ROTINA';
    if (data.prioridade === 1) {
      prioridadeSchema = 'PRIORIDADE';
    } else if (data.prioridade >= 2) {
      prioridadeSchema = 'URGENCIA';
    }

    // Criar encaminhamento
    const encaminhamento = await prisma.encaminhamento.create({
      data: {
        consultaId: atendimento.consultaId,
        especialidade: data.especialidadeDestino,
        motivo: data.justificativa,
        prioridade: prioridadeSchema,
        status: 'PENDENTE',
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    return encaminhamento as any;
  }

  /**
   * Atualizar encaminhamento
   */
  async atualizarEncaminhamento(id: string, data: UpdateEncaminhamentoDTO) {
    const updateData: any = {};

    if (data.especialidadeDestino) updateData.especialidade = data.especialidadeDestino;
    if (data.justificativa) updateData.motivo = data.justificativa;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.dataAgendamento !== undefined) updateData.dataAgendamento = data.dataAgendamento;

    if (data.prioridade !== undefined) {
      let prioridadeSchema: 'ROTINA' | 'PRIORIDADE' | 'URGENCIA' = 'ROTINA';
      if (data.prioridade === 1) {
        prioridadeSchema = 'PRIORIDADE';
      } else if (data.prioridade >= 2) {
        prioridadeSchema = 'URGENCIA';
      }
      updateData.prioridade = prioridadeSchema;
    }

    return await prisma.encaminhamento.update({
      where: { id },
      data: updateData,
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
   * Atualizar status do encaminhamento
   */
  async atualizarStatus(
    encaminhamentoId: string,
    status: StatusEncaminhamento,
    observacoes?: string
  ) {
    // Mapear status do DTO para o schema
    let statusSchema: 'PENDENTE' | 'AGENDADO' | 'REALIZADO' | 'CANCELADO' = 'PENDENTE';

    if (status === 'PENDENTE') statusSchema = 'PENDENTE';
    else if (status === 'AGENDADO') statusSchema = 'AGENDADO';
    else if (status === 'REALIZADO') statusSchema = 'REALIZADO';
    else if (status === 'CANCELADO') statusSchema = 'CANCELADO';

    const dataUpdate: any = { status: statusSchema };

    if (status === 'AGENDADO') {
      dataUpdate.dataAgendamento = new Date();
    }

    return await prisma.encaminhamento.update({
      where: { id: encaminhamentoId },
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
   * Agendar consulta do encaminhamento
   */
  async agendarEncaminhamento(
    encaminhamentoId: string,
    dataAgendamento: Date,
    profissionalDestinoId?: string
  ) {
    const dataUpdate: any = {
      status: 'AGENDADO',
      dataAgendamento,
    };

    return await prisma.encaminhamento.update({
      where: { id: encaminhamentoId },
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
   * Registrar realização do encaminhamento
   */
  async registrarRealizacao(
    encaminhamentoId: string,
    atendimentoDestinoId: string,
    observacoes?: string
  ) {
    return await prisma.encaminhamento.update({
      where: { id: encaminhamentoId },
      data: {
        status: 'REALIZADO',
      },
    });
  }

  /**
   * Buscar encaminhamento completo
   */
  async buscarEncaminhamento(id: string): Promise<EncaminhamentoCompletoResponse> {
    const encaminhamento = await prisma.encaminhamento.findUnique({
      where: { id },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    if (!encaminhamento) {
      throw new Error('Encaminhamento não encontrado');
    }

    return encaminhamento as any;
  }

  /**
   * Listar encaminhamentos de um cidadão
   */
  async listarEncaminhamentosCidadao(citizenId: string, filtros?: {
    status?: StatusEncaminhamento;
    especialidade?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.encaminhamento.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        ...(filtros?.status && { status: filtros.status as any }),
        ...(filtros?.especialidade && {
          especialidade: filtros.especialidade,
        }),
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
   * Listar encaminhamentos de um atendimento
   */
  async listarEncaminhamentosAtendimento(atendimentoId: string) {
    return await prisma.encaminhamento.findMany({
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
   * Listar encaminhamentos pendentes (visão administrativa)
   */
  async listarEncaminhamentosPendentes(filtros: {
    unidadeDestinoId?: string;
    especialidade?: string;
    prioridade?: string;
  }) {
    return await prisma.encaminhamento.findMany({
      where: {
        status: 'PENDENTE',
        ...(filtros.especialidade && {
          especialidade: filtros.especialidade,
        }),
        ...(filtros.prioridade && {
          prioridade: filtros.prioridade as any,
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
   * Listar todos os encaminhamentos (visão administrativa)
   */
  async listarEncaminhamentos(filtros: {
    unidadeOrigemId?: string;
    unidadeDestinoId?: string;
    profissionalOrigemId?: string;
    especialidade?: string;
    status?: StatusEncaminhamento;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.encaminhamento.findMany({
      where: {
        ...(filtros.status && { status: filtros.status as any }),
        ...(filtros.especialidade && {
          especialidade: filtros.especialidade,
        }),
        ...(filtros.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros.dataFim && {
          dataHora: { lte: filtros.dataFim },
        }),
        ...(filtros.unidadeOrigemId && {
          consulta: {
            atendimento: {
              unidadeId: filtros.unidadeOrigemId,
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
   * Obter estatísticas de encaminhamentos
   */
  async obterEstatisticas(filtros: {
    unidadeOrigemId?: string;
    unidadeDestinoId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const encaminhamentos = await prisma.encaminhamento.findMany({
      where: {
        dataHora: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.unidadeOrigemId && {
          consulta: {
            atendimento: {
              unidadeId: filtros.unidadeOrigemId,
            },
          },
        }),
      },
    });

    const total = encaminhamentos.length;
    const pendentes = encaminhamentos.filter((e) => e.status === 'PENDENTE').length;
    const agendados = encaminhamentos.filter((e) => e.status === 'AGENDADO').length;
    const realizados = encaminhamentos.filter((e) => e.status === 'REALIZADO').length;
    const cancelados = encaminhamentos.filter((e) => e.status === 'CANCELADO').length;

    // Especialidades mais encaminhadas
    const especialidadesCount: Record<string, number> = {};
    encaminhamentos.forEach((e) => {
      especialidadesCount[e.especialidade] =
        (especialidadesCount[e.especialidade] || 0) + 1;
    });

    const especialidadesMaisEncaminhadas = Object.entries(especialidadesCount)
      .map(([especialidade, count]) => ({ especialidade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tempo médio até agendamento (em dias)
    const encaminhamentosAgendados = encaminhamentos.filter(
      (e) => e.dataAgendamento && e.status !== 'PENDENTE'
    );
    const tempoMedioAgendamento = encaminhamentosAgendados.length > 0
      ? encaminhamentosAgendados.reduce((acc, e) => {
          const dias = Math.ceil(
            (e.dataAgendamento!.getTime() - e.dataHora.getTime()) / (1000 * 60 * 60 * 24)
          );
          return acc + dias;
        }, 0) / encaminhamentosAgendados.length
      : 0;

    return {
      total,
      pendentes,
      agendados,
      realizados,
      cancelados,
      taxaRealizacao: total > 0 ? (realizados / total) * 100 : 0,
      especialidadesMaisEncaminhadas,
      tempoMedioAgendamento: Math.round(tempoMedioAgendamento * 10) / 10,
      tempoMedioRealizacao: 0, // Não há mais campo dataRealizacao no schema
    };
  }

  /**
   * Cancelar encaminhamento
   */
  async cancelarEncaminhamento(id: string, motivo: string) {
    return await prisma.encaminhamento.update({
      where: { id },
      data: {
        status: 'CANCELADO',
      },
    });
  }

  /**
   * Buscar profissionais disponíveis para especialidade
   */
  async buscarProfissionaisDisponiveis(especialidade: string, unidadeId?: string): Promise<any[]> {
    // Buscar usuários com a especialidade específica
    const profissionais = await prisma.user.findMany({
      where: {
        // Filtrar profissionais de saúde
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 50,
    });

    return profissionais.map((p) => ({
      id: p.id,
      nome: p.name,
      email: p.email,
      especialidade,
    }));
  }
}

export default new EncaminhamentoService();
