import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// ESPORTES (MS-33 a MS-36)
// ============================================================================

class EsportesService {
  // ===== MS-33: CADASTRO DE ATLETAS =====

  async createAtleta(data: any) {
    return await prisma.atleta.create({ data });
  }

  async listAtletas(modalidade?: string, categoria?: string) {
    const where: any = { isActive: true };
    if (modalidade) where.modalidade = modalidade;
    if (categoria) where.categoria = categoria;

    return await prisma.atleta.findMany({ where });
  }

  async findAtletaById(id: string) {
    const atleta = await prisma.atleta.findUnique({ where: { id } });
    if (!atleta) throw new Error('Atleta não encontrado');
    return atleta;
  }

  async updateAtleta(id: string, data: any) {
    await this.findAtletaById(id);
    return await prisma.atleta.update({ where: { id }, data });
  }

  async deleteAtleta(id: string) {
    return await this.updateAtleta(id, { isActive: false });
  }

  // ===== MS-34: CAMPEONATOS =====

  async createCampeonato(data: any) {
    return await prisma.campeonato.create({ data });
  }

  async listCampeonatos(modalidade?: string, status?: string) {
    const where: any = { isActive: true };
    if (modalidade) where.modalidade = modalidade;
    if (status) where.status = status;

    return await prisma.campeonato.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findCampeonatoById(id: string) {
    const campeonato = await prisma.campeonato.findUnique({ where: { id } });
    if (!campeonato) throw new Error('Campeonato não encontrado');
    return campeonato;
  }

  async updateCampeonato(id: string, data: any) {
    await this.findCampeonatoById(id);
    return await prisma.campeonato.update({ where: { id }, data });
  }

  async iniciarCampeonato(id: string) {
    return await this.updateCampeonato(id, { status: 'EM_ANDAMENTO' });
  }

  async finalizarCampeonato(id: string) {
    return await this.updateCampeonato(id, { status: 'FINALIZADO' });
  }

  // ===== MS-35: ESCOLINHAS ESPORTIVAS =====

  async createEscolinhaEsporte(data: any) {
    return await prisma.escolinhaEsporte.create({ data });
  }

  async listEscolinhasEsporte(modalidade?: string) {
    const where: any = { isActive: true };
    if (modalidade) where.modalidade = modalidade;

    return await prisma.escolinhaEsporte.findMany({ where });
  }

  async findEscolinhaEsporteById(id: string) {
    const escolinha = await prisma.escolinhaEsporte.findUnique({ where: { id } });
    if (!escolinha) throw new Error('Escolinha não encontrada');
    return escolinha;
  }

  async updateEscolinhaEsporte(id: string, data: any) {
    await this.findEscolinhaEsporteById(id);
    return await prisma.escolinhaEsporte.update({ where: { id }, data });
  }

  async deleteEscolinhaEsporte(id: string) {
    return await this.updateEscolinhaEsporte(id, { isActive: false });
  }

  async inscreverAluno(escolinhaId: string, alunoId: string) {
    const escolinha = await this.findEscolinhaEsporteById(escolinhaId);
    const alunosAtuais = (escolinha.alunos as string[]) || [];

    if (escolinha.vagasOcupadas >= escolinha.vagasTotal) {
      throw new Error('Escolinha sem vagas disponíveis');
    }

    if (alunosAtuais.includes(alunoId)) {
      throw new Error('Aluno já inscrito nesta escolinha');
    }

    return await this.updateEscolinhaEsporte(escolinhaId, {
      alunos: [...alunosAtuais, alunoId],
      vagasOcupadas: escolinha.vagasOcupadas + 1,
    });
  }

  async removerAluno(escolinhaId: string, alunoId: string) {
    const escolinha = await this.findEscolinhaEsporteById(escolinhaId);
    const alunosAtuais = (escolinha.alunos as string[]) || [];

    const novosAlunos = alunosAtuais.filter((id: string) => id !== alunoId);

    return await this.updateEscolinhaEsporte(escolinhaId, {
      alunos: novosAlunos,
      vagasOcupadas: Math.max(0, escolinha.vagasOcupadas - 1),
    });
  }

  // ===== MS-36: EQUIPAMENTOS ESPORTIVOS =====

  async createEquipamentoEsportivo(data: any) {
    return await prisma.equipamentoEsportivo.create({ data });
  }

  async listEquipamentosEsportivos(tipo?: string, status?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    return await prisma.equipamentoEsportivo.findMany({ where });
  }

  async findEquipamentoEsportivoById(id: string) {
    const equipamento = await prisma.equipamentoEsportivo.findUnique({ where: { id } });
    if (!equipamento) throw new Error('Equipamento não encontrado');
    return equipamento;
  }

  async updateEquipamentoEsportivo(id: string, data: any) {
    await this.findEquipamentoEsportivoById(id);
    return await prisma.equipamentoEsportivo.update({ where: { id }, data });
  }

  async deleteEquipamentoEsportivo(id: string) {
    return await this.updateEquipamentoEsportivo(id, { isActive: false });
  }

  async atualizarStatusConservacao(id: string, novoStatus: string) {
    return await this.updateEquipamentoEsportivo(id, { status: novoStatus });
  }

  // ===== ESTATÍSTICAS GERAIS =====

  async getEstatisticasEsportes() {
    const [
      totalAtletas,
      totalCampeonatos,
      totalEscolinhas,
      totalEquipamentos,
      campeonatosAtivos,
      vagasDisponiveis,
    ] = await Promise.all([
      prisma.atleta.count({ where: { isActive: true } }),
      prisma.campeonato.count({ where: { isActive: true } }),
      prisma.escolinhaEsporte.count({ where: { isActive: true } }),
      prisma.equipamentoEsportivo.count({ where: { isActive: true } }),
      prisma.campeonato.count({ where: { isActive: true, status: 'EM_ANDAMENTO' } }),
      prisma.escolinhaEsporte.aggregate({
        _sum: {
          vagasTotal: true,
          vagasOcupadas: true,
        },
      }),
    ]);

    const vagas = vagasDisponiveis._sum.vagasTotal || 0;
    const ocupadas = vagasDisponiveis._sum.vagasOcupadas || 0;

    return {
      totalAtletas,
      totalCampeonatos,
      totalEscolinhas,
      totalEquipamentos,
      campeonatosAtivos,
      vagasTotal: vagas,
      vagasOcupadas: ocupadas,
      vagasLivres: vagas - ocupadas,
    };
  }

  async getAtletasPorModalidade() {
    const atletas = await prisma.atleta.groupBy({
      by: ['modalidade'],
      where: { isActive: true },
      _count: true,
    });

    return atletas.map(a => ({
      modalidade: a.modalidade,
      quantidade: a._count,
    }));
  }
}

export default new EsportesService();
