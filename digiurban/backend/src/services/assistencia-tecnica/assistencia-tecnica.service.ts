import { PrismaClient, TipoAssistenciaTecnica, StatusAssistencia, StatusVisita } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-04: ASSISTÊNCIA TÉCNICA RURAL (ATER)
// ============================================================================

// TÉCNICOS
interface CreateTecnicoDTO {
  nome: string;
  cpf: string;
  crea?: string;
  especialidade: string;
  especialidades?: any[];
  telefone?: string;
  celular: string;
  email?: string;
  vinculo: string;
  matricula?: string;
  disponibilidade?: any[];
  foto?: string;
}

interface UpdateTecnicoDTO {
  nome?: string;
  crea?: string;
  especialidade?: string;
  especialidades?: any[];
  telefone?: string;
  celular?: string;
  email?: string;
  vinculo?: string;
  disponibilidade?: any[];
  foto?: string;
  isActive?: boolean;
}

// SOLICITAÇÕES
interface CreateSolicitacaoAssistenciaDTO {
  produtorId: string;
  propriedadeId?: string;
  tipoAssistencia: TipoAssistenciaTecnica;
  assunto: string;
  descricaoProblema: string;
  urgente?: boolean;
  cultura?: string;
  areaAfetada?: number;
  dataPreferencial?: Date;
  periodoPreferencial?: string;
  fotos?: any[];
  documentos?: any[];
  observacoes?: string;
}

interface UpdateSolicitacaoAssistenciaDTO {
  tipoAssistencia?: TipoAssistenciaTecnica;
  assunto?: string;
  descricaoProblema?: string;
  urgente?: boolean;
  cultura?: string;
  areaAfetada?: number;
  dataPreferencial?: Date;
  periodoPreferencial?: string;
  status?: StatusAssistencia;
  fotos?: any[];
  documentos?: any[];
  observacoes?: string;
}

// VISITAS
interface CreateVisitaDTO {
  solicitacaoId: string;
  produtorId: string;
  propriedadeId?: string;
  tecnicoId: string;
  dataAgendada: Date;
  horarioInicio: string;
  horarioFim?: string;
  assuntoVisita: string;
}

interface UpdateVisitaDTO {
  dataAgendada?: Date;
  horarioInicio?: string;
  horarioFim?: string;
  dataRealizacao?: Date;
  horaChegada?: string;
  horaSaida?: string;
  assuntoVisita?: string;
  diagnostico?: string;
  recomendacoes?: string;
  prescricoesTecnicas?: string;
  analiseRealizada?: string;
  amostrasColetadas?: boolean;
  tipoAmostras?: string;
  fotos?: any[];
  assinaturaProdutor?: string;
  assinaturaTecnico?: string;
  status?: StatusVisita;
  necessitaRetorno?: boolean;
  dataRetornoPrevisto?: Date;
  motivoRetorno?: string;
  observacoes?: string;
}

class AssistenciaTecnicaService {
  // ========== TÉCNICOS ==========

  // Criar técnico
  async createTecnico(data: CreateTecnicoDTO) {
    // Verificar se CPF já existe
    const existingCPF = await prisma.tecnicoAgricola.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingCPF) {
      throw new Error('CPF já cadastrado');
    }

    // Verificar matrícula se informada
    if (data.matricula) {
      const existingMatricula = await prisma.tecnicoAgricola.findUnique({
        where: { matricula: data.matricula },
      });

      if (existingMatricula) {
        throw new Error('Matrícula já cadastrada');
      }
    }

    const tecnico = await prisma.tecnicoAgricola.create({
      data: {
        ...data,
        especialidades: data.especialidades || [],
        disponibilidade: data.disponibilidade || [],
      },
    });

    return tecnico;
  }

  // Buscar técnico por ID
  async findTecnicoById(id: string) {
    const tecnico = await prisma.tecnicoAgricola.findUnique({
      where: { id },
      include: {
        visitas: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            produtor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!tecnico) {
      throw new Error('Técnico não encontrado');
    }

    return tecnico;
  }

  // Listar técnicos ativos
  async listTecnicosAtivos() {
    const tecnicos = await prisma.tecnicoAgricola.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });

    return tecnicos;
  }

  // Listar por especialidade
  async listByEspecialidade(especialidade: string) {
    const tecnicos = await prisma.tecnicoAgricola.findMany({
      where: {
        especialidade: { contains: especialidade, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    return tecnicos;
  }

  // Atualizar técnico
  async updateTecnico(id: string, data: UpdateTecnicoDTO) {
    const tecnico = await this.findTecnicoById(id);

    const updated = await prisma.tecnicoAgricola.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Desativar técnico
  async deactivateTecnico(id: string) {
    const tecnico = await this.findTecnicoById(id);

    const updated = await prisma.tecnicoAgricola.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  // ========== SOLICITAÇÕES ==========

  // Criar solicitação
  async createSolicitacao(data: CreateSolicitacaoAssistenciaDTO) {
    // Verificar se produtor existe
    const produtor = await prisma.produtorRural.findUnique({
      where: { id: data.produtorId },
    });

    if (!produtor) {
      throw new Error('Produtor rural não encontrado');
    }

    const solicitacao = await prisma.solicitacaoAssistencia.create({
      data: {
        ...data,
        urgente: data.urgente || false,
        fotos: data.fotos || [],
        documentos: data.documentos || [],
      },
    });

    return solicitacao;
  }

  // Buscar solicitação por ID
  async findSolicitacaoById(id: string) {
    const solicitacao = await prisma.solicitacaoAssistencia.findUnique({
      where: { id },
      include: {
        visita: {
          include: {
            tecnico: true,
            propriedade: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    return solicitacao;
  }

  // Listar solicitações
  async listSolicitacoes(filters?: {
    status?: StatusAssistencia;
    urgente?: boolean;
    tipoAssistencia?: TipoAssistenciaTecnica;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.urgente !== undefined) where.urgente = filters.urgente;
    if (filters?.tipoAssistencia) where.tipoAssistencia = filters.tipoAssistencia;

    const solicitacoes = await prisma.solicitacaoAssistencia.findMany({
      where,
      include: {
        visita: {
          include: {
            tecnico: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: [{ urgente: 'desc' }, { createdAt: 'desc' }],
    });

    return solicitacoes;
  }

  // Listar solicitações por produtor
  async findSolicitacoesByProdutor(produtorId: string) {
    const solicitacoes = await prisma.solicitacaoAssistencia.findMany({
      where: { produtorId },
      include: {
        visita: {
          include: {
            tecnico: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitacoes;
  }

  // Atualizar solicitação
  async updateSolicitacao(id: string, data: UpdateSolicitacaoAssistenciaDTO) {
    const solicitacao = await this.findSolicitacaoById(id);

    const updated = await prisma.solicitacaoAssistencia.update({
      where: { id },
      data: {
        ...data,
        dataStatus: data.status ? new Date() : solicitacao.dataStatus,
      },
    });

    return updated;
  }

  // Cancelar solicitação
  async cancelarSolicitacao(id: string) {
    const solicitacao = await this.findSolicitacaoById(id);

    if (solicitacao.status === 'CONCLUIDA') {
      throw new Error('Não é possível cancelar solicitação já concluída');
    }

    const updated = await prisma.solicitacaoAssistencia.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        dataStatus: new Date(),
      },
    });

    return updated;
  }

  // ========== VISITAS ==========

  // Agendar visita
  async createVisita(data: CreateVisitaDTO) {
    // Verificar se solicitação existe
    const solicitacao = await this.findSolicitacaoById(data.solicitacaoId);

    if (solicitacao.visita) {
      throw new Error('Já existe uma visita agendada para esta solicitação');
    }

    // Verificar se técnico existe
    const tecnico = await this.findTecnicoById(data.tecnicoId);

    const visita = await prisma.visitaAssistenciaTecnica.create({
      data,
      include: {
        tecnico: true,
        produtor: true,
        propriedade: true,
        solicitacao: true,
      },
    });

    // Atualizar status da solicitação
    await this.updateSolicitacao(data.solicitacaoId, {
      status: 'AGENDADA',
    });

    return visita;
  }

  // Buscar visita por ID
  async findVisitaById(id: string) {
    const visita = await prisma.visitaAssistenciaTecnica.findUnique({
      where: { id },
      include: {
        tecnico: true,
        produtor: true,
        propriedade: true,
        solicitacao: true,
      },
    });

    if (!visita) {
      throw new Error('Visita não encontrada');
    }

    return visita;
  }

  // Listar visitas por técnico
  async findVisitasByTecnico(tecnicoId: string, filters?: { status?: StatusVisita }) {
    const where: any = { tecnicoId };

    if (filters?.status) where.status = filters.status;

    const visitas = await prisma.visitaAssistenciaTecnica.findMany({
      where,
      include: {
        produtor: true,
        propriedade: true,
        solicitacao: true,
      },
      orderBy: { dataAgendada: 'asc' },
    });

    return visitas;
  }

  // Listar visitas agendadas para uma data
  async findVisitasPorData(data: Date) {
    const inicioDia = new Date(data);
    inicioDia.setHours(0, 0, 0, 0);

    const fimDia = new Date(data);
    fimDia.setHours(23, 59, 59, 999);

    const visitas = await prisma.visitaAssistenciaTecnica.findMany({
      where: {
        dataAgendada: {
          gte: inicioDia,
          lte: fimDia,
        },
        status: {
          in: ['AGENDADA', 'CONFIRMADA', 'EM_ANDAMENTO'],
        },
      },
      include: {
        tecnico: true,
        produtor: true,
        propriedade: true,
      },
      orderBy: { horarioInicio: 'asc' },
    });

    return visitas;
  }

  // Atualizar visita
  async updateVisita(id: string, data: UpdateVisitaDTO) {
    const visita = await this.findVisitaById(id);

    const updated = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data,
      include: {
        tecnico: true,
        produtor: true,
        propriedade: true,
      },
    });

    // Atualizar status da solicitação se necessário
    if (data.status === 'CONCLUIDA') {
      await this.updateSolicitacao(visita.solicitacaoId, {
        status: data.necessitaRetorno ? 'NECESSITA_RETORNO' : 'CONCLUIDA',
      });
    }

    return updated;
  }

  // Confirmar visita
  async confirmarVisita(id: string) {
    const visita = await this.findVisitaById(id);

    const updated = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: { status: 'CONFIRMADA' },
    });

    return updated;
  }

  // Iniciar visita
  async iniciarVisita(id: string) {
    const visita = await this.findVisitaById(id);

    const updated = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: {
        status: 'EM_ANDAMENTO',
        dataRealizacao: new Date(),
        horaChegada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    });

    await this.updateSolicitacao(visita.solicitacaoId, {
      status: 'EM_ATENDIMENTO',
    });

    return updated;
  }

  // Concluir visita
  async concluirVisita(
    id: string,
    data: {
      diagnostico: string;
      recomendacoes: string;
      prescricoesTecnicas?: string;
      necessitaRetorno?: boolean;
      dataRetornoPrevisto?: Date;
      motivoRetorno?: string;
      fotos?: any[];
      observacoes?: string;
    }
  ) {
    const visita = await this.findVisitaById(id);

    const updated = await prisma.visitaAssistenciaTecnica.update({
      where: { id },
      data: {
        ...data,
        status: 'CONCLUIDA',
        horaSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    });

    await this.updateSolicitacao(visita.solicitacaoId, {
      status: data.necessitaRetorno ? 'NECESSITA_RETORNO' : 'CONCLUIDA',
    });

    return updated;
  }

  // Estatísticas
  async getStatistics(ano?: number) {
    const anoConsiderado = ano || new Date().getFullYear();
    const inicioAno = new Date(anoConsiderado, 0, 1);
    const fimAno = new Date(anoConsiderado, 11, 31, 23, 59, 59);

    const totalSolicitacoes = await prisma.solicitacaoAssistencia.count({
      where: {
        createdAt: { gte: inicioAno, lte: fimAno },
      },
    });

    const aguardandoAgendamento = await prisma.solicitacaoAssistencia.count({
      where: {
        status: 'AGUARDANDO_AGENDAMENTO',
      },
    });

    const agendadas = await prisma.solicitacaoAssistencia.count({
      where: {
        status: 'AGENDADA',
      },
    });

    const concluidas = await prisma.solicitacaoAssistencia.count({
      where: {
        status: 'CONCLUIDA',
        createdAt: { gte: inicioAno, lte: fimAno },
      },
    });

    const urgentes = await prisma.solicitacaoAssistencia.count({
      where: {
        urgente: true,
        status: { not: 'CONCLUIDA' },
      },
    });

    return {
      ano: anoConsiderado,
      totalSolicitacoes,
      aguardandoAgendamento,
      agendadas,
      concluidas,
      urgentes,
      taxaConclusao: totalSolicitacoes > 0 ? (concluidas / totalSolicitacoes) * 100 : 0,
    };
  }
}

export default new AssistenciaTecnicaService();
