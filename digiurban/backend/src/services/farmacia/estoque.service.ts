// ============================================================================
// SERVICE - ESTOQUE DE MEDICAMENTOS
// ============================================================================

import { prisma } from '../../lib/prisma';
import {
  CreateLoteMedicamentoDTO,
  UpdateLoteMedicamentoDTO,
  CreateTransferenciaEstoqueDTO,
  UpdateTransferenciaEstoqueDTO,
  CreateAlertaEstoqueDTO,
  UpdateAlertaEstoqueDTO,
  EstoquePorUnidadeResponse,
  StatusTransferencia,
} from '../../types/saude-farmacia.types';


export class EstoqueService {
  // ============================================================================
  // LOTES DE MEDICAMENTOS
  // ============================================================================

  /**
   * Criar lote de medicamento
   */
  async criarLote(data: CreateLoteMedicamentoDTO) {
    return await prisma.loteMedicamento.create({
      data: {
        medicamentoId: data.medicamentoId,
        unidadeId: data.unidadeId,
        lote: data.lote,
        quantidade: data.quantidade,
        dataFabricacao: data.dataFabricacao,
        dataValidade: data.dataValidade,
        fornecedor: data.fornecedor,
        notaFiscal: data.notaFiscal,
        usuarioRegistro: data.usuarioRegistro,
      },
      include: {
        medicamento: {
          select: {
            nome: true,
            principioAtivo: true,
            concentracao: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  /**
   * Obter lote por ID
   */
  async obterLote(id: string) {
    return await prisma.loteMedicamento.findUnique({
      where: { id },
      include: {
        medicamento: {
          select: {
            nome: true,
            principioAtivo: true,
            concentracao: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  /**
   * Listar lotes
   */
  async listarLotes(filtros?: {
    medicamentoId?: string;
    unidadeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filtros?.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    if (filtros?.unidadeId) {
      where.unidadeId = filtros.unidadeId;
    }

    return await prisma.loteMedicamento.findMany({
      where,
      include: {
        medicamento: {
          select: {
            nome: true,
            principioAtivo: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { dataEntrada: 'desc' },
      take: filtros?.limit || 50,
      skip: filtros?.offset || 0,
    });
  }

  /**
   * Atualizar quantidade de lote
   */
  async atualizarQuantidade(loteId: string, quantidade: number) {
    const lote = await prisma.loteMedicamento.findUnique({
      where: { id: loteId },
    });

    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    return await prisma.loteMedicamento.update({
      where: { id: loteId },
      data: {
        quantidade,
      },
    });
  }

  // ============================================================================
  // ALERTAS DE ESTOQUE
  // ============================================================================

  /**
   * Criar alerta de estoque
   */
  async criarAlerta(data: CreateAlertaEstoqueDTO) {
    return await prisma.alertaEstoque.create({
      data: {
        medicamentoId: data.medicamentoId,
        unidadeId: data.unidadeId,
        tipoAlerta: data.tipoAlerta,
        mensagem: data.mensagem,
        quantidadeAtual: data.quantidadeAtual,
        quantidadeMinima: data.quantidadeMinima,
        dataVencimento: data.dataVencimento,
        visualizado: false,
      },
    });
  }

  /**
   * Listar alertas
   */
  async listarAlertas(filtros?: {
    medicamentoId?: string;
    unidadeId?: string;
    visualizado?: boolean;
  }) {
    const where: any = {};

    if (filtros?.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    if (filtros?.unidadeId) {
      where.unidadeId = filtros.unidadeId;
    }

    if (filtros?.visualizado !== undefined) {
      where.visualizado = filtros.visualizado;
    }

    return await prisma.alertaEstoque.findMany({
      where,
      include: {
        medicamento: {
          select: {
            nome: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { dataGeracao: 'desc' },
    });
  }

  /**
   * Marcar alerta como visualizado
   */
  async marcarAlertaVisualizado(id: string) {
    return await prisma.alertaEstoque.update({
      where: { id },
      data: { visualizado: true },
    });
  }

  // ============================================================================
  // TRANSFERÊNCIAS
  // ============================================================================

  /**
   * Criar transferência de estoque
   */
  async criarTransferencia(data: CreateTransferenciaEstoqueDTO) {
    return await prisma.transferenciaEstoque.create({
      data: {
        medicamentoId: data.medicamentoId,
        unidadeOrigemId: data.unidadeOrigemId,
        unidadeDestinoId: data.unidadeDestinoId,
        quantidade: data.quantidade,
        motivo: data.motivo,
        status: 'PENDENTE',
        usuarioSolicitante: data.usuarioSolicitante,
      },
    });
  }

  /**
   * Aprovar transferência
   */
  async aprovarTransferencia(id: string, usuarioConfirmante: string) {
    return await prisma.transferenciaEstoque.update({
      where: { id },
      data: {
        status: 'APROVADA',
        usuarioConfirmante,
        dataConfirmacao: new Date(),
      },
    });
  }

  /**
   * Rejeitar transferência
   */
  async rejeitarTransferencia(id: string, usuarioConfirmante: string) {
    return await prisma.transferenciaEstoque.update({
      where: { id },
      data: {
        status: 'REJEITADA',
        usuarioConfirmante,
        dataConfirmacao: new Date(),
      },
    });
  }

  /**
   * Listar transferências
   */
  async listarTransferencias(filtros?: {
    unidadeOrigemId?: string;
    unidadeDestinoId?: string;
    status?: StatusTransferencia;
  }) {
    const where: any = {};

    if (filtros?.unidadeOrigemId) {
      where.unidadeOrigemId = filtros.unidadeOrigemId;
    }

    if (filtros?.unidadeDestinoId) {
      where.unidadeDestinoId = filtros.unidadeDestinoId;
    }

    if (filtros?.status) {
      where.status = filtros.status;
    }

    return await prisma.transferenciaEstoque.findMany({
      where,
      include: {
        medicamento: {
          select: {
            nome: true,
          },
        },
        unidadeOrigem: {
          select: {
            nome: true,
          },
        },
        unidadeDestino: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { dataSolicitacao: 'desc' },
    });
  }

  // ============================================================================
  // CONSULTAS DE ESTOQUE
  // ============================================================================

  /**
   * Obter estoque por unidade
   */
  async obterEstoquePorUnidade(unidadeId: string): Promise<EstoquePorUnidadeResponse> {
    const lotes = await prisma.loteMedicamento.findMany({
      where: {
        unidadeId,
        quantidade: { gt: 0 },
      },
      include: {
        medicamento: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    // Agrupar por medicamento
    const medicamentosMap = new Map<string, any>();

    for (const lote of lotes) {
      const medId = lote.medicamentoId;
      if (!medicamentosMap.has(medId)) {
        medicamentosMap.set(medId, {
          medicamentoId: medId,
          medicamentoNome: lote.medicamento.nome,
          quantidadeTotal: 0,
          lotes: [],
        });
      }

      const med = medicamentosMap.get(medId);
      med.quantidadeTotal += lote.quantidade;
      med.lotes.push({
        loteId: lote.id,
        numeroLote: lote.lote,
        quantidade: lote.quantidade,
        dataValidade: lote.dataValidade,
      });
    }

    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id: unidadeId },
      select: { nome: true },
    });

    return {
      unidadeId,
      unidadeNome: unidade?.nome || 'Unidade não encontrada',
      medicamentos: Array.from(medicamentosMap.values()),
    };
  }

  /**
   * Verificar lotes vencidos ou próximos do vencimento
   */
  async verificarLotesVencimento(diasAntes: number = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntes);

    return await prisma.loteMedicamento.findMany({
      where: {
        dataValidade: {
          lte: dataLimite,
        },
        quantidade: {
          gt: 0,
        },
      },
      include: {
        medicamento: {
          select: {
            nome: true,
          },
        },
        unidade: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  // Aliases e métodos adicionais para compatibilidade com rotas
  async buscarLote(id: string) {
    return this.obterLote(id);
  }

  async atualizarLote(id: string, data: UpdateLoteMedicamentoDTO) {
    return await prisma.loteMedicamento.update({
      where: { id },
      data,
    });
  }

  async listarLotesMedicamento(medicamentoId: string, filtros?: any) {
    return this.listarLotes({ medicamentoId, ...filtros });
  }

  async listarLotesUnidade(unidadeId: string, filtros?: any) {
    return this.listarLotes({ unidadeId, ...filtros });
  }

  async darBaixaLote(loteId: string, data?: any) {
    const quantidade = data?.quantidade || 0;
    const lote = await prisma.loteMedicamento.findUnique({ where: { id: loteId } });
    if (!lote) throw new Error('Lote não encontrado');
    return this.atualizarQuantidade(loteId, Math.max(0, lote.quantidade - quantidade));
  }

  async adicionarQuantidade(loteId: string, quantidade: number, data?: any) {
    const lote = await prisma.loteMedicamento.findUnique({ where: { id: loteId } });
    if (!lote) throw new Error('Lote não encontrado');
    return this.atualizarQuantidade(loteId, lote.quantidade + quantidade);
  }

  async listarLotesProximosVencimento(diasAntes: number = 30, unidadeId?: string) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntes);

    return await prisma.loteMedicamento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        dataValidade: { gte: new Date(), lte: dataLimite },
        quantidade: { gt: 0 },
      },
      include: {
        medicamento: { select: { nome: true, principioAtivo: true } },
        unidade: { select: { nome: true } },
      },
      orderBy: { dataValidade: 'asc' },
    });
  }

  async listarLotesVencidos(unidadeId?: string) {
    return await prisma.loteMedicamento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        dataValidade: { lt: new Date() },
        quantidade: { gt: 0 },
      },
      include: {
        medicamento: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    });
  }

  async verificarDisponibilidade(medicamentoId: string, quantidade?: number, unidadeId?: string) {
    const where: any = { medicamentoId };
    if (unidadeId) where.unidadeId = unidadeId;

    const lotes = await prisma.loteMedicamento.findMany({ where });
    const total = lotes.reduce((acc, l) => acc + l.quantidade, 0);

    return {
      disponivel: quantidade ? total >= quantidade : total > 0,
      quantidadeDisponivel: total,
      lotes: lotes.map((l) => ({ id: l.id, quantidade: l.quantidade })),
    };
  }

  async obterEstatisticas(unidadeId?: string) {
    const whereBase = unidadeId ? { unidadeId } : {};
    const agora = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    const [totalLotes, agregado, medicamentosDistintos, lotesVencidos, lotesProximosVencimento] =
      await Promise.all([
        prisma.loteMedicamento.count({
          where: { ...whereBase, quantidade: { gt: 0 } },
        }),
        prisma.loteMedicamento.aggregate({
          where: { ...whereBase, quantidade: { gt: 0 } },
          _sum: { quantidade: true },
        }),
        prisma.loteMedicamento.findMany({
          where: { ...whereBase, quantidade: { gt: 0 } },
          select: { medicamentoId: true },
          distinct: ['medicamentoId'],
        }),
        prisma.loteMedicamento.count({
          where: { ...whereBase, quantidade: { gt: 0 }, dataValidade: { lt: agora } },
        }),
        prisma.loteMedicamento.count({
          where: {
            ...whereBase,
            quantidade: { gt: 0 },
            dataValidade: { gte: agora, lte: em30Dias },
          },
        }),
      ]);

    return {
      totalLotes,
      totalMedicamentos: medicamentosDistintos.length,
      quantidadeTotal: agregado._sum.quantidade || 0,
      lotesVencidos,
      lotesProximosVencimento,
    };
  }

  async recusarTransferencia(id: string, data: any, usuarioConfirmante?: string) {
    return this.rejeitarTransferencia(id, usuarioConfirmante || data.usuarioConfirmante);
  }

  async cancelarTransferencia(id: string, data?: any) {
    return await prisma.transferenciaEstoque.update({
      where: { id },
      data: { status: 'CANCELADO' as any },
    });
  }

  async visualizarAlerta(id: string, data?: any) {
    return this.marcarAlertaVisualizado(id);
  }

  async resolverAlerta(id: string, observacoes?: string, usuarioId?: string) {
    return await prisma.alertaEstoque.delete({ where: { id } });
  }

  async listarAlertasAtivos(unidadeId?: string) {
    return this.listarAlertas({ unidadeId, visualizado: false });
  }

  async verificarAlertasAutomaticos(unidadeId: string) {
    return [];
  }
}

export default new EstoqueService();
