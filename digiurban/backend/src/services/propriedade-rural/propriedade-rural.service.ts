import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-02: CADASTRO DE PROPRIEDADES RURAIS
// ============================================================================

interface CreatePropriedadeRuralDTO {
  produtorId: string;
  nome: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;

  // Localização
  endereco: any;
  latitude?: number;
  longitude?: number;
  coordenadasPoligono?: any;

  // Área
  areaTotalHectares: number;
  areaAgricolaHectares?: number;
  areaPastoHectares?: number;
  areaReservaHectares?: number;

  // Documentação
  car?: string;
  itr?: string;
  matricula?: string;
  ccir?: string;

  // Infraestrutura
  temEnergia?: boolean;
  temAgua?: boolean;
  fontesAgua?: any[];
  temIrrigacao?: boolean;
  tipoIrrigacao?: string;
  acessoEstrada?: string;
  distanciaSede?: number;

  // Produção
  atividadesPrincipais?: any[];
  culturas?: any[];
  criacoes?: any[];

  // Fotos
  fotos?: any[];

  // Observações
  observacoes?: string;
}

interface UpdatePropriedadeRuralDTO {
  nome?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  endereco?: any;
  latitude?: number;
  longitude?: number;
  coordenadasPoligono?: any;
  areaTotalHectares?: number;
  areaAgricolaHectares?: number;
  areaPastoHectares?: number;
  areaReservaHectares?: number;
  car?: string;
  itr?: string;
  matricula?: string;
  ccir?: string;
  temEnergia?: boolean;
  temAgua?: boolean;
  fontesAgua?: any[];
  temIrrigacao?: boolean;
  tipoIrrigacao?: string;
  acessoEstrada?: string;
  distanciaSede?: number;
  atividadesPrincipais?: any[];
  culturas?: any[];
  criacoes?: any[];
  fotos?: any[];
  observacoes?: string;
  isActive?: boolean;
}

class PropriedadeRuralService {
  // Criar propriedade rural
  async createPropriedade(data: CreatePropriedadeRuralDTO) {
    // Verificar se produtor existe
    const produtor = await prisma.produtorRural.findUnique({
      where: { id: data.produtorId },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    const propriedade = await prisma.propriedadeRural.create({
      data: {
        ...data,
        temEnergia: data.temEnergia || false,
        temAgua: data.temAgua || false,
        temIrrigacao: data.temIrrigacao || false,
        fontesAgua: data.fontesAgua || [],
        atividadesPrincipais: data.atividadesPrincipais || [],
        culturas: data.culturas || [],
        criacoes: data.criacoes || [],
        fotos: data.fotos || [],
      },
      include: {
        produtor: true,
      },
    });

    return propriedade;
  }

  // Buscar propriedade por ID
  async findPropriedadeById(id: string) {
    const propriedade = await prisma.propriedadeRural.findUnique({
      where: { id },
      include: {
        produtor: true,
      },
    });

    if (!propriedade) {
      throw new Error('Propriedade rural não encontrada');
    }

    return propriedade;
  }

  // Listar propriedades por produtor
  async findByProdutor(produtorId: string) {
    const propriedades = await prisma.propriedadeRural.findMany({
      where: {
        produtorId,
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return propriedades;
  }

  // Listar todas as propriedades ativas
  async listPropriedadesAtivas() {
    const propriedades = await prisma.propriedadeRural.findMany({
      where: { isActive: true },
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return propriedades;
  }

  // Listar todas as propriedades
  async listPropriedades(filters?: { isActive?: boolean }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const propriedades = await prisma.propriedadeRural.findMany({
      where,
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return propriedades;
  }

  // Buscar propriedades por CAR
  async findByCAR(car: string) {
    const propriedade = await prisma.propriedadeRural.findFirst({
      where: { car },
      include: {
        produtor: true,
      },
    });

    if (!propriedade) {
      throw new Error('Propriedade com CAR não encontrada');
    }

    return propriedade;
  }

  // Buscar propriedades com geolocalização
  async findComGeolocalizacao() {
    const propriedades = await prisma.propriedadeRural.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return propriedades;
  }

  // Atualizar propriedade
  async updatePropriedade(id: string, data: UpdatePropriedadeRuralDTO) {
    const propriedade = await this.findPropriedadeById(id);

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data,
      include: {
        produtor: true,
      },
    });

    return updated;
  }

  // Adicionar foto
  async addFoto(id: string, foto: any) {
    const propriedade = await this.findPropriedadeById(id);
    const fotos = (propriedade.fotos as any) || [];

    fotos.push({
      ...foto,
      dataUpload: new Date(),
    });

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { fotos },
    });

    return updated;
  }

  // Remover foto
  async removeFoto(id: string, fotoIndex: number) {
    const propriedade = await this.findPropriedadeById(id);
    const fotos = (propriedade.fotos as any) || [];

    if (fotoIndex < 0 || fotoIndex >= fotos.length) {
      throw new Error('Foto não encontrada');
    }

    fotos.splice(fotoIndex, 1);

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { fotos },
    });

    return updated;
  }

  // Atualizar geolocalização
  async updateGeolocalizacao(
    id: string,
    latitude: number,
    longitude: number,
    coordenadasPoligono?: any
  ) {
    const propriedade = await this.findPropriedadeById(id);

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: {
        latitude,
        longitude,
        coordenadasPoligono: coordenadasPoligono || propriedade.coordenadasPoligono,
      },
    });

    return updated;
  }

  // Adicionar cultura
  async addCultura(id: string, cultura: any) {
    const propriedade = await this.findPropriedadeById(id);
    const culturas = (propriedade.culturas as any) || [];

    culturas.push(cultura);

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { culturas },
    });

    return updated;
  }

  // Remover cultura
  async removeCultura(id: string, culturaIndex: number) {
    const propriedade = await this.findPropriedadeById(id);
    const culturas = (propriedade.culturas as any) || [];

    if (culturaIndex < 0 || culturaIndex >= culturas.length) {
      throw new Error('Cultura não encontrada');
    }

    culturas.splice(culturaIndex, 1);

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { culturas },
    });

    return updated;
  }

  // Estatísticas gerais
  async getStatistics() {
    const total = await prisma.propriedadeRural.count();
    const ativas = await prisma.propriedadeRural.count({
      where: { isActive: true },
    });

    const areaTotal = await prisma.propriedadeRural.aggregate({
      _sum: {
        areaTotalHectares: true,
        areaAgricolaHectares: true,
        areaPastoHectares: true,
        areaReservaHectares: true,
      },
      where: { isActive: true },
    });

    const comCAR = await prisma.propriedadeRural.count({
      where: { NOT: { car: null }, isActive: true },
    });

    const comIrrigacao = await prisma.propriedadeRural.count({
      where: { temIrrigacao: true, isActive: true },
    });

    const comGeorref = await prisma.propriedadeRural.count({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        isActive: true,
      },
    });

    return {
      total,
      ativas,
      inativas: total - ativas,
      comCAR,
      comIrrigacao,
      comGeorref,
      areaTotalHectares: areaTotal._sum.areaTotalHectares || 0,
      areaAgricolaHectares: areaTotal._sum.areaAgricolaHectares || 0,
      areaPastoHectares: areaTotal._sum.areaPastoHectares || 0,
      areaReservaHectares: areaTotal._sum.areaReservaHectares || 0,
    };
  }

  // Buscar com histórico completo
  async findComHistorico(id: string) {
    const propriedade = await prisma.propriedadeRural.findUnique({
      where: { id },
      include: {
        produtor: true,
        visitasAssistencia: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            tecnico: true,
          },
        },
        distribuicoesSementes: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!propriedade) {
      throw new Error('Propriedade rural não encontrada');
    }

    return propriedade;
  }

  // Desativar propriedade
  async deactivatePropriedade(id: string) {
    const propriedade = await this.findPropriedadeById(id);

    if (!propriedade.isActive) {
      throw new Error('Propriedade já está desativada');
    }

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  // Reativar propriedade
  async reactivatePropriedade(id: string) {
    const propriedade = await this.findPropriedadeById(id);

    if (propriedade.isActive) {
      throw new Error('Propriedade já está ativa');
    }

    const updated = await prisma.propriedadeRural.update({
      where: { id },
      data: { isActive: true },
    });

    return updated;
  }

  // Deletar propriedade (apenas para testes/admin)
  async deletePropriedade(id: string) {
    const propriedade = await this.findPropriedadeById(id);

    await prisma.propriedadeRural.delete({
      where: { id },
    });

    return { message: 'Propriedade deletada com sucesso' };
  }
}

export default new PropriedadeRuralService();
