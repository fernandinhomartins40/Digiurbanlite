import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-19: CADASTRO DE PRODUTORES RURAIS
// ============================================================================

interface CreateProdutorRuralDTO {
  citizenId: string;
  cpf: string;
  nome: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  dataNascimento?: Date;
  estadoCivil?: string;

  // Contato
  telefone?: string;
  celular?: string;
  email?: string;

  // Endereço residencial
  enderecoResidencial?: any;

  // Documentação rural
  dap?: string;
  dataValidadeDap?: Date;
  car?: string;
  inscricaoEstadual?: string;

  // Informações profissionais
  atividadePrincipal?: string;
  tempoAtuacao?: number;
  associacao?: string;

  // Documentos anexados
  documentos?: any[];
  foto?: string;

  // Carteirinha do produtor
  numeroCarteirinha?: string;
  dataEmissaoCarteirinha?: Date;

  // Observações
  observacoes?: string;
}

interface UpdateProdutorRuralDTO {
  nome?: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  dataNascimento?: Date;
  estadoCivil?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  enderecoResidencial?: any;
  dap?: string;
  dataValidadeDap?: Date;
  car?: string;
  inscricaoEstadual?: string;
  atividadePrincipal?: string;
  tempoAtuacao?: number;
  associacao?: string;
  documentos?: any[];
  foto?: string;
  observacoes?: string;
  isActive?: boolean;
}

interface FilterProdutoresDTO {
  tipoProducao?: string;
  temCAR?: boolean;
  temDAP?: boolean;
  pendencias?: boolean;
  isActive?: boolean;
}

class ProdutorRuralService {
  // Criar produtor rural
  async createProdutor(data: CreateProdutorRuralDTO) {
    // Verificar se CPF já existe
    const existingCPF = await prisma.produtorRural.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingCPF) {
      throw new Error('CPF já cadastrado como produtor rural');
    }

    // Verificar se citizenId já está cadastrado
    const existingCitizen = await prisma.produtorRural.findUnique({
      where: { citizenId: data.citizenId },
    });

    if (existingCitizen) {
      throw new Error('Cidadão já cadastrado como produtor rural');
    }

    const produtor = await prisma.produtorRural.create({
      data: {
        ...data,
        tiposProducao: data.tiposProducao || [],
      },
    });

    return produtor;
  }

  // Buscar produtor por ID
  async findProdutorById(id: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { id },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    return produtor;
  }

  // Buscar produtor por CPF
  async findProdutorByCPF(cpf: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { cpf },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    return produtor;
  }

  // Buscar produtor por citizenId
  async findProdutorByCitizenId(citizenId: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { citizenId },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    return produtor;
  }

  // Listar todos os produtores com filtros
  async listProdutores(filters?: FilterProdutoresDTO) {
    const where: any = {};

    if (filters?.pendencias !== undefined) {
      where.pendencias = filters.pendencias;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.temCAR) {
      where.NOT = { car: null };
    }

    if (filters?.temDAP) {
      where.NOT = { dap: null };
    }

    const produtores = await prisma.produtorRural.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    // Filtrar por tipo de produção
    let filtered = produtores;

    if (filters?.tipoProducao) {
      filtered = filtered.filter(p => {
        const tipos = p.tiposProducao as any;
        return tipos && Array.isArray(tipos) && tipos.includes(filters.tipoProducao);
      });
    }

    return filtered;
  }

  // Listar produtores ativos
  async listProdutoresAtivos() {
    const produtores = await prisma.produtorRural.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });

    return produtores;
  }

  // Buscar produtores por tipo de produção
  async findProdutoresByTipo(tipoProducao: string) {
    const produtores = await prisma.produtorRural.findMany({
      where: { isActive: true },
    });

    const filtered = produtores.filter(p => {
      const tipos = p.tiposProducao as any;
      return tipos && Array.isArray(tipos) && tipos.includes(tipoProducao);
    });

    return filtered;
  }

  // Buscar produtores com pendências
  async findProdutoresComPendencias() {
    const produtores = await prisma.produtorRural.findMany({
      where: {
        pendencias: true,
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return produtores;
  }

  // Atualizar produtor
  async updateProdutor(id: string, data: UpdateProdutorRuralDTO) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Adicionar tipo de produção
  async addTipoProducao(id: string, tipoProducao: string) {
    const produtor = await this.findProdutorById(id);
    const tipos = (produtor.tiposProducao as any) || [];

    if (tipos.includes(tipoProducao)) {
      throw new Error('Tipo de produção já cadastrado');
    }

    tipos.push(tipoProducao);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { tiposProducao: tipos },
    });

    return updated;
  }

  // Remover tipo de produção
  async removeTipoProducao(id: string, tipoProducao: string) {
    const produtor = await this.findProdutorById(id);
    let tipos = (produtor.tiposProducao as any) || [];

    tipos = tipos.filter((t: string) => t !== tipoProducao);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { tiposProducao: tipos },
    });

    return updated;
  }

  // Registrar pendência
  async registrarPendencia(id: string, motivoPendencia: string) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: {
        pendencias: true,
        motivoPendencia,
      },
    });

    return updated;
  }

  // Resolver pendência
  async resolverPendencia(id: string) {
    const produtor = await this.findProdutorById(id);

    if (!produtor.pendencias) {
      throw new Error('Produtor não possui pendências');
    }

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: {
        pendencias: false,
        motivoPendencia: null,
      },
    });

    return updated;
  }

  // Atualizar CAR
  async updateCAR(id: string, car: string) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { car },
    });

    return updated;
  }

  // Atualizar DAP
  async updateDAP(id: string, dap: string) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { dap },
    });

    return updated;
  }

  // Desativar produtor
  async deactivateProdutor(id: string) {
    const produtor = await this.findProdutorById(id);

    if (!produtor.isActive) {
      throw new Error('Produtor já está desativado');
    }

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  // Reativar produtor
  async reactivateProdutor(id: string) {
    const produtor = await this.findProdutorById(id);

    if (produtor.isActive) {
      throw new Error('Produtor já está ativo');
    }

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { isActive: true },
    });

    return updated;
  }

  // Estatísticas
  async getStatistics() {
    const total = await prisma.produtorRural.count();
    const ativos = await prisma.produtorRural.count({
      where: { isActive: true },
    });
    const inativos = total - ativos;

    const comPendencias = await prisma.produtorRural.count({
      where: { pendencias: true, isActive: true },
    });

    const comCAR = await prisma.produtorRural.count({
      where: { NOT: { car: null }, isActive: true },
    });

    const comDAP = await prisma.produtorRural.count({
      where: { NOT: { dap: null }, isActive: true },
    });

    const areaTotal = await prisma.produtorRural.aggregate({
      _sum: { areaTotal: true },
      where: { isActive: true },
    });

    return {
      total,
      ativos,
      inativos,
      comPendencias,
      comCAR,
      comDAP,
      areaTotalHectares: areaTotal._sum.areaTotal || 0,
    };
  }

  // Upload de foto
  async uploadFoto(id: string, fotoUrl: string) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { foto: fotoUrl },
    });

    return updated;
  }

  // Adicionar documento
  async addDocumento(id: string, documento: any) {
    const produtor = await this.findProdutorById(id);
    const documentos = (produtor.documentos as any) || [];

    documentos.push({
      ...documento,
      dataUpload: new Date(),
    });

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { documentos },
    });

    return updated;
  }

  // Remover documento
  async removeDocumento(id: string, documentoIndex: number) {
    const produtor = await this.findProdutorById(id);
    const documentos = (produtor.documentos as any) || [];

    if (documentoIndex < 0 || documentoIndex >= documentos.length) {
      throw new Error('Documento não encontrado');
    }

    documentos.splice(documentoIndex, 1);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: { documentos },
    });

    return updated;
  }

  // Emitir carteirinha
  async emitirCarteirinha(id: string) {
    const produtor = await this.findProdutorById(id);

    if (produtor.numeroCarteirinha) {
      throw new Error('Produtor já possui carteirinha emitida');
    }

    // Gerar número da carteirinha (formato: ano + sequencial)
    const ano = new Date().getFullYear();
    const count = await prisma.produtorRural.count({
      where: {
        numeroCarteirinha: {
          startsWith: `${ano}`,
        },
      },
    });

    const numeroCarteirinha = `${ano}${String(count + 1).padStart(6, '0')}`;

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: {
        numeroCarteirinha,
        dataEmissaoCarteirinha: new Date(),
      },
    });

    return updated;
  }

  // Buscar por número de carteirinha
  async findByCarteirinha(numeroCarteirinha: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { numeroCarteirinha },
      include: {
        propriedades: true,
        distribuicoesSementes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        visitasAssistencia: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!produtor) {
      throw new Error('Carteirinha não encontrada');
    }

    return produtor;
  }

  // Buscar com propriedades
  async findProdutorComPropriedades(id: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { id },
      include: {
        propriedades: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    return produtor;
  }

  // Buscar histórico completo
  async findHistoricoCompleto(id: string) {
    const produtor = await prisma.produtorRural.findUnique({
      where: { id },
      include: {
        propriedades: {
          where: { isActive: true },
        },
        distribuicoesSementes: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        visitasAssistencia: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        solicitacoesMaquinas: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    return produtor;
  }

  // Validar DAP
  async validarDAP(id: string, dataValidade: Date) {
    const produtor = await this.findProdutorById(id);

    const updated = await prisma.produtorRural.update({
      where: { id },
      data: {
        dataValidadeDap: dataValidade,
      },
    });

    return updated;
  }

  // Deletar produtor (apenas para testes/admin)
  async deleteProdutor(id: string) {
    const produtor = await this.findProdutorById(id);

    await prisma.produtorRural.delete({
      where: { id },
    });

    return { message: 'Produtor deletado com sucesso' };
  }
}

export default new ProdutorRuralService();
