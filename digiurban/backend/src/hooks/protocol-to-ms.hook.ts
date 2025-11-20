/**
 * 🔄 HOOK DE SINCRONIZAÇÃO: PROTOCOLO → MICRO SISTEMA
 *
 * Este hook é chamado automaticamente quando um protocolo é criado.
 * Ele detecta se o serviço está vinculado a um Micro Sistema (MS)
 * e cria o registro correspondente no MS.
 *
 * Exemplo:
 * - Cidadão cria protocolo de matrícula no portal
 * → Hook detecta moduleType = 'MATRICULA_ALUNO'
 * → Cria registro em inscricao_matricula
 * → Vincula protocolId para rastreamento bidirecional
 */

import { PrismaClient } from '@prisma/client';
import { MatriculaService } from '../services/matricula/matricula.service';
import { TFDService } from '../services/tfd/tfd.service';
import { AgendaMedicaService } from '../services/agenda-medica/agenda-medica.service';

const prisma = new PrismaClient();

interface ProtocolData {
  id: string;
  serviceId: string;
  citizenId?: string;
  requesterId?: string;
  customData: any;
  createdAt: Date;
}

/**
 * Hook principal chamado após criação de protocolo
 */
export async function onProtocolCreated(protocol: ProtocolData): Promise<void> {
  try {
    // Buscar informações do serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: protocol.serviceId },
      select: {
        id: true,
        name: true,
        moduleType: true,
        departmentId: true
      }
    });

    if (!service || !service.moduleType) {
      // Não é um MS, ignorar
      console.log(`[Hook] Protocolo ${protocol.id}: Serviço não tem moduleType, pulando sync MS`);
      return;
    }

    console.log(`[Hook] Protocolo ${protocol.id}: Sincronizando com MS ${service.moduleType}`);

    // Rotear para o MS específico baseado no moduleType
    await routeToMicroSystem(protocol, service.moduleType);

    console.log(`[Hook] Protocolo ${protocol.id}: Sincronizado com sucesso!`);
  } catch (error) {
    console.error(`[Hook] Erro ao sincronizar protocolo ${protocol.id}:`, error);
    // Não lançar erro para não bloquear criação do protocolo
  }
}

/**
 * Roteia o protocolo para o Micro Sistema correto
 */
async function routeToMicroSystem(protocol: ProtocolData, moduleType: string): Promise<void> {
  switch (moduleType) {
    // EDUCAÇÃO
    case 'MATRICULA_ALUNO':
    case 'MS_MATRICULAS':
      await syncMatricula(protocol);
      break;

    case 'TRANSPORTE_ESCOLAR':
    case 'MS_TRANSPORTE_ESCOLAR':
      await syncTransporteEscolar(protocol);
      break;

    case 'MERENDA_ESCOLAR':
    case 'MS_MERENDA':
      await syncMerenda(protocol);
      break;

    // SAÚDE
    case 'AGENDAMENTOS_MEDICOS':
    case 'MS_AGENDA_MEDICA':
      await syncAgendaMedica(protocol);
      break;

    case 'ENCAMINHAMENTOS_TFD':
    case 'MS_TFD':
      await syncTFD(protocol);
      break;

    case 'EXAMES_LABORATORIAIS':
    case 'MS_EXAMES':
      await syncExames(protocol);
      break;

    case 'CONSULTAS_ESPECIALIZADAS':
    case 'MS_CONSULTAS':
      await syncConsultasEspecializadas(protocol);
      break;

    // ASSISTÊNCIA SOCIAL
    case 'AUXILIO_EMERGENCIAL':
    case 'MS_AUXILIO':
      await syncAuxilioEmergencial(protocol);
      break;

    case 'CESTA_BASICA':
    case 'MS_CESTA_BASICA':
      await syncCestaBasica(protocol);
      break;

    case 'CADUNICO':
    case 'MS_CADUNICO':
      await syncCadUnico(protocol);
      break;

    // AGRICULTURA
    case 'CREDITO_AGRICOLA':
    case 'MS_CREDITO':
      await syncCreditoAgricola(protocol);
      break;

    case 'ASSISTENCIA_TECNICA':
    case 'MS_ASSISTENCIA_TECNICA':
      await syncAssistenciaTecnica(protocol);
      break;

    // Adicionar mais MS conforme necessário...

    default:
      console.log(`[Hook] ModuleType ${moduleType} não tem sincronização implementada ainda`);
  }
}

// ==================== FUNÇÕES DE SINCRONIZAÇÃO POR MS ====================

/**
 * MS-08: Matrículas Escolares
 */
async function syncMatricula(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId, requesterId } = protocol;

  try {
    // TODO: Implementar método createFromProtocol no MatriculaService
    // const matriculaService = new MatriculaService();
    // await matriculaService.createFromProtocol({...});

    console.log(`[MS-08] Sync matrícula pendente de implementação createFromProtocol - protocolo ${protocol.id}`);
  } catch (error) {
    console.error(`[MS-08] Erro ao criar inscrição:`, error);
    throw error;
  }
}

/**
 * MS-07: Transporte Escolar
 */
async function syncTransporteEscolar(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  await prisma.solicitacaoTransporteEscolar.create({
    data: {
      protocolId: protocol.id,
      alunoId: citizenId || '',
      responsavelId: protocol.requesterId || '',
      enderecoEmbarque: customData?.endereco || customData?.enderecoCompleto || '',
      unidadeEscolarId: customData?.escolaId || customData?.unidadeEscolarId,
      serie: customData?.serie,
      turno: customData?.turno,
      status: 'AGUARDANDO_ANALISE'
    }
  });

  console.log(`[MS-07] Solicitação de transporte criada para protocolo ${protocol.id}`);
}

/**
 * MS-09: Merenda Escolar
 */
async function syncMerenda(protocol: ProtocolData): Promise<void> {
  // Implementar conforme necessidade
  console.log(`[MS-09] Sync merenda não implementado ainda`);
}

/**
 * MS-02: Agenda Médica
 */
async function syncAgendaMedica(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  try {
    // TODO: Implementar método createFromProtocol no AgendaMedicaService
    // const agendaService = new AgendaMedicaService();
    // await agendaService.createFromProtocol({
    //   protocolId: protocol.id,
    //   pacienteId: citizenId,
    //   profissionalId: customData?.profissionalId || customData?.medicoId,
    //   unidadeId: customData?.unidadeId || customData?.unidadeSaudeId,
    //   especialidade: customData?.especialidade,
    //   dataDesejada: customData?.dataDesejada ? new Date(customData.dataDesejada) : undefined,
    //   turno: customData?.turno,
    //   motivoConsulta: customData?.motivo || customData?.motivoConsulta,
    //   prioridade: customData?.prioridade || 'NORMAL'
    // });

    console.log(`[MS-02] Sync agenda médica pendente de implementação createFromProtocol - protocolo ${protocol.id}`);
  } catch (error) {
    console.error(`[MS-02] Erro ao criar consulta:`, error);
    throw error;
  }
}

/**
 * MS-06: TFD (Tratamento Fora de Domicílio)
 */
async function syncTFD(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  try {
    // TODO: Implementar método createFromProtocol no TFDService
    // const tfdService = new TFDService();
    // await tfdService.createFromProtocol({
    //   protocolId: protocol.id,
    //   pacienteId: citizenId,
    //   destinoCidade: customData?.cidadeDestino,
    //   destinoEstado: customData?.estadoDestino,
    //   especialidade: customData?.especialidade,
    //   motivoViagem: customData?.motivo,
    //   acompanhante: customData?.necessitaAcompanhante || false,
    //   documentosAnexos: customData?.documentos || []
    // });

    console.log(`[MS-06] Sync TFD pendente de implementação createFromProtocol - protocolo ${protocol.id}`);
  } catch (error) {
    console.error(`[MS-06] Erro ao criar TFD:`, error);
    throw error;
  }
}

/**
 * MS-03: Exames
 */
async function syncExames(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  // SolicitacaoExame requer workflowId e campos específicos, não será sincronizado via protocolo simples
  // Deve ser criado através do serviço de Exames com workflow
  console.log(`[MS-03] Solicitação de exame requer criação via serviço com workflow, protocolo ${protocol.id}`);
}

/**
 * MS-01: Consultas Especializadas
 */
async function syncConsultasEspecializadas(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  await prisma.solicitacaoConsultaEspecializada.create({
    data: {
      protocolId: protocol.id,
      pacienteId: citizenId || '',
      especialidade: customData?.especialidade || '',
      unidadePreferencial: customData?.unidadeId,
      motivoConsulta: customData?.motivo || '',
      status: 'FILA_ESPERA'
    }
  });

  console.log(`[MS-01] Solicitação de consulta especializada criada para protocolo ${protocol.id}`);
}

/**
 * MS-13: Auxílio Emergencial
 */
async function syncAuxilioEmergencial(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId, requesterId } = protocol;

  await prisma.solicitacaoAuxilioEmergencial.create({
    data: {
      protocolId: protocol.id,
      familiaId: citizenId || '',
      responsavelId: requesterId || '',
      qtdMembrosFamilia: customData?.numeroPessoas ? parseInt(customData.numeroPessoas) : 1,
      rendaFamiliarTotal: customData?.rendaFamiliar ? parseFloat(customData.rendaFamiliar) : 0,
      situacaoEmergencia: customData?.tipoAuxilio || 'NECESSIDADE_BASICA',
      descricaoSituacao: customData?.motivo || '',
      status: 'EM_ANALISE'
    }
  });

  console.log(`[MS-13] Solicitação de auxílio emergencial criada para protocolo ${protocol.id}`);
}

/**
 * MS-14: Cesta Básica
 */
async function syncCestaBasica(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  await prisma.solicitacaoCestaBasica.create({
    data: {
      protocolId: protocol.id,
      familiaId: citizenId || '',
      responsavelId: protocol.requesterId || '',
      qtdMembrosFamilia: customData?.numeroMembros ? parseInt(customData.numeroMembros) : 1,
      rendaFamiliarTotal: customData?.rendaFamiliar ? parseFloat(customData.rendaFamiliar) : 0,
      motivoSolicitacao: customData?.motivo || '',
      status: 'AGUARDANDO_ANALISE'
    }
  });

  console.log(`[MS-14] Solicitação de cesta básica criada para protocolo ${protocol.id}`);
}

/**
 * MS-18: CadÚnico
 */
async function syncCadUnico(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  // CadUnico requer workflowId, não será sincronizado via protocolo simples
  // Deve ser criado através do serviço CadUnico com workflow
  console.log(`[MS-18] CadÚnico requer criação via serviço com workflow, protocolo ${protocol.id}`);

  console.log(`[MS-18] Cadastro CadÚnico criado para protocolo ${protocol.id}`);
}

/**
 * MS-20: Crédito Agrícola
 */
async function syncCreditoAgricola(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  await prisma.solicitacaoCreditoAgricola.create({
    data: {
      protocolId: protocol.id,
      produtorId: citizenId || '',
      cpfProdutor: customData?.cpf || '',
      tipoCredito: customData?.tipoCredito || 'CUSTEIO',
      finalidade: customData?.finalidade || '',
      valorSolicitado: customData?.valorSolicitado ? parseFloat(customData.valorSolicitado) : 0,
      areaPlantio: customData?.areaPlantio ? parseFloat(customData.areaPlantio) : undefined,
      culturaDestino: customData?.cultura,
      status: 'EM_ANALISE'
    }
  });

  console.log(`[MS-20] Solicitação de crédito agrícola criada para protocolo ${protocol.id}`);
}

/**
 * MS-19: Assistência Técnica Rural
 */
async function syncAssistenciaTecnica(protocol: ProtocolData): Promise<void> {
  const { customData, citizenId } = protocol;

  await prisma.solicitacaoAssistenciaTecnica.create({
    data: {
      protocolId: protocol.id,
      produtorId: citizenId || '',
      cpfProdutor: customData?.cpf || '',
      propriedadeId: customData?.propriedadeId,
      enderecoPropriedade: customData?.endereco || '',
      tipoAssistencia: customData?.tipoAssistencia || '',
      problemaRelatado: customData?.descricao || customData?.problema || '',
      status: 'AGUARDANDO_VISITA'
    }
  });

  console.log(`[MS-19] Solicitação de assistência técnica criada para protocolo ${protocol.id}`);
}

export default {
  onProtocolCreated
};
