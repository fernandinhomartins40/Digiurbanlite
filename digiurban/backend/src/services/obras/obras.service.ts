import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// OBRAS PÚBLICAS (MS-49 a MS-54)
class ObrasService {
  // MS-49: Tipos de Obra
  async createTipoObra(data: any) { return await prisma.tipoObra.create({ data }); }
  async listTiposObra() { return await prisma.tipoObra.findMany({ where: { isActive: true } }); }
  async updateTipoObra(id: string, data: any) { return await prisma.tipoObra.update({ where: { id }, data }); }

  // MS-50: Solicitações
  async createSolicitacaoObra(data: any) { return await prisma.solicitacaoObra.create({ data }); }
  async listSolicitacoesObra(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return await prisma.solicitacaoObra.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async updateSolicitacaoObra(id: string, data: any) { return await prisma.solicitacaoObra.update({ where: { id }, data }); }

  // MS-51: Obras Públicas
  async createObraPublica(data: any) { return await prisma.obraPublica.create({ data }); }
  async listObrasPublicas(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return await prisma.obraPublica.findMany({ where, orderBy: { dataInicio: 'desc' } });
  }
  async updateObraPublica(id: string, data: any) { return await prisma.obraPublica.update({ where: { id }, data }); }
  async iniciarObra(id: string) { return await this.updateObraPublica(id, { status: 'EM_EXECUCAO' }); }
  async finalizarObra(id: string) { return await this.updateObraPublica(id, { status: 'CONCLUIDA' }); }

  // MS-52: Iluminação Pública
  async createPontoIluminacao(data: any) { return await prisma.pontoIluminacao.create({ data }); }
  async listPontosIluminacao(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return await prisma.pontoIluminacao.findMany({ where });
  }
  async updatePontoIluminacao(id: string, data: any) { return await prisma.pontoIluminacao.update({ where: { id }, data }); }

  async getEstatisticasObras() {
    const [totalTipos, totalSolicitacoes, totalObras, totalPontosIluminacao] = await Promise.all([
      prisma.tipoObra.count({ where: { isActive: true } }),
      prisma.solicitacaoObra.count(),
      prisma.obraPublica.count({ where: { isActive: true } }),
      prisma.pontoIluminacao.count({ where: { isActive: true } }),
    ]);
    return { totalTipos, totalSolicitacoes, totalObras, totalPontosIluminacao };
  }
}

export default new ObrasService();
