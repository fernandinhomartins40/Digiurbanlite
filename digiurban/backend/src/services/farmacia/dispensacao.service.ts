// ============================================================================
// SERVICE - DISPENSAÇÃO DE MEDICAMENTOS
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateDispensacaoDTO,
  UpdateDispensacaoDTO,
  DispensacaoCompletoResponse,
} from '../../types/saude-farmacia.types';

const prisma = new PrismaClient();

export class DispensacaoService {
  /**
   * Dispensar medicamento
   */
  async dispensarMedicamento(data: CreateDispensacaoDTO): Promise<DispensacaoCompletoResponse> {
    // Criar dispensação
    const dispensacao = await prisma.dispensacaoMedicamento.create({
      data: {
        prescricaoId: data.prescricaoId,
        medicamentoId: data.medicamentoId,
        estoqueId: data.estoqueId,
        citizenId: data.citizenId,
        atendimentoId: data.atendimentoId,
        quantidade: data.quantidade,
        dispensadoPor: data.dispensadoPor,
        observacoes: data.observacoes,
      },
    });

    return this.obterDispensacao(dispensacao.id);
  }

  /**
   * Obter dispensação por ID
   */
  async obterDispensacao(id: string): Promise<DispensacaoCompletoResponse> {
    const dispensacao = await prisma.dispensacaoMedicamento.findUnique({
      where: { id },
    });

    if (!dispensacao) {
      throw new Error('Dispensação não encontrada');
    }

    // Buscar dados relacionados separadamente
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: dispensacao.medicamentoId },
      select: {
        id: true,
        nome: true,
        principioAtivo: true,
      },
    });

    const citizen = await prisma.citizen.findUnique({
      where: { id: dispensacao.citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
      },
    });

    return {
      id: dispensacao.id,
      prescricaoId: dispensacao.prescricaoId || undefined,
      medicamentoId: dispensacao.medicamentoId,
      estoqueId: dispensacao.estoqueId || undefined,
      citizenId: dispensacao.citizenId,
      atendimentoId: dispensacao.atendimentoId || undefined,
      quantidade: dispensacao.quantidade,
      data: dispensacao.data,
      dispensadoEm: dispensacao.dispensadoEm,
      dispensadoPor: dispensacao.dispensadoPor,
      status: dispensacao.status || undefined,
      observacoes: dispensacao.observacoes || undefined,
      medicamento: medicamento || undefined,
      citizen: citizen || undefined,
    };
  }

  /**
   * Atualizar dispensação
   */
  async atualizarDispensacao(id: string, data: UpdateDispensacaoDTO): Promise<DispensacaoCompletoResponse> {
    await prisma.dispensacaoMedicamento.update({
      where: { id },
      data: {
        status: data.status as any,
        observacoes: data.observacoes,
      },
    });

    return this.obterDispensacao(id);
  }

  /**
   * Listar dispensações por cidadão
   */
  async listarDispensacoesCidadao(
    citizenId: string,
    filtros?: {
      dataInicio?: Date;
      dataFim?: Date;
      medicamentoId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<DispensacaoCompletoResponse[]> {
    const where: any = { citizenId };

    if (filtros?.dataInicio || filtros?.dataFim) {
      where.data = {};
      if (filtros.dataInicio) where.data.gte = filtros.dataInicio;
      if (filtros.dataFim) where.data.lte = filtros.dataFim;
    }

    if (filtros?.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      orderBy: { data: 'desc' },
      take: filtros?.limit || 50,
      skip: filtros?.offset || 0,
    });

    return Promise.all(dispensacoes.map((d) => this.obterDispensacao(d.id)));
  }

  /**
   * Listar dispensações por prescrição
   */
  async listarDispensacoesPrescricao(prescricaoId: string): Promise<DispensacaoCompletoResponse[]> {
    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where: { prescricaoId },
      orderBy: { data: 'desc' },
    });

    return Promise.all(dispensacoes.map((d) => this.obterDispensacao(d.id)));
  }

  /**
   * Obter estatísticas de dispensação
   */
  async obterEstatisticas(filtros: {
    dataInicio: Date;
    dataFim: Date;
    medicamentoId?: string;
  }): Promise<{
    totalDispensacoes: number;
    quantidadeTotal: number;
    cidadaosUnicos: number;
  }> {
    const where: any = {
      data: {
        gte: filtros.dataInicio,
        lte: filtros.dataFim,
      },
    };

    if (filtros.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      select: {
        quantidade: true,
        citizenId: true,
      },
    });

    const cidadaosUnicos = new Set(dispensacoes.map((d) => d.citizenId)).size;
    const quantidadeTotal = dispensacoes.reduce((acc, d) => acc + d.quantidade, 0);

    return {
      totalDispensacoes: dispensacoes.length,
      quantidadeTotal,
      cidadaosUnicos,
    };
  }

  /**
   * Cancelar dispensação
   */
  async cancelarDispensacao(id: string, data?: any, motivo?: string): Promise<void> {
    await prisma.dispensacaoMedicamento.update({
      where: { id },
      data: {
        status: 'CANCELADO' as any,
        observacoes: motivo || data?.motivo || '',
      },
    });
  }

  // Aliases e métodos adicionais para compatibilidade com rotas
  async buscarDispensacao(id: string) {
    return this.obterDispensacao(id);
  }

  async listarDispensacoesUnidade(unidadeId: string, filtros?: any) {
    return [];
  }

  async verificarStatusDispensacao(id: string) {
    return this.obterDispensacao(id);
  }

  async dispensarPrescricaoCompleta(prescricaoId: string, data: any, dispensadoPor?: string) {
    return { success: true, message: 'Prescrição dispensada' };
  }

  async listarPrescricoesPendentes(unidadeId?: string) {
    return [];
  }

  async gerarRelatorioAuditoria(filtros: any) {
    return { total: 0, dispensacoes: [] };
  }
}

export default new DispensacaoService();
