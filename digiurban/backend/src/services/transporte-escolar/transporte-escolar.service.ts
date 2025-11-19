import { PrismaClient, StatusVeiculo, StatusRota, Turno, TipoParada } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateVeiculoEscolarDTO {
  placa: string;
  modelo: string;
  capacidade: number;
  ano?: number;
  kmAtual?: number;
  acessibilidade?: boolean;
}

export interface CreateRotaEscolarDTO {
  nome: string;
  turno: Turno;
  veiculoId: string;
  motoristaId: string;
  monitorId?: string;
  distanciaTotal?: number;
  tempoEstimado?: number;
  paradas: CreateParadaDTO[];
}

export interface CreateParadaDTO {
  ordem: number;
  endereco: string;
  latitude?: number;
  longitude?: number;
  tipo: TipoParada;
  horarioEstimado: string;
  referencia?: string;
}

export interface VincularAlunoRotaDTO {
  rotaId: string;
  alunoId: string;
  paradaId: string;
}

export class TransporteEscolarService {
  // ==================== VEÍCULOS ====================

  async createVeiculo(data: CreateVeiculoEscolarDTO) {
    const existente = await prisma.veiculoEscolar.findUnique({
      where: { placa: data.placa },
    });

    if (existente) {
      throw new Error('Já existe um veículo cadastrado com esta placa');
    }

    return await prisma.veiculoEscolar.create({
      data: {
        ...data,
        status: 'DISPONIVEL',
        isActive: true,
      },
    });
  }

  async findVeiculoById(id: string) {
    return await prisma.veiculoEscolar.findUnique({
      where: { id },
    });
  }

  async listVeiculosDisponiveis() {
    return await prisma.veiculoEscolar.findMany({
      where: {
        isActive: true,
        status: 'DISPONIVEL',
      },
      orderBy: { modelo: 'asc' },
    });
  }

  async listAllVeiculos() {
    return await prisma.veiculoEscolar.findMany({
      where: { isActive: true },
      orderBy: { placa: 'asc' },
    });
  }

  async updateVeiculo(id: string, data: Partial<CreateVeiculoEscolarDTO>) {
    return await prisma.veiculoEscolar.update({
      where: { id },
      data,
    });
  }

  async updateVeiculoStatus(id: string, status: StatusVeiculo) {
    return await prisma.veiculoEscolar.update({
      where: { id },
      data: { status },
    });
  }

  async registrarManutencao(id: string, kmAtual?: number) {
    return await prisma.veiculoEscolar.update({
      where: { id },
      data: {
        status: 'MANUTENCAO',
        ultimaManutencao: new Date(),
        ...(kmAtual && { kmAtual }),
      },
    });
  }

  async finalizarManutencao(id: string, proximaManutencaoKm?: number) {
    const veiculo = await prisma.veiculoEscolar.findUnique({
      where: { id },
    });

    if (!veiculo) {
      throw new Error('Veículo não encontrado');
    }

    let proximaManutencao: Date | undefined;
    if (proximaManutencaoKm && veiculo.kmAtual) {
      const diasEstimados = Math.ceil((proximaManutencaoKm - veiculo.kmAtual) / 50); // 50km/dia estimado
      proximaManutencao = new Date();
      proximaManutencao.setDate(proximaManutencao.getDate() + diasEstimados);
    }

    return await prisma.veiculoEscolar.update({
      where: { id },
      data: {
        status: 'DISPONIVEL',
        proximaManutencao,
      },
    });
  }

  async deactivateVeiculo(id: string) {
    return await prisma.veiculoEscolar.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== ROTAS ====================

  async createRota(data: CreateRotaEscolarDTO) {
    const { paradas, ...rotaData } = data;

    // Verificar se o veículo está disponível
    const veiculo = await prisma.veiculoEscolar.findUnique({
      where: { id: data.veiculoId },
    });

    if (!veiculo || !veiculo.isActive) {
      throw new Error('Veículo não disponível');
    }

    // Criar rota com paradas
    const rota = await prisma.rotaEscolar.create({
      data: {
        ...rotaData,
        status: 'ATIVA',
      },
    });

    // Criar paradas
    for (const parada of paradas) {
      await prisma.paradaRota.create({
        data: {
          rotaId: rota.id,
          ...parada,
        },
      });
    }

    return await this.findRotaById(rota.id);
  }

  async findRotaById(id: string) {
    return await prisma.rotaEscolar.findUnique({
      where: { id },
      include: {
        veiculo: true,
        paradas: {
          orderBy: { ordem: 'asc' },
        },
        alunosVinculados: {
          where: { isActive: true },
        },
      },
    });
  }

  async listRotasByTurno(turno: Turno) {
    return await prisma.rotaEscolar.findMany({
      where: {
        turno,
        status: {
          in: ['ATIVA', 'EM_REVISAO'],
        },
      },
      include: {
        veiculo: true,
        paradas: {
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async listAllRotas() {
    return await prisma.rotaEscolar.findMany({
      where: {
        status: {
          not: 'INATIVA',
        },
      },
      include: {
        veiculo: true,
        _count: {
          select: {
            paradas: true,
            alunosVinculados: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ turno: 'asc' }, { nome: 'asc' }],
    });
  }

  async updateRota(id: string, data: Partial<Omit<CreateRotaEscolarDTO, 'paradas'>>) {
    return await prisma.rotaEscolar.update({
      where: { id },
      data,
    });
  }

  async updateRotaStatus(id: string, status: StatusRota) {
    return await prisma.rotaEscolar.update({
      where: { id },
      data: { status },
    });
  }

  async inativarRota(id: string) {
    // Desativar todos os vínculos de alunos
    await prisma.alunoRota.updateMany({
      where: { rotaId: id },
      data: { isActive: false },
    });

    return await prisma.rotaEscolar.update({
      where: { id },
      data: { status: 'INATIVA' },
    });
  }

  // ==================== PARADAS ====================

  async adicionarParada(rotaId: string, data: CreateParadaDTO) {
    return await prisma.paradaRota.create({
      data: {
        rotaId,
        ...data,
      },
    });
  }

  async updateParada(id: string, data: Partial<CreateParadaDTO>) {
    return await prisma.paradaRota.update({
      where: { id },
      data,
    });
  }

  async removerParada(id: string) {
    // Verificar se há alunos vinculados a esta parada
    const alunosVinculados = await prisma.alunoRota.count({
      where: {
        paradaId: id,
        isActive: true,
      },
    });

    if (alunosVinculados > 0) {
      throw new Error(
        `Não é possível remover parada com ${alunosVinculados} aluno(s) vinculado(s)`
      );
    }

    return await prisma.paradaRota.delete({
      where: { id },
    });
  }

  // ==================== ALUNOS ====================

  async vincularAluno(data: VincularAlunoRotaDTO) {
    // Verificar se a parada pertence à rota
    const parada = await prisma.paradaRota.findUnique({
      where: { id: data.paradaId },
    });

    if (!parada || parada.rotaId !== data.rotaId) {
      throw new Error('Parada não pertence à rota informada');
    }

    // Verificar se aluno já está vinculado a esta rota
    const vinculoExistente = await prisma.alunoRota.findFirst({
      where: {
        rotaId: data.rotaId,
        alunoId: data.alunoId,
        isActive: true,
      },
    });

    if (vinculoExistente) {
      throw new Error('Aluno já está vinculado a esta rota');
    }

    // Verificar capacidade do veículo
    const rota = await prisma.rotaEscolar.findUnique({
      where: { id: data.rotaId },
      include: {
        veiculo: true,
        alunosVinculados: {
          where: { isActive: true },
        },
      },
    });

    if (!rota) {
      throw new Error('Rota não encontrada');
    }

    if (rota.alunosVinculados.length >= rota.veiculo.capacidade) {
      throw new Error('Veículo da rota atingiu capacidade máxima');
    }

    return await prisma.alunoRota.create({
      data: {
        rotaId: data.rotaId,
        alunoId: data.alunoId,
        paradaId: data.paradaId,
        isActive: true,
      },
    });
  }

  async desvincularAluno(alunoRotaId: string) {
    return await prisma.alunoRota.update({
      where: { id: alunoRotaId },
      data: { isActive: false },
    });
  }

  async findAlunosByRota(rotaId: string) {
    return await prisma.alunoRota.findMany({
      where: {
        rotaId,
        isActive: true,
      },
      include: {
        parada: true,
      },
      orderBy: {
        parada: {
          ordem: 'asc',
        },
      },
    });
  }

  async findRotaByAluno(alunoId: string) {
    return await prisma.alunoRota.findFirst({
      where: {
        alunoId,
        isActive: true,
      },
      include: {
        rota: {
          include: {
            veiculo: true,
            paradas: {
              orderBy: { ordem: 'asc' },
            },
          },
        },
        parada: true,
      },
    });
  }

  // ==================== RELATÓRIOS ====================

  async getEstatisticas() {
    const totalVeiculos = await prisma.veiculoEscolar.count({
      where: { isActive: true },
    });

    const veiculosDisponiveis = await prisma.veiculoEscolar.count({
      where: {
        isActive: true,
        status: 'DISPONIVEL',
      },
    });

    const totalRotas = await prisma.rotaEscolar.count({
      where: { status: { not: 'INATIVA' } },
    });

    const totalAlunos = await prisma.alunoRota.count({
      where: { isActive: true },
    });

    const alunosPorTurno = await prisma.alunoRota.groupBy({
      by: ['rotaId'],
      where: { isActive: true },
      _count: true,
    });

    return {
      totalVeiculos,
      veiculosDisponiveis,
      totalRotas,
      totalAlunos,
      mediaAlunosPorRota: totalRotas > 0 ? Math.round(totalAlunos / totalRotas) : 0,
    };
  }

  async getVeiculosManutencao() {
    return await prisma.veiculoEscolar.findMany({
      where: {
        isActive: true,
        OR: [
          { status: 'MANUTENCAO' },
          {
            proximaManutencao: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
            },
          },
        ],
      },
      orderBy: { proximaManutencao: 'asc' },
    });
  }
}

export default new TransporteEscolarService();
