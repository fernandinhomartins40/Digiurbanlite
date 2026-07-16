import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Ordens de Serviço — Serviços Públicos (Fase 1D do plano de apps).
 * Fluxo: OS criada (de protocolo ou manual) → triagem/priorização →
 * despacho para equipe → execução com evidências → conclusão
 * (retroalimenta o protocolo, NÃO-FATAL).
 */
class OrdemServicoService {
  private async gerarNumero() {
    const ano = new Date().getFullYear();
    const emitidas = await prisma.ordemServico.count({
      where: { numero: { startsWith: `OS-${ano}-` } },
    });
    return `OS-${ano}-${String(emitidas + 1).padStart(4, '0')}`;
  }

  /** Anexa {equipe, responsavel} via join manual (equipeId/responsavelId são escalares). */
  private async comVinculos(ordens: any[]) {
    const equipeIds = Array.from(new Set(ordens.map((o) => o.equipeId).filter(Boolean)));
    const userIds = Array.from(new Set(ordens.map((o) => o.responsavelId).filter(Boolean)));
    const [equipes, usuarios] = await Promise.all([
      equipeIds.length
        ? prisma.team.findMany({ where: { id: { in: equipeIds } }, select: { id: true, nome: true, sigla: true } })
        : Promise.resolve([]),
      userIds.length
        ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
    ]);
    const equipePorId = new Map(equipes.map((e) => [e.id, e]));
    const userPorId = new Map(usuarios.map((u) => [u.id, u]));
    return ordens.map((o) => ({
      ...o,
      equipe: o.equipeId ? equipePorId.get(o.equipeId) || null : null,
      responsavel: o.responsavelId ? userPorId.get(o.responsavelId) || null : null,
    }));
  }

  async listOrdens(filters?: {
    status?: string;
    tipo?: string;
    bairro?: string;
    prioridade?: string;
    equipeId?: string;
  }) {
    const ordens = await prisma.ordemServico.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.bairro ? { bairro: { contains: filters.bairro, mode: 'insensitive' as const } } : {}),
        ...(filters?.prioridade ? { prioridade: filters.prioridade } : {}),
        ...(filters?.equipeId ? { equipeId: filters.equipeId } : {}),
      },
      orderBy: [{ status: 'asc' }, { prioridade: 'desc' }, { createdAt: 'asc' }],
      take: 500,
    });
    return this.comVinculos(ordens);
  }

  async findById(id: string) {
    const ordem = await prisma.ordemServico.findFirst({
      where: { id },
      include: { apontamentos: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ordem) return null;
    const [comDados] = await this.comVinculos([ordem]);
    return comDados;
  }

  async createOrdem(data: any) {
    if (!data?.tipo) throw new Error('tipo é obrigatório');
    return prisma.ordemServico.create({
      data: {
        numero: await this.gerarNumero(),
        protocolId: data.protocolId,
        tipo: data.tipo,
        descricao: data.descricao,
        prioridade: data.prioridade || 'NORMAL',
        endereco: data.endereco,
        bairro: data.bairro,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        fotos: data.fotos,
        slaPrazo: data.slaPrazo ? new Date(data.slaPrazo) : null,
        observacoes: data.observacoes,
      },
    });
  }

  /** Triagem: ajustar tipo/prioridade/SLA/local antes do despacho. */
  async updateOrdem(id: string, data: any) {
    const {
      id: _id,
      tenantId: _t,
      numero: _n,
      protocolId: _p,
      status: _s,
      apontamentos: _a,
      equipe: _e,
      responsavel: _r,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = data || {};
    if (rest.slaPrazo) rest.slaPrazo = new Date(rest.slaPrazo);
    return prisma.ordemServico.update({ where: { id }, data: rest });
  }

  async despachar(id: string, params: { equipeId?: string; responsavelId?: string; userId?: string; observacoes?: string }) {
    const ordem = await prisma.ordemServico.findFirst({ where: { id } });
    if (!ordem) throw new Error('Ordem de serviço não encontrada');
    if (['CONCLUIDA', 'CANCELADA'].includes(ordem.status)) {
      throw new Error('OS já encerrada');
    }
    if (!params.equipeId && !params.responsavelId) {
      throw new Error('Informe a equipe ou o responsável pelo despacho');
    }
    const atualizada = await prisma.ordemServico.update({
      where: { id },
      data: {
        status: 'DESPACHADA',
        equipeId: params.equipeId,
        responsavelId: params.responsavelId,
        dataDespacho: new Date(),
      },
    });
    await prisma.apontamentoOS.create({
      data: {
        ordemServicoId: id,
        userId: params.userId,
        tipo: 'DESPACHO',
        descricao: params.observacoes || 'OS despachada para execução',
      },
    });
    return atualizada;
  }

  async iniciar(id: string, userId?: string) {
    const ordem = await prisma.ordemServico.findFirst({ where: { id } });
    if (!ordem) throw new Error('Ordem de serviço não encontrada');
    if (['CONCLUIDA', 'CANCELADA'].includes(ordem.status)) throw new Error('OS já encerrada');
    const atualizada = await prisma.ordemServico.update({
      where: { id },
      data: { status: 'EM_EXECUCAO', dataInicio: ordem.dataInicio || new Date() },
    });
    await prisma.apontamentoOS.create({
      data: { ordemServicoId: id, userId, tipo: 'INICIO', descricao: 'Execução iniciada' },
    });
    return atualizada;
  }

  async registrarApontamento(id: string, data: any) {
    const ordem = await prisma.ordemServico.findFirst({ where: { id } });
    if (!ordem) throw new Error('Ordem de serviço não encontrada');
    return prisma.apontamentoOS.create({
      data: {
        ordemServicoId: id,
        userId: data.userId,
        tipo: data.tipo || 'EXECUCAO',
        descricao: data.descricao,
        horas: data.horas != null ? Number(data.horas) : null,
        materiais: data.materiais,
        fotosAntes: data.fotosAntes,
        fotosDepois: data.fotosDepois,
      },
    });
  }

  async concluir(id: string, data: { userId?: string; descricao?: string; horas?: number; materiais?: any; fotosDepois?: any }) {
    const ordem = await prisma.ordemServico.findFirst({ where: { id } });
    if (!ordem) throw new Error('Ordem de serviço não encontrada');
    if (ordem.status === 'CONCLUIDA') return ordem;
    if (ordem.status === 'CANCELADA') throw new Error('OS cancelada não pode ser concluída');

    const atualizada = await prisma.ordemServico.update({
      where: { id },
      data: { status: 'CONCLUIDA', dataConclusao: new Date() },
    });
    await prisma.apontamentoOS.create({
      data: {
        ordemServicoId: id,
        userId: data?.userId,
        tipo: 'CONCLUSAO',
        descricao: data?.descricao || 'Serviço concluído',
        horas: data?.horas != null ? Number(data.horas) : null,
        materiais: data?.materiais,
        fotosDepois: data?.fotosDepois,
      },
    });

    // Retroalimenta o protocolo de origem (NÃO-FATAL, padrão materializeOnApproval)
    if (ordem.protocolId) {
      try {
        await prisma.protocolSimplified.update({
          where: { id: ordem.protocolId },
          data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
        });
      } catch (error) {
        logger.warn(`OS ${ordem.numero}: falha ao concluir protocolo ${ordem.protocolId} (não-fatal)`, error);
      }
    }
    return atualizada;
  }

  async cancelar(id: string, params: { userId?: string; motivo?: string }) {
    const ordem = await prisma.ordemServico.findFirst({ where: { id } });
    if (!ordem) throw new Error('Ordem de serviço não encontrada');
    if (ordem.status === 'CONCLUIDA') throw new Error('OS concluída não pode ser cancelada');
    const atualizada = await prisma.ordemServico.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
    await prisma.apontamentoOS.create({
      data: {
        ordemServicoId: id,
        userId: params.userId,
        tipo: 'CANCELAMENTO',
        descricao: params.motivo || 'OS cancelada',
      },
    });
    return atualizada;
  }

  /** Equipes de campo: Teams ativos da secretaria de Serviços Públicos. */
  async listEquipes() {
    return prisma.team.findMany({
      where: { ativo: true, department: { code: 'SERVICOS_PUBLICOS' } },
      select: {
        id: true,
        nome: true,
        sigla: true,
        coordenador: { select: { id: true, name: true } },
        _count: { select: { membros: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async getStatistics() {
    const [porStatus, porTipo, porBairro, concluidas] = await Promise.all([
      prisma.ordemServico.groupBy({ by: ['status'], _count: true }),
      prisma.ordemServico.groupBy({
        by: ['tipo'],
        where: { status: { notIn: ['CONCLUIDA', 'CANCELADA'] } },
        _count: true,
      }),
      prisma.ordemServico.groupBy({
        by: ['bairro'],
        where: { status: { notIn: ['CONCLUIDA', 'CANCELADA'] }, bairro: { not: null } },
        _count: true,
      }),
      prisma.ordemServico.findMany({
        where: { status: 'CONCLUIDA', dataConclusao: { not: null } },
        select: { tipo: true, createdAt: true, dataConclusao: true },
        take: 1000,
        orderBy: { dataConclusao: 'desc' },
      }),
    ]);

    // Tempo médio de conclusão (dias) por tipo
    const tempoPorTipo = new Map<string, { tipo: string; totalDias: number; total: number }>();
    for (const os of concluidas) {
      const dias = (os.dataConclusao!.getTime() - os.createdAt.getTime()) / 86400000;
      const atual = tempoPorTipo.get(os.tipo) || { tipo: os.tipo, totalDias: 0, total: 0 };
      atual.totalDias += dias;
      atual.total += 1;
      tempoPorTipo.set(os.tipo, atual);
    }

    const agora = new Date();
    const atrasadas = await prisma.ordemServico.count({
      where: { status: { notIn: ['CONCLUIDA', 'CANCELADA'] }, slaPrazo: { lt: agora } },
    });

    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      backlogPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count })),
      backlogPorBairro: porBairro
        .map((b) => ({ bairro: b.bairro, total: b._count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15),
      tempoMedioPorTipo: Array.from(tempoPorTipo.values()).map((t) => ({
        tipo: t.tipo,
        dias: Math.round((t.totalDias / t.total) * 10) / 10,
        amostra: t.total,
      })),
      atrasadas,
    };
  }

  /** Pontos para o mapa (OS abertas com coordenadas). */
  async getMapa() {
    return prisma.ordemServico.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        numero: true,
        tipo: true,
        status: true,
        prioridade: true,
        bairro: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
}

export default new OrdemServicoService();
