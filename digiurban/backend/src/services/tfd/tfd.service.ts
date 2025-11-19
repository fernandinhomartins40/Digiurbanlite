import { PrismaClient, TFDStatus, MeioPagamento } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

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
        especialidade: data.especialidade,
        procedimento: data.procedimento,
        justificativaMedica: data.justificativaMedica,
        medicoSolicitante: data.medicoSolicitante,
        prioridade: data.prioridade || 0,
        documentosAnexados: data.documentosAnexados,
        observacoes: data.observacoes,
        status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
      },
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
    } else {
      novoStatus = 'DOCUMENTACAO_PENDENTE';
      proximoStage = 'ANALISE_DOCUMENTAL';
      action = 'DOCUMENTACAO_PENDENTE';
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

    return await this.findById(data.solicitacaoId);
  }

  /**
   * Aprovação da gestão
   */
  async aprovarGestao(data: AprovarGestaoDTO) {
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

    // Transição do workflow
    await workflowInstanceService.transition(
      solicitacao.workflowId,
      proximoStage,
      action,
      data.gestorId,
      undefined,
      data.justificativa || (data.aprovado ? 'Aprovado pela gestão' : 'Negado pela gestão')
    );

    if (!data.aprovado) {
      await workflowInstanceService.cancel(
        solicitacao.workflowId,
        data.gestorId,
        undefined,
        'Solicitação negada pela gestão'
      );
    }

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
        solicitacaoId: data.solicitacaoId,
        destino: data.destino,
        unidadeDestino: data.unidadeDestino,
        dataAgendamento: data.dataAgendamento,
        dataRetornoPrevisto: data.dataRetornoPrevisto,
        veiculoId: data.veiculoId,
        motoristaId: data.motoristaId,
        acompanhante: data.acompanhante,
        observacoes: data.observacoes,
      },
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
      where: { id: viagem.solicitacaoId },
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
        dataRetornoReal: new Date(),
        observacoes: observacoes
          ? `${viagem.observacoes || ''}\n\n[Retorno] ${observacoes}`
          : viagem.observacoes,
      },
    });

    // Atualizar status da solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: viagem.solicitacaoId },
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

    return await this.findById(viagem.solicitacaoId);
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
        valorDespesas: data.valorDespesas,
        comprovanteDespesas: data.comprovanteDespesas,
        mecanismoPagamento: data.mecanismoPagamento,
      },
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
        viagens: {
          include: {
            veiculo: true,
            motorista: true,
          },
        },
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
        dataRetornoReal: null,
        ...(dataInicio &&
          dataFim && {
            dataAgendamento: {
              gte: dataInicio,
              lte: dataFim,
            },
          }),
      },
      include: {
        solicitacao: true,
        veiculo: true,
        motorista: true,
      },
      orderBy: { dataAgendamento: 'asc' },
    });
  }

  // ==================== GESTÃO DE VEÍCULOS ====================

  /**
   * Criar veículo
   */
  async createVeiculo(data: CreateVeiculoDTO) {
    return await prisma.veiculoTFD.create({
      data: {
        ...data,
        status: 'DISPONIVEL',
      },
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
        ...data,
        isActive: true,
      },
    });
  }

  /**
   * Listar motoristas disponíveis
   */
  async listarMotoristasDisponiveis() {
    return await prisma.motoristaTFD.findMany({
      where: {
        isActive: true,
        validadeCnh: {
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

    // Despesas totais
    const despesaTotal = solicitacoes.reduce((acc, s) => {
      const despesasViagens = s.viagens.reduce(
        (sum, v) => sum + (v.valorDespesas || 0),
        0
      );
      return acc + despesasViagens;
    }, 0);

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
}

export default new TFDService();
