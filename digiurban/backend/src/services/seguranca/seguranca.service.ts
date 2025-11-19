import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// SEGURANÇA PÚBLICA (MS-55 a MS-60)
class SegurancaService {
  // MS-55: Viaturas
  async createViatura(data: any) { return await prisma.viatura.create({ data }); }
  async listViaturas(tipo?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    return await prisma.viatura.findMany({ where });
  }
  async updateViatura(id: string, data: any) { return await prisma.viatura.update({ where: { id }, data }); }

  // MS-56: Ocorrências
  async createOcorrencia(data: any) { return await prisma.ocorrencia.create({ data }); }
  async listOcorrencias(tipo?: string, status?: string) {
    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    return await prisma.ocorrencia.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async updateOcorrencia(id: string, data: any) { return await prisma.ocorrencia.update({ where: { id }, data }); }
  async finalizarOcorrencia(id: string) { return await this.updateOcorrencia(id, { status: 'FINALIZADA' }); }

  // MS-57: Rotas de Patrulha
  async createRotaPatrulha(data: any) { return await prisma.rotaPatrulha.create({ data }); }
  async listRotasPatrulha(turno?: string) {
    const where: any = { isActive: true };
    if (turno) where.turno = turno;
    return await prisma.rotaPatrulha.findMany({ where });
  }
  async updateRotaPatrulha(id: string, data: any) { return await prisma.rotaPatrulha.update({ where: { id }, data }); }

  // MS-58: Câmeras
  async createCamera(data: any) { return await prisma.camera.create({ data }); }
  async listCameras(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return await prisma.camera.findMany({ where });
  }
  async updateCamera(id: string, data: any) { return await prisma.camera.update({ where: { id }, data }); }

  async getEstatisticasSeguranca() {
    const [totalViaturas, totalOcorrencias, totalRotas, totalCameras] = await Promise.all([
      prisma.viatura.count({ where: { isActive: true } }),
      prisma.ocorrencia.count(),
      prisma.rotaPatrulha.count({ where: { isActive: true } }),
      prisma.camera.count({ where: { isActive: true } }),
    ]);
    return { totalViaturas, totalOcorrencias, totalRotas, totalCameras };
  }
}

export default new SegurancaService();
