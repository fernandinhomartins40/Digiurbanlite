// ============================================================================
// SERVICE - SOLICITAÇÕES TFD
// ============================================================================

import { prisma } from '../../lib/prisma';
import {
  CreateSolicitacaoTFDDTO,
  UpdateSolicitacaoTFDDTO,
  CreateDocumentoTFDDTO,
  SolicitacaoTFDCompletoResponse,
  StatusSolicitacaoTFD,
  TipoDocumentoTFD,
} from '../../types/saude-tfd.types';


export class SolicitacoesTFDService {
  /**
   * Criar solicitação de TFD
   */
  async criarSolicitacao(data: CreateSolicitacaoTFDDTO): Promise<SolicitacaoTFDCompletoResponse> {
    // Verificar se o cidadão existe
    const citizen = await prisma.citizen.findUnique({
      where: { id: data.citizenId },
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // Gerar IDs únicos
    const workflowId = `WF-${Date.now()}`;
    const protocolId = `TFD-${Date.now()}`;

    // Criar solicitação
    const solicitacao = await prisma.solicitacaoTFD.create({
      data: {
        workflowId,
        protocolId,
        citizenId: data.citizenId,
        acompanhanteId: data.acompanhanteId,
        especialidade: data.especialidade,
        procedimento: data.procedimento,
        cid10: data.cid10,
        justificativa: data.justificativa,
        encaminhamentoMedicoUrl: data.encaminhamentoMedicoUrl,
        examesUrls: data.examesUrls,
        prioridade: data.prioridade,
        cidadeDestino: data.cidadeDestino,
        estadoDestino: data.estadoDestino,
        hospitalDestino: data.hospitalDestino,
        observacoes: data.observacoes,
        status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
      },
      include: {
        documentos: true,
        pareceresRegulacao: true,
        aprovacoesGestao: true,
      },
    });

    return solicitacao as any;
  }

  /**
   * Atualizar solicitação
   */
  async atualizarSolicitacao(id: string, data: UpdateSolicitacaoTFDDTO) {
    return await prisma.solicitacaoTFD.update({
      where: { id },
      data,
    });
  }

  /**
   * Buscar solicitação completa
   */
  async buscarSolicitacao(id: string): Promise<SolicitacaoTFDCompletoResponse> {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id },
      include: {
        documentos: {
          orderBy: {
            dataUpload: 'desc',
          },
        },
        pareceresRegulacao: {
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
        },
        aprovacoesGestao: {
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
        },
        agendamentosExternos: {
          orderBy: {
            dataHoraConsulta: 'desc',
          },
        },
        viagens: {
          orderBy: {
            dataViagem: 'desc',
          },
        },
      },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    return solicitacao as any;
  }

  /**
   * Listar solicitações
   */
  async listarSolicitacoes(filtros: {
    citizenId?: string;
    status?: StatusSolicitacaoTFD;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return await prisma.solicitacaoTFD.findMany({
      where: {
        ...(filtros.citizenId && { citizenId: filtros.citizenId }),
        ...(filtros.status && { status: filtros.status }),
        ...(filtros.dataInicio && {
          createdAt: { gte: filtros.dataInicio },
        }),
        ...(filtros.dataFim && {
          createdAt: { lte: filtros.dataFim },
        }),
      },
      include: {
        documentos: {
          select: {
            id: true,
            tipoDocumento: true,
          },
        },
        pareceresRegulacao: {
          select: {
            status: true,
          },
          take: 1,
          orderBy: {
            dataParecer: 'desc',
          },
        },
      },
      orderBy: [
        { prioridade: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Atualizar status da solicitação
   */
  async atualizarStatus(solicitacaoId: string, status: StatusSolicitacaoTFD, observacoes?: string) {
    const dataUpdate: any = { status };

    if (status === 'APROVADO_PARA_AGENDAMENTO') {
      dataUpdate.dataAprovacao = new Date();
    } else if (status === 'CANCELADO' || status === 'INDEFERIDO') {
      if (observacoes) {
        dataUpdate.observacoes = observacoes;
      }
    }

    return await prisma.solicitacaoTFD.update({
      where: { id: solicitacaoId },
      data: dataUpdate,
    });
  }

  // ============================================================================
  // DOCUMENTOS
  // ============================================================================

  /**
   * Adicionar documento à solicitação
   */
  async adicionarDocumento(data: CreateDocumentoTFDDTO) {
    const documento = await prisma.documentoTFD.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        tipoDocumento: data.tipo,
        nomeArquivo: data.nomeArquivo,
        caminhoArquivo: data.urlArquivo,
        tamanho: 0, // TODO: Calcular tamanho real
        mimeType: 'application/pdf', // TODO: Detectar mime type
        usuarioUpload: 'SYSTEM', // TODO: Pegar do contexto
      },
    });

    // Verificar se todos os documentos obrigatórios foram anexados
    const documentos = await prisma.documentoTFD.findMany({
      where: { solicitacaoId: data.solicitacaoId },
    });

    const tiposObrigatorios = [
      TipoDocumentoTFD.PEDIDO_MEDICO,
      TipoDocumentoTFD.RG,
      TipoDocumentoTFD.CARTAO_SUS,
    ];

    const todosObrigatoriosPresentes = tiposObrigatorios.every((tipo) =>
      documentos.some((d) => d.tipoDocumento === tipo)
    );

    if (todosObrigatoriosPresentes) {
      // Atualizar status para AGUARDANDO_REGULACAO_MEDICA
      await this.atualizarStatus(
        data.solicitacaoId,
        'AGUARDANDO_REGULACAO_MEDICA' as any,
        'Documentação completa'
      );
    }

    return documento;
  }

  /**
   * Remover documento
   */
  async removerDocumento(id: string) {
    return await prisma.documentoTFD.delete({
      where: { id },
    });
  }

  /**
   * Listar documentos de uma solicitação
   */
  async listarDocumentos(solicitacaoId: string) {
    return await prisma.documentoTFD.findMany({
      where: { solicitacaoId },
      orderBy: {
        dataUpload: 'desc',
      },
    });
  }

  /**
   * Verificar documentação completa
   */
  async verificarDocumentacaoCompleta(solicitacaoId: string): Promise<{
    completa: boolean;
    documentosPresentes: string[];
    documentosFaltantes: string[];
  }> {
    const documentos = await prisma.documentoTFD.findMany({
      where: { solicitacaoId },
    });

    const tiposObrigatorios = [
      TipoDocumentoTFD.PEDIDO_MEDICO,
      TipoDocumentoTFD.RG,
      TipoDocumentoTFD.CARTAO_SUS,
    ];

    const documentosPresentes = documentos.map((d) => d.tipoDocumento);
    const documentosFaltantes = tiposObrigatorios.filter(
      (tipo) => !documentosPresentes.includes(tipo)
    );

    return {
      completa: documentosFaltantes.length === 0,
      documentosPresentes,
      documentosFaltantes,
    };
  }

  // ============================================================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================================================

  /**
   * Obter estatísticas de solicitações
   */
  async obterEstatisticas(filtros: {
    dataInicio: Date;
    dataFim: Date;
  }) {
    const solicitacoes = await prisma.solicitacaoTFD.findMany({
      where: {
        createdAt: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
      },
      include: {
        pareceresRegulacao: true,
      },
    });

    const total = solicitacoes.length;

    // Por status
    const porStatus: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      porStatus[s.status] = (porStatus[s.status] || 0) + 1;
    });

    // Por especialidade
    const porEspecialidade: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      porEspecialidade[s.especialidade] =
        (porEspecialidade[s.especialidade] || 0) + 1;
    });

    const especialidadesMaisSolicitadas = Object.entries(porEspecialidade)
      .map(([especialidade, count]) => ({ especialidade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Por cidade destino
    const porCidade: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      const cidade = `${s.cidadeDestino}/${s.estadoDestino}`;
      porCidade[cidade] = (porCidade[cidade] || 0) + 1;
    });

    const cidadesMaisFrequentes = Object.entries(porCidade)
      .map(([cidade, count]) => ({ cidade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Taxa de aprovação
    const aprovadas = solicitacoes.filter((s) => s.status === 'APROVADO_PARA_AGENDAMENTO' || s.status === 'AGENDADO').length;
    const indeferidas = solicitacoes.filter((s) => s.status === 'INDEFERIDO').length;
    const taxaAprovacao = total > 0 ? (aprovadas / total) * 100 : 0;

    // Tempo médio de análise (em dias)
    const solicitacoesAnalisadas = solicitacoes.filter(
      (s) =>
        s.pareceresRegulacao.length > 0 &&
        (s.status === 'APROVADO_PARA_AGENDAMENTO' || s.status === 'INDEFERIDO')
    );

    const tempoMedioAnalise =
      solicitacoesAnalisadas.length > 0
        ? solicitacoesAnalisadas.reduce((acc, s) => {
            const parecer = s.pareceresRegulacao[0];
            const dias = Math.ceil(
              (parecer.dataParecer.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            return acc + dias;
          }, 0) / solicitacoesAnalisadas.length
        : 0;

    // Por prioridade
    const porPrioridade: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      porPrioridade[s.prioridade] = (porPrioridade[s.prioridade] || 0) + 1;
    });

    return {
      total,
      porStatus: Object.entries(porStatus).map(([status, count]) => ({ status, count })),
      porPrioridade: Object.entries(porPrioridade).map(([prioridade, count]) => ({ prioridade, count })),
      aprovadas,
      indeferidas,
      taxaAprovacao,
      especialidadesMaisSolicitadas,
      cidadesMaisFrequentes,
      tempoMedioAnalise: Math.round(tempoMedioAnalise * 10) / 10,
    };
  }

  /**
   * Cancelar solicitação
   */
  async cancelarSolicitacao(id: string, motivo: string, canceladoPorId?: string) {
    return await prisma.solicitacaoTFD.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        observacoes: `CANCELADA: ${motivo}`,
      },
    });
  }

  /**
   * Reabrir solicitação
   */
  async reabrirSolicitacao(id: string, motivo: string) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id },
      include: {
        documentos: true,
      },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    // Verificar documentação para definir status
    const verificacao = await this.verificarDocumentacaoCompleta(id);
    const novoStatus = verificacao.completa
      ? 'AGUARDANDO_REGULACAO_MEDICA'
      : 'AGUARDANDO_ANALISE_DOCUMENTAL';

    return await prisma.solicitacaoTFD.update({
      where: { id },
      data: {
        status: novoStatus as any,
        observacoes: `REABERTA: ${motivo}`,
      },
    });
  }

  /**
   * Listar solicitações urgentes pendentes
   */
  async listarSolicitacoesUrgentes() {
    return await prisma.solicitacaoTFD.findMany({
      where: {
        prioridade: 'EMERGENCIA',
        status: {
          in: [
            'AGUARDANDO_ANALISE_DOCUMENTAL',
            'AGUARDANDO_REGULACAO_MEDICA',
            'AGUARDANDO_APROVACAO_GESTAO',
          ],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Buscar histórico de solicitações do cidadão
   */
  async buscarHistoricoCidadao(citizenId: string) {
    return await prisma.solicitacaoTFD.findMany({
      where: { citizenId },
      include: {
        pareceresRegulacao: {
          select: {
            status: true,
            parecer: true,
          },
          take: 1,
          orderBy: {
            dataParecer: 'desc',
          },
        },
        viagens: {
          select: {
            id: true,
            dataViagem: true,
            dataRetornoReal: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new SolicitacoesTFDService();
