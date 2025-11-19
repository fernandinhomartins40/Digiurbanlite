import { PrismaClient, StatusMaquina, EmprestimoMaquinaStatus } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface CreateMaquinaAgricolaDTO {
  nome: string;
  tipo: string;
  modelo: string;
  fabricante?: string;
  ano?: number;
  numeroPatrimonio?: string;
  capacidadeOperacional?: string;
  horasUso?: number;
}

export interface CreateProdutorRuralDTO {
  citizenId: string;
  cpf?: string;
  nome?: string;
  endereco?: any;
  propriedadeNome: string;
  propriedadeEndereco: string;
  areaTotalHectares: number;
  atividadePrincipal: string;
  inscricaoEstadual?: string;
  CAR?: string;
  telefoneContato: string;
}

export interface CreateSolicitacaoEmprestimoDTO {
  produtorRuralId: string;
  maquinaId: string;
  finalidade: string;
  areaTrabalhada?: number;
  areaUtilizacao?: string;
  tamanhoArea?: number;
  justificativa?: string;
  diasSolicitados?: number;
  dataInicio: Date;
  dataFim: Date;
  observacoes?: string;
}

export interface AprovarEmprestimoDTO {
  solicitacaoId: string;
  aprovadoPor: string;
}

export interface RegistrarEmprestimoDTO {
  solicitacaoId: string;
  condicaoRetirada: string;
}

export interface RegistrarDevolucaoDTO {
  solicitacaoId: string;
  condicaoDevolucao: string;
  horasUtilizadas: number;
  observacoes?: string;
}

export class MaquinasAgricolasService {
  // ==================== MÁQUINAS ====================

  async createMaquina(data: CreateMaquinaAgricolaDTO) {
    if (data.numeroPatrimonio) {
      const existente = await prisma.maquinaAgricolaMS.findUnique({
        where: { patrimonio: data.numeroPatrimonio },
      });

      if (existente) {
        throw new Error('Já existe máquina cadastrada com este número de patrimônio');
      }
    }

    return await prisma.maquinaAgricolaMS.create({
      data: {
        tipo: data.tipo || 'OUTRO',
        marca: data.fabricante || 'N/A',
        modelo: data.modelo,
        nome: data.nome,
        ano: data.ano,
        patrimonio: data.numeroPatrimonio || `PAT-${Date.now()}`,
        numeroPatrimonio: data.numeroPatrimonio,
        capacidade: data.capacidadeOperacional,
        horasUso: data.horasUso || 0,
        status: 'DISPONIVEL',
        isActive: true,
      } as any,
    });
  }

  async findMaquinaById(id: string) {
    return await prisma.maquinaAgricolaMS.findUnique({
      where: { id },
    });
  }

  async listMaquinasDisponiveis() {
    return await prisma.maquinaAgricolaMS.findMany({
      where: {
        isActive: true,
        status: 'DISPONIVEL',
      },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    });
  }

  async listAllMaquinas() {
    return await prisma.maquinaAgricolaMS.findMany({
      where: { isActive: true },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    });
  }

  async updateMaquina(id: string, data: Partial<CreateMaquinaAgricolaDTO>) {
    return await prisma.maquinaAgricolaMS.update({
      where: { id },
      data: data as any,
    });
  }

  async updateMaquinaStatus(id: string, status: StatusMaquina) {
    return await prisma.maquinaAgricolaMS.update({
      where: { id },
      data: { status },
    });
  }

  async registrarManutencao(id: string) {
    return await prisma.maquinaAgricolaMS.update({
      where: { id },
      data: {
        status: 'MANUTENCAO',
        ultimaManutencao: new Date(),
      },
    });
  }

  async finalizarManutencao(id: string, proximaManutencaoHoras?: number) {
    const maquina = await prisma.maquinaAgricolaMS.findUnique({
      where: { id },
    });

    if (!maquina) {
      throw new Error('Máquina não encontrada');
    }

    let proximaManutencao: Date | undefined;
    if (proximaManutencaoHoras && maquina.horasUso) {
      const horasRestantes = proximaManutencaoHoras - maquina.horasUso;
      const diasEstimados = Math.ceil(horasRestantes / 8); // 8h/dia estimado
      proximaManutencao = new Date();
      proximaManutencao.setDate(proximaManutencao.getDate() + diasEstimados);
    }

    return await prisma.maquinaAgricolaMS.update({
      where: { id },
      data: {
        status: 'DISPONIVEL',
        proximaManutencao,
      },
    });
  }

  // ==================== PRODUTORES RURAIS ====================

  async createProdutor(data: CreateProdutorRuralDTO) {
    const existente = await prisma.produtorRural.findUnique({
      where: { citizenId: data.citizenId },
    });

    if (existente) {
      throw new Error('Cidadão já cadastrado como produtor rural');
    }

    return await prisma.produtorRural.create({
      data: {
        ...data,
        cpf: data.cpf || '',
        nome: data.nome || '',
        endereco: data.endereco || {},
        isActive: true,
      } as any,
    });
  }

  async findProdutorById(id: string) {
    return await prisma.produtorRural.findUnique({
      where: { id },
    });
  }

  async findProdutorByCitizen(citizenId: string) {
    return await prisma.produtorRural.findUnique({
      where: { citizenId },
    });
  }

  async listAllProdutores() {
    return await prisma.produtorRural.findMany({
      where: { isActive: true },
      orderBy: { propriedadeNome: 'asc' },
    });
  }

  async updateProdutor(id: string, data: Partial<CreateProdutorRuralDTO>) {
    return await prisma.produtorRural.update({
      where: { id },
      data,
    });
  }

  // ==================== SOLICITAÇÕES DE EMPRÉSTIMO ====================

  async createSolicitacao(data: CreateSolicitacaoEmprestimoDTO) {
    // Verificar se o produtor existe
    const produtor = await prisma.produtorRural.findUnique({
      where: { id: data.produtorRuralId },
    });

    if (!produtor || !produtor.isActive) {
      throw new Error('Produtor rural não encontrado ou inativo');
    }

    // Verificar se a máquina está disponível
    const maquina = await prisma.maquinaAgricolaMS.findUnique({
      where: { id: data.maquinaId },
    });

    if (!maquina || !maquina.isActive) {
      throw new Error('Máquina não encontrada ou inativa');
    }

    if (maquina.status !== 'DISPONIVEL') {
      throw new Error(`Máquina não disponível. Status atual: ${maquina.status}`);
    }

    // Verificar conflito de datas
    const conflito = await prisma.solicitacaoEmprestimoMaquina.findFirst({
      where: {
        maquinaId: data.maquinaId,
        status: {
          in: ['APROVADO', 'EMPRESTIMO_ATIVO'],
        },
        OR: [
          {
            AND: [
              { dataInicio: { lte: data.dataInicio } },
              { dataFim: { gte: data.dataInicio } },
            ],
          },
          {
            AND: [
              { dataInicio: { lte: data.dataFim } },
              { dataFim: { gte: data.dataFim } },
            ],
          },
        ],
      },
    });

    if (conflito) {
      throw new Error('Máquina já tem empréstimo aprovado para este período');
    }

    // Criar workflow
    const workflow = await workflowInstanceService.create({
      definitionId: 'emprestimo-maquina-v1',
      entityType: 'SOLICITACAO_EMPRESTIMO_MAQUINA',
      entityId: '',
      citizenId: produtor.citizenId,
      currentStage: 'VALIDACAO_CADASTRO',
      metadata: {
        maquinaId: data.maquinaId,
        produtorId: data.produtorRuralId,
      },
    });

    // Criar solicitação
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.create({
      data: {
        workflowId: workflow.id,
        produtorRuralId: data.produtorRuralId,
        maquinaId: data.maquinaId,
        finalidade: data.finalidade as any,
        areaUtilizacao: data.areaUtilizacao || 'Não especificado',
        tamanhoArea: data.tamanhoArea,
        justificativa: data.justificativa || 'Não fornecida',
        diasSolicitados: data.diasSolicitados || Math.ceil((new Date(data.dataFim).getTime() - new Date(data.dataInicio).getTime()) / (1000 * 60 * 60 * 24)),
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        observacoes: data.observacoes,
        statusPagamento: 'PENDENTE',
        status: 'SOLICITADO',
      } as any,
    });

    // Atualizar workflow
    await workflowInstanceService.update(workflow.id, {
      entityId: solicitacao.id,
    });

    return await this.findSolicitacaoById(solicitacao.id);
  }

  async findSolicitacaoById(id: string) {
    return await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id },
      include: {
        produtorRural: true,
        maquina: true,
      },
    });
  }

  async findSolicitacoesByProdutor(produtorRuralId: string) {
    return await prisma.solicitacaoEmprestimoMaquina.findMany({
      where: { produtorRuralId },
      include: {
        maquina: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSolicitacoesByMaquina(maquinaId: string) {
    return await prisma.solicitacaoEmprestimoMaquina.findMany({
      where: { maquinaId },
      include: {
        produtorRural: true,
      },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findSolicitacoesByStatus(status: EmprestimoMaquinaStatus) {
    return await prisma.solicitacaoEmprestimoMaquina.findMany({
      where: { status },
      include: {
        produtorRural: true,
        maquina: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async validarCadastro(solicitacaoId: string, validadorId: string, aprovado: boolean) {
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id: solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'SOLICITADO') {
      throw new Error(`Solicitação não está em status válido: ${solicitacao.status}`);
    }

    const novoStatus = aprovado ? 'CADASTRO_VALIDADO' : 'CANCELADO';

    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: solicitacaoId },
      data: { status: novoStatus },
    });

    await workflowInstanceService.transition(
      solicitacao.workflowId,
      aprovado ? 'APROVACAO_TECNICA' : 'CANCELADO',
      aprovado ? 'CADASTRO_APROVADO' : 'CADASTRO_REPROVADO',
      validadorId,
      undefined,
      aprovado ? 'Cadastro validado' : 'Cadastro reprovado'
    );

    if (!aprovado) {
      await workflowInstanceService.cancel(
        solicitacao.workflowId,
        validadorId,
        undefined,
        'Cadastro do produtor não validado'
      );
    }

    return await this.findSolicitacaoById(solicitacaoId);
  }

  async aprovarTecnico(solicitacaoId: string, tecnicoId: string, aprovado: boolean, justificativa?: string) {
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id: solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    const novoStatus = aprovado ? 'APROVADO_TECNICO' : 'CANCELADO';

    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: solicitacaoId },
      data: { status: novoStatus },
    });

    await workflowInstanceService.transition(
      solicitacao.workflowId,
      aprovado ? 'APROVACAO_FINAL' : 'CANCELADO',
      aprovado ? 'TECNICO_APROVADO' : 'TECNICO_REPROVADO',
      tecnicoId,
      undefined,
      justificativa || (aprovado ? 'Aprovado tecnicamente' : 'Reprovado tecnicamente')
    );

    if (!aprovado) {
      await workflowInstanceService.cancel(
        solicitacao.workflowId,
        tecnicoId,
        undefined,
        'Solicitação reprovada pela análise técnica'
      );
    }

    return await this.findSolicitacaoById(solicitacaoId);
  }

  async aprovarEmprestimo(data: AprovarEmprestimoDTO) {
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: data.solicitacaoId },
      data: {
        status: 'APROVADO',
        aprovadoPor: data.aprovadoPor,
      },
    });

    await workflowInstanceService.transition(
      solicitacao.workflowId,
      'EMPRESTIMO',
      'EMPRESTIMO_APROVADO',
      data.aprovadoPor,
      undefined,
      'Empréstimo aprovado'
    );

    return await this.findSolicitacaoById(data.solicitacaoId);
  }

  async registrarEmprestimo(data: RegistrarEmprestimoDTO) {
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id: data.solicitacaoId },
      include: { maquina: true },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'APROVADO') {
      throw new Error('Solicitação não está aprovada');
    }

    // Atualizar solicitação
    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: data.solicitacaoId },
      data: {
        status: 'EMPRESTIMO_ATIVO',
        dataEmprestimo: new Date(),
        condicaoRetirada: data.condicaoRetirada,
      },
    });

    // Atualizar status da máquina
    await prisma.maquinaAgricolaMS.update({
      where: { id: solicitacao.maquinaId },
      data: { status: 'EMPRESTADA' },
    });

    await workflowInstanceService.transition(
      solicitacao.workflowId,
      'EMPRESTIMO',
      'MAQUINA_RETIRADA',
      'system',
      undefined,
      'Máquina retirada pelo produtor'
    );

    return await this.findSolicitacaoById(data.solicitacaoId);
  }

  async registrarDevolucao(data: RegistrarDevolucaoDTO) {
    const solicitacao = await prisma.solicitacaoEmprestimoMaquina.findUnique({
      where: { id: data.solicitacaoId },
      include: { maquina: true },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    if (solicitacao.status !== 'EMPRESTIMO_ATIVO') {
      throw new Error('Empréstimo não está ativo');
    }

    // Atualizar solicitação
    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: data.solicitacaoId },
      data: {
        status: 'DEVOLVIDO',
        dataDevolucao: new Date(),
        condicaoDevolucao: data.condicaoDevolucao,
        horasUtilizadas: data.horasUtilizadas,
        observacoes: data.observacoes
          ? `${solicitacao.observacoes || ''}\n\n[Devolução] ${data.observacoes}`
          : solicitacao.observacoes,
      },
    });

    // Atualizar horas de uso da máquina
    await prisma.maquinaAgricolaMS.update({
      where: { id: solicitacao.maquinaId },
      data: {
        status: 'DISPONIVEL',
        horasUso: {
          increment: data.horasUtilizadas,
        },
      },
    });

    await workflowInstanceService.complete(
      solicitacao.workflowId,
      'system',
      undefined,
      'Máquina devolvida e empréstimo finalizado'
    );

    // Marcar como finalizado
    await prisma.solicitacaoEmprestimoMaquina.update({
      where: { id: data.solicitacaoId },
      data: { status: 'FINALIZADO' },
    });

    return await this.findSolicitacaoById(data.solicitacaoId);
  }

  // ==================== RELATÓRIOS ====================

  async getEstatisticas(dataInicio: Date, dataFim: Date) {
    const solicitacoes = await prisma.solicitacaoEmprestimoMaquina.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    const total = solicitacoes.length;
    const aprovados = solicitacoes.filter((s) => s.status === 'APROVADO').length;
    const ativos = solicitacoes.filter((s) => s.status === 'EMPRESTIMO_ATIVO').length;
    const finalizados = solicitacoes.filter((s) => s.status === 'FINALIZADO').length;
    const cancelados = solicitacoes.filter((s) => s.status === 'CANCELADO').length;

    const horasTotais = solicitacoes
      .filter((s) => s.horasUtilizadas)
      .reduce((acc, s) => acc + (s.horasUtilizadas || 0), 0);

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      total,
      aprovados,
      ativos,
      finalizados,
      cancelados,
      horasTotaisUtilizadas: horasTotais,
    };
  }
}

export default new MaquinasAgricolasService();
