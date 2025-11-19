import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-18: DASHBOARD ASSISTÊNCIA SOCIAL
// ============================================================================

class DashboardAssistenciaService {
  // ===== VISÃO GERAL =====

  async getVisaoGeral(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const [
      totalCRAS,
      totalFamiliasCadUnico,
      totalProgramasSociais,
      totalBeneficios,
      totalAtendimentos,
    ] = await Promise.all([
      prisma.unidadeCRAS.count({ where: { isActive: true } }),
      prisma.cadUnicoFamilia.count({ where: { ...where, status: 'ATIVO' } }),
      prisma.inscricaoProgramaSocial.count({ where: { ...where, status: 'ATIVA' } }),
      prisma.solicitacaoBeneficio.count({ where }),
      prisma.fichaAtendimentoPsicossocial.count({ where }),
    ]);

    return {
      totalCRAS,
      totalFamiliasCadUnico,
      totalProgramasSociais,
      totalBeneficios,
      totalAtendimentos,
    };
  }

  // ===== BENEFÍCIOS =====

  async getEstatisticasBeneficios(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const porStatus = await prisma.solicitacaoBeneficio.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const porTipo = await prisma.solicitacaoBeneficio.groupBy({
      by: ['tipoBeneficioId'],
      where,
      _count: true,
    });

    return {
      porStatus: porStatus.map((s: any) => ({ status: s.status, quantidade: s._count })),
      porTipo: porTipo.map(t => ({ tipoBeneficioId: t.tipoBeneficioId, quantidade: t._count })),
    };
  }

  // ===== PROGRAMAS SOCIAIS =====

  async getEstatisticasProgramas(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const porStatus = await prisma.inscricaoProgramaSocial.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const porPrograma = await prisma.inscricaoProgramaSocial.groupBy({
      by: ['programaSocialId'],
      where,
      _count: true,
    });

    return {
      porStatus: porStatus.map((s: any) => ({ status: s.status, quantidade: s._count })),
      porPrograma: porPrograma.map(p => ({ programaSocialId: p.programaSocialId, quantidade: p._count })),
    };
  }

  // ===== ATENDIMENTOS PSICOSSOCIAIS =====

  async getEstatisticasAtendimentos(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const porStatus = await prisma.fichaAtendimentoPsicossocial.groupBy({
      by: ['statusCaso'],
      where,
      _count: true,
    });

    const totalAcompanhamentos = await prisma.acompanhamento.count();

    return {
      porStatus: porStatus.map(s => ({ status: s.statusCaso, quantidade: s._count })),
      totalAcompanhamentos,
    };
  }

  // ===== FAMÍLIAS CADUNICO =====

  async getEstatisticasCadUnico(unidadeCRASId?: string) {
    const where: any = {};
    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const porStatus = await prisma.cadUnicoFamilia.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const totalFamilias = await prisma.cadUnicoFamilia.count({ where });
    const familiasAtivas = await prisma.cadUnicoFamilia.count({
      where: { ...where, status: 'ATIVO' },
    });

    return {
      totalFamilias,
      familiasAtivas,
      porStatus: porStatus.map((s: any) => ({ status: s.status, quantidade: s._count })),
    };
  }

  // ===== INDICADORES MENSAIS =====

  async getIndicadoresMensais(ano: number, mes: number, unidadeCRASId?: string) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    const where: any = {
      createdAt: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (unidadeCRASId) where.unidadeCRASId = unidadeCRASId;

    const [
      novosCadastros,
      novosBeneficios,
      novosProgramas,
      novosAtendimentos,
    ] = await Promise.all([
      prisma.cadUnicoFamilia.count({ where }),
      prisma.solicitacaoBeneficio.count({ where }),
      prisma.inscricaoProgramaSocial.count({ where }),
      prisma.fichaAtendimentoPsicossocial.count({ where }),
    ]);

    return {
      periodo: `${mes}/${ano}`,
      novosCadastros,
      novosBeneficios,
      novosProgramas,
      novosAtendimentos,
    };
  }

  // ===== RANKING CRAS =====

  async getRankingCRAS() {
    const todasUnidades = await prisma.unidadeCRAS.findMany({
      where: { isActive: true },
    });

    const ranking = await Promise.all(
      todasUnidades.map(async (unidade) => {
        const [familias, programas, beneficios, atendimentos] = await Promise.all([
          prisma.cadUnicoFamilia.count({
            where: { status: 'ATIVO' },
          }),
          prisma.inscricaoProgramaSocial.count({
            where: { status: 'ATIVA' },
          }),
          prisma.solicitacaoBeneficio.count({
            where: {},
          }),
          prisma.fichaAtendimentoPsicossocial.count({
            where: {},
          }),
        ]);

        return {
          unidadeId: unidade.id,
          nome: unidade.nome,
          familias,
          programas,
          beneficios,
          atendimentos,
          total: familias + programas + beneficios + atendimentos,
        };
      })
    );

    return ranking.sort((a, b) => b.total - a.total);
  }

  // ===== DASHBOARD COMPLETO =====

  async getDashboardCompleto(unidadeCRASId?: string) {
    const [
      visaoGeral,
      beneficios,
      programas,
      atendimentos,
      cadUnico,
    ] = await Promise.all([
      this.getVisaoGeral(unidadeCRASId),
      this.getEstatisticasBeneficios(unidadeCRASId),
      this.getEstatisticasProgramas(unidadeCRASId),
      this.getEstatisticasAtendimentos(unidadeCRASId),
      this.getEstatisticasCadUnico(unidadeCRASId),
    ]);

    return {
      visaoGeral,
      beneficios,
      programas,
      atendimentos,
      cadUnico,
    };
  }
}

export default new DashboardAssistenciaService();
