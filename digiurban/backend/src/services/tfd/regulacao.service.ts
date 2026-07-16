// ============================================================================
// SERVICE - REGULAÇÃO MÉDICA TFD
// ============================================================================

import { prisma } from '../../lib/prisma';
import {
  CreateParecerRegulacaoDTO,
  UpdateParecerRegulacaoDTO,
  CreateAprovacaoGestaoDTO,
  CreateAgendamentoExternoDTO,
  UpdateAgendamentoExternoDTO,
  StatusSolicitacaoTFD,
  StatusAgendamentoExterno,
} from '../../types/saude-tfd.types';
import { centralCalendarService } from '../central-calendar.service';


export class RegulacaoTFDService {
  private async syncAgendamentoExternoComAgendaCentral(
    agendamentoId: string,
    fallbackUserId?: string
  ) {
    try {
      await centralCalendarService.syncTFDExternalScheduleById(agendamentoId, fallbackUserId);
    } catch (error) {
      console.warn('Falha ao sincronizar agendamento TFD com agenda centralizada', {
        agendamentoId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================================================
  // PARECER DE REGULAÇÃO
  // ============================================================================

  /**
   * Criar parecer de regulação médica
   */
  async criarParecer(data: CreateParecerRegulacaoDTO) {
    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    // Criar parecer
    const parecer = await prisma.parecerRegulacaoTFD.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        medicoReguladorId: data.reguladorId,
        parecer: data.justificativa || '',
        status: data.aprovado ? 'APROVADO' : 'REPROVADO',
        observacoes: data.observacoes,
      },
    });

    // Atualizar status da solicitação
    if (data.aprovado) {
      await prisma.solicitacaoTFD.update({
        where: { id: data.solicitacaoId },
        data: {
          status: 'AGUARDANDO_APROVACAO_GESTAO',
        },
      });
    } else {
      await prisma.solicitacaoTFD.update({
        where: { id: data.solicitacaoId },
        data: {
          status: 'INDEFERIDO',
        },
      });
    }

    return parecer;
  }

  /**
   * Atualizar parecer
   */
  async atualizarParecer(id: string, data: UpdateParecerRegulacaoDTO) {
    const updateData: any = {};

    if (data.aprovado !== undefined) {
      updateData.status = data.aprovado ? 'APROVADO' : 'REPROVADO';
    }
    if (data.justificativa !== undefined) {
      updateData.parecer = data.justificativa;
    }
    if (data.observacoes !== undefined) {
      updateData.observacoes = data.observacoes;
    }

    return await prisma.parecerRegulacaoTFD.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Buscar parecer
   */
  async buscarParecer(id: string) {
    return await prisma.parecerRegulacaoTFD.findUnique({
      where: { id },
      include: {
        solicitacao: true,
        medicoRegulador: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar pareceres de uma solicitação
   */
  async listarPareceresSolicitacao(solicitacaoId: string) {
    return await prisma.parecerRegulacaoTFD.findMany({
      where: { solicitacaoId },
      include: {
        medicoRegulador: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dataParecer: 'desc',
      },
    });
  }

  /**
   * Listar solicitações aguardando regulação
   */
  async listarAguardandoRegulacao(filtros?: {
    urgente?: boolean;
    especialidade?: string;
  }) {
    return await prisma.solicitacaoTFD.findMany({
      where: {
        status: 'AGUARDANDO_REGULACAO_MEDICA',
        ...(filtros?.especialidade && { especialidade: filtros.especialidade }),
      },
      include: {
        documentos: {
          select: {
            id: true,
            tipoDocumento: true,
            nomeArquivo: true,
          },
        },
      },
      orderBy: [
        { prioridade: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // ============================================================================
  // APROVAÇÃO DA GESTÃO
  // ============================================================================

  /**
   * Criar aprovação da gestão
   */
  async criarAprovacaoGestao(data: CreateAprovacaoGestaoDTO) {
    // Verificar se a solicitação existe e tem parecer aprovado
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
      include: {
        pareceresRegulacao: {
          where: { status: 'APROVADO' },
          take: 1,
        },
      },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    if (solicitacao.pareceresRegulacao.length === 0) {
      throw new Error('Solicitação não possui parecer médico aprovado');
    }

    // Criar aprovação
    const aprovacao = await prisma.aprovacaoGestaoTFD.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        gestorId: data.aprovadoPorId,
        decisao: data.aprovado ? 'APROVADO' : 'REPROVADO',
        justificativa: data.justificativa,
      },
    });

    // Atualizar status da solicitação
    if (data.aprovado) {
      await prisma.solicitacaoTFD.update({
        where: { id: data.solicitacaoId },
        data: {
          status: 'APROVADO_PARA_AGENDAMENTO',
          dataAprovacao: new Date(),
        },
      });
    } else {
      await prisma.solicitacaoTFD.update({
        where: { id: data.solicitacaoId },
        data: {
          status: 'INDEFERIDO',
        },
      });
    }

    return aprovacao;
  }

  /**
   * Buscar aprovação
   */
  async buscarAprovacao(id: string) {
    return await prisma.aprovacaoGestaoTFD.findUnique({
      where: { id },
      include: {
        solicitacao: true,
        gestor: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar aprovações de uma solicitação
   */
  async listarAprovacoesSolicitacao(solicitacaoId: string) {
    return await prisma.aprovacaoGestaoTFD.findMany({
      where: { solicitacaoId },
      include: {
        gestor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dataAprovacao: 'desc',
      },
    });
  }

  /**
   * Listar solicitações aguardando aprovação da gestão
   */
  async listarAguardandoAprovacaoGestao() {
    return await prisma.solicitacaoTFD.findMany({
      where: {
        status: 'AGUARDANDO_APROVACAO_GESTAO',
      },
      include: {
        pareceresRegulacao: {
          where: { status: 'APROVADO' },
          take: 1,
          include: {
            medicoRegulador: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { prioridade: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // ============================================================================
  // AGENDAMENTO EXTERNO
  // ============================================================================

  /**
   * Criar agendamento externo
   */
  async criarAgendamentoExterno(data: CreateAgendamentoExternoDTO, usuarioAgendamentoId: string) {
    // Verificar se a solicitação está aprovada
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    if (solicitacao.status !== 'APROVADO_PARA_AGENDAMENTO' && solicitacao.status !== 'AGENDANDO') {
      throw new Error('Solicitação não está aprovada para agendamento');
    }

    // Criar data/hora combinada
    const dataHoraConsulta = new Date(data.dataAgendamento);
    const [hora, minuto] = data.horaAgendamento.split(':');
    dataHoraConsulta.setHours(parseInt(hora), parseInt(minuto));

    // Criar agendamento
    const agendamento = await prisma.agendamentoExternoTFD.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        hospitalDestino: data.localAtendimento,
        especialidade: data.especialidade,
        dataHoraConsulta: dataHoraConsulta,
        endereco: data.enderecoCompleto,
        telefoneContato: data.telefoneContato,
        confirmado: false,
        observacoes: data.observacoes,
        usuarioAgendamento: usuarioAgendamentoId,
      },
    });

    // Atualizar status da solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: data.solicitacaoId },
      data: {
        status: 'AGENDADO',
      },
    });

    await this.syncAgendamentoExternoComAgendaCentral(agendamento.id, usuarioAgendamentoId);

    return agendamento;
  }

  /**
   * Atualizar agendamento
   */
  async atualizarAgendamento(
    id: string,
    data: UpdateAgendamentoExternoDTO,
    fallbackUserId?: string
  ) {
    const agendamentoAtual = await prisma.agendamentoExternoTFD.findUnique({
      where: { id },
    });

    if (!agendamentoAtual) {
      throw new Error('Agendamento não encontrado');
    }

    const updateData: Record<string, any> = {};

    if (data.especialidade !== undefined) {
      updateData.especialidade = data.especialidade;
    }

    if (data.localAtendimento !== undefined) {
      updateData.hospitalDestino = data.localAtendimento;
    }

    if (data.enderecoCompleto !== undefined) {
      updateData.endereco = data.enderecoCompleto;
    }

    if (data.telefoneContato !== undefined) {
      updateData.telefoneContato = data.telefoneContato;
    }

    if (data.observacoes !== undefined) {
      updateData.observacoes = data.observacoes;
    }

    if (data.dataAgendamento || data.horaAgendamento) {
      const baseDate = data.dataAgendamento
        ? new Date(data.dataAgendamento)
        : new Date(agendamentoAtual.dataHoraConsulta);

      if (data.horaAgendamento) {
        const [hora, minuto] = data.horaAgendamento.split(':');
        baseDate.setHours(parseInt(hora, 10), parseInt(minuto, 10), 0, 0);
      } else {
        baseDate.setHours(
          agendamentoAtual.dataHoraConsulta.getHours(),
          agendamentoAtual.dataHoraConsulta.getMinutes(),
          0,
          0
        );
      }

      updateData.dataHoraConsulta = baseDate;
    }

    const agendamento = await prisma.agendamentoExternoTFD.update({
      where: { id },
      data: updateData,
    });

    await this.syncAgendamentoExternoComAgendaCentral(id, fallbackUserId);

    return agendamento;
  }

  /**
   * Confirmar agendamento
   */
  async confirmarAgendamento(id: string, fallbackUserId?: string) {
    const agendamento = await prisma.agendamentoExternoTFD.update({
      where: { id },
      data: {
        confirmado: true,
      },
    });

    await this.syncAgendamentoExternoComAgendaCentral(id, fallbackUserId);

    return agendamento;
  }

  /**
   * Cancelar agendamento
   */
  async cancelarAgendamento(id: string, motivo: string, fallbackUserId?: string) {
    const agendamento = await prisma.agendamentoExternoTFD.update({
      where: { id },
      data: {
        confirmado: false,
        observacoes: `CANCELADO: ${motivo}`,
      },
    });

    await this.syncAgendamentoExternoComAgendaCentral(id, fallbackUserId);

    return agendamento;
  }

  /**
   * Registrar comparecimento
   */
  async registrarComparecimento(
    id: string,
    compareceu: boolean,
    observacoes?: string,
    fallbackUserId?: string
  ) {
    const agendamento = await prisma.agendamentoExternoTFD.update({
      where: { id },
      data: {
        confirmado: compareceu,
        observacoes,
      },
    });

    await this.syncAgendamentoExternoComAgendaCentral(id, fallbackUserId);

    return agendamento;
  }

  /**
   * Buscar agendamento
   */
  async buscarAgendamento(id: string) {
    return await prisma.agendamentoExternoTFD.findUnique({
      where: { id },
      include: {
        solicitacao: true,
      },
    });
  }

  /**
   * Listar agendamentos de uma solicitação
   */
  async listarAgendamentosSolicitacao(solicitacaoId: string) {
    return await prisma.agendamentoExternoTFD.findMany({
      where: { solicitacaoId },
      orderBy: {
        dataHoraConsulta: 'desc',
      },
    });
  }

  /**
   * Listar próximos agendamentos
   */
  async listarProximosAgendamentos(filtros?: {
    diasProximos?: number;
    confirmado?: boolean;
  }) {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(
      dataLimite.getDate() + (filtros?.diasProximos || 30)
    );

    return await prisma.agendamentoExternoTFD.findMany({
      where: {
        dataHoraConsulta: {
          gte: hoje,
          lte: dataLimite,
        },
        ...(filtros?.confirmado !== undefined && { confirmado: filtros.confirmado }),
      },
      include: {
        solicitacao: true,
      },
      orderBy: {
        dataHoraConsulta: 'asc',
      },
    });
  }

  // ============================================================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================================================

  /**
   * Obter estatísticas de regulação
   */
  async obterEstatisticasRegulacao(filtros: {
    dataInicio: Date;
    dataFim: Date;
  }) {
    const pareceres = await prisma.parecerRegulacaoTFD.findMany({
      where: {
        dataParecer: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
      },
      include: {
        solicitacao: true,
      },
    });

    const total = pareceres.length;
    const aprovados = pareceres.filter((p) => p.status === 'APROVADO').length;
    const indeferidos = pareceres.filter((p) => p.status === 'REPROVADO').length;
    const taxaAprovacao = total > 0 ? (aprovados / total) * 100 : 0;

    // Tempo médio de regulação
    const tempoMedio =
      pareceres.length > 0
        ? pareceres.reduce((acc, p) => {
            const dias = Math.ceil(
              (p.dataParecer.getTime() - p.solicitacao.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return acc + dias;
          }, 0) / pareceres.length
        : 0;

    // Por regulador
    const porRegulador: Record<string, { nome: string; total: number; aprovados: number }> = {};
    pareceres.forEach((p) => {
      const key = p.medicoReguladorId;
      if (!porRegulador[key]) {
        porRegulador[key] = {
          nome: '',
          total: 0,
          aprovados: 0,
        };
      }
      porRegulador[key].total++;
      if (p.status === 'APROVADO') {
        porRegulador[key].aprovados++;
      }
    });

    return {
      total,
      aprovados,
      indeferidos,
      taxaAprovacao,
      tempoMedioRegulacao: Math.round(tempoMedio * 10) / 10,
      produtividadeReguladores: Object.values(porRegulador),
    };
  }

  /**
   * Obter estatísticas de agendamentos
   */
  async obterEstatisticasAgendamentos(filtros: {
    dataInicio: Date;
    dataFim: Date;
  }) {
    const agendamentos = await prisma.agendamentoExternoTFD.findMany({
      where: {
        dataHoraConsulta: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
      },
    });

    const total = agendamentos.length;
    const confirmados = agendamentos.filter((a) => a.confirmado).length;
    const naoConfirmados = agendamentos.filter((a) => !a.confirmado).length;

    return {
      total,
      confirmados,
      naoConfirmados,
      taxaConfirmacao: total > 0 ? (confirmados / total) * 100 : 0,
    };
  }

  /**
   * Gerar relatório de regulação
   */
  async gerarRelatorioRegulacao(filtros: {
    dataInicio: Date;
    dataFim: Date;
    reguladorId?: string;
  }) {
    const pareceres = await prisma.parecerRegulacaoTFD.findMany({
      where: {
        dataParecer: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.reguladorId && { medicoReguladorId: filtros.reguladorId }),
      },
      include: {
        solicitacao: true,
        medicoRegulador: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dataParecer: 'asc',
      },
    });

    return {
      periodo: {
        inicio: filtros.dataInicio,
        fim: filtros.dataFim,
      },
      totalPareceres: pareceres.length,
      pareceres: pareceres.map((p) => ({
        data: p.dataParecer,
        solicitacao: {
          id: p.solicitacaoId,
          especialidade: p.solicitacao.especialidade,
          procedimento: p.solicitacao.procedimento,
        },
        regulador: {
          nome: p.medicoRegulador.name,
        },
        status: p.status,
        parecer: p.parecer,
        observacoes: p.observacoes,
      })),
    };
  }
}

export default new RegulacaoTFDService();
