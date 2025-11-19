import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// SERVIÇOS PÚBLICOS (MS-73 a MS-78)
class ServicosPublicosService {
  // MS-73: Rotas de Coleta
  async createRotaColeta(data: any) { return await prisma.rotaColeta.create({ data }); }
  async listRotasColeta(diasSemana?: string) {
    const where: any = { isActive: true };
    if (diasSemana) where.diasSemana = { has: diasSemana };
    return await prisma.rotaColeta.findMany({ where });
  }
  async updateRotaColeta(id: string, data: any) { return await prisma.rotaColeta.update({ where: { id }, data }); }

  // MS-74: Solicitações de Manutenção
  async createSolicitacaoManutencao(data: any) { return await prisma.solicitacaoManutencao.create({ data }); }
  async listSolicitacoesManutencao(tipo?: string, status?: string) {
    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    return await prisma.solicitacaoManutencao.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async updateSolicitacaoManutencao(id: string, data: any) { return await prisma.solicitacaoManutencao.update({ where: { id }, data }); }

  // MS-75: Poda de Árvores
  async createSolicitacaoPoda(data: any) { return await prisma.solicitacaoPoda.create({ data }); }
  async listSolicitacoesPoda(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return await prisma.solicitacaoPoda.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async updateSolicitacaoPoda(id: string, data: any) { return await prisma.solicitacaoPoda.update({ where: { id }, data }); }

  // MS-76: Cemitérios
  async createCemiterio(data: any) { return await prisma.cemiterio.create({ data }); }
  async listCemiterios() { return await prisma.cemiterio.findMany({ where: { isActive: true } }); }
  async updateCemiterio(id: string, data: any) { return await prisma.cemiterio.update({ where: { id }, data }); }

  // MS-77: Sepulturas
  async createSepultura(data: any) { return await prisma.sepultura.create({ data }); }
  async listSepulturas(cemiterioId?: string, status?: string) {
    const where: any = {};
    if (cemiterioId) where.cemiterioId = cemiterioId;
    if (status) where.status = status;
    return await prisma.sepultura.findMany({ where });
  }
  async updateSepultura(id: string, data: any) { return await prisma.sepultura.update({ where: { id }, data }); }

  // MS-78: Feiras Livres
  async createFeiraLivre(data: any) { return await prisma.feiraLivre.create({ data }); }
  async listFeirasLivres(diaSemana?: string) {
    const where: any = { isActive: true };
    if (diaSemana) where.diaSemana = diaSemana;
    return await prisma.feiraLivre.findMany({ where });
  }
  async updateFeiraLivre(id: string, data: any) { return await prisma.feiraLivre.update({ where: { id }, data }); }

  async getEstatisticasServicos() {
    const [totalRotas, totalManutencoes, totalPodas, totalCemiterios, totalSepulturas, totalFeiras] = await Promise.all([
      prisma.rotaColeta.count({ where: { isActive: true } }),
      prisma.solicitacaoManutencao.count(),
      prisma.solicitacaoPoda.count(),
      prisma.cemiterio.count({ where: { isActive: true } }),
      prisma.sepultura.count(),
      prisma.feiraLivre.count({ where: { isActive: true } }),
    ]);
    return { totalRotas, totalManutencoes, totalPodas, totalCemiterios, totalSepulturas, totalFeiras };
  }
}

export default new ServicosPublicosService();
