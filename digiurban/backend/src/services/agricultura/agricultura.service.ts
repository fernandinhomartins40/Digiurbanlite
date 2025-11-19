import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-22: ASSISTÊNCIA TÉCNICA RURAL
// MS-23: CONTROLE DE PRODUÇÃO AGRÍCOLA
// MS-24: GESTÃO DE FEIRAS DO PRODUTOR
// ============================================================================

class AgriculturaService {
  // ===== MS-22: VISITAS TÉCNICAS =====

  async createVisitaTecnica(data: any) {
    return await prisma.visitaTecnica.create({ data });
  }

  async listVisitasTecnicas(produtorId?: string, tecnicoId?: string) {
    const where: any = {};
    if (produtorId) where.produtorId = produtorId;
    if (tecnicoId) where.tecnicoId = tecnicoId;
    return await prisma.visitaTecnica.findMany({
      where,
      orderBy: { data: 'desc' },
    });
  }

  async updateVisitaTecnica(id: string, data: any) {
    return await prisma.visitaTecnica.update({ where: { id }, data });
  }

  // ===== MS-23: PRODUÇÃO AGRÍCOLA =====

  async createRegistroProducao(data: any) {
    return await prisma.registroProducao.create({ data });
  }

  async listRegistrosProducao(produtorId?: string, safra?: string, produto?: string) {
    const where: any = {};
    if (produtorId) where.produtorId = produtorId;
    if (safra) where.safra = safra;
    if (produto) where.produto = produto;
    return await prisma.registroProducao.findMany({
      where,
      orderBy: { dataColheita: 'desc' },
    });
  }

  async getEstatisticasProducao(safra?: string) {
    const where: any = {};
    if (safra) where.safra = safra;

    const totalProducao = await prisma.registroProducao.aggregate({
      where,
      _sum: { quantidadeKg: true, area: true, valorVenda: true },
    });

    const porProduto = await prisma.registroProducao.groupBy({
      by: ['produto'],
      where,
      _sum: { quantidadeKg: true },
      _count: true,
    });

    return {
      totalQuantidadeKg: totalProducao._sum.quantidadeKg || 0,
      totalAreaHectares: totalProducao._sum.area || 0,
      totalValorVendas: totalProducao._sum.valorVenda || 0,
      porProduto: porProduto.map(p => ({
        produto: p.produto,
        quantidadeKg: p._sum.quantidadeKg || 0,
        registros: p._count,
      })),
    };
  }

  // ===== MS-24: FEIRAS =====

  async createFeira(data: any) {
    return await prisma.feira.create({ data });
  }

  async listFeiras(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    return await prisma.feira.findMany({
      where,
      include: { boxes: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findFeiraById(id: string) {
    const feira = await prisma.feira.findUnique({
      where: { id },
      include: { boxes: true },
    });
    if (!feira) throw new Error('Feira não encontrada');
    return feira;
  }

  async updateFeira(id: string, data: any) {
    return await prisma.feira.update({ where: { id }, data });
  }

  async createBoxFeira(feiraId: string, data: any) {
    return await prisma.boxFeira.create({
      data: { ...data, feiraId },
    });
  }

  async alocarProdutorBox(boxId: string, produtorId: string) {
    return await prisma.boxFeira.update({
      where: { id: boxId },
      data: { produtorId, ativo: true },
    });
  }

  async desalocarBox(boxId: string) {
    return await prisma.boxFeira.update({
      where: { id: boxId },
      data: { produtorId: null, ativo: false },
    });
  }

  async listBoxesFeira(feiraId: string) {
    return await prisma.boxFeira.findMany({
      where: { feiraId },
      orderBy: { numero: 'asc' },
    });
  }

  async getEstatisticasFeira(feiraId: string) {
    const boxes = await this.listBoxesFeira(feiraId);
    const totalBoxes = boxes.length;
    const boxesOcupados = boxes.filter(b => b.produtorId).length;
    const boxesDisponiveis = totalBoxes - boxesOcupados;

    return {
      totalBoxes,
      boxesOcupados,
      boxesDisponiveis,
      taxaOcupacao: totalBoxes > 0 ? (boxesOcupados / totalBoxes) * 100 : 0,
    };
  }
}

export default new AgriculturaService();
