import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MEIO AMBIENTE (MS-43 a MS-48)
// ============================================================================

class MeioAmbienteService {
  // MS-43: Árvores Urbanas
  async createArvoreUrbana(data: any) {
    return await prisma.arvoreUrbana.create({ data });
  }

  async listArvoresUrbanas(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return await prisma.arvoreUrbana.findMany({ where });
  }

  async findArvoreUrbanaById(id: string) {
    const arvore = await prisma.arvoreUrbana.findUnique({ where: { id } });
    if (!arvore) throw new Error('Árvore não encontrada');
    return arvore;
  }

  async updateArvoreUrbana(id: string, data: any) {
    await this.findArvoreUrbanaById(id);
    return await prisma.arvoreUrbana.update({ where: { id }, data });
  }

  // MS-44: Parques e Praças
  async createParquePraca(data: any) {
    return await prisma.parquePraca.create({ data });
  }

  async listParquesPracas() {
    return await prisma.parquePraca.findMany({ where: { isActive: true } });
  }

  async findParquePracaById(id: string) {
    const parque = await prisma.parquePraca.findUnique({ where: { id } });
    if (!parque) throw new Error('Parque/Praça não encontrado');
    return parque;
  }

  async updateParquePraca(id: string, data: any) {
    await this.findParquePracaById(id);
    return await prisma.parquePraca.update({ where: { id }, data });
  }

  // MS-45: Pontos de Coleta
  async createPontoColeta(data: any) {
    return await prisma.pontoColeta.create({ data });
  }

  async listPontosColeta(tipoMaterial?: string) {
    const where: any = { isActive: true };
    if (tipoMaterial) where.tipoMaterial = tipoMaterial;
    return await prisma.pontoColeta.findMany({ where });
  }

  async findPontoColetaById(id: string) {
    const ponto = await prisma.pontoColeta.findUnique({ where: { id } });
    if (!ponto) throw new Error('Ponto de coleta não encontrado');
    return ponto;
  }

  async updatePontoColeta(id: string, data: any) {
    await this.findPontoColetaById(id);
    return await prisma.pontoColeta.update({ where: { id }, data });
  }

  // MS-46: Licenças Ambientais
  async createLicencaAmbiental(data: any) {
    return await prisma.licencaAmbiental.create({ data });
  }

  async listLicencasAmbientais(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return await prisma.licencaAmbiental.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findLicencaAmbientalById(id: string) {
    const licenca = await prisma.licencaAmbiental.findUnique({ where: { id } });
    if (!licenca) throw new Error('Licença ambiental não encontrada');
    return licenca;
  }

  async updateLicencaAmbiental(id: string, data: any) {
    await this.findLicencaAmbientalById(id);
    return await prisma.licencaAmbiental.update({ where: { id }, data });
  }

  async aprovarLicenca(id: string) {
    return await this.updateLicencaAmbiental(id, { status: 'APROVADA' });
  }

  async rejeitarLicenca(id: string) {
    return await this.updateLicencaAmbiental(id, { status: 'REJEITADA' });
  }

  // Estatísticas
  async getEstatisticasMeioAmbiente() {
    const [totalArvores, totalParques, totalPontosColeta, totalLicencas] = await Promise.all([
      prisma.arvoreUrbana.count({ where: { isActive: true } }),
      prisma.parquePraca.count({ where: { isActive: true } }),
      prisma.pontoColeta.count({ where: { isActive: true } }),
      prisma.licencaAmbiental.count(),
    ]);

    return { totalArvores, totalParques, totalPontosColeta, totalLicencas };
  }
}

export default new MeioAmbienteService();
