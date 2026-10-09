/**
 * Pedidos do portal que entram na mesa dos apps que antes só funcionavam no
 * balcão (Fase 1 da auditoria de 2026-10-08): matrícula e transporte escolar,
 * benefícios da Assistência Social, renovação/troca de ponto de credencial,
 * pedido de consulta e pedido de remédio.
 *
 * Chamado por `convertProtocolToAppOnCreate` (NÃO-FATAL). Cada conversão é
 * idempotente pelo `protocolId` (único em cada fila).
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';
import { validateCPF } from '../../utils/validators';

type PortalProtocol = {
  id: string;
  number?: string | null;
  citizenId?: string | null;
  customData?: any;
};

/** Primeiro texto preenchido entre as chaves informadas (na ordem). */
function field(data: any, ...keys: string[]): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberField(data: any, ...keys: string[]): number | undefined {
  const raw = field(data, ...keys);
  if (raw === undefined) return undefined;
  const value = Number(String(raw).replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}

function dateField(data: any, ...keys: string[]): Date | null {
  const raw = field(data, ...keys);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "José da Silva " → "jose da silva" */
export function normalizeName(value?: string | null): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const sameDay = (a?: Date | null, b?: Date | null) =>
  Boolean(a && b && a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10));

/** Turno do formulário → enum TurnoPreferencia */
export function turnoPreferencia(value?: string): 'MATUTINO' | 'VESPERTINO' | 'INTEGRAL' | 'INDIFERENTE' {
  const key = normalizeName(value);
  if (key.startsWith('matut') || key.startsWith('manha')) return 'MATUTINO';
  if (key.startsWith('vesper') || key.startsWith('tarde')) return 'VESPERTINO';
  if (key.startsWith('integral')) return 'INTEGRAL';
  return 'INDIFERENTE';
}

/** Parentesco de quem pede → como o aluno entra na família dessa pessoa */
function relationshipFromParentesco(value?: string, sexo?: string): any {
  const key = normalizeName(value);
  const feminino = normalizeName(sexo).startsWith('f');
  if (key === 'pai' || key === 'mae' || key.startsWith('tutor')) return feminino ? 'DAUGHTER' : 'SON';
  if (key.startsWith('avo')) return feminino ? 'GRANDDAUGHTER' : 'GRANDSON';
  if (key.startsWith('irma')) return feminino ? 'SISTER' : 'BROTHER';
  return 'OTHER';
}

/**
 * Procura o aluno entre os familiares CONFIRMADOS do responsável (CPF, ou
 * nome + nascimento). Não achou e o formulário trouxe CPF válido de menor:
 * cadastra como dependente (mesma regra de "Minha família"). Senão, devolve
 * null — a equipe liga o cadastro antes de confirmar a matrícula.
 */
export async function resolveFamilyMember(
  responsavelId: string,
  input: { nome?: string; nascimento?: Date | null; cpf?: string; parentesco?: string; sexo?: string }
): Promise<string | null> {
  const cpf = String(input.cpf || '').replace(/\D/g, '');
  const nome = normalizeName(input.nome);

  const links = await prisma.familyComposition.findMany({
    where: { status: 'ACTIVE', OR: [{ headId: responsavelId }, { memberId: responsavelId }] },
    select: {
      headId: true,
      memberId: true,
      head: { select: { id: true, name: true, cpf: true, birthDate: true } },
      member: { select: { id: true, name: true, cpf: true, birthDate: true } },
    },
  });
  const parentes = links.map((link) => (link.headId === responsavelId ? link.member : link.head));

  const porCpf = cpf ? parentes.find((p) => p.cpf === cpf) : undefined;
  if (porCpf) return porCpf.id;
  const porNome = nome
    ? parentes.filter((p) => normalizeName(p.name) === nome && (!input.nascimento || !p.birthDate || sameDay(p.birthDate, input.nascimento)))
    : [];
  if (porNome.length === 1) return porNome[0].id;

  if (cpf && validateCPF(cpf) && input.nome && input.nascimento) {
    const { familyService } = await import('../family.service');
    const result = await familyService.createDependent(responsavelId, {
      name: input.nome,
      cpf,
      birthDate: input.nascimento.toISOString(),
      relationship: relationshipFromParentesco(input.parentesco, input.sexo),
    });
    if (result.success && (result.data as any)?.memberId) return (result.data as any).memberId;
  }
  return null;
}

/** Unidade escolar pelo nome digitado (contém, sem acento) */
async function findUnidadeEducacao(nome?: string) {
  const key = normalizeName(nome);
  if (key.length < 3) return null;
  const unidades = await prisma.unidadeEducacao.findMany({ where: { isActive: true }, select: { id: true, nome: true } });
  return unidades.find((u) => normalizeName(u.nome) === key) || unidades.find((u) => normalizeName(u.nome).includes(key) || key.includes(normalizeName(u.nome))) || null;
}

// ============================================================================
// EDUCAÇÃO
// ============================================================================

/**
 * Pedido aberto NO NOME do aluno (balcão atendendo a criança, ou dependente
 * com acesso próprio): o titular do pedido é um dependente e o nome do
 * formulário é o dele (ou veio vazio). Devolve o responsável (chefe da
 * família) para a inscrição não nascer com a criança como responsável.
 */
export async function ownDependentRequest(citizenId: string, nomeAluno?: string): Promise<{ alunoId: string; responsavelId: string; nome: string } | null> {
  const link = await prisma.familyComposition.findFirst({
    where: { memberId: citizenId, isDependent: true, status: 'ACTIVE' },
    select: { headId: true, member: { select: { name: true } } },
  });
  if (!link) return null;
  if (nomeAluno && normalizeName(nomeAluno) !== normalizeName(link.member.name)) return null;
  return { alunoId: citizenId, responsavelId: link.headId, nome: link.member.name };
}

async function matricula(protocol: PortalProtocol) {
  if (!protocol.citizenId) return;
  if (await prisma.inscricaoMatricula.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  let nomeAluno = field(data, 'nomeAluno', 'nome_aluno', 'aluno');
  const nascimento = dateField(data, 'dataNascimentoAluno', 'dataNascimento');
  let responsavelId = protocol.citizenId;
  let alunoId: string | null;
  const proprio = await ownDependentRequest(protocol.citizenId, nomeAluno);
  if (proprio) {
    alunoId = proprio.alunoId;
    responsavelId = proprio.responsavelId;
    nomeAluno = nomeAluno || proprio.nome;
  } else {
    alunoId = await resolveFamilyMember(protocol.citizenId, {
      nome: nomeAluno,
      nascimento,
      cpf: field(data, 'cpfAluno'),
      parentesco: field(data, 'grauParentesco'),
      sexo: field(data, 'sexoAluno'),
    });
  }
  const escolaTexto = field(data, 'escolaPreferencial', 'escola', 'unidadeEscolar');
  const escola = await findUnidadeEducacao(escolaTexto);
  const observacoes = [
    escolaTexto && !escola ? `Escola pedida: ${escolaTexto}` : undefined,
    field(data, 'nivelEnsino') && `Nível: ${field(data, 'nivelEnsino')}`,
    field(data, 'observacoes'),
  ].filter(Boolean).join(' · ');

  const { default: matriculaService } = await import('../matricula/matricula.service');
  await matriculaService.createInscricao({
    protocolId: protocol.id,
    responsavelId,
    alunoId,
    nomeAluno,
    dataNascimentoAluno: nascimento,
    serie: field(data, 'serie', 'anoEscolar') || field(data, 'nivelEnsino') || 'A definir',
    turno: turnoPreferencia(field(data, 'turnoDesejado', 'turno')) as any,
    escolaPreferencia1: escola?.id,
    necessidadeEspecial: data.possuiNecessidadesEspeciais === true,
    descricaoNecessidade: field(data, 'descricaoNecessidades'),
    observacoes: observacoes || undefined,
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → inscrição de matrícula (${nomeAluno || 'aluno'})`);
}

async function transporteEscolar(protocol: PortalProtocol) {
  if (await prisma.solicitacaoTransporteEscolar.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const nomeInformado = field(data, 'nomeAluno', 'aluno');
  const proprio = protocol.citizenId ? await ownDependentRequest(protocol.citizenId, nomeInformado) : null;
  const nomeAluno = nomeInformado || proprio?.nome || 'Aluno';
  const alunoId = proprio
    ? proprio.alunoId
    : protocol.citizenId
      ? await resolveFamilyMember(protocol.citizenId, { nome: nomeAluno })
      : null;
  await prisma.solicitacaoTransporteEscolar.create({
    data: {
      protocolId: protocol.id,
      responsavelId: proprio?.responsavelId || protocol.citizenId || null,
      alunoId,
      nomeAluno,
      unidadeEscolar: field(data, 'unidadeEscolar', 'escola') || null,
      serie: field(data, 'serie') || null,
      turno: field(data, 'turno') || null,
      enderecoEmbarque: field(data, 'enderecoEmbarque') || null,
      distanciaKm: numberField(data, 'distanciaEscola', 'distanciaKm') ?? null,
      veiculoAdaptado: data.necessitaVeiculoAdaptado === true,
      dados: data,
    },
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → pedido de transporte escolar (${nomeAluno})`);
}

// ============================================================================
// ASSISTÊNCIA SOCIAL
// ============================================================================

const TIPO_PADRAO: Record<string, string> = {
  CESTA_BASICA: 'Cesta Básica',
  BENEFICIO_EVENTUAL: 'Benefício Eventual',
  SOLICITACAO_BENEFICIO: 'Benefício Social',
};

async function beneficioSocial(protocol: PortalProtocol, action: string) {
  if (!protocol.citizenId) return;
  if (await prisma.inscricaoProgramaSocial.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const tipo = field(data, 'tipoBeneficio') || TIPO_PADRAO[action] || 'Benefício';

  // Família do CadÚnico municipal (responsável ou membro) e programa pelo nome
  const familia = await prisma.cadUnicoFamilia.findFirst({
    where: { OR: [{ responsavelFamiliarId: protocol.citizenId }, { membros: { some: { citizenId: protocol.citizenId } } }] },
    select: { id: true },
  });
  const chave = normalizeName(tipo).replace(/\(.*\)/, '').trim();
  const programas = await prisma.programaSocial.findMany({ where: { isActive: true }, select: { id: true, nome: true } });
  const programa = chave
    ? programas.find((p) => normalizeName(p.nome) === chave) || programas.find((p) => normalizeName(p.nome).includes(chave) || chave.includes(normalizeName(p.nome)))
    : undefined;

  const resumo = [
    field(data, 'motivoSolicitacao', 'descricaoSituacao') && `Motivo: ${field(data, 'motivoSolicitacao', 'descricaoSituacao')}`,
    field(data, 'situacaoVulnerabilidade', 'situacaoEmergencial') && `Situação: ${field(data, 'situacaoVulnerabilidade', 'situacaoEmergencial')}`,
    field(data, 'quantidadePessoasFamilia') && `Pessoas na família: ${field(data, 'quantidadePessoasFamilia')}`,
    field(data, 'rendaFamiliarMensal') && `Renda familiar: R$ ${field(data, 'rendaFamiliarMensal')}`,
    field(data, 'nisCadUnico') && `NIS: ${field(data, 'nisCadUnico')}`,
    data.urgente === true ? 'URGENTE' : undefined,
  ].filter(Boolean).join(' · ');

  const { default: programaSocialService } = await import('../programa-social/programa-social.service');
  await programaSocialService.createInscricao({
    protocolId: protocol.id,
    beneficiarioId: protocol.citizenId,
    familiaId: familia?.id || null,
    programaId: programa?.id || null,
    tipoSolicitado: tipo,
    observacoes: resumo || undefined,
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → inscrição em programa social (${tipo})`);
}

// ============================================================================
// TRANSPORTES E TRÂNSITO
// ============================================================================

async function alteracaoCredencial(protocol: PortalProtocol, action: string) {
  if (await prisma.alteracaoCredencial.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const numero = field(data, 'numeroCredencial');
  const placa = field(data, 'placaVeiculo', 'placa')?.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const citizen = protocol.citizenId
    ? await prisma.citizen.findFirst({ where: { id: protocol.citizenId }, select: { cpf: true } })
    : null;
  const candidatos = [
    numero ? { numeroCredencial: numero } : null,
    placa ? { veiculoPlaca: placa } : null,
    protocol.citizenId ? { citizenId: protocol.citizenId } : null,
    citizen?.cpf ? { cpf: citizen.cpf.replace(/\D/g, '') } : null,
  ].filter(Boolean) as any[];
  const credencial = candidatos.length
    ? await prisma.credencialTransporte.findFirst({
        where: { OR: candidatos, status: { in: ['ATIVA', 'SUSPENSA'] } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
    : null;
  await prisma.alteracaoCredencial.create({
    data: {
      protocolId: protocol.id,
      credencialId: credencial?.id || null,
      tipo: action === 'TRANSFERENCIA_PONTO_TAXI' ? 'TRANSFERENCIA_PONTO' : 'RENOVACAO',
      numeroInformado: numero || null,
      placa: placa || null,
      pontoAtual: field(data, 'pontoAtual') || null,
      pontoDesejado: field(data, 'pontoDesejado') || null,
      motivo: field(data, 'motivoTransferencia', 'observacoes') || null,
      citizenId: protocol.citizenId || null,
      dados: data,
    },
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → ${action} (credencial ${credencial?.id || 'não encontrada'})`);
}

// ============================================================================
// SAÚDE
// ============================================================================

async function pedidoConsulta(protocol: PortalProtocol) {
  if (!protocol.citizenId) return;
  if (await prisma.solicitacaoConsulta.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  // Odontologia não tem campo "especialidade": usa o tipo de atendimento
  const odonto = field(data, 'tipoAtendimento');
  await prisma.solicitacaoConsulta.create({
    data: {
      protocolId: protocol.id,
      citizenId: protocol.citizenId,
      especialidade: field(data, 'especialidade') || (odonto ? `Odontologia — ${odonto}` : 'Clínico Geral'),
      unidadePreferida: field(data, 'unidadeSaude', 'unidade') || null,
      observacoes: field(data, 'observacoes') || null,
    },
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → pedido de consulta`);
}

async function pedidoMedicamento(protocol: PortalProtocol, action: string) {
  if (!protocol.citizenId) return;
  if (await prisma.solicitacaoMedicamento.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  await prisma.solicitacaoMedicamento.create({
    data: {
      protocolId: protocol.id,
      citizenId: protocol.citizenId,
      medicamento: field(data, 'medicamento') || 'Não informado',
      principioAtivo: field(data, 'principioAtivo') || null,
      dosagem: field(data, 'dosagem') || null,
      unidadePreferida: field(data, 'unidadeSaude', 'unidade') || null,
      usoContinuo: data.usoContinuo === true,
      altoCusto: action === 'MEDICAMENTOS_ALTO_CUSTO',
      dados: data,
    },
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → pedido de remédio`);
}

/** Ações tratadas aqui (as mesmas do catálogo de apps) */
export const PORTAL_REQUEST_ACTIONS = [
  'MATRICULA_ESCOLAR',
  'TRANSPORTE_ESCOLAR',
  'SOLICITACAO_BENEFICIO',
  'CESTA_BASICA',
  'BENEFICIO_EVENTUAL',
  'RENOVACAO_CREDENCIAMENTO',
  'TRANSFERENCIA_PONTO_TAXI',
  'AGENDAMENTO_CONSULTA',
  'CONTROLE_MEDICAMENTOS',
  'MEDICAMENTOS_ALTO_CUSTO',
] as const;

export async function convertPortalRequest(action: string, protocol: PortalProtocol): Promise<boolean> {
  switch (action) {
    case 'MATRICULA_ESCOLAR':
      await matricula(protocol);
      return true;
    case 'TRANSPORTE_ESCOLAR':
      await transporteEscolar(protocol);
      return true;
    case 'SOLICITACAO_BENEFICIO':
    case 'CESTA_BASICA':
    case 'BENEFICIO_EVENTUAL':
      await beneficioSocial(protocol, action);
      return true;
    case 'RENOVACAO_CREDENCIAMENTO':
    case 'TRANSFERENCIA_PONTO_TAXI':
      await alteracaoCredencial(protocol, action);
      return true;
    case 'AGENDAMENTO_CONSULTA':
      await pedidoConsulta(protocol);
      return true;
    case 'CONTROLE_MEDICAMENTOS':
    case 'MEDICAMENTOS_ALTO_CUSTO':
      await pedidoMedicamento(protocol, action);
      return true;
    default:
      return false;
  }
}
