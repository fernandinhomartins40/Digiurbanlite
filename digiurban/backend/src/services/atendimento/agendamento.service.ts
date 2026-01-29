// ============================================================================
// SERVICE - AGENDAMENTO DE CONSULTAS
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgendamentoService {
  /**
   * Agendar consulta
   */
  async agendarConsulta(data: {
    agendaId: string;
    citizenId: string;
    dataHora: Date;
    motivoConsulta?: string;
    observacoes?: string;
  }) {
    // Verificar disponibilidade
    const disponivel = await this.verificarDisponibilidade(
      data.agendaId,
      data.dataHora
    );

    if (!disponivel) {
      throw new Error('Horário não disponível');
    }

    // Criar consulta agendada
    const consulta = await prisma.consultaAgendada.create({
      data: {
        agendaId: data.agendaId,
        citizenId: data.citizenId,
        dataHora: data.dataHora,
        status: 'AGENDADA',
        motivoConsulta: data.motivoConsulta,
        observacoes: data.observacoes,
      },
      include: {
        agenda: true,
      },
    });

    return consulta;
  }

  /**
   * Verificar disponibilidade de horário
   */
  async verificarDisponibilidade(agendaId: string, dataHora: Date): Promise<boolean> {
    const consultaExistente = await prisma.consultaAgendada.findFirst({
      where: {
        agendaId,
        dataHora,
        status: {
          in: ['AGENDADA', 'CONFIRMADA'],
        },
      },
    });

    return !consultaExistente;
  }

  /**
   * Reagendar consulta
   */
  async reagendarConsulta(
    consultaId: string,
    novaDataHora: Date,
    motivo?: string
  ) {
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id: consultaId },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    // Verificar disponibilidade do novo horário
    const disponivel = await this.verificarDisponibilidade(
      consulta.agendaId,
      novaDataHora
    );

    if (!disponivel) {
      throw new Error('Novo horário não disponível');
    }

    return await prisma.consultaAgendada.update({
      where: { id: consultaId },
      data: {
        dataHora: novaDataHora,
        observacoes: motivo ? `Reagendada: ${motivo}` : consulta.observacoes,
      },
      include: {
        agenda: true,
      },
    });
  }

  /**
   * Cancelar consulta
   */
  async cancelarConsulta(consultaId: string, motivo: string, canceladoPor: string) {
    return await prisma.consultaAgendada.update({
      where: { id: consultaId },
      data: {
        status: 'CANCELADA',
        canceladoPor,
        observacoes: `Cancelada: ${motivo}`,
      },
    });
  }

  /**
   * Confirmar consulta
   */
  async confirmarConsulta(consultaId: string) {
    return await prisma.consultaAgendada.update({
      where: { id: consultaId },
      data: {
        status: 'CONFIRMADA',
      },
    });
  }

  /**
   * Listar consultas de um cidadão
   */
  async listarConsultasCidadao(
    citizenId: string,
    filtros?: {
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ) {
    return await prisma.consultaAgendada.findMany({
      where: {
        citizenId,
        ...(filtros?.status && { status: filtros.status as any }),
        ...(filtros?.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataHora: { lte: filtros.dataFim },
        }),
      },
      include: {
        agenda: true,
      },
      orderBy: { dataHora: 'asc' },
    });
  }

  /**
   * Listar consultas agendadas (visão administrativa)
   */
  async listarConsultas(filtros?: {
    unidadeId?: string;
    profissionalId?: string;
    status?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.consultaAgendada.findMany({
      where: {
        ...(filtros?.status && { status: filtros.status as any }),
        ...(filtros?.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataHora: { lte: filtros.dataFim },
        }),
        agenda: {
          ...(filtros?.unidadeId && { unidadeId: filtros.unidadeId }),
          ...(filtros?.profissionalId && { profissionalId: filtros.profissionalId }),
        },
      },
      include: {
        agenda: true,
      },
      orderBy: { dataHora: 'asc' },
    });
  }

  /**
   * Obter estatísticas de agendamento
   */
  async obterEstatisticas(filtros: {
    unidadeId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const consultas = await prisma.consultaAgendada.findMany({
      where: {
        dataHora: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.unidadeId && {
          agenda: {
            unidadeId: filtros.unidadeId,
          },
        }),
      },
    });

    const totalConsultas = consultas.length;
    const agendadas = consultas.filter((c) => c.status === 'AGENDADA').length;
    const confirmadas = consultas.filter((c) => c.status === 'CONFIRMADA').length;
    const realizadas = consultas.filter((c) => c.status === 'REALIZADA').length;
    const faltou = consultas.filter((c) => c.status === 'FALTOU').length;
    const canceladas = consultas.filter((c) => c.status === 'CANCELADA').length;

    return {
      totalConsultas,
      agendadas,
      confirmadas,
      realizadas,
      faltou,
      canceladas,
      taxaComparecimento: totalConsultas > 0 ? (realizadas / totalConsultas) * 100 : 0,
      taxaCancelamento: totalConsultas > 0 ? (canceladas / totalConsultas) * 100 : 0,
      taxaAbsenteismo: totalConsultas > 0 ? (faltou / totalConsultas) * 100 : 0,
    };
  }
}

export default new AgendamentoService();
