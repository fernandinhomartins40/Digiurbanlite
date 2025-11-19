import {
  PrismaClient,
  CadUnicoStatus,
  GrauParentesco,
  SituacaoTrabalho,
} from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface CreateCadUnicoFamiliaDTO {
  responsavelFamiliarId: string;
  endereco: any;
  rendaTotalFamiliar?: number;
  membros: CreateMembroFamiliaDTO[];
}

export interface CreateMembroFamiliaDTO {
  citizenId?: string;
  nome: string;
  cpf?: string;
  dataNascimento: Date;
  parentesco: GrauParentesco;
  sexo: string;
  raca: string;
  escolaridade: string;
  grauParentesco?: GrauParentesco;
  numeroNIS?: string;
  situacaoTrabalho?: SituacaoTrabalho;
  rendaIndividual?: number;
  rendaMensal?: number;
  trabalha?: boolean;
  possuiDeficiencia?: boolean;
  tipoDeficiencia?: string;
  deficiencia?: boolean;
  frequentaEscola?: boolean;
  nivelEscolaridade?: string;
  fonteRenda?: string;
}

export interface AgendarEntrevistaDTO {
  familiaId: string;
  dataEntrevista: Date;
  entrevistadorId: string;
}

export interface RealizarEntrevistaDTO {
  familiaId: string;
  entrevistadorId: string;
  dadosAtualizados?: any;
  observacoes?: string;
}

export interface ValidarDadosDTO {
  familiaId: string;
  validadorId: string;
  aprovado: boolean;
  observacoes?: string;
}

export class CadUnicoService {
  async createFamilia(data: CreateCadUnicoFamiliaDTO) {
    const workflow = await workflowInstanceService.create({
      definitionId: 'cadunico-v1',
      entityType: 'CADUNICO_FAMILIA',
      entityId: '',
      citizenId: data.responsavelFamiliarId,
      currentStage: 'AGENDAMENTO',
      metadata: { numeroMembros: data.membros.length },
    });

    const familia = await prisma.cadUnicoFamilia.create({
      data: {
        workflowId: workflow.id,
        responsavelFamiliarId: data.responsavelFamiliarId,
        endereco: data.endereco,
        rendaTotalFamiliar: data.rendaTotalFamiliar || 0,
        tipoMoradia: 'CASA_PROPRIA',
        situacaoMoradia: 'ADEQUADA',
        documentos: {},
        status: 'AGENDADO',
      },
    });

    // Criar membros
    for (const membroData of data.membros) {
      await prisma.membroFamilia.create({
        data: {
          familiaId: familia.id,
          citizenId: membroData.citizenId,
          nome: membroData.nome,
          cpf: membroData.cpf,
          dataNascimento: membroData.dataNascimento,
          parentesco: membroData.parentesco || membroData.grauParentesco || 'OUTRO',
          sexo: membroData.sexo as any,
          raca: membroData.raca as any,
          escolaridade: membroData.escolaridade as any,
          trabalha: membroData.trabalha || false,
          rendaMensal: membroData.rendaMensal || membroData.rendaIndividual || 0,
          fonteRenda: membroData.fonteRenda,
          deficiencia: membroData.deficiencia || membroData.possuiDeficiencia || false,
          tipoDeficiencia: membroData.tipoDeficiencia,
          frequentaEscola: membroData.frequentaEscola || false,
        },
      });
    }

    await workflowInstanceService.update(workflow.id, { entityId: familia.id });
    return await this.findById(familia.id);
  }

  async agendarEntrevista(data: AgendarEntrevistaDTO) {
    const familia = await prisma.cadUnicoFamilia.findUnique({
      where: { id: data.familiaId },
    });

    if (!familia) throw new Error('Família não encontrada');

    await prisma.cadUnicoFamilia.update({
      where: { id: data.familiaId },
      data: {
        status: 'AGUARDANDO_ENTREVISTA',
        dataEntrevista: data.dataEntrevista,
        entrevistadorId: data.entrevistadorId,
      },
    });

    await workflowInstanceService.transition(
      familia.workflowId,
      'ENTREVISTA',
      'ENTREVISTA_AGENDADA',
      data.entrevistadorId,
      undefined,
      `Entrevista agendada para ${data.dataEntrevista.toLocaleDateString()}`
    );

    return await this.findById(data.familiaId);
  }

  async realizarEntrevista(data: RealizarEntrevistaDTO) {
    const familia = await prisma.cadUnicoFamilia.findUnique({
      where: { id: data.familiaId },
    });

    if (!familia) throw new Error('Família não encontrada');

    await prisma.cadUnicoFamilia.update({
      where: { id: data.familiaId },
      data: {
        status: 'DOCUMENTOS_VALIDADOS',
        observacoes: data.observacoes,
      },
    });

    await workflowInstanceService.transition(
      familia.workflowId,
      'VALIDACAO',
      'ENTREVISTA_REALIZADA',
      data.entrevistadorId,
      undefined,
      'Entrevista realizada'
    );

    return await this.findById(data.familiaId);
  }

  async validarDados(data: ValidarDadosDTO) {
    const familia = await prisma.cadUnicoFamilia.findUnique({
      where: { id: data.familiaId },
    });

    if (!familia) throw new Error('Família não encontrada');

    if (data.aprovado) {
      // Gerar número CadÚnico
      const count = await prisma.cadUnicoFamilia.count({
        where: { numeroCadUnico: { not: null } },
      });
      const numeroCadUnico = `${new Date().getFullYear()}${(count + 1)
        .toString()
        .padStart(8, '0')}`;

      await prisma.cadUnicoFamilia.update({
        where: { id: data.familiaId },
        data: {
          status: 'CADASTRADO',
          numeroCadUnico,
          dataUltimaAtualizacao: new Date(),
        },
      });

      await workflowInstanceService.complete(
        familia.workflowId,
        data.validadorId,
        undefined,
        'Cadastro aprovado e finalizado'
      );
    } else {
      await prisma.cadUnicoFamilia.update({
        where: { id: data.familiaId },
        data: { status: 'AGUARDANDO_ANALISE' },
      });

      await workflowInstanceService.transition(
        familia.workflowId,
        'VALIDACAO',
        'PENDENCIAS_IDENTIFICADAS',
        data.validadorId,
        undefined,
        data.observacoes
      );
    }

    return await this.findById(data.familiaId);
  }

  async ativarCadastro(familiaId: string, userId: string) {
    await prisma.cadUnicoFamilia.update({
      where: { id: familiaId },
      data: { status: 'ATIVO' },
    });
    return await this.findById(familiaId);
  }

  async findById(id: string) {
    return await prisma.cadUnicoFamilia.findUnique({
      where: { id },
      include: { membros: true },
    });
  }

  async findByResponsavel(responsavelId: string) {
    return await prisma.cadUnicoFamilia.findMany({
      where: { responsavelFamiliarId: responsavelId },
      include: { membros: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByNumeroCadUnico(numeroCadUnico: string) {
    return await prisma.cadUnicoFamilia.findUnique({
      where: { numeroCadUnico },
      include: { membros: true },
    });
  }

  async findByStatus(status: CadUnicoStatus) {
    return await prisma.cadUnicoFamilia.findMany({
      where: { status },
      include: { membros: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export default new CadUnicoService();
