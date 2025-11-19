import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-17: ATENDIMENTO PSICOSSOCIAL
// ============================================================================

class AtendimentoPsicossocialService {
  async createFicha(data: any) {
    return await prisma.fichaAtendimentoPsicossocial.create({ data });
  }

  async findFichaById(id: string) {
    const ficha = await prisma.fichaAtendimentoPsicossocial.findUnique({
      where: { id },
      include: { acompanhamentos: true },
    });
    if (!ficha) throw new Error('Ficha não encontrada');
    return ficha;
  }

  async listFichas(citizenId?: string, profissionalId?: string, unidadeCRASId?: string, statusCaso?: string) {
    const where: any = {};
    if (citizenId) where.citizenId = citizenId;
    if (profissionalId) where.profissionalId = profissionalId;
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;
    if (statusCaso) where.statusCaso = statusCaso;

    return await prisma.fichaAtendimentoPsicossocial.findMany({
      where,
      include: { acompanhamentos: true },
      orderBy: { data: 'desc' },
    });
  }

  async updateFicha(id: string, data: any) {
    await this.findFichaById(id);
    return await prisma.fichaAtendimentoPsicossocial.update({ where: { id }, data });
  }

  async addAcompanhamento(fichaId: string, data: any) {
    await this.findFichaById(fichaId);
    return await prisma.acompanhamento.create({
      data: { ...data, fichaId },
    });
  }

  async encerrarCaso(id: string, observacoes?: string) {
    return await this.updateFicha(id, {
      statusCaso: 'ENCERRADO',
      observacoes,
    });
  }

  async getStatistics(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const total = await prisma.fichaAtendimentoPsicossocial.count({ where });

    const porStatus = await prisma.fichaAtendimentoPsicossocial.groupBy({
      by: ['statusCaso'],
      where,
      _count: true,
    });

    return {
      total,
      porStatus: porStatus.map(s => ({ status: s.statusCaso, quantidade: s._count })),
    };
  }
}

export default new AtendimentoPsicossocialService();
