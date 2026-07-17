import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Licenciamento Urbano (Fase 2, blueprint B4) — único para
 * Obras Públicas + Planejamento Urbano.
 * Fluxo: processo (de protocolo ou manual) → análise (pareceres) →
 * [exigência ↔ análise] → vistoria → aprovação → emissão de licença
 * (retroalimenta o protocolo, NÃO-FATAL) | indeferimento.
 */

const TIPOS_VALIDOS = [
  'APROVACAO_PROJETO',
  'ALVARA_CONSTRUCAO',
  'ALVARA_FUNCIONAMENTO',
  'HABITE_SE',
  'VIABILIDADE',
  'DEMOLICAO',
];

const ENCERRADOS = ['LICENCA_EMITIDA', 'INDEFERIDO', 'CANCELADO'];

class LicenciamentoService {
  private async gerarNumero(prefixo: 'LIC' | 'ALV') {
    const ano = new Date().getFullYear();
    const total =
      prefixo === 'LIC'
        ? await prisma.processoLicenciamento.count({
            where: { numero: { startsWith: `LIC-${ano}-` } },
          })
        : await prisma.processoLicenciamento.count({
            where: { licencaNumero: { startsWith: `ALV-${ano}-` } },
          });
    return `${prefixo === 'LIC' ? 'LIC' : 'ALV'}-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  /** Anexa {responsavel} via join manual. */
  private async comVinculos(processos: any[]) {
    const userIds = Array.from(new Set(processos.map((p) => p.responsavelId).filter(Boolean)));
    const usuarios = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userPorId = new Map(usuarios.map((u) => [u.id, u]));
    return processos.map((p) => ({
      ...p,
      responsavel: p.responsavelId ? userPorId.get(p.responsavelId) || null : null,
    }));
  }

  async listProcessos(filters?: { status?: string; tipo?: string; bairro?: string }) {
    const processos = await prisma.processoLicenciamento.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.bairro ? { bairro: { contains: filters.bairro, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    return this.comVinculos(processos);
  }

  async findById(id: string) {
    const processo = await prisma.processoLicenciamento.findFirst({
      where: { id },
      include: { pareceres: { orderBy: { createdAt: 'asc' } } },
    });
    if (!processo) return null;
    const [comDados] = await this.comVinculos([processo]);
    return comDados;
  }

  async createProcesso(data: any) {
    if (!data?.tipo || !TIPOS_VALIDOS.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_VALIDOS.join(', ')})`);
    }
    return prisma.processoLicenciamento.create({
      data: {
        numero: await this.gerarNumero('LIC'),
        protocolId: data.protocolId,
        tipo: data.tipo,
        requerenteNome: data.requerenteNome,
        citizenId: data.citizenId,
        endereco: data.endereco,
        bairro: data.bairro,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        areaM2: data.areaM2 != null ? Number(data.areaM2) : null,
        descricao: data.descricao,
        dados: data.dados,
      },
    });
  }

  async updateProcesso(id: string, data: any) {
    const {
      id: _id,
      tenantId: _t,
      numero: _n,
      protocolId: _p,
      status: _s,
      pareceres: _pa,
      responsavel: _r,
      licencaNumero: _l,
      licencaValidade: _lv,
      licencaEmitidaEm: _le,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = data || {};
    return prisma.processoLicenciamento.update({ where: { id }, data: rest });
  }

  private async exigirProcessoAberto(id: string) {
    const processo = await prisma.processoLicenciamento.findFirst({ where: { id } });
    if (!processo) throw new Error('Processo não encontrado');
    if (ENCERRADOS.includes(processo.status)) throw new Error('Processo já encerrado');
    return processo;
  }

  async iniciarAnalise(id: string, responsavelId?: string) {
    await this.exigirProcessoAberto(id);
    return prisma.processoLicenciamento.update({
      where: { id },
      data: { status: 'EM_ANALISE', ...(responsavelId ? { responsavelId } : {}) },
    });
  }

  /**
   * Registra parecer e move o processo conforme o resultado:
   * EXIGENCIA → status EXIGENCIA (aguarda requerente);
   * parecer favorável em VISTORIA → APROVADO; desfavorável → INDEFERIDO
   * fica a cargo da ação explícita (indeferir), parecer só documenta.
   */
  async registrarParecer(
    id: string,
    data: { tipo?: string; resultado?: string; texto?: string; fotos?: any; autorId?: string }
  ) {
    const processo = await this.exigirProcessoAberto(id);
    const parecer = await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: data.tipo || 'ANALISE_PROJETO',
        resultado: data.resultado,
        texto: data.texto,
        fotos: data.fotos,
        autorId: data.autorId,
      },
    });
    if (data.resultado === 'EXIGENCIA') {
      await prisma.processoLicenciamento.update({
        where: { id: processo.id },
        data: { status: 'EXIGENCIA' },
      });
    } else if (processo.status === 'EXIGENCIA') {
      // Exigência atendida/parecer novo → volta para análise
      await prisma.processoLicenciamento.update({
        where: { id: processo.id },
        data: { status: 'EM_ANALISE' },
      });
    }
    return parecer;
  }

  async solicitarVistoria(id: string, observacoes?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: 'VISTORIA',
        texto: observacoes || 'Vistoria técnica solicitada',
        autorId,
      },
    });
    return prisma.processoLicenciamento.update({
      where: { id: processo.id },
      data: { status: 'VISTORIA' },
    });
  }

  async aprovar(id: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: 'ANALISE_PROJETO',
        resultado: 'FAVORAVEL',
        texto: 'Processo aprovado — apto à emissão de licença',
        autorId,
      },
    });
    return prisma.processoLicenciamento.update({
      where: { id: processo.id },
      data: { status: 'APROVADO' },
    });
  }

  async indeferir(id: string, motivo?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: 'ANALISE_PROJETO',
        resultado: 'DESFAVORAVEL',
        texto: motivo || 'Processo indeferido',
        autorId,
      },
    });
    const atualizado = await prisma.processoLicenciamento.update({
      where: { id: processo.id },
      data: { status: 'INDEFERIDO' },
    });
    await this.concluirProtocolo(atualizado, `Processo ${processo.numero} indeferido`);
    return atualizado;
  }

  async emitirLicenca(id: string, params: { validadeMeses?: number; autorId?: string }) {
    const processo = await this.exigirProcessoAberto(id);
    if (processo.status !== 'APROVADO') {
      throw new Error('Somente processos aprovados podem ter licença emitida');
    }
    const validadeMeses = params.validadeMeses || 12;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + validadeMeses);

    const atualizado = await prisma.processoLicenciamento.update({
      where: { id: processo.id },
      data: {
        status: 'LICENCA_EMITIDA',
        licencaNumero: await this.gerarNumero('ALV'),
        licencaValidade: validade,
        licencaEmitidaEm: new Date(),
      },
    });
    await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: 'NOTA',
        resultado: 'FAVORAVEL',
        texto: `Licença ${atualizado.licencaNumero} emitida (validade ${validadeMeses} meses)`,
        autorId: params.autorId,
      },
    });
    await this.concluirProtocolo(atualizado, `Licença ${atualizado.licencaNumero} emitida`);
    return atualizado;
  }

  async cancelar(id: string, motivo?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerLicenciamento.create({
      data: {
        processoId: processo.id,
        tipo: 'NOTA',
        texto: motivo || 'Processo cancelado',
        autorId,
      },
    });
    return prisma.processoLicenciamento.update({
      where: { id: processo.id },
      data: { status: 'CANCELADO' },
    });
  }

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(processo: { protocolId: string | null; numero: string }, motivo: string) {
    if (!processo.protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: processo.protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(
        `Licenciamento ${processo.numero}: falha ao concluir protocolo ${processo.protocolId} (não-fatal) — ${motivo}`,
        error
      );
    }
  }

  async getStatistics() {
    const [porStatus, porTipo, emitidasAno, vencendo] = await Promise.all([
      prisma.processoLicenciamento.groupBy({ by: ['status'], _count: true }),
      prisma.processoLicenciamento.groupBy({
        by: ['tipo'],
        where: { status: { notIn: ENCERRADOS } },
        _count: true,
      }),
      prisma.processoLicenciamento.count({
        where: {
          status: 'LICENCA_EMITIDA',
          licencaEmitidaEm: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      }),
      prisma.processoLicenciamento.count({
        where: {
          status: 'LICENCA_EMITIDA',
          licencaValidade: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 86400000),
          },
        },
      }),
    ]);
    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      backlogPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count })),
      licencasEmitidasNoAno: emitidasAno,
      licencasVencendo60Dias: vencendo,
    };
  }
}

export default new LicenciamentoService();
