import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Licenciamento & Fiscalização Ambiental (Fase 2, blueprint B4 + mapa) —
 * Secretaria de Meio Ambiente. Duas correntes na mesma tabela raiz:
 *
 * Licenciamento (LICENCA_AMBIENTAL, AUTORIZACAO_PODA_CORTE, AUTORIZACAO_SUPRESSAO):
 *   processo → análise (pareceres) → [exigência ↔ análise] → vistoria →
 *   aprovação → emissão de licença com condicionantes/validade (retroalimenta
 *   o protocolo, NÃO-FATAL) | indeferimento.
 *
 * Fiscalização (DENUNCIA, VISTORIA):
 *   processo → análise → vistoria em campo (agendada → realizada, geo) →
 *   auto de infração (AUTUADO) | arquivamento (improcedente). Ambos os
 *   desfechos concluem o protocolo de origem.
 */

const TIPOS_VALIDOS = [
  'LICENCA_AMBIENTAL',
  'AUTORIZACAO_PODA_CORTE',
  'AUTORIZACAO_SUPRESSAO',
  'DENUNCIA',
  'VISTORIA',
];

/** Tipos da corrente de fiscalização (não passam por aprovação/licença). */
const TIPOS_FISCALIZACAO = ['DENUNCIA', 'VISTORIA'];

const ENCERRADOS = ['LICENCA_EMITIDA', 'AUTUADO', 'ARQUIVADO', 'INDEFERIDO', 'CANCELADO'];

class MeioAmbienteService {
  private async gerarNumero(prefixo: 'AMB' | 'LAM' | 'AIA') {
    const ano = new Date().getFullYear();
    let total: number;
    if (prefixo === 'AMB') {
      total = await prisma.processoAmbiental.count({
        where: { numero: { startsWith: `AMB-${ano}-` } },
      });
    } else if (prefixo === 'LAM') {
      total = await prisma.processoAmbiental.count({
        where: { licencaNumero: { startsWith: `LAM-${ano}-` } },
      });
    } else {
      total = await prisma.autoInfracaoAmbiental.count({
        where: { numero: { startsWith: `AIA-${ano}-` } },
      });
    }
    return `${prefixo}-${ano}-${String(total + 1).padStart(4, '0')}`;
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
    const processos = await prisma.processoAmbiental.findMany({
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
    const processo = await prisma.processoAmbiental.findFirst({
      where: { id },
      include: {
        pareceres: { orderBy: { createdAt: 'asc' } },
        vistorias: { orderBy: { createdAt: 'asc' } },
        autos: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!processo) return null;
    const [comDados] = await this.comVinculos([processo]);
    return comDados;
  }

  async createProcesso(data: any) {
    if (!data?.tipo || !TIPOS_VALIDOS.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_VALIDOS.join(', ')})`);
    }
    return prisma.processoAmbiental.create({
      data: {
        numero: await this.gerarNumero('AMB'),
        protocolId: data.protocolId,
        tipo: data.tipo,
        requerenteNome: data.requerenteNome,
        citizenId: data.citizenId,
        atividade: data.atividade,
        endereco: data.endereco,
        bairro: data.bairro,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        descricao: data.descricao,
        dados: data.dados,
        renovacaoDeId: data.renovacaoDeId,
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
      vistorias: _v,
      autos: _a,
      responsavel: _r,
      condicionantes: _co,
      licencaNumero: _l,
      licencaValidade: _lv,
      licencaEmitidaEm: _le,
      renovacaoDeId: _re,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = data || {};
    return prisma.processoAmbiental.update({ where: { id }, data: rest });
  }

  private async exigirProcessoAberto(id: string) {
    const processo = await prisma.processoAmbiental.findFirst({ where: { id } });
    if (!processo) throw new Error('Processo não encontrado');
    if (ENCERRADOS.includes(processo.status)) throw new Error('Processo já encerrado');
    return processo;
  }

  async iniciarAnalise(id: string, responsavelId?: string) {
    await this.exigirProcessoAberto(id);
    return prisma.processoAmbiental.update({
      where: { id },
      data: { status: 'EM_ANALISE', ...(responsavelId ? { responsavelId } : {}) },
    });
  }

  /**
   * Registra parecer e move o processo conforme o resultado:
   * EXIGENCIA → status EXIGENCIA (aguarda requerente); novo parecer com o
   * processo em EXIGENCIA devolve para EM_ANALISE.
   */
  async registrarParecer(
    id: string,
    data: { tipo?: string; resultado?: string; texto?: string; fotos?: any; autorId?: string }
  ) {
    const processo = await this.exigirProcessoAberto(id);
    const parecer = await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: data.tipo || 'ANALISE_TECNICA',
        resultado: data.resultado,
        texto: data.texto,
        fotos: data.fotos,
        autorId: data.autorId,
      },
    });
    if (data.resultado === 'EXIGENCIA') {
      await prisma.processoAmbiental.update({
        where: { id: processo.id },
        data: { status: 'EXIGENCIA' },
      });
    } else if (processo.status === 'EXIGENCIA') {
      // Exigência atendida/parecer novo → volta para análise
      await prisma.processoAmbiental.update({
        where: { id: processo.id },
        data: { status: 'EM_ANALISE' },
      });
    }
    return parecer;
  }

  /** Agenda vistoria de campo e move o processo para VISTORIA. */
  async agendarVistoria(
    id: string,
    data: { dataAgendada?: string; fiscalId?: string; observacoes?: string }
  ) {
    const processo = await this.exigirProcessoAberto(id);
    const vistoria = await prisma.vistoriaAmbiental.create({
      data: {
        processoId: processo.id,
        dataAgendada: data.dataAgendada ? new Date(data.dataAgendada) : new Date(),
        fiscalId: data.fiscalId,
        constatacoes: data.observacoes,
      },
    });
    await prisma.processoAmbiental.update({
      where: { id: processo.id },
      data: { status: 'VISTORIA' },
    });
    return vistoria;
  }

  /**
   * Registra o resultado da vistoria realizada em campo. O processo volta
   * para EM_ANALISE — o desfecho (aprovar, autuar, arquivar...) é sempre
   * uma ação explícita do analista.
   */
  async registrarResultadoVistoria(
    vistoriaId: string,
    data: {
      resultado?: string;
      constatacoes?: string;
      fotos?: any;
      latitude?: number;
      longitude?: number;
      fiscalId?: string;
    }
  ) {
    const vistoria = await prisma.vistoriaAmbiental.findFirst({ where: { id: vistoriaId } });
    if (!vistoria) throw new Error('Vistoria não encontrada');
    const atualizada = await prisma.vistoriaAmbiental.update({
      where: { id: vistoria.id },
      data: {
        dataRealizada: new Date(),
        resultado: data.resultado,
        ...(data.constatacoes ? { constatacoes: data.constatacoes } : {}),
        ...(data.fotos !== undefined ? { fotos: data.fotos } : {}),
        ...(data.latitude != null ? { latitude: Number(data.latitude) } : {}),
        ...(data.longitude != null ? { longitude: Number(data.longitude) } : {}),
        ...(data.fiscalId ? { fiscalId: data.fiscalId } : {}),
      },
    });
    const processo = await prisma.processoAmbiental.findFirst({ where: { id: vistoria.processoId } });
    if (processo && processo.status === 'VISTORIA') {
      await prisma.processoAmbiental.update({
        where: { id: processo.id },
        data: { status: 'EM_ANALISE' },
      });
    }
    return atualizada;
  }

  async aprovar(id: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    if (TIPOS_FISCALIZACAO.includes(processo.tipo)) {
      throw new Error('Denúncias e vistorias não passam por aprovação — use autuar ou arquivar');
    }
    await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: 'ANALISE_TECNICA',
        resultado: 'FAVORAVEL',
        texto: 'Processo aprovado — apto à emissão de licença',
        autorId,
      },
    });
    return prisma.processoAmbiental.update({
      where: { id: processo.id },
      data: { status: 'APROVADO' },
    });
  }

  async indeferir(id: string, motivo?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: 'ANALISE_TECNICA',
        resultado: 'DESFAVORAVEL',
        texto: motivo || 'Processo indeferido',
        autorId,
      },
    });
    const atualizado = await prisma.processoAmbiental.update({
      where: { id: processo.id },
      data: { status: 'INDEFERIDO' },
    });
    await this.concluirProtocolo(atualizado, `Processo ${processo.numero} indeferido`);
    return atualizado;
  }

  async emitirLicenca(
    id: string,
    params: { validadeMeses?: number; condicionantes?: string[]; autorId?: string }
  ) {
    const processo = await this.exigirProcessoAberto(id);
    if (TIPOS_FISCALIZACAO.includes(processo.tipo)) {
      throw new Error('Denúncias e vistorias não geram licença');
    }
    if (processo.status !== 'APROVADO') {
      throw new Error('Somente processos aprovados podem ter licença emitida');
    }
    const validadeMeses = params.validadeMeses || 12;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + validadeMeses);
    const condicionantes = (params.condicionantes || []).map((c) => String(c).trim()).filter(Boolean);

    const atualizado = await prisma.processoAmbiental.update({
      where: { id: processo.id },
      data: {
        status: 'LICENCA_EMITIDA',
        licencaNumero: await this.gerarNumero('LAM'),
        licencaValidade: validade,
        licencaEmitidaEm: new Date(),
        ...(condicionantes.length ? { condicionantes } : {}),
      },
    });
    await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: 'NOTA',
        resultado: 'FAVORAVEL',
        texto:
          `Licença ${atualizado.licencaNumero} emitida (validade ${validadeMeses} meses)` +
          (condicionantes.length ? ` com ${condicionantes.length} condicionante(s)` : ''),
        autorId: params.autorId,
      },
    });
    await this.concluirProtocolo(atualizado, `Licença ${atualizado.licencaNumero} emitida`);
    return atualizado;
  }

  /**
   * Abre um novo processo de renovação a partir de uma licença emitida,
   * herdando os dados do original (renovacaoDeId aponta para ele).
   */
  async renovarLicenca(id: string) {
    const original = await prisma.processoAmbiental.findFirst({ where: { id } });
    if (!original) throw new Error('Processo não encontrado');
    if (original.status !== 'LICENCA_EMITIDA') {
      throw new Error('Somente licenças emitidas podem ser renovadas');
    }
    const jaRenovado = await prisma.processoAmbiental.findFirst({
      where: { renovacaoDeId: original.id, status: { notIn: ['INDEFERIDO', 'CANCELADO'] } },
    });
    if (jaRenovado) {
      throw new Error(`Já existe renovação em andamento (${jaRenovado.numero})`);
    }
    return this.createProcesso({
      tipo: original.tipo,
      requerenteNome: original.requerenteNome,
      citizenId: original.citizenId,
      atividade: original.atividade,
      endereco: original.endereco,
      bairro: original.bairro,
      latitude: original.latitude,
      longitude: original.longitude,
      descricao: `Renovação da licença ${original.licencaNumero} (processo ${original.numero})`,
      dados: original.dados,
      renovacaoDeId: original.id,
    });
  }

  /**
   * Lavra auto de infração vinculado ao processo. Na corrente de fiscalização
   * o processo é encerrado como AUTUADO e o protocolo de origem concluído;
   * num processo de licenciamento o auto é registrado sem mudar o status.
   */
  async lavrarAuto(
    processoId: string,
    data: {
      vistoriaId?: string;
      infratorNome?: string;
      infratorDocumento?: string;
      descricao?: string;
      enquadramento?: string;
      gravidade?: string;
      valorMulta?: number;
      prazoDefesaDias?: number;
      fotos?: any;
      fiscalId?: string;
    }
  ) {
    const processo = await this.exigirProcessoAberto(processoId);
    const prazoDefesa = new Date();
    prazoDefesa.setDate(prazoDefesa.getDate() + (data.prazoDefesaDias || 20));

    const auto = await prisma.autoInfracaoAmbiental.create({
      data: {
        processoId: processo.id,
        vistoriaId: data.vistoriaId,
        numero: await this.gerarNumero('AIA'),
        infratorNome: data.infratorNome,
        infratorDocumento: data.infratorDocumento,
        descricao: data.descricao,
        enquadramento: data.enquadramento,
        gravidade: data.gravidade,
        valorMulta: data.valorMulta != null ? Number(data.valorMulta) : null,
        prazoDefesa,
        fotos: data.fotos,
        fiscalId: data.fiscalId,
      },
    });
    if (TIPOS_FISCALIZACAO.includes(processo.tipo)) {
      const atualizado = await prisma.processoAmbiental.update({
        where: { id: processo.id },
        data: { status: 'AUTUADO' },
      });
      await this.concluirProtocolo(atualizado, `Auto de infração ${auto.numero} lavrado`);
    }
    return auto;
  }

  async atualizarAuto(autoId: string, data: { status?: string; valorMulta?: number; descricao?: string }) {
    const auto = await prisma.autoInfracaoAmbiental.findFirst({ where: { id: autoId } });
    if (!auto) throw new Error('Auto de infração não encontrado');
    return prisma.autoInfracaoAmbiental.update({
      where: { id: auto.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.valorMulta != null ? { valorMulta: Number(data.valorMulta) } : {}),
        ...(data.descricao ? { descricao: data.descricao } : {}),
      },
    });
  }

  /** Arquiva denúncia/vistoria improcedente (conclui o protocolo). */
  async arquivar(id: string, motivo?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: 'NOTA',
        texto: motivo || 'Processo arquivado',
        autorId,
      },
    });
    const atualizado = await prisma.processoAmbiental.update({
      where: { id: processo.id },
      data: { status: 'ARQUIVADO' },
    });
    await this.concluirProtocolo(atualizado, `Processo ${processo.numero} arquivado`);
    return atualizado;
  }

  async cancelar(id: string, motivo?: string, autorId?: string) {
    const processo = await this.exigirProcessoAberto(id);
    await prisma.parecerAmbiental.create({
      data: {
        processoId: processo.id,
        tipo: 'NOTA',
        texto: motivo || 'Processo cancelado',
        autorId,
      },
    });
    return prisma.processoAmbiental.update({
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
        `Meio Ambiente ${processo.numero}: falha ao concluir protocolo ${processo.protocolId} (não-fatal) — ${motivo}`,
        error
      );
    }
  }

  async getStatistics() {
    const inicioAno = new Date(new Date().getFullYear(), 0, 1);
    const [porStatus, porTipo, emitidasAno, vencendo, denunciasAbertas, autosAno] = await Promise.all([
      prisma.processoAmbiental.groupBy({ by: ['status'], _count: true }),
      prisma.processoAmbiental.groupBy({
        by: ['tipo'],
        where: { status: { notIn: ENCERRADOS } },
        _count: true,
      }),
      prisma.processoAmbiental.count({
        where: { status: 'LICENCA_EMITIDA', licencaEmitidaEm: { gte: inicioAno } },
      }),
      prisma.processoAmbiental.count({
        where: {
          status: 'LICENCA_EMITIDA',
          licencaValidade: { gte: new Date(), lte: new Date(Date.now() + 60 * 86400000) },
        },
      }),
      prisma.processoAmbiental.count({
        where: { tipo: { in: TIPOS_FISCALIZACAO }, status: { notIn: ENCERRADOS } },
      }),
      prisma.autoInfracaoAmbiental.count({ where: { createdAt: { gte: inicioAno } } }),
    ]);
    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      backlogPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count })),
      licencasEmitidasNoAno: emitidasAno,
      licencasVencendo60Dias: vencendo,
      fiscalizacoesAbertas: denunciasAbertas,
      autosLavradosNoAno: autosAno,
    };
  }
}

export default new MeioAmbienteService();
