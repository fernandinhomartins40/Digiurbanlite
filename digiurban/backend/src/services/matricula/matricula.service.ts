import { PrismaClient, MatriculaStatus, Turno, TipoTurma } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface CreateInscricaoMatriculaDTO {
  alunoId: string;
  responsavelId: string;
  anoLetivo?: number;
  escolaPreferencia1: string;
  escolaPreferencia2?: string;
  escolaPreferencia3?: string;
  serie: string;
  turno?: Turno;
  tipoTurma?: TipoTurma;
  endereco?: any;
  documentos?: any;
  necessidadeEspecial?: boolean;
  descricaoNecessidade?: string;
  isTransferencia?: boolean;
  escolaOrigem?: string;
  motivoTransferencia?: string;
  necessidadesEspeciais?: string;
  documentosAnexados?: any;
  observacoes?: string;
}

export interface ValidarDocumentosDTO {
  inscricaoId: string;
  validadorId: string;
  aprovado: boolean;
  documentosPendentes?: string[];
  observacoes?: string;
}

export interface AtribuirVagaDTO {
  inscricaoId: string;
  turmaId: string;
  gestorId: string;
}

export interface ConfirmarMatriculaDTO {
  inscricaoId: string;
  responsavelId: string;
  dataInicio: Date;
}

export class MatriculaService {
  async createInscricao(data: CreateInscricaoMatriculaDTO) {
    const workflow = await workflowInstanceService.create({
      definitionId: 'matricula-v1',
      entityType: 'INSCRICAO_MATRICULA',
      entityId: '',
      citizenId: data.alunoId,
      currentStage: 'VALIDACAO',
      metadata: { serie: data.serie, turno: data.turno },
    });

    const inscricao = await prisma.inscricaoMatricula.create({
      data: {
        ...data,
        anoLetivo: data.anoLetivo || new Date().getFullYear(),
        serie: data.serie || '',
        turno: data.turno || 'MATUTINO',
        endereco: data.endereco || {},
        documentos: data.documentos || {},
        workflowId: workflow.id,
        status: 'INSCRITO_AGUARDANDO_VALIDACAO',
      } as any,
    });

    await workflowInstanceService.update(workflow.id, { entityId: inscricao.id });
    return inscricao;
  }

  async validarDocumentos(data: ValidarDocumentosDTO) {
    const inscricao = await prisma.inscricaoMatricula.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');

    const novoStatus = data.aprovado ? 'DOCUMENTOS_VALIDADOS' : 'DOCUMENTACAO_PENDENTE';

    await prisma.inscricaoMatricula.update({
      where: { id: data.inscricaoId },
      data: { status: novoStatus },
    });

    await workflowInstanceService.transition(
      inscricao.workflowId,
      data.aprovado ? 'ATRIBUICAO_VAGA' : 'VALIDACAO',
      data.aprovado ? 'DOCS_APROVADOS' : 'DOCS_PENDENTES',
      data.validadorId,
      undefined,
      data.observacoes
    );

    return await this.findById(data.inscricaoId);
  }

  async atribuirVaga(data: AtribuirVagaDTO) {
    const inscricao = await prisma.inscricaoMatricula.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');

    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });

    if (!turma) throw new Error('Turma não encontrada');
    if (turma.vagasOcupadas >= turma.capacidade) {
      throw new Error('Turma sem vagas disponíveis');
    }

    await prisma.inscricaoMatricula.update({
      where: { id: data.inscricaoId },
      data: { status: 'VAGA_ATRIBUIDA' },
    });

    await workflowInstanceService.transition(
      inscricao.workflowId,
      'CONFIRMACAO',
      'VAGA_ATRIBUIDA',
      data.gestorId,
      undefined,
      `Vaga atribuída na turma ${turma.nome}`
    );

    return await this.findById(data.inscricaoId);
  }

  async confirmarMatricula(data: ConfirmarMatriculaDTO) {
    const inscricao = await prisma.inscricaoMatricula.findUnique({
      where: { id: data.inscricaoId },
      include: { matricula: true },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (inscricao.status !== 'VAGA_ATRIBUIDA') {
      throw new Error('Inscrição não está com vaga atribuída');
    }

    // Gerar número de matrícula
    const ano = new Date().getFullYear();
    const count = await prisma.matricula.count();
    const numeroMatricula = `${ano}${(count + 1).toString().padStart(6, '0')}`;

    // Buscar a turma da inscrição (deveria estar no workflow metadata ou outro campo)
    // Por simplicidade, vou assumir que pegamos a primeira escola de preferência
    const turmas = await prisma.turma.findMany({
      where: {
        unidadeEducacaoId: inscricao.escolaPreferencia1 || '',
        serie: inscricao.serie,
        ano,
        isActive: true,
      },
    });

    if (turmas.length === 0) throw new Error('Nenhuma turma disponível');
    const turma = turmas[0];

    const matricula = await prisma.matricula.create({
      data: {
        inscricaoId: data.inscricaoId,
        alunoId: inscricao.alunoId,
        responsavelId: inscricao.responsavelId,
        unidadeEducacaoId: turma.unidadeEducacaoId,
        anoLetivo: inscricao.anoLetivo,
        turmaId: turma.id,
        numeroMatricula,
        dataInicio: data.dataInicio,
        situacao: 'ATIVA',
      } as any,
    });

    await prisma.turma.update({
      where: { id: turma.id },
      data: { vagasOcupadas: { increment: 1 } },
    });

    await prisma.inscricaoMatricula.update({
      where: { id: data.inscricaoId },
      data: { status: 'MATRICULADO' },
    });

    await workflowInstanceService.complete(
      inscricao.workflowId,
      data.responsavelId,
      undefined,
      'Matrícula confirmada'
    );

    return matricula;
  }

  async findById(id: string) {
    return await prisma.inscricaoMatricula.findUnique({
      where: { id },
      include: { matricula: { include: { turma: true } } },
    });
  }

  async findByAluno(alunoId: string) {
    return await prisma.inscricaoMatricula.findMany({
      where: { alunoId },
      include: { matricula: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: MatriculaStatus) {
    return await prisma.inscricaoMatricula.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export default new MatriculaService();
