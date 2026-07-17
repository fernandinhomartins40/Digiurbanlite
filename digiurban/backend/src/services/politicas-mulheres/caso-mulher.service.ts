import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Rede de Atendimento à Mulher (Fase 2, blueprint B7 — SIGILO MÁXIMO).
 *
 * Regras inegociáveis deste domínio:
 * - Ficha completa SOMENTE para a equipe do caso (equipeIds) e ADMIN/SUPER_ADMIN;
 *   fora da equipe a listagem vem MASCARADA (número, tipo, risco, status —
 *   nenhuma PII).
 * - TODA leitura de ficha gera AuditLog (CASO_MULHER_READ), inclusive as
 *   negadas (success=false).
 * - SEM export CSV — não existe endpoint de export neste app.
 */

const TIPOS_VALIDOS = [
  'VIOLENCIA_DOMESTICA',
  'ASSEDIO',
  'ACOLHIMENTO',
  'MEDIDA_PROTETIVA',
  'ACOMPANHAMENTO',
  'OUTRO',
];

type Contexto = { userId?: string; role?: string };

const ROLES_GESTORAS = ['ADMIN', 'SUPER_ADMIN'];

class CasoMulherService {
  private async gerarNumero() {
    const ano = new Date().getFullYear();
    const total = await prisma.casoMulher.count({
      where: { numero: { startsWith: `CM-${ano}-` } },
    });
    return `CM-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  private equipeDoCaso(caso: { equipeIds: any }): string[] {
    return Array.isArray(caso.equipeIds) ? caso.equipeIds.map(String) : [];
  }

  private podeAcessar(caso: { equipeIds: any; createdById: string | null }, ctx: Contexto): boolean {
    if (ctx.role && ROLES_GESTORAS.includes(ctx.role)) return true;
    if (!ctx.userId) return false;
    if (caso.createdById === ctx.userId) return true;
    return this.equipeDoCaso(caso).includes(ctx.userId);
  }

  /** AuditLog de leitura/ação sobre ficha (NÃO-FATAL). */
  private async auditar(action: string, casoId: string, ctx: Contexto, success: boolean, detalhe?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          action,
          resource: `caso_mulher:${casoId}`,
          success,
          ...(detalhe ? { details: { detalhe } } : {}),
        },
      });
    } catch (error) {
      logger.warn('[caso-mulher] Falha ao gravar AuditLog (não-fatal)', error);
    }
  }

  private mascarar(caso: any) {
    return {
      id: caso.id,
      numero: caso.numero,
      tipo: caso.tipo,
      risco: caso.risco,
      status: caso.status,
      createdAt: caso.createdAt,
      updatedAt: caso.updatedAt,
      acessoRestrito: true,
    };
  }

  /**
   * Lista casos: membros da equipe (e gestoras) veem a linha completa;
   * fora da equipe a linha vem mascarada, sem PII.
   */
  async listCasos(ctx: Contexto, filters?: { status?: string; tipo?: string; risco?: string }) {
    const casos = await prisma.casoMulher.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.risco ? { risco: filters.risco } : {}),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
    return casos.map((caso) =>
      this.podeAcessar(caso, ctx)
        ? { ...caso, dados: undefined, acessoRestrito: false }
        : this.mascarar(caso)
    );
  }

  /** Ficha completa — só equipe/gestão; TODA leitura auditada. */
  async findById(id: string, ctx: Contexto) {
    const caso = await prisma.casoMulher.findFirst({
      where: { id },
      include: {
        atendimentos: { orderBy: { createdAt: 'asc' } },
        encaminhamentos: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!caso) return null;
    if (!this.podeAcessar(caso, ctx)) {
      await this.auditar('CASO_MULHER_READ', caso.id, ctx, false, 'Acesso negado — fora da equipe');
      const erro: any = new Error('Acesso restrito à equipe do caso');
      erro.status = 403;
      throw erro;
    }
    await this.auditar('CASO_MULHER_READ', caso.id, ctx, true);

    // Nomes da equipe para exibição
    const equipeIds = this.equipeDoCaso(caso);
    const equipe = equipeIds.length
      ? await prisma.user.findMany({
          where: { id: { in: equipeIds } },
          select: { id: true, name: true, role: true },
        })
      : [];
    return { ...caso, equipe };
  }

  async createCaso(data: any, ctx: Contexto) {
    if (!data?.tipo || !TIPOS_VALIDOS.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_VALIDOS.join(', ')})`);
    }
    const equipeIds = Array.from(
      new Set([...(Array.isArray(data.equipeIds) ? data.equipeIds.map(String) : []), ...(ctx.userId ? [ctx.userId] : [])])
    );
    const caso = await prisma.casoMulher.create({
      data: {
        numero: await this.gerarNumero(),
        protocolId: data.protocolId,
        tipo: data.tipo,
        risco: data.risco || 'MEDIO',
        nomeAtendida: data.nomeAtendida,
        citizenId: data.citizenId,
        telefoneSeguro: data.telefoneSeguro,
        equipeIds,
        planoAcompanhamento: data.planoAcompanhamento,
        dados: data.dados,
        createdById: ctx.userId,
      },
    });
    await this.auditar('CASO_MULHER_CREATE', caso.id, ctx, true);
    return caso;
  }

  private async exigirAcesso(id: string, ctx: Contexto) {
    const caso = await prisma.casoMulher.findFirst({ where: { id } });
    if (!caso) throw new Error('Caso não encontrado');
    if (!this.podeAcessar(caso, ctx)) {
      await this.auditar('CASO_MULHER_WRITE', caso.id, ctx, false, 'Acesso negado — fora da equipe');
      const erro: any = new Error('Acesso restrito à equipe do caso');
      erro.status = 403;
      throw erro;
    }
    return caso;
  }

  async updateCaso(id: string, data: any, ctx: Contexto) {
    const caso = await this.exigirAcesso(id, ctx);
    if (caso.status === 'ENCERRADO') throw new Error('Caso encerrado');
    const atualizado = await prisma.casoMulher.update({
      where: { id: caso.id },
      data: {
        ...(data.tipo && TIPOS_VALIDOS.includes(data.tipo) ? { tipo: data.tipo } : {}),
        ...(data.risco !== undefined ? { risco: data.risco } : {}),
        ...(data.nomeAtendida !== undefined ? { nomeAtendida: data.nomeAtendida } : {}),
        ...(data.telefoneSeguro !== undefined ? { telefoneSeguro: data.telefoneSeguro } : {}),
        ...(data.planoAcompanhamento !== undefined
          ? { planoAcompanhamento: data.planoAcompanhamento }
          : {}),
        ...(data.status === 'EM_ACOMPANHAMENTO' ? { status: 'EM_ACOMPANHAMENTO' } : {}),
      },
    });
    await this.auditar('CASO_MULHER_UPDATE', caso.id, ctx, true);
    return atualizado;
  }

  /** Gestão da equipe do caso (adicionar/remover profissional). */
  async atualizarEquipe(id: string, params: { adicionar?: string[]; remover?: string[] }, ctx: Contexto) {
    const caso = await this.exigirAcesso(id, ctx);
    const atual = new Set(this.equipeDoCaso(caso));
    for (const u of params.adicionar || []) atual.add(String(u));
    for (const u of params.remover || []) atual.delete(String(u));
    if (caso.createdById) atual.add(caso.createdById); // quem abriu não sai da equipe
    const atualizado = await prisma.casoMulher.update({
      where: { id: caso.id },
      data: { equipeIds: Array.from(atual) },
    });
    await this.auditar('CASO_MULHER_EQUIPE', caso.id, ctx, true, `equipe=${Array.from(atual).length}`);
    return atualizado;
  }

  async registrarAtendimento(
    id: string,
    data: { tipo?: string; relato?: string },
    ctx: Contexto
  ) {
    const caso = await this.exigirAcesso(id, ctx);
    if (caso.status === 'ENCERRADO') throw new Error('Caso encerrado');
    const atendimento = await prisma.atendimentoCasoMulher.create({
      data: {
        casoId: caso.id,
        tipo: data.tipo || 'NOTA',
        relato: data.relato,
        autorId: ctx.userId,
      },
    });
    if (caso.status === 'ABERTO') {
      await prisma.casoMulher.update({
        where: { id: caso.id },
        data: { status: 'EM_ACOMPANHAMENTO' },
      });
    }
    await this.auditar('CASO_MULHER_ATENDIMENTO', caso.id, ctx, true);
    return atendimento;
  }

  async registrarEncaminhamento(
    id: string,
    data: { destino?: string; detalhes?: string },
    ctx: Contexto
  ) {
    const caso = await this.exigirAcesso(id, ctx);
    if (caso.status === 'ENCERRADO') throw new Error('Caso encerrado');
    if (!data?.destino) throw new Error('destino é obrigatório');
    const encaminhamento = await prisma.encaminhamentoCasoMulher.create({
      data: {
        casoId: caso.id,
        destino: data.destino,
        detalhes: data.detalhes,
        autorId: ctx.userId,
      },
    });
    if (caso.status === 'ABERTO') {
      await prisma.casoMulher.update({
        where: { id: caso.id },
        data: { status: 'EM_ACOMPANHAMENTO' },
      });
    }
    await this.auditar('CASO_MULHER_ENCAMINHAMENTO', caso.id, ctx, true, data.destino);
    return encaminhamento;
  }

  async atualizarEncaminhamento(encaminhamentoId: string, status: string, ctx: Contexto) {
    const encaminhamento = await prisma.encaminhamentoCasoMulher.findFirst({
      where: { id: encaminhamentoId },
    });
    if (!encaminhamento) throw new Error('Encaminhamento não encontrado');
    await this.exigirAcesso(encaminhamento.casoId, ctx);
    if (!['ENCAMINHADO', 'CONFIRMADO', 'CONCLUIDO'].includes(status)) {
      throw new Error('status inválido');
    }
    return prisma.encaminhamentoCasoMulher.update({
      where: { id: encaminhamento.id },
      data: { status },
    });
  }

  async encerrar(id: string, motivo: string | undefined, ctx: Contexto) {
    const caso = await this.exigirAcesso(id, ctx);
    if (caso.status === 'ENCERRADO') throw new Error('Caso já encerrado');
    await prisma.atendimentoCasoMulher.create({
      data: {
        casoId: caso.id,
        tipo: 'NOTA',
        relato: motivo || 'Caso encerrado',
        autorId: ctx.userId,
      },
    });
    const atualizado = await prisma.casoMulher.update({
      where: { id: caso.id },
      data: { status: 'ENCERRADO', encerradoEm: new Date() },
    });
    await this.auditar('CASO_MULHER_ENCERRAR', caso.id, ctx, true);
    await this.concluirProtocolo(atualizado);
    return atualizado;
  }

  async reabrir(id: string, ctx: Contexto) {
    const caso = await this.exigirAcesso(id, ctx);
    if (caso.status !== 'ENCERRADO') throw new Error('Caso não está encerrado');
    await this.auditar('CASO_MULHER_REABRIR', caso.id, ctx, true);
    return prisma.casoMulher.update({
      where: { id: caso.id },
      data: { status: 'EM_ACOMPANHAMENTO', encerradoEm: null },
    });
  }

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(caso: { protocolId: string | null; numero: string }) {
    if (!caso.protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: caso.protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(
        `Caso ${caso.numero}: falha ao concluir protocolo ${caso.protocolId} (não-fatal)`,
        error
      );
    }
  }

  /** Estatísticas agregadas — nunca expõem PII. */
  async getStatistics() {
    const inicioAno = new Date(new Date().getFullYear(), 0, 1);
    const [porStatus, porTipo, porRisco, noAno, encaminhamentosAbertos] = await Promise.all([
      prisma.casoMulher.groupBy({ by: ['status'], _count: true }),
      prisma.casoMulher.groupBy({
        by: ['tipo'],
        where: { status: { not: 'ENCERRADO' } },
        _count: true,
      }),
      prisma.casoMulher.groupBy({
        by: ['risco'],
        where: { status: { not: 'ENCERRADO' } },
        _count: true,
      }),
      prisma.casoMulher.count({ where: { createdAt: { gte: inicioAno } } }),
      prisma.encaminhamentoCasoMulher.count({ where: { status: { not: 'CONCLUIDO' } } }),
    ]);
    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      ativosPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count })),
      ativosPorRisco: porRisco.map((r) => ({ risco: r.risco, total: r._count })),
      casosNoAno: noAno,
      encaminhamentosAbertos,
    };
  }
}

export default new CasoMulherService();
