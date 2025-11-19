import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// PLANEJAMENTO URBANO (MS-67 a MS-72)
class PlanejamentoService {
  // MS-67: Zonas Urbanas
  async createZonaUrbana(data: any) { return await prisma.zonaUrbana.create({ data }); }
  async listZonasUrbanas(tipo?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    return await prisma.zonaUrbana.findMany({ where });
  }
  async updateZonaUrbana(id: string, data: any) { return await prisma.zonaUrbana.update({ where: { id }, data }); }

  // MS-68: Licenças de Obra
  async createLicencaObra(data: any) { return await prisma.licencaObra.create({ data }); }
  async listLicencasObra(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return await prisma.licencaObra.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async updateLicencaObra(id: string, data: any) { return await prisma.licencaObra.update({ where: { id }, data }); }
  async aprovarLicenca(id: string) { return await this.updateLicencaObra(id, { status: 'APROVADA' }); }
  async rejeitarLicenca(id: string) { return await this.updateLicencaObra(id, { status: 'REJEITADA' }); }

  // MS-69: Imóveis Urbanos
  async createImovelUrbano(data: any) { return await prisma.imovelUrbano.create({ data }); }
  async listImoveisUrbanos() { return await prisma.imovelUrbano.findMany({ where: { isActive: true } }); }
  async updateImovelUrbano(id: string, data: any) { return await prisma.imovelUrbano.update({ where: { id }, data }); }

  // MS-70: Loteamentos
  async createLoteamento(data: any) { return await prisma.loteamento.create({ data }); }
  async listLoteamentos(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return await prisma.loteamento.findMany({ where });
  }
  async updateLoteamento(id: string, data: any) { return await prisma.loteamento.update({ where: { id }, data }); }

  async getEstatisticasPlanejamento() {
    const [totalZonas, totalLicencas, totalImoveis, totalLoteamentos] = await Promise.all([
      prisma.zonaUrbana.count({ where: { isActive: true } }),
      prisma.licencaObra.count(),
      prisma.imovelUrbano.count({ where: { isActive: true } }),
      prisma.loteamento.count({ where: { isActive: true } }),
    ]);
    return { totalZonas, totalLicencas, totalImoveis, totalLoteamentos };
  }
}

export default new PlanejamentoService();
