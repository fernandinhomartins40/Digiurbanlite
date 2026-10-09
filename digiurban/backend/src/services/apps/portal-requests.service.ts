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
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

async function citizenOf(protocol: PortalProtocol) {
  return protocol.citizenId
    ? prisma.citizen.findFirst({ where: { id: protocol.citizenId }, select: { id: true, name: true, cpf: true, phone: true, email: true } })
    : null;
}

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
    isTransferencia: Boolean(field(data, 'escolaOrigem', 'motivoTransferencia')),
    escolaOrigem: field(data, 'escolaOrigem'),
    motivoTransferencia: field(data, 'motivoTransferencia'),
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
  // Programa pelo que foi pedido; se não achar (ex.: o "tipo" veio do nome do
  // serviço), tenta o tipo padrão desta porta
  const programas = await prisma.programaSocial.findMany({ where: { isActive: true }, select: { id: true, nome: true } });
  const acharPrograma = (texto?: string) => {
    const chave = normalizeName(texto).replace(/\(.*\)/, '').trim();
    if (!chave) return undefined;
    return programas.find((p) => normalizeName(p.nome) === chave) || programas.find((p) => normalizeName(p.nome).includes(chave) || chave.includes(normalizeName(p.nome)));
  };
  const programa = acharPrograma(tipo) || acharPrograma(TIPO_PADRAO[action]);

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

// ============================================================================
// APPS DA FASE 3: mecanização, balcão de empregos, segurança e turismo
// ============================================================================

async function mecanizacao(protocol: PortalProtocol) {
  if (await prisma.servicoMecanizacao.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const pessoa = await citizenOf(protocol);
  const produtor = protocol.citizenId
    ? await prisma.produtorRural.findFirst({ where: { citizenId: protocol.citizenId }, select: { id: true } })
    : null;
  const { default: mecanizacaoService } = await import('../agricultura/mecanizacao.service');
  await mecanizacaoService.create({
    protocolId: protocol.id,
    citizenId: protocol.citizenId,
    produtorId: produtor?.id,
    solicitanteNome: pessoa?.name,
    telefone: pessoa?.phone,
    tipoMaquina: field(data, 'tipoMaquina') || 'Trator',
    areaHectares: numberField(data, 'areaTrabalho', 'areaHectares'),
    descricao: field(data, 'descricaoNecessidade', 'descricao'),
    dataDesejada: field(data, 'dataDesejada'),
    local: field(data, 'localPropriedade', 'local') || protocol.address || undefined,
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → serviço de mecanização`);
}

async function curriculo(protocol: PortalProtocol) {
  if (!protocol.citizenId) return;
  if (await prisma.curriculoTrabalhador.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const pessoa = await citizenOf(protocol);
  const { default: empregoService } = await import('../emprego/emprego.service');
  await empregoService.saveCurriculo(null, {
    protocolId: protocol.id,
    citizenId: protocol.citizenId,
    nome: pessoa?.name || 'Trabalhador',
    cpf: pessoa?.cpf,
    telefone: pessoa?.phone,
    email: pessoa?.email,
    escolaridade: field(data, 'escolaridade'),
    areaInteresse: field(data, 'areaInteresse'),
    experiencia: field(data, 'experiencia'),
    habilidades: field(data, 'habilidades', 'cursos'),
    disponibilidade: data.disponibilidadeImediata !== false,
    pcd: data.pcd === true || data.pessoaComDeficiencia === true,
  });
  // O cadastro É o serviço: o pedido já pode ser concluído
  const { concludeProtocolFromApp } = await import('./app-protocol-bridge.service');
  await concludeProtocolFromApp({
    protocolId: protocol.id,
    app: 'Balcão de Empregos',
    message: 'Currículo cadastrado no Balcão de Empregos. Quando surgir uma vaga parecida com o seu perfil, você recebe um aviso aqui no portal.',
    outcome: 'DEFERIDO',
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → currículo no balcão de empregos`);
}

const TIPO_SEGURANCA: Record<string, { tipo: string; prioridade: string }> = {
  REGISTRO_OCORRENCIA: { tipo: 'OCORRENCIA', prioridade: 'MEDIA' },
  SOLICITACAO_PATRULHAMENTO: { tipo: 'PATRULHAMENTO', prioridade: 'MEDIA' },
  DENUNCIA_ANONIMA: { tipo: 'DENUNCIA', prioridade: 'ALTA' },
  CADASTRO_PONTO_CRITICO: { tipo: 'PONTO_CRITICO', prioridade: 'MEDIA' },
  ALERTA_SEGURANCA: { tipo: 'ALERTA', prioridade: 'ALTA' },
  PATRULHA_ESCOLAR: { tipo: 'PATRULHA_ESCOLAR', prioridade: 'MEDIA' },
  GUARDA_PATRIMONIAL: { tipo: 'GUARDA_PATRIMONIAL', prioridade: 'BAIXA' },
  SOS_MULHER: { tipo: 'ALERTA', prioridade: 'URGENTE' },
};

/** Maior texto livre do formulário (o relato), quando não há um campo com nome conhecido. */
function longestText(data: any): string | undefined {
  const textos = Object.entries(data || {})
    .filter(([key, value]) => key !== '_meta' && typeof value === 'string' && (value as string).trim().length >= 10)
    .map(([, value]) => (value as string).trim());
  return textos.sort((a, b) => b.length - a.length)[0];
}

async function ocorrenciaSeguranca(protocol: PortalProtocol, action: string) {
  if (await prisma.ocorrenciaSeguranca.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const cfg = TIPO_SEGURANCA[action] || TIPO_SEGURANCA.REGISTRO_OCORRENCIA;
  const anonima = action === 'DENUNCIA_ANONIMA';
  const pessoa = anonima ? null : await citizenOf(protocol);
  const { default: segurancaService } = await import('../seguranca/seguranca.service');
  await segurancaService.create({
    protocolId: protocol.id,
    tipo: cfg.tipo,
    prioridade: data.urgente === true ? 'URGENTE' : cfg.prioridade,
    anonima,
    citizenId: protocol.citizenId,
    solicitanteNome: pessoa?.name,
    telefone: pessoa?.phone,
    natureza: field(data, 'tipoOcorrencia', 'tipoDenuncia', 'tipoProblema', 'tipoAlerta', 'motivo'),
    descricao: field(data, 'relatoDetalhado', 'descricao', 'relato', 'descricaoProblema', 'justificativa') || longestText(data) || 'Sem relato',
    local: field(data, 'localOcorrencia', 'local', 'endereco', 'localizacao', 'enderecoPatrulhamento') || protocol.address || undefined,
    bairro: field(data, 'bairro'),
    latitude: protocol.latitude ?? undefined,
    longitude: protocol.longitude ?? undefined,
    dataOcorrencia: field(data, 'dataHoraOcorrencia', 'dataOcorrencia'),
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → ocorrência de segurança (${cfg.tipo})`);
}

const TIPO_PRESTADOR: Record<string, string> = {
  CADASTRO_ESTABELECIMENTO_TURISTICO: 'ESTABELECIMENTO',
  CADASTRO_GUIA_TURISTICO: 'GUIA',
  CREDENCIAMENTO_AGENCIA_TURISMO: 'AGENCIA',
  AUTORIZACAO_TRANSPORTE_TURISTICO: 'TRANSPORTE',
  CADASTRO_ATRACAO_TURISTICA: 'ATRACAO',
};

async function prestadorTuristico(protocol: PortalProtocol, action: string) {
  if (await prisma.prestadorTuristico.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const pessoa = await citizenOf(protocol);
  const { default: turismoService } = await import('../turismo/turismo.service');
  await turismoService.savePrestador(null, {
    protocolId: protocol.id,
    tipo: TIPO_PRESTADOR[action],
    citizenId: protocol.citizenId,
    nome: field(data, 'nomeEstabelecimento', 'nomeAgencia', 'nomeAtracao', 'nomeEmpresa', 'nomeFantasia', 'razaoSocial', 'nome') || pessoa?.name || 'Sem nome',
    categoria: field(data, 'tipoEstabelecimento', 'tipoAtracao', 'tipoVeiculo', 'especialidade', 'idiomas', 'categoria'),
    responsavel: pessoa?.name,
    cpfCnpj: field(data, 'cnpj', 'cpf') || pessoa?.cpf,
    telefone: pessoa?.phone,
    email: pessoa?.email,
    endereco: field(data, 'enderecoEstabelecimento', 'endereco', 'localizacao', 'enderecoAtracao'),
    descricao: field(data, 'descricaoServicos', 'descricao', 'descricaoAtracao', 'experiencia'),
    cadastur: field(data, 'cadastur', 'numeroCadastur'),
    dados: data,
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → cadastro turístico (${TIPO_PRESTADOR[action]})`);
}

async function eventoTuristico(protocol: PortalProtocol, action: string) {
  if (await prisma.eventoTuristico.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
  const data = protocol.customData || {};
  const pessoa = await citizenOf(protocol);
  const { default: turismoService } = await import('../turismo/turismo.service');
  await turismoService.saveEvento(null, {
    protocolId: protocol.id,
    citizenId: protocol.citizenId,
    nome: field(data, 'nomeEvento', 'nomeFeira', 'nome') || 'Evento',
    tipo: field(data, 'tipoEvento', 'tipo'),
    descricao: field(data, 'descricaoEvento', 'descricao'),
    local: field(data, 'localEvento', 'local'),
    dataInicio: field(data, 'dataInicio', 'dataEvento'),
    dataFim: field(data, 'dataFim', 'dataTermino'),
    organizador: field(data, 'organizador', 'nomeOrganizador') || pessoa?.name,
    contato: pessoa?.phone || pessoa?.email,
    publicoEstimado: numberField(data, 'publicoEstimado'),
    apoioSolicitado: action === 'APOIO_FEIRA_EXPOSICAO' ? field(data, 'tipoApoio', 'apoioSolicitado', 'necessidades') || 'Apoio da prefeitura' : field(data, 'apoioSolicitado'),
    dados: data,
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → evento turístico`);
}

/**
 * Cadastro de gestante feito no portal: abre o pré-natal com a DUM informada
 * (semanas e data do parto calculadas) e conclui o pedido. Sem DUM, avisa.
 */
async function cadastroGestante(protocol: PortalProtocol) {
  if (!protocol.citizenId) return;
  const data = protocol.customData || {};
  const { noteProtocolFromApp, concludeProtocolFromApp } = await import('./app-protocol-bridge.service');
  const ativo = await prisma.acompanhamentoPreNatal.findFirst({ where: { citizenId: protocol.citizenId, status: 'EM_ANDAMENTO' }, select: { id: true } });
  if (ativo) {
    await concludeProtocolFromApp({ protocolId: protocol.id, app: 'Pré-natal', message: 'Você já está em acompanhamento de pré-natal. Continue indo às consultas marcadas.', outcome: 'DEFERIDO' });
    return;
  }
  const dum = dateField(data, 'dum');
  if (!dum || dum > new Date()) {
    await noteProtocolFromApp({ protocolId: protocol.id, app: 'Pré-natal', message: 'Recebemos o seu cadastro. A unidade de saúde vai entrar em contato para marcar a primeira consulta de pré-natal.' });
    return;
  }
  const { preNatalService } = await import('../saude/cuidado.service');
  const pn = await preNatalService.iniciar({
    citizenId: protocol.citizenId,
    dum: dum.toISOString(),
    gravidez: data.primeiraGestacao === true ? 1 : undefined,
    observacoes: [field(data, 'unidadeSaude') && `Unidade preferida: ${field(data, 'unidadeSaude')}`, field(data, 'observacoes')].filter(Boolean).join(' · ') || undefined,
  });
  const dpp = pn?.dpp ? new Date(pn.dpp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
  await concludeProtocolFromApp({
    protocolId: protocol.id,
    app: 'Pré-natal',
    message: `Pré-natal aberto${pn?.idadeGestacional ? ` (${pn.idadeGestacional})` : ''}${dpp ? `, parto previsto para ${dpp}` : ''}. A unidade de saúde vai marcar as consultas.`,
    outcome: 'DEFERIDO',
  });
  logger.info(`[portal→app] ${protocol.number || protocol.id} → pré-natal aberto`);
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
  'CADASTRO_GESTANTE',
  // Apps da Fase 3
  'SOLICITACAO_MAQUINAS',
  'CADASTRO_BALCAO_EMPREGOS',
  'REGISTRO_OCORRENCIA',
  'SOLICITACAO_PATRULHAMENTO',
  'DENUNCIA_ANONIMA',
  'CADASTRO_PONTO_CRITICO',
  'ALERTA_SEGURANCA',
  'PATRULHA_ESCOLAR',
  'GUARDA_PATRIMONIAL',
  'SOS_MULHER',
  'CADASTRO_ESTABELECIMENTO_TURISTICO',
  'CADASTRO_GUIA_TURISTICO',
  'CREDENCIAMENTO_AGENCIA_TURISMO',
  'AUTORIZACAO_TRANSPORTE_TURISTICO',
  'CADASTRO_ATRACAO_TURISTICA',
  'REGISTRO_EVENTO_TURISTICO',
  'APOIO_FEIRA_EXPOSICAO',
  // Apps gerais (2026-10-09)
  'AGENDAMENTO_ATENDIMENTO',
  'AGENDA_VISITA_DOMICILIAR',
  'INSCRICAO_CURSO',
  'PERMISSAO_ESPACO_FEIRA',
  'INSCRICAO_FEIRA',
  'RELOCACAO_PONTO_FEIRA',
  'CONCESSAO_SEPULTURA',
  'RENOVACAO_CONCESSAO_SEPULTURA',
  'TRANSFERENCIA_JAZIGO',
  'EXUMACAO',
  'SEPULTAMENTO',
  'DISTRIBUICAO_INSUMOS',
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
    case 'CADASTRO_GESTANTE':
      await cadastroGestante(protocol);
      return true;
    case 'SOLICITACAO_MAQUINAS':
      await mecanizacao(protocol);
      return true;
    case 'CADASTRO_BALCAO_EMPREGOS':
      await curriculo(protocol);
      return true;
    case 'REGISTRO_OCORRENCIA':
    case 'SOLICITACAO_PATRULHAMENTO':
    case 'DENUNCIA_ANONIMA':
    case 'CADASTRO_PONTO_CRITICO':
    case 'ALERTA_SEGURANCA':
    case 'PATRULHA_ESCOLAR':
    case 'GUARDA_PATRIMONIAL':
    case 'SOS_MULHER':
      await ocorrenciaSeguranca(protocol, action);
      return true;
    case 'CADASTRO_ESTABELECIMENTO_TURISTICO':
    case 'CADASTRO_GUIA_TURISTICO':
    case 'CREDENCIAMENTO_AGENCIA_TURISMO':
    case 'AUTORIZACAO_TRANSPORTE_TURISTICO':
    case 'CADASTRO_ATRACAO_TURISTICA':
      await prestadorTuristico(protocol, action);
      return true;
    case 'REGISTRO_EVENTO_TURISTICO':
    case 'APOIO_FEIRA_EXPOSICAO':
      await eventoTuristico(protocol, action);
      return true;
    // Apps gerais (2026-10-09)
    case 'AGENDAMENTO_ATENDIMENTO':
    case 'AGENDA_VISITA_DOMICILIAR': {
      const { default: agenda } = await import('../apps-gerais/agenda-atendimentos.service');
      await agenda.fromPortal(protocol, action);
      logger.info(`[portal→app] ${protocol.number || protocol.id} → agenda de atendimentos`);
      return true;
    }
    case 'INSCRICAO_CURSO': {
      const { default: cursos } = await import('../apps-gerais/cursos.service');
      await cursos.fromPortal(protocol);
      logger.info(`[portal→app] ${protocol.number || protocol.id} → inscrição em curso`);
      return true;
    }
    case 'PERMISSAO_ESPACO_FEIRA':
    case 'INSCRICAO_FEIRA':
    case 'RELOCACAO_PONTO_FEIRA': {
      const { default: feiras } = await import('../apps-gerais/feiras.service');
      await feiras.fromPortal(protocol, action);
      logger.info(`[portal→app] ${protocol.number || protocol.id} → feiras e mercados`);
      return true;
    }
    case 'CONCESSAO_SEPULTURA':
    case 'RENOVACAO_CONCESSAO_SEPULTURA':
    case 'TRANSFERENCIA_JAZIGO':
    case 'EXUMACAO':
    case 'SEPULTAMENTO': {
      const { default: cemiterio } = await import('../apps-gerais/cemiterio.service');
      await cemiterio.fromPortal(protocol, action);
      logger.info(`[portal→app] ${protocol.number || protocol.id} → cemitérios`);
      return true;
    }
    case 'DISTRIBUICAO_INSUMOS': {
      const { default: insumos } = await import('../agricultura/pedido-insumo.service');
      await insumos.fromPortal(protocol);
      logger.info(`[portal→app] ${protocol.number || protocol.id} → pedido de insumos agrícolas`);
      return true;
    }
    default:
      return false;
  }
}
