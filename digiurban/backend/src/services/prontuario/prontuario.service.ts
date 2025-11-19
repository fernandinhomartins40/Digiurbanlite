import { PrismaClient, TipoAtendimento, AtendimentoStatus, ClassificacaoRisco } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface IniciarAtendimentoDTO {
  citizenId: string;
  unidadeId: string;
  tipo: TipoAtendimento;
  prioridade?: number;
}

export interface RealizarTriagemDTO {
  atendimentoId: string;
  enfermeiroId: string;
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  temperatura?: number;
  saturacaoOxigenio?: number;
  peso?: number;
  altura?: number;
  classificacaoRisco: ClassificacaoRisco;
  queixaPrincipal: string;
  observacoes?: string;
}

export interface IniciarConsultaDTO {
  atendimentoId: string;
  medicoId: string;
}

export interface FinalizarConsultaDTO {
  consultaId: string;
  anamnese?: string;
  examesFisicos?: string;
  hipoteseDiagnostica?: string;
  diagnosticos?: any;
  conduta?: string;
  observacoes?: string;
}

export interface AdicionarPrescricaoDTO {
  consultaId: string;
  medicamentoId?: string;
  medicamentoTexto?: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  observacoes?: string;
}

export interface SolicitarExameDTO {
  consultaId: string;
  tipo: 'LABORATORIAL' | 'IMAGEM' | 'PROCEDIMENTO';
  descricao: string;
  justificativa?: string;
}

export interface EmitirAtestadoDTO {
  consultaId: string;
  cid?: string;
  diasAfastamento: number;
  dataInicio: Date;
  observacoes?: string;
}

export class ProntuarioService {
  /**
   * Iniciar novo atendimento (Check-in)
   * Cria workflow e atendimento
   */
  async iniciarAtendimento(data: IniciarAtendimentoDTO) {
    // Criar workflow instance
    const workflow = await workflowInstanceService.create({
      definitionId: 'atendimento-medico-v1', // Este ID deve corresponder à WorkflowDefinition criada
      entityType: 'ATENDIMENTO_MEDICO',
      entityId: '', // Será preenchido depois
      citizenId: data.citizenId,
      currentStage: 'CHECKIN',
      priority: data.prioridade || 0,
      metadata: {
        unidadeId: data.unidadeId,
        tipo: data.tipo,
      },
    });

    // Criar atendimento
    const atendimento = await prisma.atendimentoMedico.create({
      data: {
        workflowId: workflow.id,
        citizenId: data.citizenId,
        unidadeId: data.unidadeId,
        tipo: data.tipo,
        prioridade: data.prioridade || 0,
        status: 'AGUARDANDO_CHECKIN',
      },
    });

    // Atualizar workflow com entityId
    await workflowInstanceService.update(workflow.id, {
      entityId: atendimento.id,
    });

    // Transição para CHECKIN_REALIZADO
    await workflowInstanceService.transition(
      workflow.id,
      'TRIAGEM',
      'CHECKIN_REALIZADO',
      'system',
      'Sistema',
      'Check-in realizado automaticamente'
    );

    // Atualizar status do atendimento
    await prisma.atendimentoMedico.update({
      where: { id: atendimento.id },
      data: { status: 'CHECKIN_REALIZADO' },
    });

    return await this.findById(atendimento.id);
  }

  /**
   * Realizar triagem de enfermagem
   */
  async realizarTriagem(data: RealizarTriagemDTO) {
    // Buscar atendimento
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
      include: { triagem: true },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    if (atendimento.triagem) {
      throw new Error('Triagem já foi realizada para este atendimento');
    }

    if (
      !['CHECKIN_REALIZADO', 'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM'].includes(
        atendimento.status
      )
    ) {
      throw new Error(`Atendimento não está em status adequado para triagem: ${atendimento.status}`);
    }

    // Criar triagem
    const triagem = await prisma.triagemEnfermagem.create({
      data: {
        atendimentoId: data.atendimentoId,
        enfermeiroId: data.enfermeiroId,
        pressaoArterial: data.pressaoArterial,
        frequenciaCardiaca: data.frequenciaCardiaca,
        temperatura: data.temperatura,
        peso: data.peso,
        altura: data.altura,
        classificacaoRisco: data.classificacaoRisco,
        queixaPrincipal: data.queixaPrincipal,
        observacoes: data.observacoes,
      } as any,
    });

    // Atualizar status do atendimento
    await prisma.atendimentoMedico.update({
      where: { id: data.atendimentoId },
      data: {
        status: 'TRIAGEM_CONCLUIDA',
        // Ajustar prioridade baseado na classificação de risco
        prioridade: this.getPrioridadeByRisco(data.classificacaoRisco),
      },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      atendimento.workflowId,
      'FILA_MEDICA',
      'TRIAGEM_REALIZADA',
      data.enfermeiroId,
      undefined,
      `Triagem realizada. Classificação: ${data.classificacaoRisco}`
    );

    return triagem;
  }

  /**
   * Converter classificação de risco em prioridade numérica
   */
  private getPrioridadeByRisco(risco: ClassificacaoRisco): number {
    const prioridades = {
      VERMELHO: 5,
      LARANJA: 4,
      AMARELO: 3,
      VERDE: 2,
      AZUL: 1,
      EMERGENCIA: 5,
      URGENTE: 4,
      POUCO_URGENTE: 3,
      NAO_URGENTE: 2,
    };
    return prioridades[risco as keyof typeof prioridades] || 0;
  }

  /**
   * Chamar próximo paciente da fila
   */
  async chamarProximoPaciente(medicoId: string, unidadeId: string) {
    // Buscar atendimento com maior prioridade que está aguardando médico
    const atendimento = await prisma.atendimentoMedico.findFirst({
      where: {
        unidadeId,
        status: 'AGUARDANDO_MEDICO',
      },
      orderBy: [{ prioridade: 'desc' }, { createdAt: 'asc' }],
      include: {
        triagem: true,
      },
    });

    if (!atendimento) {
      return null;
    }

    // Atualizar status
    await prisma.atendimentoMedico.update({
      where: { id: atendimento.id },
      data: { status: 'EM_CONSULTA' },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      atendimento.workflowId,
      'CONSULTA',
      'PACIENTE_CHAMADO',
      medicoId,
      undefined,
      'Paciente chamado para consulta'
    );

    return atendimento;
  }

  /**
   * Iniciar consulta médica
   */
  async iniciarConsulta(data: IniciarConsultaDTO) {
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
      include: { consulta: true },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    if (atendimento.consulta) {
      throw new Error('Consulta já foi iniciada para este atendimento');
    }

    // Criar consulta
    const consulta = await prisma.consultaMedica.create({
      data: {
        atendimentoId: data.atendimentoId,
        medicoId: data.medicoId,
        queixaPrincipal: '',
        diagnosticos: '',
      } as any,
    });

    // Atualizar status
    await prisma.atendimentoMedico.update({
      where: { id: data.atendimentoId },
      data: { status: 'EM_CONSULTA' },
    });

    return consulta;
  }

  /**
   * Finalizar consulta médica
   */
  async finalizarConsulta(data: FinalizarConsultaDTO) {
    const consulta = await prisma.consultaMedica.findUnique({
      where: { id: data.consultaId },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    // Atualizar consulta
    const consultaAtualizada = await prisma.consultaMedica.update({
      where: { id: data.consultaId },
      data: {
        examesFisicos: data.examesFisicos,
        hipoteseDiagnostica: data.hipoteseDiagnostica,
        diagnosticos: data.diagnosticos,
        conduta: data.conduta,
        observacoes: data.observacoes,
      } as any,
    });

    // Verificar se há prescrições para ir para farmácia
    const temPrescricoes = false; // Simplificado, prescricoes não é uma relação direta

    // Atualizar status do atendimento
    const novoStatus = temPrescricoes ? 'AGUARDANDO_FARMACIA' : 'CONSULTA_CONCLUIDA';
    const proximoStage = temPrescricoes ? 'FARMACIA' : 'FINALIZADO';

    await prisma.atendimentoMedico.update({
      where: { id: consulta.atendimentoId },
      data: { status: novoStatus },
    });

    // Buscar atendimento para pegar workflowId
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: consulta.atendimentoId },
    });

    // Transição do workflow
    if (atendimento?.workflowId) {
      await workflowInstanceService.transition(
        atendimento.workflowId,
        proximoStage,
        'CONSULTA_FINALIZADA',
        consulta.medicoId,
      undefined,
      temPrescricoes
        ? 'Consulta finalizada. Encaminhado para farmácia.'
        : 'Consulta finalizada.'
      );
    }

    return consultaAtualizada;
  }

  /**
   * Adicionar prescrição
   */
  async adicionarPrescricao(data: AdicionarPrescricaoDTO) {
    const consulta = await prisma.consultaMedica.findUnique({
      where: { id: data.consultaId },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    return await prisma.prescricao.create({
      data: {
        consultaId: data.consultaId,
        medicamentoTexto: data.medicamentoTexto || data.medicamentoId,
        dosagem: data.dosagem,
        frequencia: data.frequencia,
        duracao: data.duracao,
        observacoes: data.observacoes,
      } as any,
    });
  }

  /**
   * Solicitar exame
   */
  async solicitarExame(data: SolicitarExameDTO) {
    const consulta = await prisma.consultaMedica.findUnique({
      where: { id: data.consultaId },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    return await prisma.exameSolicitado.create({
      data: {
        consultaId: data.consultaId,
        descricao: data.descricao,
        justificativa: data.justificativa,
        status: 'SOLICITADO',
      } as any,
    });
  }

  /**
   * Emitir atestado médico
   */
  async emitirAtestado(data: EmitirAtestadoDTO) {
    const consulta = await prisma.consultaMedica.findUnique({
      where: { id: data.consultaId },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    const dataFim = new Date(data.dataInicio);
    dataFim.setDate(dataFim.getDate() + data.diasAfastamento);

    return await prisma.atestado.create({
      data: {
        consultaId: data.consultaId,
        diasAfastamento: data.diasAfastamento,
        dataInicio: data.dataInicio,
        dataFim,
        observacoes: data.observacoes,
      } as any,
    });
  }

  /**
   * Finalizar atendimento completo
   */
  async finalizarAtendimento(atendimentoId: string, userId: string) {
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: atendimentoId },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    // Atualizar status
    await prisma.atendimentoMedico.update({
      where: { id: atendimentoId },
      data: {
        status: 'FINALIZADO',
      } as any,
    });

    // Completar workflow
    await workflowInstanceService.complete(
      atendimento.workflowId,
      userId,
      undefined,
      'Atendimento finalizado com sucesso'
    );

    return await this.findById(atendimentoId);
  }

  /**
   * Buscar atendimento por ID
   */
  async findById(id: string) {
    return await prisma.atendimentoMedico.findUnique({
      where: { id },
      include: {
        triagem: true,
        consulta: {
          include: {
            prescricoes: true,
            exameSolicitados: true,
            atestados: true,
          },
        },
      },
    });
  }

  /**
   * Buscar atendimentos por cidadão
   */
  async findByCitizen(citizenId: string, limit = 10) {
    return await prisma.atendimentoMedico.findMany({
      where: { citizenId },
      include: {
        triagem: true,
        consulta: {
          include: {
            prescricoes: true,
            exameSolicitados: true,
            atestados: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Buscar fila de atendimento
   */
  async getFilaAtendimento(unidadeId: string, status?: AtendimentoStatus) {
    return await prisma.atendimentoMedico.findMany({
      where: {
        unidadeId,
        ...(status && { status }),
        status: {
          notIn: ['FINALIZADO', 'CANCELADO'],
        },
      },
      include: {
        triagem: true,
      },
      orderBy: [{ prioridade: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Buscar atendimentos por médico
   */
  async findByMedico(medicoId: string, dataInicio?: Date, dataFim?: Date) {
    return await prisma.consultaMedica.findMany({
      where: {
        medicoId,
        ...(dataInicio &&
          dataFim && {
            createdAt: {
              gte: dataInicio,
              lte: dataFim,
            },
          }),
      },
      orderBy: { dataHora: 'desc' },
    });
  }

  /**
   * Estatísticas de atendimento
   */
  async getEstatisticas(unidadeId: string, dataInicio: Date, dataFim: Date) {
    const atendimentos = await prisma.atendimentoMedico.findMany({
      where: {
        unidadeId,
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        triagem: true,
      },
    });

    const total = atendimentos.length;
    const finalizados = atendimentos.filter((a) => a.status === 'FINALIZADO').length;
    const cancelados = atendimentos.filter((a) => a.status === 'CANCELADO').length;
    const emAndamento = atendimentos.filter(
      (a) => !['FINALIZADO', 'CANCELADO'].includes(a.status)
    ).length;

    // Estatísticas por classificação de risco
    const porRisco = {
      VERMELHO: atendimentos.filter((a) => a.triagem?.classificacaoRisco === 'VERMELHO' as any)
        .length,
      LARANJA: atendimentos.filter((a) => a.triagem?.classificacaoRisco === 'LARANJA' as any)
        .length,
      AMARELO: atendimentos.filter((a) => a.triagem?.classificacaoRisco === 'AMARELO' as any)
        .length,
      VERDE: atendimentos.filter((a) => a.triagem?.classificacaoRisco === 'VERDE' as any).length,
      AZUL: atendimentos.filter((a) => a.triagem?.classificacaoRisco === 'AZUL' as any).length,
    };

    // Tempo médio de atendimento (para os finalizados)
    const atendimentosFinalizados = atendimentos.filter(
      (a) => a.status === 'FINALIZADO'
    );

    let tempoMedioMinutos = 0;
    if (atendimentosFinalizados.length > 0) {
      const totalMinutos = atendimentosFinalizados.reduce((acc, a) => {
        const diff = a.updatedAt.getTime() - a.createdAt.getTime();
        return acc + diff / 1000 / 60; // converter para minutos
      }, 0);
      tempoMedioMinutos = Math.round(totalMinutos / atendimentosFinalizados.length);
    }

    return {
      total,
      finalizados,
      cancelados,
      emAndamento,
      porRisco,
      tempoMedioMinutos,
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
    };
  }
}

export default new ProntuarioService();
