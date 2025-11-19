import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-07: GESTÃO DE UNIDADES EDUCACIONAIS
// ============================================================================

interface CreateUnidadeEducacaoDTO {
  nome: string;
  tipo: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  niveisEnsino?: string[];
  turnos?: string[];
  vagas?: number;
}

interface UpdateUnidadeEducacaoDTO {
  nome?: string;
  tipo?: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  niveisEnsino?: string[];
  turnos?: string[];
  vagas?: number;
  isActive?: boolean;
}

interface FilterUnidadesEducacaoDTO {
  tipo?: string;
  bairro?: string;
  nivelEnsino?: string;
  turno?: string;
  isActive?: boolean;
}

class UnidadeEducacaoService {
  // Criar unidade educacional
  async createUnidade(data: CreateUnidadeEducacaoDTO) {
    const unidade = await prisma.unidadeEducacao.create({
      data: {
        ...data,
        niveisEnsino: data.niveisEnsino || [],
        turnos: data.turnos || [],
      },
    });

    return unidade;
  }

  // Buscar unidade por ID
  async findUnidadeById(id: string) {
    const unidade = await prisma.unidadeEducacao.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade educacional não encontrada');
    }

    return unidade;
  }

  // Listar todas as unidades com filtros
  async listUnidades(filters?: FilterUnidadesEducacaoDTO) {
    const where: any = {};

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.bairro) {
      where.bairro = { contains: filters.bairro, mode: 'insensitive' };
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const unidades = await prisma.unidadeEducacao.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nome: 'asc' },
      ],
    });

    // Filtrar por nivelEnsino e turno se necessário
    let filtered = unidades;

    if (filters?.nivelEnsino) {
      filtered = filtered.filter(u => {
        const niveis = u.niveisEnsino as any;
        return niveis && Array.isArray(niveis) && niveis.includes(filters.nivelEnsino);
      });
    }

    if (filters?.turno) {
      filtered = filtered.filter(u => {
        const turnos = u.turnos as any;
        return turnos && Array.isArray(turnos) && turnos.includes(filters.turno);
      });
    }

    return filtered;
  }

  // Listar unidades ativas
  async listUnidadesAtivas(tipo?: string) {
    const where: any = { isActive: true };

    if (tipo) {
      where.tipo = tipo;
    }

    const unidades = await prisma.unidadeEducacao.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nome: 'asc' },
      ],
    });

    return unidades;
  }

  // Buscar unidades por tipo
  async findUnidadesByTipo(tipo: string) {
    const unidades = await prisma.unidadeEducacao.findMany({
      where: {
        tipo,
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return unidades;
  }

  // Buscar unidades por bairro
  async findUnidadesByBairro(bairro: string) {
    const unidades = await prisma.unidadeEducacao.findMany({
      where: {
        bairro: {
          contains: bairro,
          mode: 'insensitive',
        },
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return unidades;
  }

  // Buscar unidades por nível de ensino
  async findUnidadesByNivelEnsino(nivelEnsino: string) {
    const unidades = await prisma.unidadeEducacao.findMany({
      where: { isActive: true },
    });

    const filtered = unidades.filter(u => {
      const niveis = u.niveisEnsino as any;
      return niveis && Array.isArray(niveis) && niveis.includes(nivelEnsino);
    });

    return filtered;
  }

  // Buscar unidades por turno
  async findUnidadesByTurno(turno: string) {
    const unidades = await prisma.unidadeEducacao.findMany({
      where: { isActive: true },
    });

    const filtered = unidades.filter(u => {
      const turnos = u.turnos as any;
      return turnos && Array.isArray(turnos) && turnos.includes(turno);
    });

    return filtered;
  }

  // Atualizar unidade
  async updateUnidade(id: string, data: UpdateUnidadeEducacaoDTO) {
    const unidade = await prisma.unidadeEducacao.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade educacional não encontrada');
    }

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Adicionar nível de ensino
  async addNivelEnsino(id: string, nivelEnsino: string) {
    const unidade = await this.findUnidadeById(id);
    const niveis = (unidade.niveisEnsino as any) || [];

    if (niveis.includes(nivelEnsino)) {
      throw new Error('Nível de ensino já cadastrado nesta unidade');
    }

    niveis.push(nivelEnsino);

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { niveisEnsino: niveis },
    });

    return updated;
  }

  // Remover nível de ensino
  async removeNivelEnsino(id: string, nivelEnsino: string) {
    const unidade = await this.findUnidadeById(id);
    let niveis = (unidade.niveisEnsino as any) || [];

    niveis = niveis.filter((n: string) => n !== nivelEnsino);

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { niveisEnsino: niveis },
    });

    return updated;
  }

  // Adicionar turno
  async addTurno(id: string, turno: string) {
    const unidade = await this.findUnidadeById(id);
    const turnos = (unidade.turnos as any) || [];

    if (turnos.includes(turno)) {
      throw new Error('Turno já cadastrado nesta unidade');
    }

    turnos.push(turno);

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { turnos },
    });

    return updated;
  }

  // Remover turno
  async removeTurno(id: string, turno: string) {
    const unidade = await this.findUnidadeById(id);
    let turnos = (unidade.turnos as any) || [];

    turnos = turnos.filter((t: string) => t !== turno);

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { turnos },
    });

    return updated;
  }

  // Atualizar vagas
  async updateVagas(id: string, vagas: number) {
    const unidade = await this.findUnidadeById(id);

    if (vagas < 0) {
      throw new Error('Número de vagas não pode ser negativo');
    }

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { vagas },
    });

    return updated;
  }

  // Desativar unidade
  async deactivateUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    if (!unidade.isActive) {
      throw new Error('Unidade já está desativada');
    }

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  // Reativar unidade
  async reactivateUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    if (unidade.isActive) {
      throw new Error('Unidade já está ativa');
    }

    const updated = await prisma.unidadeEducacao.update({
      where: { id },
      data: { isActive: true },
    });

    return updated;
  }

  // Estatísticas
  async getStatistics() {
    const total = await prisma.unidadeEducacao.count();
    const ativas = await prisma.unidadeEducacao.count({
      where: { isActive: true },
    });
    const inativas = total - ativas;

    const porTipo = await prisma.unidadeEducacao.groupBy({
      by: ['tipo'],
      _count: true,
      _sum: { vagas: true },
      where: { isActive: true },
    });

    const totalVagas = await prisma.unidadeEducacao.aggregate({
      _sum: { vagas: true },
      where: { isActive: true },
    });

    return {
      total,
      ativas,
      inativas,
      totalVagas: totalVagas._sum.vagas || 0,
      porTipo: porTipo.map(t => ({
        tipo: t.tipo,
        quantidade: t._count,
        vagas: t._sum.vagas || 0,
      })),
    };
  }

  // Deletar unidade (apenas para testes/admin)
  async deleteUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    await prisma.unidadeEducacao.delete({
      where: { id },
    });

    return { message: 'Unidade deletada com sucesso' };
  }
}

export default new UnidadeEducacaoService();
