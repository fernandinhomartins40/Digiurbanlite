import { PrismaClient, TipoInsumoAgricola } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-03: DISTRIBUIÇÃO DE SEMENTES E MUDAS
// ============================================================================

// ESTOQUE DE SEMENTES
interface CreateEstoqueSementeDTO {
  tipo: TipoInsumoAgricola;
  nome: string;
  especie?: string;
  variedade?: string;
  quantidadeAtual: number;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueMaximo?: number;
  numeroLote: string;
  dataEntrada: Date;
  fornecedor?: string;
  notaFiscal?: string;
  valorUnitario?: number;
  dataValidade?: Date;
  taxaGerminacao?: number;
  tratamento?: string;
  certificacao?: string;
  localArmazenamento?: string;
  condicaoArmazenamento?: string;
  observacoes?: string;
}

interface UpdateEstoqueSementeDTO {
  nome?: string;
  especie?: string;
  variedade?: string;
  quantidadeAtual?: number;
  unidadeMedida?: string;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  fornecedor?: string;
  valorUnitario?: number;
  dataValidade?: Date;
  taxaGerminacao?: number;
  tratamento?: string;
  certificacao?: string;
  localArmazenamento?: string;
  condicaoArmazenamento?: string;
  observacoes?: string;
  isActive?: boolean;
}

// DISTRIBUIÇÃO
interface CreateDistribuicaoDTO {
  produtorId: string;
  propriedadeId?: string;
  estoqueId: string;
  quantidade: number;
  unidadeMedida: string;
  dataDistribuicao?: Date;
  finalidade: string;
  areaPrevista?: number;
  culturaPrevista?: string;
  limiteAnual?: number;
  entregadoPor: string;
  observacoes?: string;
}

class SementesService {
  // ========== ESTOQUE ==========

  // Criar item de estoque
  async createEstoque(data: CreateEstoqueSementeDTO) {
    // Verificar se lote já existe
    const existingLote = await prisma.estoqueSemente.findUnique({
      where: { numeroLote: data.numeroLote },
    });

    if (existingLote) {
      throw new Error('Número de lote já cadastrado');
    }

    const estoque = await prisma.estoqueSemente.create({
      data,
    });

    return estoque;
  }

  // Buscar item de estoque por ID
  async findEstoqueById(id: string) {
    const estoque = await prisma.estoqueSemente.findUnique({
      where: { id },
      include: {
        distribuicoes: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            produtor: {
              select: {
                id: true,
                nome: true,
                cpf: true,
              },
            },
          },
        },
      },
    });

    if (!estoque) {
      throw new Error('Item de estoque não encontrado');
    }

    return estoque;
  }

  // Buscar por lote
  async findByLote(numeroLote: string) {
    const estoque = await prisma.estoqueSemente.findUnique({
      where: { numeroLote },
    });

    if (!estoque) {
      throw new Error('Lote não encontrado');
    }

    return estoque;
  }

  // Listar estoque ativo
  async listEstoqueAtivo() {
    const estoque = await prisma.estoqueSemente.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });

    return estoque;
  }

  // Listar por tipo
  async listByTipo(tipo: TipoInsumoAgricola) {
    const estoque = await prisma.estoqueSemente.findMany({
      where: {
        tipo,
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return estoque;
  }

  // Listar estoque baixo
  async listEstoqueBaixo() {
    const estoque = await prisma.estoqueSemente.findMany({
      where: {
        isActive: true,
      },
    });

    // Filtrar os que estão abaixo do mínimo
    const baixo = estoque.filter((item) => item.quantidadeAtual <= item.estoqueMinimo);

    return baixo;
  }

  // Listar próximos ao vencimento
  async listProximosVencimento(diasAntecedencia: number = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    const estoque = await prisma.estoqueSemente.findMany({
      where: {
        isActive: true,
        dataValidade: {
          lte: dataLimite,
        },
      },
      orderBy: { dataValidade: 'asc' },
    });

    return estoque;
  }

  // Atualizar estoque
  async updateEstoque(id: string, data: UpdateEstoqueSementeDTO) {
    const estoque = await this.findEstoqueById(id);

    const updated = await prisma.estoqueSemente.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Adicionar quantidade (entrada)
  async addQuantidade(id: string, quantidade: number) {
    const estoque = await this.findEstoqueById(id);

    const updated = await prisma.estoqueSemente.update({
      where: { id },
      data: {
        quantidadeAtual: estoque.quantidadeAtual + quantidade,
      },
    });

    return updated;
  }

  // Reduzir quantidade (saída)
  async removeQuantidade(id: string, quantidade: number) {
    const estoque = await this.findEstoqueById(id);

    if (estoque.quantidadeAtual < quantidade) {
      throw new Error('Quantidade insuficiente em estoque');
    }

    const updated = await prisma.estoqueSemente.update({
      where: { id },
      data: {
        quantidadeAtual: estoque.quantidadeAtual - quantidade,
      },
    });

    return updated;
  }

  // Estatísticas de estoque
  async getEstoqueStatistics() {
    const total = await prisma.estoqueSemente.count();
    const ativos = await prisma.estoqueSemente.count({
      where: { isActive: true },
    });

    const totalSementes = await prisma.estoqueSemente.count({
      where: { tipo: 'SEMENTE', isActive: true },
    });

    const totalMudas = await prisma.estoqueSemente.count({
      where: { tipo: 'MUDA', isActive: true },
    });

    const baixo = (await this.listEstoqueBaixo()).length;

    const proximosVencimento = (await this.listProximosVencimento()).length;

    return {
      total,
      ativos,
      inativos: total - ativos,
      sementes: totalSementes,
      mudas: totalMudas,
      estoqueBaixo: baixo,
      proximosVencimento,
    };
  }

  // ========== DISTRIBUIÇÃO ==========

  // Criar distribuição
  async createDistribuicao(data: CreateDistribuicaoDTO) {
    // Verificar se produtor existe
    const produtor = await prisma.produtorRural.findUnique({
      where: { id: data.produtorId },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    // Verificar se propriedade existe (se informada)
    if (data.propriedadeId) {
      const propriedade = await prisma.propriedadeRural.findUnique({
        where: { id: data.propriedadeId },
      });

      if (!propriedade) {
        throw new Error('Propriedade rural não encontrada');
      }
    }

    // Verificar estoque disponível
    const estoque = await this.findEstoqueById(data.estoqueId);

    if (estoque.quantidadeAtual < data.quantidade) {
      throw new Error(
        `Quantidade insuficiente em estoque. Disponível: ${estoque.quantidadeAtual} ${estoque.unidadeMedida}`
      );
    }

    // Verificar limite anual (se existir)
    if (data.limiteAnual) {
      const anoAtual = new Date().getFullYear();
      const inicioAno = new Date(anoAtual, 0, 1);

      const distribuicoesAno = await prisma.distribuicaoSemente.findMany({
        where: {
          produtorId: data.produtorId,
          estoqueId: data.estoqueId,
          createdAt: { gte: inicioAno },
        },
      });

      const totalDistribuidoAno = distribuicoesAno.reduce(
        (sum, dist) => sum + dist.quantidade,
        0
      );

      if (totalDistribuidoAno + data.quantidade > data.limiteAnual) {
        throw new Error(
          `Limite anual excedido. Já distribuído: ${totalDistribuidoAno} ${estoque.unidadeMedida}. Limite: ${data.limiteAnual} ${estoque.unidadeMedida}`
        );
      }
    }

    // Criar distribuição
    const distribuicao = await prisma.distribuicaoSemente.create({
      data: {
        ...data,
        dataDistribuicao: data.dataDistribuicao || new Date(),
        quantidadeAnoAtual: data.quantidade,
      },
      include: {
        produtor: true,
        estoque: true,
        propriedade: true,
      },
    });

    // Reduzir quantidade em estoque
    await this.removeQuantidade(data.estoqueId, data.quantidade);

    return distribuicao;
  }

  // Buscar distribuição por ID
  async findDistribuicaoById(id: string) {
    const distribuicao = await prisma.distribuicaoSemente.findUnique({
      where: { id },
      include: {
        produtor: true,
        estoque: true,
        propriedade: true,
      },
    });

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada');
    }

    return distribuicao;
  }

  // Listar distribuições por produtor
  async findDistribuicoesByProdutor(produtorId: string) {
    const distribuicoes = await prisma.distribuicaoSemente.findMany({
      where: { produtorId },
      include: {
        estoque: true,
        propriedade: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return distribuicoes;
  }

  // Listar todas as distribuições
  async listDistribuicoes(filters?: { dataInicio?: Date; dataFim?: Date }) {
    const where: any = {};

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataDistribuicao = {};

      if (filters.dataInicio) {
        where.dataDistribuicao.gte = filters.dataInicio;
      }

      if (filters.dataFim) {
        where.dataDistribuicao.lte = filters.dataFim;
      }
    }

    const distribuicoes = await prisma.distribuicaoSemente.findMany({
      where,
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        estoque: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            unidadeMedida: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return distribuicoes;
  }

  // Estatísticas de distribuição
  async getDistribuicaoStatistics(ano?: number) {
    const anoConsiderado = ano || new Date().getFullYear();
    const inicioAno = new Date(anoConsiderado, 0, 1);
    const fimAno = new Date(anoConsiderado, 11, 31, 23, 59, 59);

    const totalDistribuicoes = await prisma.distribuicaoSemente.count({
      where: {
        createdAt: { gte: inicioAno, lte: fimAno },
      },
    });

    const produtoresAtendidos = await prisma.distribuicaoSemente.findMany({
      where: {
        createdAt: { gte: inicioAno, lte: fimAno },
      },
      distinct: ['produtorId'],
      select: { produtorId: true },
    });

    const distribuicoesPorTipo = await prisma.$queryRaw<any[]>`
      SELECT
        es."tipo",
        COUNT(*)::int as "quantidade",
        SUM(ds."quantidade")::float as "totalDistribuido"
      FROM "distribuicoes_sementes" ds
      JOIN "estoque_sementes" es ON ds."estoqueId" = es.id
      WHERE ds."createdAt" >= ${inicioAno} AND ds."createdAt" <= ${fimAno}
      GROUP BY es."tipo"
    `;

    return {
      ano: anoConsiderado,
      totalDistribuicoes,
      produtoresAtendidos: produtoresAtendidos.length,
      porTipo: distribuicoesPorTipo,
    };
  }

  // Cancelar distribuição (apenas se muito recente)
  async cancelarDistribuicao(id: string) {
    const distribuicao = await this.findDistribuicaoById(id);

    // Verificar se foi criada há menos de 24 horas
    const horasDesdeDistribuicao =
      (new Date().getTime() - distribuicao.createdAt.getTime()) / (1000 * 60 * 60);

    if (horasDesdeDistribuicao > 24) {
      throw new Error('Não é possível cancelar distribuições antigas (mais de 24h)');
    }

    // Devolver ao estoque
    await this.addQuantidade(distribuicao.estoqueId, distribuicao.quantidade);

    // Deletar distribuição
    await prisma.distribuicaoSemente.delete({
      where: { id },
    });

    return { message: 'Distribuição cancelada com sucesso' };
  }
}

export default new SementesService();
