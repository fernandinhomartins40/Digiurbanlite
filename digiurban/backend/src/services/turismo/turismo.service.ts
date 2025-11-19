import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// TURISMO (MS-61 a MS-66)
class TurismoService {
  // MS-61: Estabelecimentos Turísticos
  async createEstabelecimentoTuristico(data: any) { return await prisma.estabelecimentoTuristico.create({ data }); }
  async listEstabelecimentosTuristicos(tipo?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    return await prisma.estabelecimentoTuristico.findMany({ where });
  }
  async updateEstabelecimentoTuristico(id: string, data: any) { return await prisma.estabelecimentoTuristico.update({ where: { id }, data }); }

  // MS-62: Guias Turísticos
  async createGuiaTuristico(data: any) { return await prisma.guiaTuristico.create({ data }); }
  async listGuiasTuristicos() { return await prisma.guiaTuristico.findMany({ where: { isActive: true } }); }
  async updateGuiaTuristico(id: string, data: any) { return await prisma.guiaTuristico.update({ where: { id }, data }); }

  // MS-63: Pontos Turísticos
  async createPontoTuristico(data: any) { return await prisma.pontoTuristico.create({ data }); }
  async listPontosTuristicos(tipo?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    return await prisma.pontoTuristico.findMany({ where });
  }
  async updatePontoTuristico(id: string, data: any) { return await prisma.pontoTuristico.update({ where: { id }, data }); }

  // MS-64: Eventos Turísticos
  async createEventoTuristico(data: any) { return await prisma.eventoTuristico.create({ data }); }
  async listEventosTuristicos() {
    return await prisma.eventoTuristico.findMany({
      where: { isActive: true },
      orderBy: { dataInicio: 'asc' },
    });
  }
  async updateEventoTuristico(id: string, data: any) { return await prisma.eventoTuristico.update({ where: { id }, data }); }

  async getEstatisticasTurismo() {
    const [totalEstabelecimentos, totalGuias, totalPontos, totalEventos] = await Promise.all([
      prisma.estabelecimentoTuristico.count({ where: { isActive: true } }),
      prisma.guiaTuristico.count({ where: { isActive: true } }),
      prisma.pontoTuristico.count({ where: { isActive: true } }),
      prisma.eventoTuristico.count({ where: { isActive: true } }),
    ]);
    return { totalEstabelecimentos, totalGuias, totalPontos, totalEventos };
  }
}

export default new TurismoService();
