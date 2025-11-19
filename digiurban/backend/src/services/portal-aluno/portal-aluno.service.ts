import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-12: PORTAL DO ALUNO/PAIS
// ============================================================================

class PortalAlunoService {
  // ===== BOLETIM =====

  async getBoletimAluno(alunoId: string, ano: number, semestre?: number) {
    const where: any = { alunoId, ano };
    if (semestre) where.semestre = semestre;

    return await prisma.boletimAluno.findMany({
      where,
      orderBy: { ano: 'desc' },
    });
  }

  async createBoletim(data: any) {
    return await prisma.boletimAluno.create({ data });
  }

  async updateBoletim(id: string, data: any) {
    return await prisma.boletimAluno.update({ where: { id }, data });
  }

  // ===== FREQUÊNCIA DO ALUNO =====

  async getFrequenciaAluno(alunoId: string, diarioId?: string) {
    // Busca todas as aulas que o aluno participou
    const where: any = { alunoId };
    if (diarioId) where.aula = { diarioId };

    const frequencias = await prisma.frequencia.findMany({
      where,
      include: {
        aula: {
          include: {
            diario: true,
          },
        },
      },
      orderBy: { aula: { data: 'desc' } },
    });

    // Calcula estatísticas
    const total = frequencias.length;
    const presencas = frequencias.filter(f => f.presente).length;
    const faltas = total - presencas;
    const percentual = total > 0 ? (presencas / total) * 100 : 0;

    return {
      frequencias,
      estatisticas: {
        total,
        presencas,
        faltas,
        percentual: percentual.toFixed(2),
      },
    };
  }

  // ===== NOTAS DO ALUNO =====

  async getNotasAluno(alunoId: string, diarioId?: string) {
    const where: any = { alunoId };
    if (diarioId) where.avaliacao = { diarioId };

    const notas = await prisma.nota.findMany({
      where,
      include: {
        avaliacao: true,
      },
      orderBy: { nota: 'desc' },
    });

    return notas;
  }

  // ===== OCORRÊNCIAS/COMUNICADOS =====

  async createOcorrencia(data: any) {
    return await prisma.ocorrenciaAluno.create({ data });
  }

  async listOcorrencias(alunoId: string, tipo?: string) {
    const where: any = { alunoId };
    if (tipo) where.tipo = tipo;

    return await prisma.ocorrenciaAluno.findMany({
      where,
      orderBy: { data: 'desc' },
    });
  }

  async marcarOcorrenciaLida(id: string) {
    return await prisma.ocorrenciaAluno.update({
      where: { id },
      data: { lida: true },
    });
  }

  // ===== HISTÓRICO ESCOLAR =====

  async getHistoricoEscolar(alunoId: string) {
    const matriculas = await prisma.matricula.findMany({
      where: { alunoId },
      include: { turma: true },
      orderBy: { anoLetivo: 'desc' },
    });

    const boletins = await prisma.boletimAluno.findMany({
      where: { alunoId },
      orderBy: { ano: 'desc' },
    });

    return {
      matriculas,
      boletins,
    };
  }

  // ===== CARDÁPIO DA MERENDA =====

  async getCardapioDaSemana(unidadeEducacaoId: string) {
    const hoje = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(hoje.getDate() + 7);

    // Cardapio model não existe, retornar array vazio por enquanto
    return [];
  }

  // ===== ESTATÍSTICAS GERAIS =====

  async getResumoAluno(alunoId: string, ano: number) {
    const boletins = await this.getBoletimAluno(alunoId, ano);
    const frequencia = await this.getFrequenciaAluno(alunoId);
    const ocorrencias = await this.listOcorrencias(alunoId);

    const mediaGeral = boletins.length > 0
      ? boletins.reduce((sum, b) => sum + b.mediaFinal, 0) / boletins.length
      : 0;

    return {
      ano,
      mediaGeral: mediaGeral.toFixed(2),
      frequenciaPercentual: frequencia.estatisticas.percentual,
      totalOcorrencias: ocorrencias.length,
      situacao: mediaGeral >= 6 && parseFloat(frequencia.estatisticas.percentual) >= 75
        ? 'APROVADO'
        : 'EM RISCO',
    };
  }
}

export default new PortalAlunoService();
