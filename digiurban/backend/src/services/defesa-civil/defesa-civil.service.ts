import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Ocorrências & Áreas de Risco (Fase 2, blueprint B2 + mapa) — Defesa
 * Civil. Fluxo da ocorrência: ABERTA → EM_ATENDIMENTO (despacho) → vistoria
 * com laudo/nível de risco → VISTORIADA | INTERDITADA | MONITORAMENTO →
 * CONCLUIDA (retroalimenta o protocolo, NÃO-FATAL) | CANCELADA.
 *
 * Abrigos com capacidade/ocupação em pessoas; famílias atingidas vinculadas
 * à ocorrência, com ponte opcional para o CadÚnico da Assistência Social
 * (cadUnicoFamiliaId) e alojamento/saída de abrigo mantendo a ocupação.
 */

const TIPOS_VALIDOS = [
  'DESLIZAMENTO',
  'ALAGAMENTO',
  'VENDAVAL',
  'INCENDIO',
  'AREA_RISCO',
  'VISTORIA',
  'REMOCAO_PREVENTIVA',
  'SOLICITACAO_ABRIGO',
  'OUTRO',
];

const ENCERRADAS = ['CONCLUIDA', 'CANCELADA'];

class DefesaCivilService {
  private async gerarNumero() {
    const ano = new Date().getFullYear();
    const total = await prisma.ocorrenciaDefesaCivil.count({
      where: { numero: { startsWith: `DC-${ano}-` } },
    });
    return `DC-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  /** Anexa {responsavel} via join manual. */
  private async comVinculos(ocorrencias: any[]) {
    const userIds = Array.from(new Set(ocorrencias.map((o) => o.responsavelId).filter(Boolean)));
    const usuarios = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userPorId = new Map(usuarios.map((u) => [u.id, u]));
    return ocorrencias.map((o) => ({
      ...o,
      responsavel: o.responsavelId ? userPorId.get(o.responsavelId) || null : null,
    }));
  }

  // -------------------------------------------------------------- ocorrências

  async listOcorrencias(filters?: { status?: string; tipo?: string; bairro?: string; gravidade?: string }) {
    const ocorrencias = await prisma.ocorrenciaDefesaCivil.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.gravidade ? { gravidade: filters.gravidade } : {}),
        ...(filters?.bairro ? { bairro: { contains: filters.bairro, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ status: 'asc' }, { gravidade: 'desc' }, { createdAt: 'asc' }],
      take: 500,
    });
    return this.comVinculos(ocorrencias);
  }

  /** Pontos para o mapa (só georreferenciadas). */
  async listPontosMapa() {
    return prisma.ocorrenciaDefesaCivil.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        numero: true,
        tipo: true,
        gravidade: true,
        status: true,
        bairro: true,
        latitude: true,
        longitude: true,
        nivelRisco: true,
      },
      take: 1000,
    });
  }

  async findById(id: string) {
    const ocorrencia = await prisma.ocorrenciaDefesaCivil.findFirst({
      where: { id },
      include: { familias: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ocorrencia) return null;
    const [comDados] = await this.comVinculos([ocorrencia]);
    return comDados;
  }

  async createOcorrencia(data: any) {
    if (!data?.tipo || !TIPOS_VALIDOS.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_VALIDOS.join(', ')})`);
    }
    return prisma.ocorrenciaDefesaCivil.create({
      data: {
        numero: await this.gerarNumero(),
        protocolId: data.protocolId,
        tipo: data.tipo,
        gravidade: data.gravidade || 'MEDIA',
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        endereco: data.endereco,
        bairro: data.bairro,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        descricao: data.descricao,
        dados: data.dados,
      },
    });
  }

  async updateOcorrencia(id: string, data: any) {
    const {
      id: _id,
      tenantId: _t,
      numero: _n,
      protocolId: _p,
      status: _s,
      familias: _f,
      responsavel: _r,
      vistoriaEm: _v,
      interditadoEm: _i,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = data || {};
    if (rest.latitude != null) rest.latitude = Number(rest.latitude);
    if (rest.longitude != null) rest.longitude = Number(rest.longitude);
    return prisma.ocorrenciaDefesaCivil.update({ where: { id }, data: rest });
  }

  private async exigirOcorrenciaAberta(id: string) {
    const ocorrencia = await prisma.ocorrenciaDefesaCivil.findFirst({ where: { id } });
    if (!ocorrencia) throw new Error('Ocorrência não encontrada');
    if (ENCERRADAS.includes(ocorrencia.status)) throw new Error('Ocorrência já encerrada');
    return ocorrencia;
  }

  async iniciarAtendimento(id: string, responsavelId?: string) {
    await this.exigirOcorrenciaAberta(id);
    return prisma.ocorrenciaDefesaCivil.update({
      where: { id },
      data: { status: 'EM_ATENDIMENTO', ...(responsavelId ? { responsavelId } : {}) },
    });
  }

  /**
   * Registra a vistoria técnica: laudo + nível de risco. Com interditar=true
   * a área fica INTERDITADA; senão VISTORIADA (aguardando desfecho).
   */
  async registrarVistoria(
    id: string,
    data: { laudo?: string; nivelRisco?: string; interditar?: boolean; fotos?: any }
  ) {
    const ocorrencia = await this.exigirOcorrenciaAberta(id);
    return prisma.ocorrenciaDefesaCivil.update({
      where: { id: ocorrencia.id },
      data: {
        vistoriaEm: new Date(),
        laudo: data.laudo,
        nivelRisco: data.nivelRisco,
        ...(data.fotos !== undefined ? { fotos: data.fotos } : {}),
        ...(data.interditar
          ? { status: 'INTERDITADA', interditadoEm: new Date() }
          : { status: 'VISTORIADA' }),
      },
    });
  }

  /** Área de risco permanente sob acompanhamento (não encerra). */
  async monitorar(id: string) {
    await this.exigirOcorrenciaAberta(id);
    return prisma.ocorrenciaDefesaCivil.update({
      where: { id },
      data: { status: 'MONITORAMENTO' },
    });
  }

  async concluir(id: string, observacao?: string) {
    const ocorrencia = await this.exigirOcorrenciaAberta(id);
    const atualizada = await prisma.ocorrenciaDefesaCivil.update({
      where: { id: ocorrencia.id },
      data: {
        status: 'CONCLUIDA',
        ...(observacao
          ? { laudo: ocorrencia.laudo ? `${ocorrencia.laudo}\n\n${observacao}` : observacao }
          : {}),
      },
    });
    await this.concluirProtocolo(atualizada, `Ocorrência ${ocorrencia.numero} concluída`);
    return atualizada;
  }

  async cancelar(id: string, motivo?: string) {
    const ocorrencia = await this.exigirOcorrenciaAberta(id);
    return prisma.ocorrenciaDefesaCivil.update({
      where: { id: ocorrencia.id },
      data: {
        status: 'CANCELADA',
        ...(motivo
          ? { laudo: ocorrencia.laudo ? `${ocorrencia.laudo}\n\nCancelada: ${motivo}` : `Cancelada: ${motivo}` }
          : {}),
      },
    });
  }

  // ------------------------------------------------------------------ abrigos

  async listAbrigos() {
    return prisma.abrigo.findMany({ where: { isActive: true }, orderBy: { nome: 'asc' } });
  }

  async createAbrigo(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    const jaExiste = await prisma.abrigo.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe abrigo "${data.nome}"`);
    return prisma.abrigo.create({
      data: {
        nome: data.nome,
        endereco: data.endereco,
        bairro: data.bairro,
        capacidade: data.capacidade != null ? Number(data.capacidade) : null,
        responsavelNome: data.responsavelNome,
        telefone: data.telefone,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
      },
    });
  }

  async updateAbrigo(id: string, data: any) {
    const abrigo = await prisma.abrigo.findFirst({ where: { id } });
    if (!abrigo) throw new Error('Abrigo não encontrado');
    return prisma.abrigo.update({
      where: { id: abrigo.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.endereco !== undefined ? { endereco: data.endereco } : {}),
        ...(data.bairro !== undefined ? { bairro: data.bairro } : {}),
        ...(data.capacidade !== undefined
          ? { capacidade: data.capacidade != null ? Number(data.capacidade) : null }
          : {}),
        ...(data.responsavelNome !== undefined ? { responsavelNome: data.responsavelNome } : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
      },
    });
  }

  // ----------------------------------------------------------------- famílias

  async listFamilias(filters?: { ocorrenciaId?: string; abrigoId?: string; situacao?: string }) {
    return prisma.familiaAtingida.findMany({
      where: {
        ...(filters?.ocorrenciaId ? { ocorrenciaId: filters.ocorrenciaId } : {}),
        ...(filters?.abrigoId ? { abrigoId: filters.abrigoId } : {}),
        ...(filters?.situacao ? { situacao: filters.situacao } : {}),
      },
      include: { ocorrencia: { select: { id: true, numero: true, tipo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  /** Cria família atingida; tenta a ponte com o CadÚnico pelo CPF do responsável. */
  async createFamilia(data: any) {
    const cpf = data?.cpf ? String(data.cpf).replace(/\D/g, '') : undefined;
    let cadUnicoFamiliaId: string | undefined = data.cadUnicoFamiliaId;
    if (!cadUnicoFamiliaId && cpf) {
      try {
        const citizen = await prisma.citizen.findFirst({ where: { cpf }, select: { id: true } });
        if (citizen) {
          const cadunico = await prisma.cadUnicoFamilia.findFirst({
            where: { responsavelFamiliarId: citizen.id },
            select: { id: true },
          });
          cadUnicoFamiliaId = cadunico?.id;
        }
      } catch (error) {
        logger.warn('[defesa-civil] Falha na ponte com CadÚnico (não-fatal)', error);
      }
    }
    return prisma.familiaAtingida.create({
      data: {
        ocorrenciaId: data.ocorrenciaId,
        cadUnicoFamiliaId,
        responsavelNome: data.responsavelNome,
        cpf,
        membros: data.membros != null ? Number(data.membros) : null,
        situacao: data.situacao || 'DESALOJADA',
        necessidades: data.necessidades,
        observacoes: data.observacoes,
      },
    });
  }

  async updateFamilia(id: string, data: any) {
    const familia = await prisma.familiaAtingida.findFirst({ where: { id } });
    if (!familia) throw new Error('Família não encontrada');
    return prisma.familiaAtingida.update({
      where: { id: familia.id },
      data: {
        ...(data.responsavelNome !== undefined ? { responsavelNome: data.responsavelNome } : {}),
        ...(data.cpf !== undefined ? { cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null } : {}),
        ...(data.membros !== undefined
          ? { membros: data.membros != null ? Number(data.membros) : null }
          : {}),
        ...(data.situacao !== undefined ? { situacao: data.situacao } : {}),
        ...(data.necessidades !== undefined ? { necessidades: data.necessidades } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  /** Aloja a família num abrigo, somando as pessoas à ocupação. */
  async alojarFamilia(familiaId: string, abrigoId: string) {
    const familia = await prisma.familiaAtingida.findFirst({ where: { id: familiaId } });
    if (!familia) throw new Error('Família não encontrada');
    if (familia.abrigoId) throw new Error('Família já está em um abrigo — registre a saída antes');
    const abrigo = await prisma.abrigo.findFirst({ where: { id: abrigoId } });
    if (!abrigo) throw new Error('Abrigo não encontrado');
    const pessoas = familia.membros || 1;
    if (abrigo.capacidade != null && abrigo.ocupacao + pessoas > abrigo.capacidade) {
      throw new Error(
        `Capacidade insuficiente em ${abrigo.nome} (${abrigo.ocupacao}/${abrigo.capacidade})`
      );
    }
    await prisma.abrigo.update({
      where: { id: abrigo.id },
      data: { ocupacao: abrigo.ocupacao + pessoas },
    });
    return prisma.familiaAtingida.update({
      where: { id: familia.id },
      data: {
        abrigoId: abrigo.id,
        situacao: 'EM_ABRIGO',
        entradaAbrigoEm: new Date(),
        saidaAbrigoEm: null,
      },
    });
  }

  /** Saída do abrigo, devolvendo a ocupação. */
  async retirarFamilia(familiaId: string, situacaoFinal?: string) {
    const familia = await prisma.familiaAtingida.findFirst({ where: { id: familiaId } });
    if (!familia) throw new Error('Família não encontrada');
    if (!familia.abrigoId) throw new Error('Família não está em abrigo');
    const abrigo = await prisma.abrigo.findFirst({ where: { id: familia.abrigoId } });
    if (abrigo) {
      const pessoas = familia.membros || 1;
      await prisma.abrigo.update({
        where: { id: abrigo.id },
        data: { ocupacao: Math.max(0, abrigo.ocupacao - pessoas) },
      });
    }
    return prisma.familiaAtingida.update({
      where: { id: familia.id },
      data: {
        abrigoId: null,
        situacao: situacaoFinal || 'RETORNOU',
        saidaAbrigoEm: new Date(),
      },
    });
  }

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(ocorrencia: { protocolId: string | null; numero: string }, motivo: string) {
    if (!ocorrencia.protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: ocorrencia.protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(
        `Defesa Civil ${ocorrencia.numero}: falha ao concluir protocolo ${ocorrencia.protocolId} (não-fatal) — ${motivo}`,
        error
      );
    }
  }

  async getStatistics() {
    const inicioAno = new Date(new Date().getFullYear(), 0, 1);
    const [porStatus, porTipo, interditadas, noAno, abrigos, familiasEmAbrigo] = await Promise.all([
      prisma.ocorrenciaDefesaCivil.groupBy({ by: ['status'], _count: true }),
      prisma.ocorrenciaDefesaCivil.groupBy({
        by: ['tipo'],
        where: { status: { notIn: ENCERRADAS } },
        _count: true,
      }),
      prisma.ocorrenciaDefesaCivil.count({ where: { status: 'INTERDITADA' } }),
      prisma.ocorrenciaDefesaCivil.count({ where: { createdAt: { gte: inicioAno } } }),
      prisma.abrigo.aggregate({
        where: { isActive: true },
        _sum: { capacidade: true, ocupacao: true },
        _count: true,
      }),
      prisma.familiaAtingida.count({ where: { situacao: 'EM_ABRIGO' } }),
    ]);
    return {
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      abertasPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count })),
      areasInterditadas: interditadas,
      ocorrenciasNoAno: noAno,
      abrigos: {
        total: abrigos._count,
        capacidade: abrigos._sum.capacidade || 0,
        ocupacao: abrigos._sum.ocupacao || 0,
      },
      familiasEmAbrigo,
    };
  }
}

export default new DefesaCivilService();
