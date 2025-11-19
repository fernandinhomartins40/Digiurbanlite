import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// HABITAÇÃO (MS-37 a MS-42)
// ============================================================================

class HabitacaoService {
  // ===== MS-37: CONJUNTOS HABITACIONAIS =====

  async createConjuntoHabitacional(data: any) {
    return await prisma.conjuntoHabitacional.create({ data });
  }

  async listConjuntosHabitacionais() {
    return await prisma.conjuntoHabitacional.findMany({
      where: { isActive: true },
    });
  }

  async findConjuntoHabitacionalById(id: string) {
    const conjunto = await prisma.conjuntoHabitacional.findUnique({ where: { id } });
    if (!conjunto) throw new Error('Conjunto habitacional não encontrado');
    return conjunto;
  }

  async updateConjuntoHabitacional(id: string, data: any) {
    await this.findConjuntoHabitacionalById(id);
    return await prisma.conjuntoHabitacional.update({ where: { id }, data });
  }

  // ===== MS-38: INSCRIÇÕES HABITAÇÃO =====

  async createInscricaoHabitacao(data: any) {
    return await prisma.inscricaoHabitacao.create({ data });
  }

  async listInscricoesHabitacao(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return await prisma.inscricaoHabitacao.findMany({
      where,
      orderBy: { pontuacao: 'desc' },
    });
  }

  async findInscricaoHabitacaoById(id: string) {
    const inscricao = await prisma.inscricaoHabitacao.findUnique({ where: { id } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    return inscricao;
  }

  async updateInscricaoHabitacao(id: string, data: any) {
    await this.findInscricaoHabitacaoById(id);
    return await prisma.inscricaoHabitacao.update({ where: { id }, data });
  }

  async calcularPontuacao(id: string) {
    const inscricao = await this.findInscricaoHabitacaoById(id);

    let pontuacao = 0;

    // Pontuação por renda familiar (quanto menor a renda, maior a pontuação)
    if (inscricao.rendaFamiliar <= 1000) pontuacao += 30;
    else if (inscricao.rendaFamiliar <= 2000) pontuacao += 20;
    else if (inscricao.rendaFamiliar <= 3000) pontuacao += 10;

    // Pontuação por composição familiar
    pontuacao += Math.min(inscricao.composicaoFamiliar * 5, 25);

    return await this.updateInscricaoHabitacao(id, { pontuacao });
  }

  // ===== MS-39: OBRAS HABITACIONAIS =====

  async createObraHabitacional(data: any) {
    return await prisma.obraHabitacional.create({ data });
  }

  async listObrasHabitacionais(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;

    return await prisma.obraHabitacional.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findObraHabitacionalById(id: string) {
    const obra = await prisma.obraHabitacional.findUnique({ where: { id } });
    if (!obra) throw new Error('Obra habitacional não encontrada');
    return obra;
  }

  async updateObraHabitacional(id: string, data: any) {
    await this.findObraHabitacionalById(id);
    return await prisma.obraHabitacional.update({ where: { id }, data });
  }

  async iniciarObra(id: string) {
    return await this.updateObraHabitacional(id, {
      status: 'EM_EXECUCAO',
      dataInicio: new Date(),
    });
  }

  async finalizarObra(id: string) {
    return await this.updateObraHabitacional(id, { status: 'CONCLUIDA' });
  }

  // ===== MS-40, 41, 42: FUNCIONALIDADES COMPLEMENTARES =====

  async getEstatisticasHabitacao() {
    const [
      totalConjuntos,
      totalInscricoes,
      totalObras,
      inscricoesAprovadas,
      obrasEmAndamento,
    ] = await Promise.all([
      prisma.conjuntoHabitacional.count({ where: { isActive: true } }),
      prisma.inscricaoHabitacao.count(),
      prisma.obraHabitacional.count({ where: { isActive: true } }),
      prisma.inscricaoHabitacao.count({ where: { status: 'APROVADA' } }),
      prisma.obraHabitacional.count({ where: { status: 'EM_EXECUCAO' } }),
    ]);

    return {
      totalConjuntos,
      totalInscricoes,
      totalObras,
      inscricoesAprovadas,
      obrasEmAndamento,
    };
  }

  async getRankingInscricoes(limit: number = 100) {
    return await prisma.inscricaoHabitacao.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { pontuacao: 'desc' },
      take: limit,
    });
  }
}

export default new HabitacaoService();
