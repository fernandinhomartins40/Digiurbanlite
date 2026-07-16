import { prisma } from '../../lib/prisma';

/**
 * Serviço do app de Agricultura (Fase 1C do plano de apps).
 * Contrato definido pela UI existente (frontend lib/hooks/use-agricultura-api.ts).
 */
class AgriculturaService {
  // ==================== PRODUTORES RURAIS ====================

  async listProdutores(filters?: { isActive?: boolean; search?: string }) {
    return prisma.produtorRural.findMany({
      where: {
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
        ...(filters?.search
          ? {
              OR: [
                { nome: { contains: filters.search, mode: 'insensitive' as const } },
                { cpf: { contains: filters.search } },
                { dap: { contains: filters.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { nome: 'asc' },
      take: 500,
    });
  }

  async findProdutorById(id: string) {
    return prisma.produtorRural.findFirst({
      where: { id },
      include: {
        propriedades: { where: { isActive: true } },
        solicitacoes: { orderBy: { createdAt: 'desc' }, take: 20 },
        distribuicoes: { orderBy: { dataDistribuicao: 'desc' }, take: 20, include: { estoque: true } },
      },
    });
  }

  async createProdutor(data: {
    citizenId?: string;
    cpf: string;
    nome: string;
    celular?: string;
    email?: string;
    atividadePrincipal?: string;
    dap?: string;
    car?: string;
    observacoes?: string;
    protocolId?: string;
  }) {
    if (!data.cpf || !data.nome) {
      throw new Error('CPF e nome são obrigatórios');
    }
    const cpfLimpo = data.cpf.replace(/\D/g, '');
    const existente = await prisma.produtorRural.findFirst({ where: { cpf: cpfLimpo } });
    if (existente) {
      throw new Error('Já existe produtor cadastrado com este CPF');
    }
    return prisma.produtorRural.create({
      data: {
        citizenId: data.citizenId || null,
        cpf: cpfLimpo,
        nome: data.nome,
        celular: data.celular,
        email: data.email,
        atividadePrincipal: data.atividadePrincipal,
        dap: data.dap,
        car: data.car,
        observacoes: data.observacoes,
        protocolId: data.protocolId,
      },
    });
  }

  async updateProdutor(id: string, data: any) {
    const { id: _id, tenantId: _t, createdAt: _c, updatedAt: _u, cpf, ...rest } = data || {};
    return prisma.produtorRural.update({
      where: { id },
      data: {
        ...rest,
        ...(cpf ? { cpf: String(cpf).replace(/\D/g, '') } : {}),
      },
    });
  }

  async deactivateProdutor(id: string) {
    return prisma.produtorRural.update({ where: { id }, data: { isActive: false } });
  }

  async getProdutorStatistics() {
    const [total, ativos, comCAR, semDocumentos] = await Promise.all([
      prisma.produtorRural.count(),
      prisma.produtorRural.count({ where: { isActive: true } }),
      prisma.produtorRural.count({ where: { car: { not: null } } }),
      prisma.produtorRural.count({ where: { isActive: true, dap: null, car: null } }),
    ]);
    return { total, ativos, comCAR, comPendencias: semDocumentos };
  }

  async emitirCarteirinha(id: string) {
    const produtor = await prisma.produtorRural.findFirst({ where: { id } });
    if (!produtor) throw new Error('Produtor não encontrado');
    if (produtor.numeroCarteirinha) return produtor;

    const ano = new Date().getFullYear();
    const emitidas = await prisma.produtorRural.count({
      where: { numeroCarteirinha: { startsWith: `PR-${ano}-` } },
    });
    const numero = `PR-${ano}-${String(emitidas + 1).padStart(4, '0')}`;
    return prisma.produtorRural.update({
      where: { id },
      data: { numeroCarteirinha: numero, carteirinhaEmitidaEm: new Date() },
    });
  }

  async setFotoProdutor(id: string, fotoUrl: string) {
    return prisma.produtorRural.update({ where: { id }, data: { fotoUrl } });
  }

  // ==================== PROPRIEDADES RURAIS ====================

  async listPropriedades(filters?: { produtorId?: string; isActive?: boolean }) {
    return prisma.propriedadeRural.findMany({
      where: {
        ...(filters?.produtorId ? { produtorId: filters.produtorId } : {}),
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      include: { produtor: { select: { id: true, nome: true, cpf: true } } },
      orderBy: { nome: 'asc' },
      take: 500,
    });
  }

  async findPropriedadeById(id: string) {
    return prisma.propriedadeRural.findFirst({
      where: { id },
      include: { produtor: true, solicitacoes: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async createPropriedade(data: any) {
    if (!data?.produtorId || !data?.nome) {
      throw new Error('produtorId e nome são obrigatórios');
    }
    const produtor = await prisma.produtorRural.findFirst({ where: { id: data.produtorId } });
    if (!produtor) throw new Error('Produtor não encontrado');
    return prisma.propriedadeRural.create({
      data: {
        produtorId: data.produtorId,
        nome: data.nome,
        endereco: data.endereco,
        bairro: data.bairro,
        areaHectares: data.areaHectares != null ? Number(data.areaHectares) : null,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
        car: data.car,
        atividades: data.atividades,
        fotos: data.fotos,
      },
    });
  }

  async updatePropriedade(id: string, data: any) {
    const { id: _id, tenantId: _t, produtorId: _p, createdAt: _c, updatedAt: _u, produtor: _pr, ...rest } =
      data || {};
    return prisma.propriedadeRural.update({ where: { id }, data: rest });
  }

  async addFotoPropriedade(id: string, foto: any) {
    const propriedade = await prisma.propriedadeRural.findFirst({ where: { id } });
    if (!propriedade) throw new Error('Propriedade não encontrada');
    const fotos = Array.isArray(propriedade.fotos) ? (propriedade.fotos as any[]) : [];
    fotos.push({ ...foto, data: new Date().toISOString() });
    return prisma.propriedadeRural.update({ where: { id }, data: { fotos } });
  }

  async getPropriedadeStatistics() {
    const [total, ativas, area, comCAR] = await Promise.all([
      prisma.propriedadeRural.count(),
      prisma.propriedadeRural.count({ where: { isActive: true } }),
      prisma.propriedadeRural.aggregate({ _sum: { areaHectares: true } }),
      prisma.propriedadeRural.count({ where: { car: { not: null } } }),
    ]);
    return { total, ativas, areaTotalHectares: area._sum.areaHectares || 0, comCAR };
  }

  // ==================== TÉCNICOS ====================

  async listTecnicos() {
    return prisma.tecnicoAgricola.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findTecnicoById(id: string) {
    return prisma.tecnicoAgricola.findFirst({
      where: { id },
      include: {
        visitas: { orderBy: { dataAgendada: 'desc' }, take: 20 },
        solicitacoes: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  async createTecnico(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    return prisma.tecnicoAgricola.create({
      data: {
        nome: data.nome,
        registro: data.registro,
        especialidade: data.especialidade,
        telefone: data.telefone,
        email: data.email,
        userId: data.userId,
      },
    });
  }

  // ==================== SOLICITAÇÕES DE ASSISTÊNCIA ====================

  async listSolicitacoes(filters?: { status?: string; produtorId?: string; tecnicoId?: string }) {
    return prisma.solicitacaoAssistenciaTecnica.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.produtorId ? { produtorId: filters.produtorId } : {}),
        ...(filters?.tecnicoId ? { tecnicoId: filters.tecnicoId } : {}),
      },
      include: {
        produtor: { select: { id: true, nome: true, cpf: true, celular: true } },
        propriedade: { select: { id: true, nome: true, bairro: true } },
        tecnico: { select: { id: true, nome: true } },
        visitas: { orderBy: { dataAgendada: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async findSolicitacaoById(id: string) {
    return prisma.solicitacaoAssistenciaTecnica.findFirst({
      where: { id },
      include: {
        produtor: true,
        propriedade: true,
        tecnico: true,
        visitas: { orderBy: { dataAgendada: 'desc' } },
      },
    });
  }

  async createSolicitacao(data: any) {
    if (!data?.produtorId || !data?.tipoAssistencia) {
      throw new Error('produtorId e tipoAssistencia são obrigatórios');
    }
    return prisma.solicitacaoAssistenciaTecnica.create({
      data: {
        produtorId: data.produtorId,
        propriedadeId: data.propriedadeId,
        tecnicoId: data.tecnicoId,
        tipoAssistencia: data.tipoAssistencia,
        descricao: data.descricao,
        prioridade: data.prioridade || 'NORMAL',
        observacoes: data.observacoes,
        protocolId: data.protocolId,
      },
    });
  }

  async updateSolicitacao(id: string, data: any) {
    const {
      id: _id,
      tenantId: _t,
      createdAt: _c,
      updatedAt: _u,
      produtor: _p,
      propriedade: _pp,
      tecnico: _te,
      visitas: _v,
      ...rest
    } = data || {};
    return prisma.solicitacaoAssistenciaTecnica.update({ where: { id }, data: rest });
  }

  async getSolicitacaoStatistics(ano?: number) {
    const anoRef = ano || new Date().getFullYear();
    const inicio = new Date(anoRef, 0, 1);
    const fim = new Date(anoRef + 1, 0, 1);
    const [porStatus, totalVisitas, visitasConcluidas] = await Promise.all([
      prisma.solicitacaoAssistenciaTecnica.groupBy({
        by: ['status'],
        where: { createdAt: { gte: inicio, lt: fim } },
        _count: true,
      }),
      prisma.visitaAssistenciaTecnica.count({
        where: { dataAgendada: { gte: inicio, lt: fim } },
      }),
      prisma.visitaAssistenciaTecnica.count({
        where: { dataAgendada: { gte: inicio, lt: fim }, status: 'CONCLUIDA' },
      }),
    ]);
    return {
      ano: anoRef,
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      totalVisitas,
      visitasConcluidas,
    };
  }

  // ==================== VISITAS ====================

  async findVisitaById(id: string) {
    return prisma.visitaAssistenciaTecnica.findFirst({
      where: { id },
      include: { solicitacao: { include: { produtor: true, propriedade: true } }, tecnico: true },
    });
  }

  async createVisita(data: any) {
    if (!data?.solicitacaoId || !data?.dataAgendada) {
      throw new Error('solicitacaoId e dataAgendada são obrigatórios');
    }
    const solicitacao = await prisma.solicitacaoAssistenciaTecnica.findFirst({
      where: { id: data.solicitacaoId },
    });
    if (!solicitacao) throw new Error('Solicitação não encontrada');

    const visita = await prisma.visitaAssistenciaTecnica.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        tecnicoId: data.tecnicoId || solicitacao.tecnicoId,
        dataAgendada: new Date(data.dataAgendada),
        observacoes: data.observacoes,
      },
    });
    await prisma.solicitacaoAssistenciaTecnica.update({
      where: { id: solicitacao.id },
      data: {
        status: 'AGENDADA',
        ...(data.tecnicoId ? { tecnicoId: data.tecnicoId } : {}),
      },
    });
    return visita;
  }

  async updateVisita(id: string, data: any) {
    const { id: _id, tenantId: _t, createdAt: _c, updatedAt: _u, solicitacao: _s, tecnico: _te, ...rest } =
      data || {};
    if (rest.dataAgendada) rest.dataAgendada = new Date(rest.dataAgendada);
    return prisma.visitaAssistenciaTecnica.update({ where: { id }, data: rest });
  }

  async confirmarVisita(id: string) {
    return prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: { status: 'CONFIRMADA' },
    });
  }

  async iniciarVisita(id: string) {
    const visita = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: { status: 'EM_ANDAMENTO', dataInicio: new Date() },
    });
    await prisma.solicitacaoAssistenciaTecnica.update({
      where: { id: visita.solicitacaoId },
      data: { status: 'EM_ATENDIMENTO' },
    });
    return visita;
  }

  async concluirVisita(id: string, data: { diagnostico?: string; recomendacoes?: string; fotos?: any; observacoes?: string }) {
    const visita = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: {
        status: 'CONCLUIDA',
        dataConclusao: new Date(),
        diagnostico: data?.diagnostico,
        recomendacoes: data?.recomendacoes,
        fotos: data?.fotos,
        observacoes: data?.observacoes,
      },
    });
    await prisma.solicitacaoAssistenciaTecnica.update({
      where: { id: visita.solicitacaoId },
      data: { status: 'CONCLUIDA' },
    });
    return visita;
  }

  // ==================== ESTOQUE DE SEMENTES/MUDAS ====================

  async listEstoque() {
    return prisma.estoqueSemente.findMany({
      where: { isActive: true },
      orderBy: [{ cultura: 'asc' }, { variedade: 'asc' }],
    });
  }

  async findEstoqueById(id: string) {
    return prisma.estoqueSemente.findFirst({
      where: { id },
      include: {
        distribuicoes: {
          orderBy: { dataDistribuicao: 'desc' },
          take: 30,
          include: { produtor: { select: { id: true, nome: true, cpf: true } } },
        },
      },
    });
  }

  async createEstoque(data: any) {
    if (!data?.cultura) throw new Error('cultura é obrigatória');
    return prisma.estoqueSemente.create({
      data: {
        tipo: data.tipo || 'SEMENTE',
        cultura: data.cultura,
        variedade: data.variedade,
        unidadeMedida: data.unidadeMedida || 'kg',
        quantidade: data.quantidade != null ? Number(data.quantidade) : 0,
        estoqueMinimo: data.estoqueMinimo != null ? Number(data.estoqueMinimo) : 0,
        lote: data.lote,
        validade: data.validade ? new Date(data.validade) : null,
        origem: data.origem,
        observacoes: data.observacoes,
      },
    });
  }

  async updateEstoque(id: string, data: any) {
    const { id: _id, tenantId: _t, createdAt: _c, updatedAt: _u, distribuicoes: _d, ...rest } = data || {};
    if (rest.validade) rest.validade = new Date(rest.validade);
    if (rest.quantidade != null) rest.quantidade = Number(rest.quantidade);
    if (rest.estoqueMinimo != null) rest.estoqueMinimo = Number(rest.estoqueMinimo);
    return prisma.estoqueSemente.update({ where: { id }, data: rest });
  }

  async getEstoqueBaixo() {
    const itens = await prisma.estoqueSemente.findMany({ where: { isActive: true } });
    return itens.filter((i) => i.quantidade <= i.estoqueMinimo);
  }

  async getEstoqueStatistics() {
    const itens = await prisma.estoqueSemente.findMany({ where: { isActive: true } });
    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() + 30);
    return {
      totalItens: itens.length,
      estoqueBaixo: itens.filter((i) => i.quantidade <= i.estoqueMinimo).length,
      proximosVencimento: itens.filter((i) => i.validade && i.validade <= trintaDias).length,
      porTipo: ['SEMENTE', 'MUDA'].map((tipo) => ({
        tipo,
        itens: itens.filter((i) => i.tipo === tipo).length,
      })),
    };
  }

  // ==================== DISTRIBUIÇÕES ====================

  async listDistribuicoes(filters?: { produtorId?: string; estoqueId?: string; safra?: string }) {
    return prisma.distribuicaoSemente.findMany({
      where: {
        ...(filters?.produtorId ? { produtorId: filters.produtorId } : {}),
        ...(filters?.estoqueId ? { estoqueId: filters.estoqueId } : {}),
        ...(filters?.safra ? { safra: filters.safra } : {}),
      },
      include: {
        produtor: { select: { id: true, nome: true, cpf: true } },
        estoque: { select: { id: true, cultura: true, variedade: true, tipo: true, unidadeMedida: true } },
      },
      orderBy: { dataDistribuicao: 'desc' },
      take: 300,
    });
  }

  async createDistribuicao(data: any) {
    if (!data?.estoqueId || !data?.produtorId || !data?.quantidade) {
      throw new Error('estoqueId, produtorId e quantidade são obrigatórios');
    }
    const quantidade = Number(data.quantidade);
    if (!(quantidade > 0)) throw new Error('Quantidade deve ser maior que zero');

    return prisma.$transaction(async (tx) => {
      const estoque = await tx.estoqueSemente.findFirst({ where: { id: data.estoqueId } });
      if (!estoque) throw new Error('Item de estoque não encontrado');
      if (estoque.quantidade < quantidade) {
        throw new Error(
          `Estoque insuficiente: disponível ${estoque.quantidade} ${estoque.unidadeMedida}`
        );
      }
      const produtor = await tx.produtorRural.findFirst({ where: { id: data.produtorId } });
      if (!produtor) throw new Error('Produtor não encontrado');

      await tx.estoqueSemente.update({
        where: { id: estoque.id },
        data: { quantidade: estoque.quantidade - quantidade },
      });
      return tx.distribuicaoSemente.create({
        data: {
          estoqueId: estoque.id,
          produtorId: produtor.id,
          quantidade,
          dataDistribuicao: data.dataDistribuicao ? new Date(data.dataDistribuicao) : new Date(),
          safra: data.safra,
          responsavelId: data.responsavelId,
          observacoes: data.observacoes,
          protocolId: data.protocolId,
        },
      });
    });
  }

  async getDistribuicaoStatistics(ano?: number) {
    const anoRef = ano || new Date().getFullYear();
    const inicio = new Date(anoRef, 0, 1);
    const fim = new Date(anoRef + 1, 0, 1);
    const distribuicoes = await prisma.distribuicaoSemente.findMany({
      where: { dataDistribuicao: { gte: inicio, lt: fim } },
      include: { estoque: { select: { cultura: true, unidadeMedida: true } } },
    });
    const porCultura = new Map<string, { cultura: string; quantidade: number; distribuicoes: number }>();
    for (const d of distribuicoes) {
      const chave = d.estoque?.cultura || 'Outros';
      const atual = porCultura.get(chave) || { cultura: chave, quantidade: 0, distribuicoes: 0 };
      atual.quantidade += d.quantidade;
      atual.distribuicoes += 1;
      porCultura.set(chave, atual);
    }
    return {
      ano: anoRef,
      totalDistribuicoes: distribuicoes.length,
      produtoresAtendidos: new Set(distribuicoes.map((d) => d.produtorId)).size,
      porCultura: Array.from(porCultura.values()),
    };
  }
}

export default new AgriculturaService();
