import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-01: GESTÃO DE UNIDADES DE SAÚDE
// ============================================================================

interface CreateUnidadeSaudeDTO {
  nome: string;
  tipo: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  horario?: string;
  especialidades?: string[];
}

interface UpdateUnidadeSaudeDTO {
  nome?: string;
  tipo?: string;
  endereco?: string;
  bairro?: string;
  telefone?: string;
  horario?: string;
  especialidades?: string[];
  isActive?: boolean;
}

interface FilterUnidadesDTO {
  tipo?: string;
  bairro?: string;
  especialidade?: string;
  isActive?: boolean;
}

class UnidadeSaudeService {
  // Criar unidade de saúde
  async createUnidade(data: CreateUnidadeSaudeDTO) {
    const unidade = await prisma.unidadeSaude.create({
      data: {
        ...data,
        especialidades: data.especialidades || [],
      },
    });

    return unidade;
  }

  // Buscar unidade por ID
  async findUnidadeById(id: string) {
    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade de saúde não encontrada');
    }

    return unidade;
  }

  // Listar todas as unidades com filtros
  async listUnidades(filters?: FilterUnidadesDTO) {
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

    if (filters?.especialidade) {
      where.especialidades = {
        array_contains: filters.especialidade,
      };
    }

    const unidades = await prisma.unidadeSaude.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { nome: 'asc' },
      ],
    });

    return unidades;
  }

  // Listar unidades ativas
  async listUnidadesAtivas(tipo?: string) {
    const where: any = { isActive: true };

    if (tipo) {
      where.tipo = tipo;
    }

    const unidades = await prisma.unidadeSaude.findMany({
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
    const unidades = await prisma.unidadeSaude.findMany({
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
    const unidades = await prisma.unidadeSaude.findMany({
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

  // Buscar unidades por especialidade
  async findUnidadesByEspecialidade(especialidade: string) {
    const unidades = await prisma.unidadeSaude.findMany({
      where: {
        isActive: true,
      },
    });

    // Filtrar manualmente especialidades (JSON)
    const filtered = unidades.filter(u => {
      const especialidades = u.especialidades as any;
      return especialidades && Array.isArray(especialidades) &&
             especialidades.includes(especialidade);
    });

    return filtered;
  }

  // Atualizar unidade
  async updateUnidade(id: string, data: UpdateUnidadeSaudeDTO) {
    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id },
    });

    if (!unidade) {
      throw new Error('Unidade de saúde não encontrada');
    }

    const updated = await prisma.unidadeSaude.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Adicionar especialidade
  async addEspecialidade(id: string, especialidade: string) {
    const unidade = await this.findUnidadeById(id);
    const especialidades = (unidade.especialidades as any) || [];

    if (especialidades.includes(especialidade)) {
      throw new Error('Especialidade já cadastrada nesta unidade');
    }

    especialidades.push(especialidade);

    const updated = await prisma.unidadeSaude.update({
      where: { id },
      data: {
        especialidades,
      },
    });

    return updated;
  }

  // Remover especialidade
  async removeEspecialidade(id: string, especialidade: string) {
    const unidade = await this.findUnidadeById(id);
    let especialidades = (unidade.especialidades as any) || [];

    especialidades = especialidades.filter((e: string) => e !== especialidade);

    const updated = await prisma.unidadeSaude.update({
      where: { id },
      data: {
        especialidades,
      },
    });

    return updated;
  }

  // Desativar unidade
  async deactivateUnidade(id: string) {
    const unidade = await this.findUnidadeById(id);

    if (!unidade.isActive) {
      throw new Error('Unidade já está desativada');
    }

    const updated = await prisma.unidadeSaude.update({
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

    const updated = await prisma.unidadeSaude.update({
      where: { id },
      data: { isActive: true },
    });

    return updated;
  }

  // Estatísticas
  async getStatistics() {
    const total = await prisma.unidadeSaude.count();
    const ativas = await prisma.unidadeSaude.count({
      where: { isActive: true },
    });
    const inativas = total - ativas;

    const porTipo = await prisma.unidadeSaude.groupBy({
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

    await prisma.unidadeSaude.delete({
      where: { id },
    });

    return { message: 'Unidade deletada com sucesso' };
  }
}

export default new UnidadeSaudeService();
