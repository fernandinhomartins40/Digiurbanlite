import { MatriculaStatus, Turno, TipoTurma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import workflowInstanceService from '../workflow/workflow-instance.service';
import { concludeProtocolFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';

const APP_NAME = 'Matrícula Escolar';

async function nomeDaEscola(unidadeId?: string | null) {
  if (!unidadeId) return null;
  const unidade = await prisma.unidadeEducacao.findFirst({ where: { id: unidadeId }, select: { nome: true } });
  return unidade?.nome || null;
}


export interface CreateInscricaoMatriculaDTO {
  /** Cadastro do aluno; no pedido do portal pode faltar até a equipe ligar o dependente */
  alunoId?: string | null;
  nomeAluno?: string;
  dataNascimentoAluno?: Date | null;
  /** Pedido do portal que originou a inscrição */
  protocolId?: string;
  responsavelId: string;
  anoLetivo?: number;
  escolaPreferencia1?: string;
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
  /** Cadastro do aluno, quando a inscrição do portal ainda não tem */
  alunoId?: string;
  responsavelId: string;
  dataInicio: Date;
}

export class MatriculaService {
  /**
   * Garante que a definição de workflow de matrícula existe para o tenant
   * atual (a tenant extension escopa o findFirst/create). Retorna o id.
   */
  private async ensureWorkflowDefinition(): Promise<string> {
    const existente = await prisma.workflowDefinition.findFirst({
      where: { module: 'EDUCACAO', name: 'Matrícula Escolar', isActive: true },
      select: { id: true },
    });
    if (existente) return existente.id;

    const criada = await prisma.workflowDefinition.create({
      data: {
        name: 'Matrícula Escolar',
        description: 'Inscrição → validação de documentos → atribuição de vaga → confirmação',
        module: 'EDUCACAO',
        stages: [
          { id: 'VALIDACAO', name: 'Validação de documentos', role: 'USER' },
          { id: 'ATRIBUICAO_VAGA', name: 'Atribuição de vaga', role: 'COORDINATOR' },
          { id: 'CONFIRMACAO', name: 'Confirmação da matrícula', role: 'USER' },
        ],
      },
    });
    return criada.id;
  }

  async createInscricao(data: CreateInscricaoMatriculaDTO) {
    const definitionId = await this.ensureWorkflowDefinition();
    const workflow = await workflowInstanceService.create({
      definitionId,
      entityType: 'INSCRICAO_MATRICULA',
      entityId: '',
      citizenId: data.alunoId || data.responsavelId,
      currentStage: 'VALIDACAO',
      metadata: { serie: data.serie, turno: data.turno },
    });

    // Campos um a um: o DTO tem nomes que a tabela não tem (antes o "...data"
    // derrubava a criação quando a tela mandava observações ou anexos)
    const inscricao = await prisma.inscricaoMatricula.create({
      data: {
        protocolId: data.protocolId || null,
        alunoId: data.alunoId || null,
        nomeAluno: data.nomeAluno || null,
        dataNascimentoAluno: data.dataNascimentoAluno || null,
        responsavelId: data.responsavelId,
        anoLetivo: data.anoLetivo || new Date().getFullYear(),
        serie: data.serie || '',
        turno: (data.turno as any) || 'MATUTINO',
        endereco: data.endereco || {},
        documentos: data.documentos || data.documentosAnexados || {},
        escolaPreferencia1: data.escolaPreferencia1 || null,
        escolaPreferencia2: data.escolaPreferencia2 || null,
        escolaPreferencia3: data.escolaPreferencia3 || null,
        necessidadeEspecial: Boolean(data.necessidadeEspecial),
        descricaoNecessidade: data.descricaoNecessidade || data.necessidadesEspeciais || null,
        isTransferencia: Boolean(data.isTransferencia),
        escolaOrigem: data.escolaOrigem || null,
        motivoTransferencia: data.motivoTransferencia || null,
        observacoes: data.observacoes || null,
        workflowId: workflow.id,
        status: 'INSCRITO_AGUARDANDO_VALIDACAO',
      },
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
      data: {
        status: novoStatus,
        validadoPor: data.validadorId,
        dataValidacao: new Date(),
        ...(data.aprovado ? {} : { motivoRecusa: data.observacoes || null }),
      },
    });

    await workflowInstanceService.transition(
      inscricao.workflowId,
      data.aprovado ? 'ATRIBUICAO_VAGA' : 'VALIDACAO',
      data.aprovado ? 'DOCS_APROVADOS' : 'DOCS_PENDENTES',
      data.validadorId,
      undefined,
      data.observacoes
    );

    await noteProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      actorId: data.validadorId,
      message: data.aprovado
        ? 'Documentos conferidos. Agora a Secretaria de Educação vai reservar a vaga.'
        : `Falta documento para a matrícula${data.observacoes ? `: ${data.observacoes}` : ''}. Envie pelo pedido ou leve à escola.`,
    });

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
      data: {
        status: 'VAGA_ATRIBUIDA',
        escolaAtribuida: turma.unidadeEducacaoId,
        turmaAtribuida: turma.id,
        dataDistribuicao: new Date(),
      },
    });

    await workflowInstanceService.transition(
      inscricao.workflowId,
      'CONFIRMACAO',
      'VAGA_ATRIBUIDA',
      data.gestorId,
      undefined,
      `Vaga atribuída na turma ${turma.nome || turma.codigo}`
    );

    const escola = await nomeDaEscola(turma.unidadeEducacaoId);
    await noteProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      actorId: data.gestorId,
      message: `Vaga reservada${escola ? ` na escola ${escola}` : ''}, turma ${turma.nome || turma.codigo} (${turma.serie}). Falta só confirmar a matrícula.`,
    });

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
    const alunoId = data.alunoId || inscricao.alunoId;
    if (!alunoId) {
      throw new Error(
        `Escolha o cadastro do aluno${inscricao.nomeAluno ? ` (${inscricao.nomeAluno})` : ''} antes de confirmar. Se a criança não tem cadastro, o responsável pode incluí-la como dependente em "Minha família" ou no balcão.`
      );
    }
    if (!inscricao.alunoId) {
      await prisma.inscricaoMatricula.update({ where: { id: inscricao.id }, data: { alunoId } });
    }

    // Gerar número de matrícula
    const ano = new Date().getFullYear();
    const count = await prisma.matricula.count();
    const numeroMatricula = `${ano}${(count + 1).toString().padStart(6, '0')}`;

    // Usa a turma atribuída na etapa anterior; fallback para a 1ª escola de preferência
    let turma = inscricao.turmaAtribuida
      ? await prisma.turma.findUnique({ where: { id: inscricao.turmaAtribuida } })
      : null;

    if (!turma) {
      const turmas = await prisma.turma.findMany({
        where: {
          unidadeEducacaoId: inscricao.escolaPreferencia1 || '',
          serie: inscricao.serie,
          ano,
          isActive: true,
        },
      });
      if (turmas.length === 0) throw new Error('Nenhuma turma disponível');
      turma = turmas[0];
    }

    const matricula = await prisma.matricula.create({
      data: {
        inscricaoId: data.inscricaoId,
        alunoId,
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

    const escola = await nomeDaEscola(turma.unidadeEducacaoId);
    await concludeProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      message: `Matrícula nº ${numeroMatricula} confirmada${escola ? ` na escola ${escola}` : ''}, turma ${turma.nome || turma.codigo}.`,
      outcome: 'DEFERIDO',
    });

    return matricula;
  }

  /** Sem vaga agora: a inscrição vai para a lista de espera e o cidadão é avisado. */
  async colocarEmEspera(inscricaoId: string, userId: string, motivo?: string) {
    const inscricao = await prisma.inscricaoMatricula.findUnique({ where: { id: inscricaoId } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    const naFrente = await prisma.inscricaoMatricula.count({
      where: { status: 'LISTA_ESPERA', serie: inscricao.serie, anoLetivo: inscricao.anoLetivo },
    });
    const atualizada = await prisma.inscricaoMatricula.update({
      where: { id: inscricaoId },
      data: { status: 'LISTA_ESPERA', posicaoFilaEspera: naFrente + 1 },
    });
    await noteProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      actorId: userId,
      message: `Ainda não há vaga para ${inscricao.serie}. A inscrição está na lista de espera (posição ${naFrente + 1})${motivo ? ` — ${motivo}` : ''}. Avisaremos quando abrir vaga.`,
    });
    return atualizada;
  }

  /** Pedido recusado (fora da idade, fora do município...). Encerra o pedido com o motivo. */
  async indeferir(inscricaoId: string, userId: string, motivo: string) {
    if (!motivo?.trim()) throw new Error('Informe o motivo');
    const inscricao = await prisma.inscricaoMatricula.findUnique({ where: { id: inscricaoId } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (inscricao.status === 'MATRICULADO') throw new Error('O aluno já está matriculado');
    const atualizada = await prisma.inscricaoMatricula.update({
      where: { id: inscricaoId },
      data: { status: 'INDEFERIDA', motivoRecusa: motivo.trim() },
    });
    await concludeProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      actorId: userId,
      message: `Inscrição de matrícula não aceita: ${motivo.trim()}`,
      outcome: 'INDEFERIDO',
    });
    return atualizada;
  }

  /** Liga o cadastro do aluno (dependente) à inscrição que veio do portal. */
  async vincularAluno(inscricaoId: string, alunoId: string) {
    const aluno = await prisma.citizen.findFirst({ where: { id: alunoId }, select: { id: true } });
    if (!aluno) throw new Error('Cadastro do aluno não encontrado');
    return prisma.inscricaoMatricula.update({ where: { id: inscricaoId }, data: { alunoId } });
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
