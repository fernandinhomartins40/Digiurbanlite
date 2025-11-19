import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-10: GESTÃO DE MERENDA ESCOLAR
// ============================================================================

interface CreateCardapioDTO {
  unidadeEducacaoId: string;
  diaSemana: number; // 0-6
  turno: string;
  refeicao: string;
  alimentos: Array<{ alimento: string; quantidade: number; unidade: string }>;
  valorNutricional?: any;
  alergenicos?: string[];
}

interface CreateEstoqueAlimentoDTO {
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  validade: Date;
  lote?: string;
  fornecedor?: string;
}

interface RegistrarConsumoDTO {
  unidadeEducacaoId: string;
  data: Date;
  turno: string;
  refeicao: string;
  alunosAtendidos: number;
  alimentosUsados: Array<{ alimentoId: string; quantidade: number }>;
  observacoes?: string;
  registradoPor: string;
}

class MerendaEscolarService {
  // ===== CARDÁPIOS =====

  async createCardapio(data: CreateCardapioDTO) {
    const cardapio = await prisma.cardapioMerenda.create({
      data,
    });
    return cardapio;
  }

  async findCardapioById(id: string) {
    const cardapio = await prisma.cardapioMerenda.findUnique({
      where: { id },
    });
    if (!cardapio) throw new Error('Cardápio não encontrado');
    return cardapio;
  }

  async listCardapios(unidadeEducacaoId?: string, diaSemana?: number) {
    const where: any = { isActive: true };
    if (unidadeEducacaoId) where.unidadeEducacaoId = unidadeEducacaoId;
    if (diaSemana !== undefined) where.diaSemana = diaSemana;

    return await prisma.cardapioMerenda.findMany({
      where,
      orderBy: [{ diaSemana: 'asc' }, { turno: 'asc' }],
    });
  }

  async updateCardapio(id: string, data: Partial<CreateCardapioDTO>) {
    await this.findCardapioById(id);
    return await prisma.cardapioMerenda.update({
      where: { id },
      data,
    });
  }

  async deleteCardapio(id: string) {
    await this.findCardapioById(id);
    return await prisma.cardapioMerenda.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===== ESTOQUE =====

  async createEstoqueAlimento(data: CreateEstoqueAlimentoDTO) {
    const estoque = await prisma.estoqueAlimento.create({
      data,
    });
    return estoque;
  }

  async findEstoqueById(id: string) {
    const estoque = await prisma.estoqueAlimento.findUnique({
      where: { id },
    });
    if (!estoque) throw new Error('Estoque não encontrado');
    return estoque;
  }

  async listEstoque(categoria?: string) {
    const where: any = { isActive: true };
    if (categoria) where.categoria = categoria;

    return await prisma.estoqueAlimento.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }

  async listEstoqueProximoVencimento(dias: number = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    return await prisma.estoqueAlimento.findMany({
      where: {
        isActive: true,
        validade: { lte: dataLimite },
      },
      orderBy: { validade: 'asc' },
    });
  }

  async updateEstoque(id: string, data: Partial<CreateEstoqueAlimentoDTO>) {
    await this.findEstoqueById(id);
    return await prisma.estoqueAlimento.update({
      where: { id },
      data,
    });
  }

  async ajustarQuantidadeEstoque(id: string, ajuste: number) {
    const estoque = await this.findEstoqueById(id);
    const novaQuantidade = estoque.quantidade + ajuste;

    if (novaQuantidade < 0) {
      throw new Error('Quantidade insuficiente em estoque');
    }

    return await prisma.estoqueAlimento.update({
      where: { id },
      data: { quantidade: novaQuantidade },
    });
  }

  // ===== CONSUMO =====

  async registrarConsumo(data: RegistrarConsumoDTO) {
    // Verificar e ajustar estoque
    for (const item of data.alimentosUsados) {
      await this.ajustarQuantidadeEstoque(item.alimentoId, -item.quantidade);
    }

    const consumo = await prisma.consumoMerenda.create({
      data,
    });

    return consumo;
  }

  async listConsumo(unidadeEducacaoId?: string, dataInicio?: Date, dataFim?: Date) {
    const where: any = {};
    if (unidadeEducacaoId) where.unidadeEducacaoId = unidadeEducacaoId;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    return await prisma.consumoMerenda.findMany({
      where,
      orderBy: { data: 'desc' },
    });
  }

  async getStatistics(unidadeEducacaoId?: string) {
    const where: any = {};
    if (unidadeEducacaoId) where.unidadeEducacaoId = unidadeEducacaoId;

    const totalConsumos = await prisma.consumoMerenda.count({ where });

    const alunosAtendidos = await prisma.consumoMerenda.aggregate({
      where,
      _sum: { alunosAtendidos: true },
    });

    const estoqueTotal = await prisma.estoqueAlimento.count({
      where: { isActive: true },
    });

    const estoqueVencendo = await this.listEstoqueProximoVencimento(30);

    return {
      totalConsumos,
      totalAlunosAtendidos: alunosAtendidos._sum.alunosAtendidos || 0,
      estoqueTotal,
      alimentosVencendo: estoqueVencendo.length,
    };
  }
}

export default new MerendaEscolarService();
