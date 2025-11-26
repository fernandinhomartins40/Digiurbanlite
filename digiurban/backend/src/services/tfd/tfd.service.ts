import { PrismaClient, TFDStatus, MeioPagamento, DocumentStatus, PendingType } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';
import * as protocolDocumentService from '../protocol-document.service';
import * as protocolPendingService from '../protocol-pending.service';
import protocolToTFDService from './protocol-to-tfd.service';

const prisma = new PrismaClient();

export interface CreateSolicitacaoTFDDTO {
  citizenId: string;
  especialidade: string;
  procedimento: string;
  justificativaMedica: string;
  medicoSolicitante: string;
  prioridade?: number;
  documentosAnexados?: any;
  observacoes?: string;
}

export interface AnalisarDocumentacaoDTO {
  solicitacaoId: string;
  analistaId: string;
  aprovado: boolean;
  documentosPendentes?: string[];
  observacoes?: string;
}

export interface RegulacaoMedicaDTO {
  solicitacaoId: string;
  reguladorId: string;
  aprovado: boolean;
  justificativa?: string;
}

export interface AprovarGestaoDTO {
  solicitacaoId: string;
  gestorId: string;
  aprovado: boolean;
  justificativa?: string;
}

export interface AgendarViagemDTO {
  solicitacaoId: string;
  destino: string;
  unidadeDestino: string;
  dataAgendamento: Date;
  dataRetornoPrevisto?: Date;
  veiculoId?: string;
  motoristaId?: string;
  acompanhante?: any;
  observacoes?: string;
}

export interface RegistrarDespesasDTO {
  viagemId: string;
  valorDespesas: number;
  comprovanteDespesas: any;
  mecanismoPagamento: MeioPagamento;
}

export interface CreateVeiculoDTO {
  placa: string;
  modelo: string;
  capacidade: number;
  ano?: number;
  kmAtual?: number;
}

export interface CreateMotoristaDTO {
  userId: string;
  nome: string;
  cnh: string;
  categoriaCnh: string;
  validadeCnh: Date;
  telefone: string;
}

export class TFDService {
  /**
   * Criar nova solicitação de TFD
   */
  async createSolicitacao(data: CreateSolicitacaoTFDDTO) {
    // Criar workflow instance
    const workflow = await workflowInstanceService.create({
      definitionId: 'tfd-v1',
      entityType: 'SOLICITACAO_TFD',
      entityId: '',
      citizenId: data.citizenId,
      currentStage: 'ANALISE_DOCUMENTAL',
      priority: data.prioridade || 0,
      metadata: {
        especialidade: data.especialidade,
        procedimento: data.procedimento,
      },
    });

    // Criar solicitação
    const solicitacao = await prisma.solicitacaoTFD.create({
      data: {
        workflowId: workflow.id,
        citizenId: data.citizenId,
        protocolId: workflow.id,
        especialidade: data.especialidade,
        procedimento: data.procedimento,
        justificativa: data.justificativaMedica,
        prioridade: (data.prioridade || 'NORMAL') as any,
        observacoes: data.observacoes,
        status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
      } as any,
    });

    // Atualizar workflow com entityId
    await workflowInstanceService.update(workflow.id, {
      entityId: solicitacao.id,
    });

    return await this.findById(solicitacao.id);
  }

  /**
   * Analisar documentação
   */
  async analisarDocumentacao(data: AnalisarDocumentacaoDTO) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'AGUARDANDO_ANALISE_DOCUMENTAL') {
      throw new Error(
        `Solicitação não está aguardando análise documental. Status: ${solicitacao.status}`
      );
    }

    let novoStatus: TFDStatus;
    let proximoStage: string;
    let action: string;

    if (data.aprovado) {
      novoStatus = 'AGUARDANDO_REGULACAO_MEDICA';
      proximoStage = 'REGULACAO_MEDICA';
      action = 'DOCUMENTACAO_APROVADA';

      // ✅ INTEGRAÇÃO: Aprovar documentos no protocolo
      const documentos = await protocolDocumentService.getProtocolDocuments(solicitacao.protocolId);
      for (const doc of documentos) {
        if (doc.status === DocumentStatus.UPLOADED || doc.status === DocumentStatus.UNDER_REVIEW) {
          await protocolDocumentService.approveDocument(doc.id, data.analistaId);
        }
      }
    } else {
      novoStatus = 'DOCUMENTACAO_PENDENTE';
      proximoStage = 'ANALISE_DOCUMENTAL';
      action = 'DOCUMENTACAO_PENDENTE';

      // ✅ INTEGRAÇÃO: Criar pendências para documentos rejeitados
      if (data.documentosPendentes && data.documentosPendentes.length > 0) {
        for (const docType of data.documentosPendentes) {
          await protocolPendingService.createDocumentPending(
            solicitacao.protocolId,
            docType,
            data.analistaId,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Prazo: 7 dias
          );
        }
      }

      // ✅ INTEGRAÇÃO: Rejeitar documentos específicos no protocolo
      const documentos = await protocolDocumentService.getProtocolDocuments(solicitacao.protocolId);
      for (const doc of documentos) {
        if (data.documentosPendentes?.includes(doc.documentType)) {
          await protocolDocumentService.rejectDocument(
            doc.id,
            data.analistaId,
            data.observacoes || 'Documento não atende aos requisitos'
          );
        }
      }
    }

    // Atualizar solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: data.solicitacaoId },
      data: {
        status: novoStatus,
        observacoes: data.observacoes
          ? `${solicitacao.observacoes || ''}\n\n[Análise Documental] ${data.observacoes}`
          : solicitacao.observacoes,
      },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      solicitacao.workflowId,
      proximoStage,
      action,
      data.analistaId,
      undefined,
      data.observacoes ||
        (data.aprovado
          ? 'Documentação aprovada'
          : `Documentação pendente: ${data.documentosPendentes?.join(', ')}`)
    );

    // ✅ INTEGRAÇÃO: Sincronizar status com protocolo
    await protocolToTFDService.syncTFDStatusToProtocol(data.solicitacaoId);

    return await this.findById(data.solicitacaoId);
  }

  /**
   * Regulação médica
   */
  async regulacaoMedica(data: RegulacaoMedicaDTO) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'AGUARDANDO_REGULACAO_MEDICA') {
      throw new Error(
        `Solicitação não está aguardando regulação médica. Status: ${solicitacao.status}`
      );
    }

    let novoStatus: TFDStatus;
    let proximoStage: string;
    let action: string;

    if (data.aprovado) {
      novoStatus = 'APROVADO_REGULACAO';
      proximoStage = 'APROVACAO_GESTAO';
      action = 'REGULACAO_APROVADA';
    } else {
      novoStatus = 'CANCELADO';
      proximoStage = 'CANCELADO';
      action = 'REGULACAO_NEGADA';

      // ✅ INTEGRAÇÃO: Criar pendência informando a negação
      await protocolPendingService.createPending({
        protocolId: solicitacao.protocolId,
        type: PendingType.APPROVAL,
        title: 'Solicitação TFD Negada pela Regulação Médica',
        description: data.justificativa || 'Solicitação não atende aos critérios médicos para TFD',
        createdBy: data.reguladorId,
        blocksProgress: true,
        metadata: {
          etapa: 'REGULACAO_MEDICA',
          motivo: data.justificativa,
          dataDecisao: new Date().toISOString(),
        },
      });
    }

    // Atualizar solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: data.solicitacaoId },
      data: {
        status: novoStatus,
        observacoes: data.justificativa
          ? `${solicitacao.observacoes || ''}\n\n[Regulação Médica] ${data.justificativa}`
          : solicitacao.observacoes,
      },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      solicitacao.workflowId,
      proximoStage,
      action,
      data.reguladorId,
      undefined,
      data.justificativa || (data.aprovado ? 'Regulação aprovada' : 'Regulação negada')
    );

    if (!data.aprovado) {
      await workflowInstanceService.cancel(
        solicitacao.workflowId,
        data.reguladorId,
        undefined,
        'Solicitação negada na regulação médica'
      );
    }

    // ✅ INTEGRAÇÃO: Sincronizar status com protocolo
    await protocolToTFDService.syncTFDStatusToProtocol(data.solicitacaoId);

    return await this.findById(data.solicitacaoId);
  }

  /**
   * Aprovação da gestão
   */
  async aprovarGestao(data: AprovarGestaoDTO & { valorEstimado?: number }) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (
      ![' APROVADO_REGULACAO', 'AGUARDANDO_APROVACAO_GESTAO'].includes(solicitacao.status)
    ) {
      throw new Error(
        `Solicitação não está aguardando aprovação da gestão. Status: ${solicitacao.status}`
      );
    }

    let novoStatus: TFDStatus;
    let proximoStage: string;
    let action: string;

    if (data.aprovado) {
      novoStatus = 'AGENDADO';
      proximoStage = 'AGENDAMENTO';
      action = 'GESTAO_APROVADA';
    } else {
      novoStatus = 'CANCELADO';
      proximoStage = 'CANCELADO';
      action = 'GESTAO_NEGADA';

      // ✅ INTEGRAÇÃO: Criar pendência informando a negação
      await protocolPendingService.createPending({
        protocolId: solicitacao.protocolId,
        type: PendingType.APPROVAL,
        title: 'Solicitação TFD Negada pela Gestão',
        description: data.justificativa || 'Solicitação não atende aos critérios orçamentários',
        createdBy: data.gestorId,
        blocksProgress: true,
        metadata: {
          etapa: 'APROVACAO_GESTAO',
          motivo: data.justificativa,
          dataDecisao: new Date().toISOString(),
        },
      });
    }

    // Atualizar solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: data.solicitacaoId },
      data: {
        status: novoStatus,
        observacoes: data.justificativa
          ? `${solicitacao.observacoes || ''}\n\n[Aprovação Gestão] ${data.justificativa}`
          : solicitacao.observacoes,
      },
    });

    // Transição do workflow com metadata incluindo valor estimado
    await workflowInstanceService.transition(
      solicitacao.workflowId,
      proximoStage,
      action,
      data.gestorId,
      undefined,
      data.justificativa || (data.aprovado ? 'Aprovado pela gestão' : 'Negado pela gestão'),
      data.aprovado && (data as any).valorEstimado
        ? { valorEstimado: (data as any).valorEstimado }
        : undefined
    );

    if (!data.aprovado) {
      await workflowInstanceService.cancel(
        solicitacao.workflowId,
        data.gestorId,
        undefined,
        'Solicitação negada pela gestão'
      );
    }

    // ✅ INTEGRAÇÃO: Sincronizar status com protocolo
    await protocolToTFDService.syncTFDStatusToProtocol(data.solicitacaoId);

    return await this.findById(data.solicitacaoId);
  }

  /**
   * Agendar viagem
   */
  async agendarViagem(data: AgendarViagemDTO) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'AGENDADO') {
      throw new Error(`Solicitação não está em status AGENDADO. Status: ${solicitacao.status}`);
    }

    // Criar viagem
    const viagem = await prisma.viagemTFD.create({
      data: {
        solicitacaoTFDId: data.solicitacaoId,
        tipo: 'IDA_VOLTA',
        destino: data.destino,
        unidadeDestino: data.unidadeDestino,
        dataIda: data.dataAgendamento,
        dataRetorno: data.dataRetornoPrevisto,
        veiculoId: data.veiculoId,
        motoristaId: data.motoristaId,
        acompanhante: data.acompanhante,
        status: 'AGENDADA',
        observacoes: data.observacoes,
      } as any,
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      solicitacao.workflowId,
      'VIAGEM',
      'VIAGEM_AGENDADA',
      'system',
      undefined,
      `Viagem agendada para ${data.dataAgendamento.toLocaleDateString()}`
    );

    return viagem;
  }

  /**
   * Iniciar viagem
   */
  async iniciarViagem(viagemId: string, userId: string) {
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id: viagemId },
      include: { solicitacao: true },
    });

    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }

    // Atualizar status da solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: viagem.solicitacaoTFDId },
      data: { status: 'EM_VIAGEM' },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      viagem.solicitacao.workflowId,
      'VIAGEM',
      'VIAGEM_INICIADA',
      userId,
      undefined,
      'Viagem iniciada'
    );

    return viagem;
  }

  /**
   * Registrar retorno da viagem
   */
  async registrarRetorno(viagemId: string, userId: string, observacoes?: string) {
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id: viagemId },
      include: { solicitacao: true },
    });

    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }

    // Atualizar viagem
    await prisma.viagemTFD.update({
      where: { id: viagemId },
      data: {
        status: 'CONCLUIDA',
        observacoes: observacoes
          ? `${viagem.observacoes || ''}\n\n[Retorno] ${observacoes}`
          : viagem.observacoes,
      } as any,
    });

    // Atualizar status da solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: viagem.solicitacaoTFDId },
      data: { status: 'REALIZADO' },
    });

    // Transição do workflow
    await workflowInstanceService.transition(
      viagem.solicitacao.workflowId,
      'FINALIZADO',
      'RETORNO_REGISTRADO',
      userId,
      undefined,
      observacoes || 'Retorno registrado'
    );

    // Completar workflow
    await workflowInstanceService.complete(
      viagem.solicitacao.workflowId,
      userId,
      undefined,
      'TFD realizado com sucesso'
    );

    return await this.findById(viagem.solicitacaoTFDId);
  }

  /**
   * Registrar despesas
   */
  async registrarDespesas(data: RegistrarDespesasDTO) {
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id: data.viagemId },
    });

    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }

    return await prisma.viagemTFD.update({
      where: { id: data.viagemId },
      data: {
        observacoes: `Despesas: R$ ${data.valorDespesas}`,
      } as any,
    });
  }

  /**
   * Cancelar solicitação
   */
  async cancelarSolicitacao(
    solicitacaoId: string,
    userId: string,
    motivo: string
  ) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (['REALIZADO', 'CANCELADO'].includes(solicitacao.status)) {
      throw new Error(
        `Não é possível cancelar. Status atual: ${solicitacao.status}`
      );
    }

    // Atualizar solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: solicitacaoId },
      data: {
        status: 'CANCELADO',
        observacoes: `${solicitacao.observacoes || ''}\n\n[Cancelamento] ${motivo}`,
      },
    });

    // Cancelar workflow
    await workflowInstanceService.cancel(
      solicitacao.workflowId,
      userId,
      undefined,
      motivo
    );

    return await this.findById(solicitacaoId);
  }

  /**
   * Buscar solicitação por ID
   */
  async findById(id: string) {
    return await prisma.solicitacaoTFD.findUnique({
      where: { id },
      include: {
        viagens: true,
      },
    });
  }

  /**
   * Buscar solicitações por cidadão
   */
  async findByCitizen(citizenId: string) {
    return await prisma.solicitacaoTFD.findMany({
      where: { citizenId },
      include: {
        viagens: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar solicitações por status
   */
  async findByStatus(status: TFDStatus) {
    return await prisma.solicitacaoTFD.findMany({
      where: { status },
      orderBy: [{ prioridade: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Listar viagens agendadas
   */
  async listarViagensAgendadas(dataInicio?: Date, dataFim?: Date) {
    return await prisma.viagemTFD.findMany({
      where: {
        status: 'AGENDADA' as any,
        ...(dataInicio &&
          dataFim && {
            dataIda: {
              gte: dataInicio,
              lte: dataFim,
            },
          }),
      },
      include: {
        solicitacao: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ==================== GESTÃO DE VEÍCULOS ====================

  /**
   * Criar veículo
   */
  async createVeiculo(data: CreateVeiculoDTO) {
    return await prisma.veiculoTFD.create({
      data: {
        placa: data.placa,
        modelo: data.modelo,
        capacidade: data.capacidade,
        ano: data.ano || new Date().getFullYear(),
        status: 'DISPONIVEL',
      } as any,
    });
  }

  /**
   * Listar veículos disponíveis
   */
  async listarVeiculosDisponiveis() {
    return await prisma.veiculoTFD.findMany({
      where: {
        isActive: true,
        status: 'DISPONIVEL',
      },
      orderBy: { modelo: 'asc' },
    });
  }

  /**
   * Atualizar status do veículo
   */
  async updateVeiculoStatus(veiculoId: string, status: string) {
    return await prisma.veiculoTFD.update({
      where: { id: veiculoId },
      data: { status: status as any },
    });
  }

  // ==================== GESTÃO DE MOTORISTAS ====================

  /**
   * Criar motorista
   */
  async createMotorista(data: CreateMotoristaDTO) {
    return await prisma.motoristaTFD.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        cpf: data.userId, // CPF não existe no DTO, usar userId
        cnh: data.cnh,
        categoriaCNH: data.categoriaCnh,
        validadeCNH: data.validadeCnh,
        telefone: data.telefone,
        status: 'DISPONIVEL',
        isActive: true,
      } as any,
    });
  }

  /**
   * Listar motoristas disponíveis
   */
  async listarMotoristasDisponiveis() {
    return await prisma.motoristaTFD.findMany({
      where: {
        isActive: true,
        validadeCNH: {
          gte: new Date(),
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Relatório de TFD
   */
  async getRelatorio(dataInicio: Date, dataFim: Date) {
    const solicitacoes = await prisma.solicitacaoTFD.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        viagens: true,
      },
    });

    const total = solicitacoes.length;
    const realizados = solicitacoes.filter((s) => s.status === 'REALIZADO').length;
    const cancelados = solicitacoes.filter((s) => s.status === 'CANCELADO').length;
    const emAndamento = solicitacoes.filter(
      (s) => !['REALIZADO', 'CANCELADO'].includes(s.status)
    ).length;

    // Despesas totais (simplificado, campo não existe)
    const despesaTotal = 0;

    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      total,
      realizados,
      cancelados,
      emAndamento,
      despesaTotal,
      despesaMedia: realizados > 0 ? despesaTotal / realizados : 0,
    };
  }

  /**
   * Buscar todas as solicitações com filtros
   */
  async findAll(where: any = {}) {
    return await prisma.solicitacaoTFD.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obter estatísticas para o dashboard
   */
  async getDashboardStats() {
    // Buscar contagens de solicitações por status em paralelo
    const [
      totalSolicitacoes,
      aguardandoAnalise,
      aguardandoRegulacao,
      aguardandoGestao,
      agendados,
      emViagem,
      realizados,
      cancelados,
      veiculosDisponiveis,
      motoristasDisponiveis
    ] = await Promise.all([
      prisma.solicitacaoTFD.count(),
      prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_ANALISE_DOCUMENTAL' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_REGULACAO_MEDICA' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_APROVACAO_GESTAO' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'AGENDADO' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'EM_VIAGEM' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'REALIZADO' } }),
      prisma.solicitacaoTFD.count({ where: { status: 'CANCELADO' } }),
      prisma.veiculoTFD.count({ where: { status: 'DISPONIVEL' } }),
      prisma.motoristaTFD.count({ where: { status: 'DISPONIVEL' } })
    ]);

    // Buscar viagens de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date();
    fimHoje.setHours(23, 59, 59, 999);

    const viagensHoje = await prisma.viagemTFD.count({
      where: {
        dataViagem: {
          gte: hoje,
          lte: fimHoje
        }
      }
    });

    // Calcular despesas do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    const despesasMesAggregate = await prisma.viagemTFD.aggregate({
      where: {
        dataViagem: {
          gte: inicioMes,
          lte: fimMes
        }
      },
      _sum: {
        totalGasto: true
      }
    });

    const despesasMes = despesasMesAggregate._sum?.totalGasto || 0;

    return {
      totalSolicitacoes,
      aguardandoAnalise,
      aguardandoRegulacao,
      aguardandoGestao,
      agendados,
      emViagem,
      realizados,
      cancelados,
      viagensHoje,
      despesasMes,
      veiculosDisponiveis,
      motoristasDisponiveis
    };
  }
}

export default new TFDService();
