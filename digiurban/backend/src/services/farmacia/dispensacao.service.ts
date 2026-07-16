// ============================================================================
// SERVICE - DISPENSAÇÃO DE MEDICAMENTOS
// ============================================================================

import { prisma } from '../../lib/prisma';
import {
  CreateDispensacaoDTO,
  UpdateDispensacaoDTO,
  DispensacaoCompletoResponse,
} from '../../types/saude-farmacia.types';


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
    const estoques = await prisma.estoqueMedicamento.findMany({
      where: { unidadeId },
      select: { id: true },
    });

    const where: any = { estoqueId: { in: estoques.map((e) => e.id) } };
    if (filtros?.dataInicio || filtros?.dataFim) {
      where.data = {};
      if (filtros.dataInicio) where.data.gte = new Date(filtros.dataInicio);
      if (filtros.dataFim) where.data.lte = new Date(filtros.dataFim);
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      orderBy: { data: 'desc' },
      take: filtros?.limit || 100,
    });

    return Promise.all(dispensacoes.map((d) => this.obterDispensacao(d.id)));
  }

  async verificarStatusDispensacao(id: string) {
    return this.obterDispensacao(id);
  }

  /**
   * Dispensar todos os medicamentos de uma prescrição de uma vez.
   * Cria uma dispensação por item da prescrição e marca a prescrição como dispensada.
   */
  async dispensarPrescricaoCompleta(prescricaoId: string, data: any, dispensadoPor?: string) {
    const prescricao = await prisma.prescricao.findUnique({
      where: { id: prescricaoId },
      include: {
        consulta: {
          select: {
            atendimento: { select: { citizenId: true, id: true } },
          },
        },
      },
    });

    if (!prescricao) {
      throw new Error('Prescrição não encontrada');
    }
    if (prescricao.dispensada) {
      throw new Error('Prescrição já foi dispensada');
    }

    const responsavel = dispensadoPor || data?.dispensadoPor;
    if (!responsavel) {
      throw new Error('dispensadoPor é obrigatório');
    }

    const medicamentos: any[] = Array.isArray(prescricao.medicamentos)
      ? (prescricao.medicamentos as any[])
      : [];

    const criadas = [];
    for (const item of medicamentos) {
      if (!item?.medicamentoId) continue;
      const dispensacao = await prisma.dispensacaoMedicamento.create({
        data: {
          prescricaoId,
          medicamentoId: item.medicamentoId,
          citizenId: prescricao.consulta.atendimento.citizenId,
          atendimentoId: prescricao.consulta.atendimento.id,
          quantidade: item.quantidade || 1,
          dispensadoPor: responsavel,
          observacoes: data?.observacoes,
        },
      });
      criadas.push(dispensacao);
    }

    await prisma.prescricao.update({
      where: { id: prescricaoId },
      data: { dispensada: true },
    });

    return {
      success: true,
      message: `Prescrição dispensada (${criadas.length} item(ns))`,
      dispensacoes: criadas,
    };
  }

  async listarPrescricoesPendentes(unidadeId?: string) {
    const where: any = { dispensada: false, validade: { gte: new Date() } };
    if (unidadeId) {
      where.consulta = { atendimento: { unidadeId } };
    }

    return await prisma.prescricao.findMany({
      where,
      include: {
        consulta: {
          select: {
            id: true,
            medicoId: true,
            atendimento: { select: { id: true, citizenId: true, unidadeId: true } },
          },
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 200,
    });
  }

  async gerarRelatorioAuditoria(filtros: any) {
    const where: any = {};

    if (filtros?.dataInicio || filtros?.dataFim) {
      where.data = {};
      if (filtros.dataInicio) where.data.gte = new Date(filtros.dataInicio);
      if (filtros.dataFim) where.data.lte = new Date(filtros.dataFim);
    }
    if (filtros?.citizenId) where.citizenId = filtros.citizenId;
    if (filtros?.medicamentoId) where.medicamentoId = filtros.medicamentoId;
    if (filtros?.dispensadoPor) where.dispensadoPor = filtros.dispensadoPor;

    if (filtros?.unidadeId) {
      const estoques = await prisma.estoqueMedicamento.findMany({
        where: { unidadeId: filtros.unidadeId },
        select: { id: true },
      });
      where.estoqueId = { in: estoques.map((e) => e.id) };
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      orderBy: { data: 'desc' },
      take: 500,
    });

    const [medicamentos, cidadaos, usuarios] = await Promise.all([
      prisma.medicamento.findMany({
        where: { id: { in: Array.from(new Set(dispensacoes.map((d) => d.medicamentoId))) } },
        select: { id: true, nome: true, principioAtivo: true },
      }),
      prisma.citizen.findMany({
        where: { id: { in: Array.from(new Set(dispensacoes.map((d) => d.citizenId))) } },
        select: { id: true, name: true, cpf: true },
      }),
      prisma.user.findMany({
        where: { id: { in: Array.from(new Set(dispensacoes.map((d) => d.dispensadoPor))) } },
        select: { id: true, name: true },
      }),
    ]);

    const medMap = new Map(medicamentos.map((m) => [m.id, m]));
    const cidMap = new Map(cidadaos.map((c) => [c.id, c]));
    const userMap = new Map(usuarios.map((u) => [u.id, u]));

    const detalhadas = dispensacoes.map((d) => ({
      ...d,
      medicamento: medMap.get(d.medicamentoId) || null,
      citizen: cidMap.get(d.citizenId) || null,
      responsavel: userMap.get(d.dispensadoPor) || null,
    }));

    return {
      total: detalhadas.length,
      quantidadeTotal: detalhadas.reduce((acc, d) => acc + d.quantidade, 0),
      cidadaosUnicos: new Set(detalhadas.map((d) => d.citizenId)).size,
      dispensacoes: detalhadas,
    };
  }
}

export default new DispensacaoService();
