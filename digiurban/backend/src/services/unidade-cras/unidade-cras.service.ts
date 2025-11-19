import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-13: GESTÃO DE CRAS/CREAS
// ============================================================================

interface CreateUnidadeCRASDTO {
  nome: string;
  tipo: string; // 'CRAS' ou 'CREAS'
  endereco?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  horario?: string;
  programas?: string[];
}

interface UpdateUnidadeCRASDTO {
  nome?: string;
  tipo?: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  horario?: string;
  programas?: string[];
  isActive?: boolean;
}

interface FilterUnidadesCRASDTO {
  tipo?: string;
  bairro?: string;
  programa?: string;
  isActive?: boolean;
}

class UnidadeCRASService {
  // Criar unidade CRAS/CREAS
  async createUnidade(data: CreateUnidadeCRASDTO) {
    const unidade = await prisma.unidadeCRAS.create({
      data: {
        ...data,
        programas: data.programas || [],
      },
    });

    return unidade;
  }

  // Buscar unidade por ID
  async findUnidadeById(id: string) {
    const unidade = await prisma.unidadeCRAS.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade CRAS/CREAS não encontrada');
    }

    return unidade;
  }

  // Listar todas as unidades com filtros
  async listUnidades(filters?: FilterUnidadesCRASDTO) {
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

    const unidades = await prisma.unidadeCRAS.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nome: 'asc' },
      ],
    });

    // Filtrar por programa se necessário
    let filtered = unidades;

    if (filters?.programa) {
      filtered = filtered.filter(u => {
        const programas = u.programas as any;
        return programas && Array.isArray(programas) && programas.includes(filters.programa);
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

    const unidades = await prisma.unidadeCRAS.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nome: 'asc' },
      ],
    });

    return unidades;
  }

  // Buscar unidades por tipo (CRAS ou CREAS)
  async findUnidadesByTipo(tipo: string) {
    const unidades = await prisma.unidadeCRAS.findMany({
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
    const unidades = await prisma.unidadeCRAS.findMany({
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

  // Buscar unidades por programa
  async findUnidadesByPrograma(programa: string) {
    const unidades = await prisma.unidadeCRAS.findMany({
      where: { isActive: true },
    });

    const filtered = unidades.filter(u => {
      const programas = u.programas as any;
      return programas && Array.isArray(programas) && programas.includes(programa);
    });

    return filtered;
  }

  // Atualizar unidade
  async updateUnidade(id: string, data: UpdateUnidadeCRASDTO) {
    const unidade = await prisma.unidadeCRAS.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade CRAS/CREAS não encontrada');
    }

    const updated = await prisma.unidadeCRAS.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Adicionar programa
  async addPrograma(id: string, programa: string) {
    const unidade = await this.findUnidadeById(id);
    const programas = (unidade.programas as any) || [];

    if (programas.includes(programa)) {
      throw new Error('Programa já cadastrado nesta unidade');
    }

    programas.push(programa);

    const updated = await prisma.unidadeCRAS.update({
      where: { id },
      data: { programas },
    });

    return updated;
  }

  // Remover programa
  async removePrograma(id: string, programa: string) {
    const unidade = await this.findUnidadeById(id);
    let programas = (unidade.programas as any) || [];

    programas = programas.filter((p: string) => p !== programa);

    const updated = await prisma.unidadeCRAS.update({
      where: { id },
      data: { programas },
    });

    return updated;
  }

  // Desativar unidade
  async deactivateUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    if (!unidade.isActive) {
      throw new Error('Unidade já está desativada');
    }

    const updated = await prisma.unidadeCRAS.update({
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

    const updated = await prisma.unidadeCRAS.update({
      where: { id },
      data: { isActive: true },
    });

    return updated;
  }

  // Estatísticas
  async getStatistics() {
    const total = await prisma.unidadeCRAS.count();
    const ativas = await prisma.unidadeCRAS.count({
      where: { isActive: true },
    });
    const inativas = total - ativas;

    const porTipo = await prisma.unidadeCRAS.groupBy({
      by: ['tipo'],
      _count: true,
      where: { isActive: true },
    });

    return {
      total,
      ativas,
      inativas,
      porTipo: porTipo.map(t => ({
        tipo: t.tipo,
        quantidade: t._count,
      })),
    };
  }

  // Deletar unidade (apenas para testes/admin)
  async deleteUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    await prisma.unidadeCRAS.delete({
      where: { id },
    });

    return { message: 'Unidade deletada com sucesso' };
  }
}

export default new UnidadeCRASService();
