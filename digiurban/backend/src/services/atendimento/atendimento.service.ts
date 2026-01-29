// ============================================================================
// SERVICE - ATENDIMENTO MÉDICO (Triagem e Consulta)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateAtendimentoDTO,
  UpdateAtendimentoDTO,
  CreateTriagemDTO,
  UpdateTriagemDTO,
  CreateConsultaMedicaDTO,
  UpdateConsultaMedicaDTO,
  AtendimentoCompletoResponse,
  TipoAtendimento,
  StatusAtendimento,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class AtendimentoService {
  // ============================================================================
  // ATENDIMENTO GERAL
  // ============================================================================

  /**
   * Iniciar atendimento médico
   */
  async iniciarAtendimento(data: CreateAtendimentoDTO): Promise<any> {
    // Verificar se o cidadão existe
    const citizen = await prisma.citizen.findUnique({
      where: { id: data.citizenId },
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // Gerar workflowId único
    const workflowId = `ATD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Se houver consultaId, verificar se existe e atualizar fila
    if (data.consultaId) {
      const consulta = await prisma.consultaAgendada.findUnique({
        where: { id: data.consultaId },
      });

      if (!consulta) {
        throw new Error('Consulta agendada não encontrada');
      }

      // Atualizar consulta para REALIZADA
      await prisma.consultaAgendada.update({
        where: { id: data.consultaId },
        data: { status: 'REALIZADA' },
      });

      // Atualizar fila para EM_ATENDIMENTO
      const fila = await prisma.filaAtendimento.findFirst({
        where: { consultaId: data.consultaId },
      });

      if (fila) {
        await prisma.filaAtendimento.update({
          where: { id: fila.id },
          data: { status: 'EM_ATENDIMENTO' },
        });
      }
    }

    // Mapear TipoAtendimento do DTO para o schema
    let tipoSchema: 'AGENDADO' | 'DEMANDA_ESPONTANEA' | 'URGENCIA' | 'RETORNO' = 'DEMANDA_ESPONTANEA';
    if (data.tipoAtendimento === 'CONSULTA' || data.tipoAtendimento === 'RETORNO') {
      tipoSchema = data.consultaId ? 'AGENDADO' : 'DEMANDA_ESPONTANEA';
    } else if (data.tipoAtendimento === 'URGENCIA' || data.tipoAtendimento === 'EMERGENCIA') {
      tipoSchema = 'URGENCIA';
    }

    // Criar atendimento
    const atendimento = await prisma.atendimentoMedico.create({
      data: {
        workflowId,
        unidadeId: data.unidadeId,
        citizenId: data.citizenId,
        profissionalId: data.profissionalId,
        consultaAgendadaId: data.consultaId,
        tipo: tipoSchema,
        dataAtendimento: new Date(),
        status: 'AGUARDANDO_TRIAGEM',
      },
      include: {
        triagem: true,
        consulta: true,
      },
    });

    return atendimento;
  }

  /**
   * Atualizar atendimento
   */
  async atualizarAtendimento(id: string, data: UpdateAtendimentoDTO) {
    // Mapear status do DTO para o schema
    let statusSchema: any = undefined;
    if (data.status) {
      const statusMap: Record<string, string> = {
        'AGUARDANDO': 'AGUARDANDO_TRIAGEM',
        'EM_ANDAMENTO': 'EM_CONSULTA',
        'FINALIZADO': 'FINALIZADO',
        'CANCELADO': 'CANCELADO',
      };
      statusSchema = statusMap[data.status] || data.status;
    }

    return await prisma.atendimentoMedico.update({
      where: { id },
      data: {
        ...(statusSchema && { status: statusSchema }),
      },
      include: {
        triagem: true,
        consulta: true,
      },
    });
  }

  /**
   * Finalizar atendimento
   */
  async finalizarAtendimento(id: string, observacoes?: string) {
    const atendimento = await prisma.atendimentoMedico.update({
      where: { id },
      data: {
        status: 'FINALIZADO',
      },
    });

    // Atualizar fila para FINALIZADO
    if (atendimento.consultaAgendadaId) {
      const fila = await prisma.filaAtendimento.findFirst({
        where: { consultaId: atendimento.consultaAgendadaId },
      });

      if (fila) {
        await prisma.filaAtendimento.update({
          where: { id: fila.id },
          data: {
            status: 'FINALIZADO',
            atendidoEm: new Date(),
          },
        });
      }
    }

    return atendimento;
  }

  /**
   * Buscar atendimento completo
   */
  async buscarAtendimento(id: string): Promise<any> {
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id },
      include: {
        triagem: true,
        consulta: {
          include: {
            prescricoes: true,
            exameSolicitados: true,
            atestados: true,
            encaminhamentos: true,
          },
        },
        anexos: true,
      },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    return atendimento;
  }

  /**
   * Listar atendimentos
   */
  async listarAtendimentos(filtros: {
    unidadeId?: string;
    citizenId?: string;
    profissionalId?: string;
    tipoAtendimento?: TipoAtendimento;
    status?: StatusAtendimento;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    // Mapear tipo do DTO para o schema
    let tipoSchema: any = undefined;
    if (filtros.tipoAtendimento) {
      if (filtros.tipoAtendimento === 'RETORNO') {
        tipoSchema = 'RETORNO';
      } else if (filtros.tipoAtendimento === 'URGENCIA' || filtros.tipoAtendimento === 'EMERGENCIA') {
        tipoSchema = 'URGENCIA';
      }
    }

    return await prisma.atendimentoMedico.findMany({
      where: {
        ...(filtros.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros.citizenId && { citizenId: filtros.citizenId }),
        ...(filtros.profissionalId && { profissionalId: filtros.profissionalId }),
        ...(tipoSchema && { tipo: tipoSchema }),
        ...(filtros.dataInicio && {
          dataAtendimento: { gte: filtros.dataInicio },
        }),
        ...(filtros.dataFim && {
          dataAtendimento: { lte: filtros.dataFim },
        }),
      },
      include: {
        triagem: true,
        consulta: true,
      },
      orderBy: {
        dataAtendimento: 'desc',
      },
    });
  }

  // ============================================================================
  // TRIAGEM
  // ============================================================================

  /**
   * Realizar triagem
   */
  async realizarTriagem(data: CreateTriagemDTO) {
    // Verificar se o atendimento existe
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    // Mapear classificação de risco do DTO para o schema
    let classificacaoRiscoSchema: 'EMERGENCIA' | 'MUITO_URGENTE' | 'URGENTE' | 'POUCO_URGENTE' | 'NAO_URGENTE' = 'NAO_URGENTE';
    const corProtocolo = data.classificacaoRisco || 'AZUL';

    if (corProtocolo === 'VERMELHO') {
      classificacaoRiscoSchema = 'EMERGENCIA';
    } else if (corProtocolo === 'LARANJA') {
      classificacaoRiscoSchema = 'MUITO_URGENTE';
    } else if (corProtocolo === 'AMARELO') {
      classificacaoRiscoSchema = 'URGENTE';
    } else if (corProtocolo === 'VERDE') {
      classificacaoRiscoSchema = 'POUCO_URGENTE';
    } else {
      classificacaoRiscoSchema = 'NAO_URGENTE';
    }

    // Criar triagem
    const triagem = await prisma.triagemEnfermagem.create({
      data: {
        atendimentoId: data.atendimentoId,
        enfermeiroId: data.profissionalId,
        peso: data.peso,
        altura: data.altura,
        pressaoArterial: data.pressaoArterial,
        frequenciaCardiaca: data.frequenciaCardiaca,
        frequenciaRespiratoria: data.frequenciaRespiratoria,
        temperatura: data.temperatura,
        saturacaoO2: data.saturacaoO2,
        glicemia: data.glicemia,
        queixaPrincipal: data.queixaPrincipal,
        observacoes: data.observacoes,
        classificacaoRisco: classificacaoRiscoSchema,
        corProtocolo: corProtocolo,
      },
    });

    // Atualizar atendimento
    await prisma.atendimentoMedico.update({
      where: { id: data.atendimentoId },
      data: {
        triagemId: triagem.id,
        horarioTriagem: new Date(),
        status: 'AGUARDANDO_MEDICO',
      },
    });

    return triagem;
  }

  /**
   * Atualizar triagem
   */
  async atualizarTriagem(id: string, data: UpdateTriagemDTO) {
    // Mapear classificação de risco
    let updateData: any = {
      ...(data.peso !== undefined && { peso: data.peso }),
      ...(data.altura !== undefined && { altura: data.altura }),
      ...(data.pressaoArterial && { pressaoArterial: data.pressaoArterial }),
      ...(data.frequenciaCardiaca !== undefined && { frequenciaCardiaca: data.frequenciaCardiaca }),
      ...(data.frequenciaRespiratoria !== undefined && { frequenciaRespiratoria: data.frequenciaRespiratoria }),
      ...(data.temperatura !== undefined && { temperatura: data.temperatura }),
      ...(data.saturacaoO2 !== undefined && { saturacaoO2: data.saturacaoO2 }),
      ...(data.glicemia !== undefined && { glicemia: data.glicemia }),
      ...(data.queixaPrincipal && { queixaPrincipal: data.queixaPrincipal }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
    };

    if (data.classificacaoRisco) {
      let classificacaoRiscoSchema: 'EMERGENCIA' | 'MUITO_URGENTE' | 'URGENTE' | 'POUCO_URGENTE' | 'NAO_URGENTE' = 'NAO_URGENTE';
      if (data.classificacaoRisco === 'VERMELHO') {
        classificacaoRiscoSchema = 'EMERGENCIA';
      } else if (data.classificacaoRisco === 'LARANJA') {
        classificacaoRiscoSchema = 'MUITO_URGENTE';
      } else if (data.classificacaoRisco === 'AMARELO') {
        classificacaoRiscoSchema = 'URGENTE';
      } else if (data.classificacaoRisco === 'VERDE') {
        classificacaoRiscoSchema = 'POUCO_URGENTE';
      }
      updateData.classificacaoRisco = classificacaoRiscoSchema;
      updateData.corProtocolo = data.classificacaoRisco;
    }

    return await prisma.triagemEnfermagem.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Buscar triagem do atendimento
   */
  async buscarTriagem(atendimentoId: string) {
    return await prisma.triagemEnfermagem.findUnique({
      where: { atendimentoId },
      include: {
        atendimento: true,
      },
    });
  }

  // ============================================================================
  // CONSULTA MÉDICA
  // ============================================================================

  /**
   * Registrar consulta médica
   */
  async registrarConsulta(data: CreateConsultaMedicaDTO) {
    // Verificar se o atendimento existe
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
      include: {
        triagem: true,
      },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    // Preparar diagnósticos no formato JSON
    const diagnosticos = {
      principal: {
        descricao: data.diagnosticoPrincipal,
        cid10: data.cid10Principal,
      },
      secundarios: data.diagnosticosSecundarios || [],
    };

    // Criar consulta médica
    const consulta = await prisma.consultaMedica.create({
      data: {
        atendimentoId: data.atendimentoId,
        medicoId: data.profissionalId,
        queixaPrincipal: atendimento.triagem?.queixaPrincipal || '',
        antecedentesPessoais: data.anamnese,
        exameFisico: data.exameClinico,
        hipoteseDiagnostica: data.diagnosticoPrincipal,
        diagnosticos: diagnosticos as any,
        conduta: data.conduta,
        observacoes: data.observacoes,
      },
    });

    // Atualizar atendimento
    await prisma.atendimentoMedico.update({
      where: { id: data.atendimentoId },
      data: {
        consultaId: consulta.id,
        horarioConsulta: new Date(),
        status: 'EM_CONSULTA',
      },
    });

    return consulta;
  }

  /**
   * Atualizar consulta médica
   */
  async atualizarConsulta(id: string, data: UpdateConsultaMedicaDTO) {
    let updateData: any = {
      ...(data.anamnese && { antecedentesPessoais: data.anamnese }),
      ...(data.exameClinico && { exameFisico: data.exameClinico }),
      ...(data.diagnosticoPrincipal && { hipoteseDiagnostica: data.diagnosticoPrincipal }),
      ...(data.conduta && { conduta: data.conduta }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
    };

    // Se houver mudança nos diagnósticos, atualizar
    if (data.diagnosticoPrincipal || data.diagnosticosSecundarios) {
      const consulta = await prisma.consultaMedica.findUnique({
        where: { id },
      });

      const diagnosticosAtuais = (consulta?.diagnosticos as any) || {};
      updateData.diagnosticos = {
        principal: {
          descricao: data.diagnosticoPrincipal || diagnosticosAtuais.principal?.descricao || '',
          cid10: data.cid10Principal || diagnosticosAtuais.principal?.cid10 || '',
        },
        secundarios: data.diagnosticosSecundarios || diagnosticosAtuais.secundarios || [],
      };
    }

    return await prisma.consultaMedica.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Buscar consulta do atendimento
   */
  async buscarConsulta(atendimentoId: string) {
    return await prisma.consultaMedica.findUnique({
      where: { atendimentoId },
      include: {
        atendimento: {
          include: {
            triagem: true,
          },
        },
        prescricoes: true,
        exameSolicitados: true,
        atestados: true,
        encaminhamentos: true,
      },
    });
  }

  // ============================================================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================================================

  /**
   * Obter estatísticas de atendimentos
   */
  async obterEstatisticas(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const atendimentos = await prisma.atendimentoMedico.findMany({
      where: {
        dataAtendimento: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros.profissionalId && { profissionalId: filtros.profissionalId }),
      },
      include: {
        triagem: true,
        consulta: true,
      },
    });

    const total = atendimentos.length;
    const porTipo: Record<string, number> = {};
    const porStatus: Record<string, number> = {};
    const porClassificacaoRisco: Record<string, number> = {};

    atendimentos.forEach((a) => {
      porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
      porStatus[a.status] = (porStatus[a.status] || 0) + 1;

      if (a.triagem?.classificacaoRisco) {
        porClassificacaoRisco[a.triagem.classificacaoRisco] =
          (porClassificacaoRisco[a.triagem.classificacaoRisco] || 0) + 1;
      }
    });

    // Diagnósticos mais frequentes (CID-10)
    const cidsCount: Record<string, { cid: string; count: number }> = {};
    atendimentos.forEach((a) => {
      if (a.consulta?.diagnosticos) {
        const diagnosticos = a.consulta.diagnosticos as any;
        if (diagnosticos.principal?.cid10) {
          const cid = diagnosticos.principal.cid10;
          if (!cidsCount[cid]) {
            cidsCount[cid] = { cid, count: 0 };
          }
          cidsCount[cid].count++;
        }
      }
    });

    const diagnosticosMaisFrequentes = Object.values(cidsCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tempo médio de atendimento
    const atendimentosFinalizados = atendimentos.filter(
      (a) => a.status === 'FINALIZADO' && a.updatedAt
    );
    const tempoMedioAtendimento = atendimentosFinalizados.length > 0
      ? atendimentosFinalizados.reduce((acc, a) => {
          const minutos = a.tempoTotalMinutos || 0;
          return acc + minutos;
        }, 0) / atendimentosFinalizados.length
      : 0;

    return {
      total,
      porTipo: Object.entries(porTipo).map(([tipo, count]) => ({ tipo, count })),
      porStatus: Object.entries(porStatus).map(([status, count]) => ({ status, count })),
      porClassificacaoRisco: Object.entries(porClassificacaoRisco).map(([classificacao, count]) => ({
        classificacao,
        count,
      })),
      diagnosticosMaisFrequentes,
      tempoMedioAtendimento: Math.round(tempoMedioAtendimento),
    };
  }

  /**
   * Cancelar atendimento
   */
  async cancelarAtendimento(id: string, motivo: string) {
    const atendimento = await prisma.atendimentoMedico.update({
      where: { id },
      data: {
        status: 'CANCELADO',
      },
    });

    // Atualizar fila se houver
    if (atendimento.consultaAgendadaId) {
      const fila = await prisma.filaAtendimento.findFirst({
        where: { consultaId: atendimento.consultaAgendadaId },
      });

      if (fila) {
        await prisma.filaAtendimento.update({
          where: { id: fila.id },
          data: {
            status: 'CANCELADO',
            observacoes: motivo,
          },
        });
      }
    }

    return atendimento;
  }

  /**
   * Obter produtividade de profissionais
   */
  async obterProdutividadeProfissionais(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    dataInicio: Date;
    dataFim: Date;
  }): Promise<any[]> {
    const where: any = {
      dataAtendimento: {
        gte: filtros.dataInicio,
        lte: filtros.dataFim,
      },
    };

    if (filtros.unidadeId) {
      where.unidadeId = filtros.unidadeId;
    }

    const atendimentos = await prisma.atendimentoMedico.findMany({
      where,
      include: {
        consulta: true,
      },
    });

    // Agrupar por profissional
    const porProfissional = atendimentos.reduce((acc: any, atendimento) => {
      const profissionalId = atendimento.consulta?.medicoId || 'sem_profissional';
      if (!acc[profissionalId]) {
        acc[profissionalId] = {
          profissionalId,
          totalAtendimentos: 0,
          atendimentosFinalizados: 0,
        };
      }
      acc[profissionalId].totalAtendimentos++;
      if (atendimento.status === 'CONSULTA_CONCLUIDA') {
        acc[profissionalId].atendimentosFinalizados++;
      }
      return acc;
    }, {});

    return Object.values(porProfissional);
  }
}

export default new AtendimentoService();
