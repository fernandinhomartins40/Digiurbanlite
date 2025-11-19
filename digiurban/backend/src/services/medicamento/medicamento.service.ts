import {
  PrismaClient,
  TipoMedicamento,
  UnidadeMedida,
  StatusEstoque,
  StatusDispensacao,
} from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMedicamentoDTO {
  nome: string;
  principioAtivo: string;
  tipo: TipoMedicamento;
  unidadeMedida: UnidadeMedida;
  concentracao?: string;
  fabricante?: string;
  codigoBarras?: string;
  isControlado?: boolean;
}

export interface CreateEstoqueDTO {
  medicamentoId: string;
  unidadeId: string;
  lote: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  dataFabricacao?: Date;
  dataValidade: Date;
}

export interface DispensarMedicamentoDTO {
  prescricaoId?: string;
  atendimentoId: string;
  citizenId: string;
  farmaceuticoId: string;
  medicamentoId: string;
  estoqueId: string;
  quantidade: number;
  observacoes?: string;
}

export interface AtualizarEstoqueDTO {
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  quantidadeMaxima?: number;
  status?: StatusEstoque;
}

export class MedicamentoService {
  /**
   * Criar novo medicamento
   */
  async createMedicamento(data: CreateMedicamentoDTO) {
    // Verificar se já existe medicamento com mesmo nome
    const existente = await prisma.medicamento.findFirst({
      where: {
        nome: data.nome,
        principioAtivo: data.principioAtivo,
      },
    });

    if (existente) {
      throw new Error('Medicamento com este nome e princípio ativo já existe');
    }

    return await prisma.medicamento.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  /**
   * Buscar medicamento por ID
   */
  async findById(id: string) {
    return await prisma.medicamento.findUnique({
      where: { id },
    });
  }

  /**
   * Buscar medicamentos por nome ou princípio ativo
   */
  async search(termo: string) {
    return await prisma.medicamento.findMany({
      where: {
        isActive: true,
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { principioAtivo: { contains: termo, mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Listar todos os medicamentos ativos
   */
  async listAll() {
    return await prisma.medicamento.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Atualizar medicamento
   */
  async updateMedicamento(id: string, data: Partial<CreateMedicamentoDTO>) {
    return await prisma.medicamento.update({
      where: { id },
      data,
    });
  }

  /**
   * Desativar medicamento
   */
  async deactivate(id: string) {
    return await prisma.medicamento.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== GESTÃO DE ESTOQUE ====================

  /**
   * Criar entrada de estoque
   */
  async createEstoque(data: CreateEstoqueDTO) {
    // Verificar se já existe estoque com mesmo lote
    const existente = await prisma.estoqueMedicamento.findFirst({
      where: {
        medicamentoId: data.medicamentoId,
        unidadeId: data.unidadeId,
        lote: data.lote,
      },
    });

    if (existente) {
      throw new Error('Já existe estoque cadastrado para este lote nesta unidade');
    }

    // Verificar se está vencido
    const hoje = new Date();
    const status = data.dataValidade < hoje ? 'VENCIDO' : 'DISPONIVEL';

    return await prisma.estoqueMedicamento.create({
      data: {
        ...data,
        status,
      },
    });
  }

  /**
   * Buscar estoque por ID
   */
  async findEstoqueById(id: string) {
    return await prisma.estoqueMedicamento.findUnique({
      where: { id },
      include: {
        medicamento: true,
      },
    });
  }

  /**
   * Buscar estoque por medicamento e unidade
   */
  async findEstoqueByMedicamentoUnidade(medicamentoId: string, unidadeId: string) {
    return await prisma.estoqueMedicamento.findMany({
      where: {
        medicamentoId,
        unidadeId,
        status: {
          in: ['DISPONIVEL', 'ESTOQUE_BAIXO'],
        },
      },
      include: {
        medicamento: true,
      },
      orderBy: { dataValidade: 'asc' }, // FIFO: primeiro que vence, primeiro que sai
    });
  }

  /**
   * Buscar todo estoque de uma unidade
   */
  async findEstoqueByUnidade(unidadeId: string, statusFilter?: StatusEstoque) {
    return await prisma.estoqueMedicamento.findMany({
      where: {
        unidadeId,
        ...(statusFilter && { status: statusFilter }),
      },
      include: {
        medicamento: true,
      },
      orderBy: [{ medicamento: { nome: 'asc' } }, { dataValidade: 'asc' }],
    });
  }

  /**
   * Atualizar estoque
   */
  async updateEstoque(id: string, data: AtualizarEstoqueDTO) {
    const estoque = await prisma.estoqueMedicamento.findUnique({
      where: { id },
    });

    if (!estoque) {
      throw new Error('Estoque não encontrado');
    }

    // Atualizar status baseado na quantidade
    let novoStatus = data.status || estoque.status;
    const quantidadeAtual = data.quantidadeAtual ?? estoque.quantidadeAtual;
    const quantidadeMinima = data.quantidadeMinima ?? estoque.quantidadeMinima;

    if (quantidadeAtual === 0) {
      novoStatus = 'ESGOTADO';
    } else if (quantidadeAtual <= quantidadeMinima) {
      novoStatus = 'ESTOQUE_BAIXO';
    } else if (novoStatus !== 'VENCIDO' && novoStatus !== 'BLOQUEADO') {
      novoStatus = 'DISPONIVEL';
    }

    return await prisma.estoqueMedicamento.update({
      where: { id },
      data: {
        ...data,
        status: novoStatus,
      },
    });
  }

  /**
   * Adicionar quantidade ao estoque
   */
  async adicionarQuantidade(id: string, quantidade: number) {
    const estoque = await prisma.estoqueMedicamento.findUnique({
      where: { id },
    });

    if (!estoque) {
      throw new Error('Estoque não encontrado');
    }

    const novaQuantidade = estoque.quantidadeAtual + quantidade;

    return await this.updateEstoque(id, {
      quantidadeAtual: novaQuantidade,
    });
  }

  /**
   * Remover quantidade do estoque
   */
  async removerQuantidade(id: string, quantidade: number) {
    const estoque = await prisma.estoqueMedicamento.findUnique({
      where: { id },
    });

    if (!estoque) {
      throw new Error('Estoque não encontrado');
    }

    if (estoque.quantidadeAtual < quantidade) {
      throw new Error('Quantidade insuficiente em estoque');
    }

    const novaQuantidade = estoque.quantidadeAtual - quantidade;

    return await this.updateEstoque(id, {
      quantidadeAtual: novaQuantidade,
    });
  }

  /**
   * Verificar medicamentos com estoque baixo
   */
  async getEstoqueBaixo(unidadeId?: string) {
    return await prisma.estoqueMedicamento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        status: 'ESTOQUE_BAIXO',
      },
      include: {
        medicamento: true,
      },
      orderBy: { quantidadeAtual: 'asc' },
    });
  }

  /**
   * Verificar medicamentos próximos do vencimento
   */
  async getProximosVencimento(unidadeId?: string, diasAntecedencia = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    return await prisma.estoqueMedicamento.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        dataValidade: {
          lte: dataLimite,
          gte: new Date(),
        },
        status: {
          notIn: ['VENCIDO', 'ESGOTADO'],
        },
      },
      include: {
        medicamento: true,
      },
      orderBy: { dataValidade: 'asc' },
    });
  }

  /**
   * Marcar lotes vencidos
   */
  async marcarVencidos(unidadeId?: string) {
    const hoje = new Date();

    const result = await prisma.estoqueMedicamento.updateMany({
      where: {
        ...(unidadeId && { unidadeId }),
        dataValidade: {
          lt: hoje,
        },
        status: {
          not: 'VENCIDO',
        },
      },
      data: {
        status: 'VENCIDO',
      },
    });

    return result.count;
  }

  // ==================== DISPENSAÇÃO ====================

  /**
   * Dispensar medicamento
   */
  async dispensarMedicamento(data: DispensarMedicamentoDTO) {
    // Verificar estoque disponível
    const estoque = await prisma.estoqueMedicamento.findUnique({
      where: { id: data.estoqueId },
      include: {
        medicamento: true,
      },
    });

    if (!estoque) {
      throw new Error('Estoque não encontrado');
    }

    if (estoque.medicamentoId !== data.medicamentoId) {
      throw new Error('Estoque não corresponde ao medicamento solicitado');
    }

    if (estoque.quantidadeAtual < data.quantidade) {
      throw new Error(
        `Quantidade insuficiente em estoque. Disponível: ${estoque.quantidadeAtual}`
      );
    }

    if (!['DISPONIVEL', 'ESTOQUE_BAIXO'].includes(estoque.status)) {
      throw new Error(`Estoque não disponível para dispensação. Status: ${estoque.status}`);
    }

    // Verificar se é medicamento controlado
    if (estoque.medicamento.isControlado && !data.prescricaoId) {
      throw new Error('Medicamento controlado requer prescrição médica');
    }

    // Criar dispensação
    const dispensacao = await prisma.dispensacaoMedicamento.create({
      data: {
        prescricaoId: data.prescricaoId,
        atendimentoId: data.atendimentoId,
        citizenId: data.citizenId,
        farmaceuticoId: data.farmaceuticoId,
        medicamentoId: data.medicamentoId,
        estoqueId: data.estoqueId,
        quantidade: data.quantidade,
        status: 'AGUARDANDO',
        observacoes: data.observacoes,
      },
    });

    return dispensacao;
  }

  /**
   * Confirmar dispensação e baixar do estoque
   */
  async confirmarDispensacao(id: string) {
    const dispensacao = await prisma.dispensacaoMedicamento.findUnique({
      where: { id },
    });

    if (!dispensacao) {
      throw new Error('Dispensação não encontrada');
    }

    if (dispensacao.status !== 'AGUARDANDO') {
      throw new Error(`Dispensação não pode ser confirmada. Status: ${dispensacao.status}`);
    }

    // Baixar do estoque
    await this.removerQuantidade(dispensacao.estoqueId, dispensacao.quantidade);

    // Atualizar dispensação
    return await prisma.dispensacaoMedicamento.update({
      where: { id },
      data: {
        status: 'DISPENSADO',
        dispensadoEm: new Date(),
      },
    });
  }

  /**
   * Cancelar dispensação
   */
  async cancelarDispensacao(id: string, motivo?: string) {
    const dispensacao = await prisma.dispensacaoMedicamento.findUnique({
      where: { id },
    });

    if (!dispensacao) {
      throw new Error('Dispensação não encontrada');
    }

    if (dispensacao.status === 'DISPENSADO') {
      // Se já foi dispensada, devolver ao estoque
      await this.adicionarQuantidade(dispensacao.estoqueId, dispensacao.quantidade);
    }

    return await prisma.dispensacaoMedicamento.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        observacoes: motivo
          ? `${dispensacao.observacoes || ''}\nCancelamento: ${motivo}`
          : dispensacao.observacoes,
      },
    });
  }

  /**
   * Buscar dispensações por cidadão
   */
  async findDispensacoesByCitizen(citizenId: string) {
    return await prisma.dispensacaoMedicamento.findMany({
      where: { citizenId },
      include: {
        medicamento: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar dispensações por atendimento
   */
  async findDispensacoesByAtendimento(atendimentoId: string) {
    return await prisma.dispensacaoMedicamento.findMany({
      where: { atendimentoId },
      include: {
        medicamento: true,
        estoque: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Relatório de consumo de medicamentos
   */
  async getRelatorioConsumo(
    unidadeId: string,
    dataInicio: Date,
    dataFim: Date,
    medicamentoId?: string
  ) {
    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where: {
        status: 'DISPENSADO',
        dispensadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
        ...(medicamentoId && { medicamentoId }),
        estoque: {
          unidadeId,
        },
      },
      include: {
        medicamento: true,
      },
    });

    // Agrupar por medicamento
    const consumoPorMedicamento = dispensacoes.reduce(
      (acc, disp) => {
        const key = disp.medicamentoId;
        if (!acc[key]) {
          acc[key] = {
            medicamento: disp.medicamento,
            quantidadeTotal: 0,
            numeroDispensacoes: 0,
          };
        }
        acc[key].quantidadeTotal += disp.quantidade;
        acc[key].numeroDispensacoes += 1;
        return acc;
      },
      {} as Record<
        string,
        { medicamento: any; quantidadeTotal: number; numeroDispensacoes: number }
      >
    );

    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      totalDispensacoes: dispensacoes.length,
      consumoPorMedicamento: Object.values(consumoPorMedicamento).sort(
        (a, b) => b.quantidadeTotal - a.quantidadeTotal
      ),
    };
  }
}

export default new MedicamentoService();
