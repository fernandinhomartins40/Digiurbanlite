import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-11: PORTAL DO PROFESSOR
// ============================================================================

class PortalProfessorService {
  // ===== DIÁRIO DE CLASSE =====

  async createDiario(data: any) {
    return await prisma.diarioClasse.create({ data });
  }

  async listDiarios(professorId?: string, unidadeEducacaoId?: string) {
    const where: any = {};
    if (professorId) where.professorId = professorId;
    if (unidadeEducacaoId) where.unidadeEducacaoId = unidadeEducacaoId;
    return await prisma.diarioClasse.findMany({ where, include: { aulas: true } });
  }

  async findDiarioById(id: string) {
    const diario = await prisma.diarioClasse.findUnique({
      where: { id },
      include: { aulas: { include: { frequencias: true, avaliacoes: { include: { notas: true } } } } },
    });
    if (!diario) throw new Error('Diário não encontrado');
    return diario;
  }

  // ===== AULAS =====

  async createAula(diarioId: string, data: any) {
    return await prisma.aula.create({ data: { ...data, diarioId } });
  }

  async listAulas(diarioId: string) {
    return await prisma.aula.findMany({
      where: { diarioId },
      include: { frequencias: true, avaliacoes: true },
      orderBy: { data: 'desc' },
    });
  }

  async updateAula(id: string, data: any) {
    return await prisma.aula.update({ where: { id }, data });
  }

  // ===== FREQUÊNCIAS =====

  async registrarFrequencia(aulaId: string, frequencias: Array<{ alunoId: string; presente: boolean; justificado?: boolean }>) {
    const created = [];
    for (const freq of frequencias) {
      const result = await prisma.frequencia.create({
        data: { aulaId, ...freq },
      });
      created.push(result);
    }
    return created;
  }

  async updateFrequencia(id: string, data: any) {
    return await prisma.frequencia.update({ where: { id }, data });
  }

  async getFrequenciasPorAluno(diarioId: string, alunoId: string) {
    const aulas = await prisma.aula.findMany({
      where: { diarioId },
      include: {
        frequencias: { where: { alunoId } },
      },
    });

    const totalAulas = aulas.length;
    const presencas = aulas.filter(a => a.frequencias.some(f => f.presente)).length;
    const percentual = totalAulas > 0 ? (presencas / totalAulas) * 100 : 0;

    return { totalAulas, presencas, faltas: totalAulas - presencas, percentual };
  }

  // ===== AVALIAÇÕES =====

  async createAvaliacao(diarioId: string, data: any) {
    return await prisma.avaliacao.create({ data: { ...data, diarioId } });
  }

  async listAvaliacoes(diarioId: string) {
    return await prisma.avaliacao.findMany({
      where: { diarioId },
      include: { notas: true },
      orderBy: { data: 'desc' },
    });
  }

  async updateAvaliacao(id: string, data: any) {
    return await prisma.avaliacao.update({ where: { id }, data });
  }

  // ===== NOTAS =====

  async lancarNotas(avaliacaoId: string, notas: Array<{ alunoId: string; nota: number; observacao?: string }>) {
    const created = [];
    for (const nota of notas) {
      const result = await prisma.nota.create({
        data: { avaliacaoId, ...nota },
      });
      created.push(result);
    }
    return created;
  }

  async updateNota(id: string, data: any) {
    return await prisma.nota.update({ where: { id }, data });
  }

  async calcularMediaAluno(diarioId: string, alunoId: string) {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { diarioId },
      include: { notas: { where: { alunoId } } },
    });

    let somaNotas = 0;
    let somaPesos = 0;

    for (const avaliacao of avaliacoes) {
      for (const nota of avaliacao.notas) {
        somaNotas += nota.nota * avaliacao.peso;
        somaPesos += avaliacao.peso;
      }
    }

    const media = somaPesos > 0 ? somaNotas / somaPesos : 0;
    return { media, avaliacoes: avaliacoes.length };
  }

  // ===== RELATÓRIOS =====

  async getBoletimAluno(diarioId: string, alunoId: string) {
    const media = await this.calcularMediaAluno(diarioId, alunoId);
    const frequencia = await this.getFrequenciasPorAluno(diarioId, alunoId);

    return { media, frequencia };
  }

  async getMapaNotas(diarioId: string) {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { diarioId },
      include: { notas: true },
    });

    return avaliacoes;
  }
}

export default new PortalProfessorService();
