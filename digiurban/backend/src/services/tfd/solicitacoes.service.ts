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
  /**
   * Registro presencial de TFD (Balcão).
   *
   * Decisão do produto: todo atendimento gera protocolo. Antes esta função
   * gravava protocolId = "TFD-<hora>" (inexistente): a FK recusava e o
   * atendimento presencial não funcionava; o cidadão também não recebia
   * número nem acompanhamento. Agora abre o protocolo pelo serviço de TFD do
   * município (canal BALCAO, em nome do cidadão) e a conversão padrão
   * protocolo → app cria o caso aqui.
   */
  async criarSolicitacao(
    data: CreateSolicitacaoTFDDTO,
    operadorId?: string
  ): Promise<SolicitacaoTFDCompletoResponse> {
    const citizen = await prisma.citizen.findUnique({ where: { id: data.citizenId } });
    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    const servicoTFD =
      (await prisma.serviceSimplified.findFirst({ where: { appAction: 'ENCAMINHAMENTOS_TFD', isActive: true } })) ||
      (await prisma.serviceSimplified.findFirst({ where: { moduleType: 'ENCAMINHAMENTOS_TFD', isActive: true } })) ||
      (await prisma.serviceSimplified.findFirst({ where: { moduleType: { contains: 'TFD' }, isActive: true } }));
    if (!servicoTFD) {
      throw new Error(
        'O serviço de TFD não está ativo no catálogo deste município. Ative-o em Serviços para registrar atendimentos.'
      );
    }

    // Import dinâmico: evita ciclo protocol-module → conversor TFD → este serviço
    const { protocolModuleService } = await import('../protocol-module.service');
    const { protocol } = await protocolModuleService.createProtocolWithModule({
      citizenId: data.citizenId,
      serviceId: servicoTFD.id,
      createdById: operadorId,
      channel: 'BALCAO',
      description: `Atendimento presencial de TFD — ${data.especialidade}`,
      formData: {
        especialidade: data.especialidade,
        procedimento: data.procedimento,
        justificativa: data.justificativa,
        cid10: data.cid10,
        prioridade: data.prioridade,
        cidadeDestino: data.cidadeDestino,
        estadoDestino: data.estadoDestino,
        hospitalDestino: data.hospitalDestino,
        acompanhanteId: data.acompanhanteId,
        observacoes: data.observacoes,
      },
    });

    // A conversão roda como gancho não-fatal na criação; garante aqui o caso
    let solicitacao = await prisma.solicitacaoTFD.findUnique({ where: { protocolId: protocol.id } });
    if (!solicitacao) {
      const { default: protocolToTFDService } = await import('./protocol-to-tfd.service');
      solicitacao = await protocolToTFDService.convertProtocolToTFD(protocol.id);
    }

    // Documentos já anexados no balcão
    if (data.encaminhamentoMedicoUrl || (Array.isArray(data.examesUrls) && data.examesUrls.length)) {
      await prisma.solicitacaoTFD.update({
        where: { id: solicitacao.id },
        data: {
          ...(data.encaminhamentoMedicoUrl && { encaminhamentoMedicoUrl: data.encaminhamentoMedicoUrl }),
          ...(Array.isArray(data.examesUrls) && data.examesUrls.length && { examesUrls: data.examesUrls as any }),
        },
      });
    }

    return this.buscarSolicitacao(solicitacao.id);
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
        // Número do protocolo: é o que o cidadão usa para acompanhar
        protocol: { select: { id: true, number: true, channel: true } },
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
    status?: StatusSolicitacaoTFD | StatusSolicitacaoTFD[];
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const statuses = filtros.status ? ([] as StatusSolicitacaoTFD[]).concat(filtros.status) : [];
    return await prisma.solicitacaoTFD.findMany({
      where: {
        ...(filtros.citizenId && { citizenId: filtros.citizenId }),
        ...(statuses.length > 0 && { status: { in: statuses as any } }),
        // Período: antes o filtro de fim sobrescrevia o de início
        ...((filtros.dataInicio || filtros.dataFim) && {
          createdAt: {
            ...(filtros.dataInicio && { gte: filtros.dataInicio }),
            ...(filtros.dataFim && { lte: filtros.dataFim }),
          },
        }),
      },
      include: {
        // Número do protocolo e nome do cidadão para as filas exibirem quem é quem
        protocol: {
          select: {
            id: true,
            number: true,
            citizen: { select: { id: true, name: true, cpf: true } },
          },
        },
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
  async atualizarStatus(
    solicitacaoId: string,
    status: StatusSolicitacaoTFD,
    observacoes?: string,
    usuarioId?: string
  ) {
    const dataUpdate: any = { status };

    if (status === 'APROVADO_PARA_AGENDAMENTO') {
      dataUpdate.dataAprovacao = new Date();
    } else if (status === 'CANCELADO' || status === 'INDEFERIDO' || status === ('DOCUMENTACAO_PENDENTE' as any)) {
      if (observacoes) {
        dataUpdate.observacoes = observacoes;
      }
    }

    // Saída da análise documental: registrar responsável e data
    if (status === ('AGUARDANDO_REGULACAO_MEDICA' as any) || status === ('DOCUMENTACAO_PENDENTE' as any)) {
      dataUpdate.dataAnalise = new Date();
      if (usuarioId) dataUpdate.analisadoPor = usuarioId;
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
