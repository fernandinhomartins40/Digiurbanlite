import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Programas Habitacionais (Fase 2, blueprint B6 + fila) — Habitação.
 * Aproveita os models de catálogo ProgramaHabitacional (critérios de
 * pontuação em criteriosElegibilidade) e ConjuntoHabitacional (unidades).
 *
 * Fluxo da inscrição: INSCRITA → EM_ANALISE → CLASSIFICADA (entra na fila,
 * ordenada por pontuação e antiguidade) → SELECIONADA (manual ou sorteio) →
 * CONTEMPLADA (unidade vinculada, contadores do conjunto atualizados,
 * protocolo concluído NÃO-FATAL) | INDEFERIDA | CANCELADA.
 *
 * Critérios configuráveis: criteriosElegibilidade do programa no formato
 * [{ codigo, label, pontos }]; a pontuação da inscrição é a soma dos pontos
 * dos códigos em criteriosAtendidos.
 */

const ENCERRADAS = ['CONTEMPLADA', 'INDEFERIDA', 'CANCELADA'];

type Criterio = { codigo: string; label?: string; pontos?: number };

class HabitacaoService {
  // ---------------------------------------------------------------- programas

  async listProgramas(incluirInativos = false) {
    const programas = await prisma.programaHabitacional.findMany({
      where: incluirInativos ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { inscricoes: true } } },
    });
    return programas.map((p) => ({ ...p, totalInscricoes: p._count.inscricoes }));
  }

  async createPrograma(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    const jaExiste = await prisma.programaHabitacional.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe programa "${data.nome}"`);
    return prisma.programaHabitacional.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo || 'Aquisição',
        criteriosElegibilidade: this.normalizarCriterios(data.criteriosElegibilidade),
        rendaMaxima: data.rendaMaxima != null ? Number(data.rendaMaxima) : null,
        rendaMinima: data.rendaMinima != null ? Number(data.rendaMinima) : null,
        beneficiosOferecidos: data.beneficiosOferecidos,
        dataInicioInscricoes: data.dataInicioInscricoes ? new Date(data.dataInicioInscricoes) : null,
        dataFimInscricoes: data.dataFimInscricoes ? new Date(data.dataFimInscricoes) : null,
      },
    });
  }

  async updatePrograma(id: string, data: any) {
    const programa = await prisma.programaHabitacional.findFirst({ where: { id } });
    if (!programa) throw new Error('Programa não encontrado');
    return prisma.programaHabitacional.update({
      where: { id: programa.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.tipo ? { tipo: data.tipo } : {}),
        ...(data.criteriosElegibilidade !== undefined
          ? { criteriosElegibilidade: this.normalizarCriterios(data.criteriosElegibilidade) }
          : {}),
        ...(data.rendaMaxima !== undefined
          ? { rendaMaxima: data.rendaMaxima != null ? Number(data.rendaMaxima) : null }
          : {}),
        ...(data.beneficiosOferecidos !== undefined
          ? { beneficiosOferecidos: data.beneficiosOferecidos }
          : {}),
        ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
      },
    });
  }

  private normalizarCriterios(criterios: any): Criterio[] {
    if (!Array.isArray(criterios)) return [];
    return criterios
      .map((c: any) => ({
        codigo: String(c?.codigo || '').trim(),
        label: c?.label ? String(c.label) : undefined,
        pontos: Number(c?.pontos) || 0,
      }))
      .filter((c) => c.codigo);
  }

  // ---------------------------------------------------------------- conjuntos

  async listConjuntos() {
    return prisma.conjuntoHabitacional.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
  }

  async createConjunto(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    const total = data.totalUnidades != null ? Number(data.totalUnidades) : null;
    return prisma.conjuntoHabitacional.create({
      data: {
        nome: data.nome,
        endereco: data.endereco,
        bairro: data.bairro,
        totalUnidades: total,
        unidadesDisponiveis: total || 0,
        programaOrigem: data.programaOrigem,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
      },
    });
  }

  // --------------------------------------------------------------- inscrições

  /** Anexa nome do programa/conjunto e posição na fila. */
  async listInscricoes(filters?: { programaId?: string; status?: string; busca?: string }) {
    const inscricoes = await prisma.inscricaoHabitacional.findMany({
      where: {
        ...(filters?.programaId ? { programaId: filters.programaId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { nome: { contains: filters.busca, mode: 'insensitive' as const } },
                { cpf: { contains: filters.busca.replace(/\D/g, '') || filters.busca } },
              ],
            }
          : {}),
      },
      include: { programa: { select: { id: true, nome: true } } },
      orderBy: [{ pontuacao: 'desc' }, { createdAt: 'asc' }],
      take: 1000,
    });

    // Posição na fila: só CLASSIFICADA, por programa, na mesma ordenação
    const posicao = new Map<string, number>();
    const contadores = new Map<string, number>();
    for (const i of inscricoes) {
      if (i.status !== 'CLASSIFICADA') continue;
      const chave = i.programaId || 'geral';
      const atual = (contadores.get(chave) || 0) + 1;
      contadores.set(chave, atual);
      posicao.set(i.id, atual);
    }
    return inscricoes.map((i) => ({ ...i, posicaoFila: posicao.get(i.id) ?? null }));
  }

  async findInscricaoById(id: string) {
    return prisma.inscricaoHabitacional.findFirst({
      where: { id },
      include: { programa: true },
    });
  }

  async createInscricao(data: any) {
    const cpf = data?.cpf ? String(data.cpf).replace(/\D/g, '') : undefined;
    if (cpf && data?.programaId) {
      const duplicada = await prisma.inscricaoHabitacional.findFirst({
        where: { cpf, programaId: data.programaId, status: { notIn: ['INDEFERIDA', 'CANCELADA'] } },
      });
      if (duplicada) throw new Error('Já existe inscrição ativa deste CPF neste programa');
    }
    const inscricao = await prisma.inscricaoHabitacional.create({
      data: {
        protocolId: data.protocolId,
        programaId: data.programaId,
        citizenId: data.citizenId,
        nome: data.nome,
        cpf,
        rendaFamiliar: data.rendaFamiliar != null ? Number(data.rendaFamiliar) : null,
        membrosFamilia: data.membrosFamilia != null ? Number(data.membrosFamilia) : null,
        criteriosAtendidos: Array.isArray(data.criteriosAtendidos) ? data.criteriosAtendidos : [],
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
    return this.recalcularPontuacao(inscricao.id);
  }

  async updateInscricao(id: string, data: any) {
    const inscricao = await prisma.inscricaoHabitacional.findFirst({ where: { id } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    await prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: {
        ...(data.programaId !== undefined ? { programaId: data.programaId || null } : {}),
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.cpf !== undefined ? { cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null } : {}),
        ...(data.rendaFamiliar !== undefined
          ? { rendaFamiliar: data.rendaFamiliar != null ? Number(data.rendaFamiliar) : null }
          : {}),
        ...(data.membrosFamilia !== undefined
          ? { membrosFamilia: data.membrosFamilia != null ? Number(data.membrosFamilia) : null }
          : {}),
        ...(data.criteriosAtendidos !== undefined
          ? { criteriosAtendidos: Array.isArray(data.criteriosAtendidos) ? data.criteriosAtendidos : [] }
          : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
    return this.recalcularPontuacao(inscricao.id);
  }

  /** Soma os pontos dos critérios do programa presentes em criteriosAtendidos. */
  private async recalcularPontuacao(inscricaoId: string) {
    const inscricao = await prisma.inscricaoHabitacional.findFirst({
      where: { id: inscricaoId },
      include: { programa: { select: { criteriosElegibilidade: true } } },
    });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    const criterios = this.normalizarCriterios(inscricao.programa?.criteriosElegibilidade);
    const atendidos = new Set(
      (Array.isArray(inscricao.criteriosAtendidos) ? inscricao.criteriosAtendidos : []).map(String)
    );
    const pontuacao = criterios.reduce(
      (acc, c) => acc + (atendidos.has(c.codigo) ? c.pontos || 0 : 0),
      0
    );
    return prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: { pontuacao },
      include: { programa: { select: { id: true, nome: true } } },
    });
  }

  private async exigirInscricaoAberta(id: string) {
    const inscricao = await prisma.inscricaoHabitacional.findFirst({ where: { id } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (ENCERRADAS.includes(inscricao.status)) throw new Error('Inscrição já encerrada');
    return inscricao;
  }

  async iniciarAnalise(id: string) {
    await this.exigirInscricaoAberta(id);
    return prisma.inscricaoHabitacional.update({ where: { id }, data: { status: 'EM_ANALISE' } });
  }

  /** Deferimento: entra na fila com a pontuação recalculada. */
  async classificar(id: string) {
    const inscricao = await this.exigirInscricaoAberta(id);
    if (!inscricao.programaId) {
      throw new Error('Vincule a inscrição a um programa antes de classificar');
    }
    await this.recalcularPontuacao(inscricao.id);
    return prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: { status: 'CLASSIFICADA' },
    });
  }

  async indeferir(id: string, motivo?: string) {
    const inscricao = await this.exigirInscricaoAberta(id);
    const atualizada = await prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: {
        status: 'INDEFERIDA',
        observacoes: motivo || inscricao.observacoes,
      },
    });
    await this.concluirProtocolo(atualizada, 'Inscrição indeferida');
    return atualizada;
  }

  async selecionar(id: string) {
    const inscricao = await this.exigirInscricaoAberta(id);
    if (inscricao.status !== 'CLASSIFICADA') {
      throw new Error('Somente inscrições classificadas (na fila) podem ser selecionadas');
    }
    return prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: { status: 'SELECIONADA' },
    });
  }

  /** Sorteio público: seleciona N inscrições aleatórias da fila do programa. */
  async sortear(programaId: string, quantidade: number) {
    if (!quantidade || quantidade < 1) throw new Error('quantidade deve ser >= 1');
    const fila = await prisma.inscricaoHabitacional.findMany({
      where: { programaId, status: 'CLASSIFICADA' },
      select: { id: true, nome: true },
    });
    if (fila.length === 0) throw new Error('Não há inscrições classificadas neste programa');
    const embaralhada = [...fila];
    for (let i = embaralhada.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhada[i], embaralhada[j]] = [embaralhada[j], embaralhada[i]];
    }
    const sorteadas = embaralhada.slice(0, Math.min(quantidade, embaralhada.length));
    await prisma.inscricaoHabitacional.updateMany({
      where: { id: { in: sorteadas.map((s) => s.id) } },
      data: { status: 'SELECIONADA' },
    });
    logger.info(`[habitacao] Sorteio do programa ${programaId}: ${sorteadas.length} selecionada(s)`);
    return { selecionadas: sorteadas };
  }

  /** Contemplação: vincula unidade, atualiza contadores do conjunto e conclui o protocolo. */
  async contemplar(
    id: string,
    params: { conjuntoId?: string; unidadeIdentificacao?: string; contratoAssinadoEm?: string }
  ) {
    const inscricao = await this.exigirInscricaoAberta(id);
    if (inscricao.status !== 'SELECIONADA') {
      throw new Error('Somente inscrições selecionadas podem ser contempladas');
    }
    const atualizada = await prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: {
        status: 'CONTEMPLADA',
        conjuntoId: params.conjuntoId,
        unidadeIdentificacao: params.unidadeIdentificacao,
        contratoAssinadoEm: params.contratoAssinadoEm ? new Date(params.contratoAssinadoEm) : new Date(),
      },
    });
    if (params.conjuntoId) {
      try {
        const conjunto = await prisma.conjuntoHabitacional.findFirst({
          where: { id: params.conjuntoId },
        });
        if (conjunto) {
          await prisma.conjuntoHabitacional.update({
            where: { id: conjunto.id },
            data: {
              unidadesOcupadas: conjunto.unidadesOcupadas + 1,
              unidadesDisponiveis: Math.max(0, conjunto.unidadesDisponiveis - 1),
            },
          });
        }
      } catch (error) {
        logger.warn('[habitacao] Falha ao atualizar contadores do conjunto (não-fatal)', error);
      }
    }
    await this.concluirProtocolo(atualizada, 'Inscrição contemplada');
    return atualizada;
  }

  async cancelar(id: string, motivo?: string) {
    const inscricao = await this.exigirInscricaoAberta(id);
    return prisma.inscricaoHabitacional.update({
      where: { id: inscricao.id },
      data: { status: 'CANCELADA', observacoes: motivo || inscricao.observacoes },
    });
  }

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(inscricao: { protocolId: string | null; id: string }, motivo: string) {
    if (!inscricao.protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: inscricao.protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(
        `Habitação: falha ao concluir protocolo ${inscricao.protocolId} (não-fatal) — ${motivo}`,
        error
      );
    }
  }

  async getStatistics() {
    const inicioAno = new Date(new Date().getFullYear(), 0, 1);
    const [porStatus, porPrograma, contempladasAno, programasAtivos, conjuntos] = await Promise.all([
      prisma.inscricaoHabitacional.groupBy({ by: ['status'], _count: true }),
      prisma.inscricaoHabitacional.groupBy({
        by: ['programaId'],
        where: { status: 'CLASSIFICADA' },
        _count: true,
      }),
      prisma.inscricaoHabitacional.count({
        where: { status: 'CONTEMPLADA', updatedAt: { gte: inicioAno } },
      }),
      prisma.programaHabitacional.count({ where: { isActive: true } }),
      prisma.conjuntoHabitacional.aggregate({
        where: { isActive: true },
        _sum: { unidadesDisponiveis: true },
      }),
    ]);
    const programas = await prisma.programaHabitacional.findMany({
      where: { id: { in: porPrograma.map((p) => p.programaId).filter(Boolean) as string[] } },
      select: { id: true, nome: true },
    });
    const nomePorId = new Map(programas.map((p) => [p.id, p.nome]));
    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      filaPorPrograma: porPrograma.map((p) => ({
        programaId: p.programaId,
        programa: p.programaId ? nomePorId.get(p.programaId) || p.programaId : 'Sem programa',
        total: p._count,
      })),
      contempladasNoAno: contempladasAno,
      programasAtivos,
      unidadesDisponiveis: conjuntos._sum.unidadesDisponiveis || 0,
    };
  }
}

export default new HabitacaoService();
