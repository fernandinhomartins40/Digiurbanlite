/**
 * Agenda de Atendimentos (app geral, 2026-10-09).
 *
 * Para os serviços em que o cidadão pede para SER ATENDIDO (orientação,
 * consultoria, CRAS/CREAS, Sala do Empreendedor, visita em casa...) e a
 * secretaria não tinha onde marcar. O pedido chega aguardando horário; a
 * equipe marca dia, hora, local e quem atende (o cidadão recebe no pedido);
 * depois registra "atendido" ou "não compareceu" — os dois encerram o pedido.
 * Horário sempre de Brasília.
 */

import { prisma } from '../../lib/prisma';
import { brasiliaDayBounds, parseBrasiliaDateTime } from '../agenda-medica/brasilia-time';
import { concludeProtocolFromApp, markProtocolInProgressFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';
import { AppScope, campo, comEvento, dataHoraBrasilia, numerosDosPedidos, origemDoPedido, pickDepartment, proximoNumero, scopeWhere } from './common';

const APP = 'Agenda de Atendimentos';

/** Secretarias que usam a agenda (a Saúde tem agenda própria). */
export const AGENDA_DEPARTMENTS = [
  'ADMINISTRACAO', 'AGRICULTURA', 'ASSISTENCIA_SOCIAL', 'CULTURA', 'DEFESA_CIVIL', 'DESENVOLVIMENTO_ECONOMICO', 'EDUCACAO', 'ESPORTES',
  'FINANCAS', 'HABITACAO', 'MEIO_AMBIENTE', 'MOBILIDADE_URBANA', 'OBRAS_PUBLICAS', 'PLANEJAMENTO_URBANO', 'POLITICAS_MULHERES',
  'SEGURANCA_PUBLICA', 'SERVICOS_PUBLICOS', 'TECNOLOGIA_INOVACAO', 'TRANSPORTES_TRANSITO', 'TURISMO',
];
export const MODALIDADES = ['PRESENCIAL', 'DOMICILIAR', 'ONLINE', 'TELEFONE'];
const ABERTOS = ['AGUARDANDO', 'AGENDADO'];

function semAcento(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Como o atendimento acontece, pelo nome do serviço ("Visita Domiciliar" = na casa da pessoa). */
export function modalidadeDoServico(nome: string): string {
  const n = semAcento(nome || '');
  if (/domicil|em casa|home care/.test(n)) return 'DOMICILIAR';
  if (/\bonline\b|virtual|videochamada/.test(n)) return 'ONLINE';
  return 'PRESENCIAL';
}

/** Dois horários do mesmo profissional se sobrepõem? */
export function horariosSeChocam(a: { inicio: Date; duracaoMin: number }, b: { inicio: Date; duracaoMin: number }): boolean {
  const fimA = a.inicio.getTime() + a.duracaoMin * 60_000;
  const fimB = b.inicio.getTime() + b.duracaoMin * 60_000;
  return a.inicio.getTime() < fimB && b.inicio.getTime() < fimA;
}

/** Texto que o cidadão lê no pedido quando o atendimento é marcado. */
export function mensagemDoHorario(ag: { modalidade: string; dataHora: Date; local?: string | null; profissionalNome?: string | null; observacoes?: string | null }, remarcado = false): string {
  const quando = dataHoraBrasilia(ag.dataHora);
  const partes = [
    ag.modalidade === 'DOMICILIAR'
      ? `${remarcado ? 'A visita foi remarcada' : 'A visita na sua casa foi marcada'} para ${quando}.`
      : ag.modalidade === 'TELEFONE'
        ? `${remarcado ? 'A ligação foi remarcada' : 'Vamos ligar para você'} em ${quando}.`
        : `${remarcado ? 'O seu atendimento foi remarcado' : 'O seu atendimento foi marcado'} para ${quando}.`,
    ag.local && ag.modalidade !== 'DOMICILIAR' ? `${ag.modalidade === 'ONLINE' ? 'Link' : 'Local'}: ${ag.local}.` : null,
    ag.profissionalNome ? `Quem vai atender: ${ag.profissionalNome}.` : null,
    ag.observacoes ? ag.observacoes : null,
  ];
  return partes.filter(Boolean).join(' ');
}

class AgendaAtendimentosService {
  private async exigir(id: string, scope: AppScope) {
    const atual = await prisma.agendamentoAtendimento.findFirst({ where: { id, ...scopeWhere(scope) } });
    if (!atual) throw new Error('Atendimento não encontrado');
    return atual;
  }

  /** Pedido do portal → aguardando horário (idempotente pelo pedido). */
  async fromPortal(protocol: { id: string; citizenId?: string | null; customData?: any }, action = 'AGENDAMENTO_ATENDIMENTO') {
    if (await prisma.agendamentoAtendimento.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
    const origem = await origemDoPedido(protocol.id);
    const data = protocol.customData || {};
    const modalidade = action === 'AGENDA_VISITA_DOMICILIAR' ? 'DOMICILIAR' : modalidadeDoServico(origem.servico);
    await prisma.agendamentoAtendimento.create({
      data: {
        protocolId: protocol.id,
        numero: await proximoNumero('agendamentoAtendimento', 'AGA'),
        departmentCode: AGENDA_DEPARTMENTS.includes(origem.departmentCode) ? origem.departmentCode : AGENDA_DEPARTMENTS[0],
        servico: origem.servico,
        assunto: campo(data, 'assunto', 'motivo', 'descricao', 'tipoAtendimento', 'necessidade'),
        modalidade,
        citizenId: protocol.citizenId || null,
        solicitanteNome: origem.citizen?.name || null,
        telefone: campo(data, 'telefone') || origem.citizen?.phone || null,
        preferencia: [campo(data, 'dataPreferencial', 'data'), campo(data, 'turnoPreferencial', 'horario', 'horaInicio')].filter(Boolean).join(' — ') || null,
        endereco: modalidade === 'DOMICILIAR' ? campo(data, 'endereco') || origem.endereco : null,
        historico: comEvento(null, 'Pedido recebido, aguardando horário') as any,
      },
    });
  }

  async list(scope: AppScope, filters: { status?: string; dia?: string; departmentCode?: string; abertos?: boolean }) {
    const dia = filters.dia && /^\d{4}-\d{2}-\d{2}$/.test(filters.dia) ? brasiliaDayBounds(filters.dia) : null;
    const itens = await prisma.agendamentoAtendimento.findMany({
      where: {
        ...scopeWhere(scope),
        ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}),
        ...(filters.abertos ? { status: { in: ABERTOS } } : filters.status ? { status: filters.status } : {}),
        ...(dia ? { dataHora: { gte: dia.start, lt: dia.end } } : {}),
      },
      // quem ainda espera horário primeiro (mais antigo antes), depois pela hora marcada
      orderBy: [{ dataHora: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
      take: 500,
    });
    const numeros = await numerosDosPedidos(itens.map((i) => i.protocolId));
    return itens.map((i) => ({ ...i, protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  /** Atendimento registrado direto no balcão (sem pedido). */
  async create(scope: AppScope, data: any, userId?: string) {
    const nome = String(data?.solicitanteNome || '').trim();
    if (!nome) throw new Error('Informe o nome de quem será atendido');
    const servico = String(data?.servico || '').trim() || 'Atendimento';
    return prisma.agendamentoAtendimento.create({
      data: {
        numero: await proximoNumero('agendamentoAtendimento', 'AGA'),
        departmentCode: pickDepartment(scope, AGENDA_DEPARTMENTS, data?.departmentCode),
        servico,
        assunto: data?.assunto || null,
        modalidade: MODALIDADES.includes(data?.modalidade) ? data.modalidade : modalidadeDoServico(servico),
        solicitanteNome: nome,
        telefone: data?.telefone || null,
        endereco: data?.endereco || null,
        historico: comEvento(null, 'Registrado no balcão', userId) as any,
      },
    });
  }

  async agendar(id: string, scope: AppScope, userId: string, data: any) {
    const atual = await this.exigir(id, scope);
    if (!ABERTOS.includes(atual.status)) throw new Error('Este atendimento já foi encerrado');
    if (!data?.dataHora) throw new Error('Escolha o dia e a hora');
    const dataHora = parseBrasiliaDateTime(String(data.dataHora));
    if (Number.isNaN(dataHora.getTime())) throw new Error('Data e hora inválidas');
    const duracaoMin = Math.max(5, Math.min(480, Number(data.duracaoMin) || atual.duracaoMin || 30));
    const local = String(data.local || '').trim() || null;
    if (!local && atual.modalidade === 'PRESENCIAL') throw new Error('Informe o local do atendimento');

    let profissionalNome = String(data.profissionalNome || '').trim() || null;
    const profissionalId = data.profissionalId || null;
    if (profissionalId) {
      const profissional = await prisma.user.findFirst({ where: { id: profissionalId }, select: { name: true } });
      if (!profissional) throw new Error('Servidor não encontrado');
      profissionalNome = profissional.name;
      // o mesmo servidor não atende duas pessoas na mesma hora
      const outros = await prisma.agendamentoAtendimento.findMany({
        where: { profissionalId, status: 'AGENDADO', id: { not: id }, dataHora: { gte: new Date(dataHora.getTime() - 8 * 3600_000), lte: new Date(dataHora.getTime() + 8 * 3600_000) } },
        select: { dataHora: true, duracaoMin: true, solicitanteNome: true },
      });
      const choque = outros.find((o) => o.dataHora && horariosSeChocam({ inicio: dataHora, duracaoMin }, { inicio: o.dataHora, duracaoMin: o.duracaoMin }));
      if (choque) throw new Error(`${profissionalNome} já tem atendimento marcado em ${dataHoraBrasilia(choque.dataHora!)}${choque.solicitanteNome ? ` (${choque.solicitanteNome})` : ''}`);
    }

    const remarcado = atual.status === 'AGENDADO';
    const observacoes = String(data.observacoes || '').trim() || null;
    const atualizado = await prisma.agendamentoAtendimento.update({
      where: { id },
      data: {
        status: 'AGENDADO',
        dataHora,
        duracaoMin,
        local,
        profissionalId,
        profissionalNome,
        observacoes,
        historico: comEvento(atual.historico, `${remarcado ? 'Remarcado' : 'Marcado'} para ${dataHoraBrasilia(dataHora)}`, userId) as any,
      },
    });
    const message = mensagemDoHorario({ modalidade: atual.modalidade, dataHora, local, profissionalNome, observacoes }, remarcado);
    if (remarcado) await noteProtocolFromApp({ protocolId: atual.protocolId, app: APP, actorId: userId, message });
    else await markProtocolInProgressFromApp({ protocolId: atual.protocolId, app: APP, actorId: userId, message });
    return atualizado;
  }

  /** Atendido ou não compareceu — os dois encerram o pedido. */
  async registrarResultado(id: string, scope: AppScope, userId: string, data: { resultado: 'REALIZADO' | 'FALTOU'; mensagem?: string }) {
    const atual = await this.exigir(id, scope);
    if (atual.status !== 'AGENDADO' || !atual.dataHora) throw new Error('Só dá para registrar o resultado de um atendimento marcado');
    const faltou = data.resultado === 'FALTOU';
    const texto = String(data.mensagem || '').trim();
    const message =
      texto ||
      (faltou
        ? `Você não compareceu ao atendimento marcado para ${dataHoraBrasilia(atual.dataHora)}. Se ainda precisar, faça um novo pedido.`
        : `Atendimento realizado em ${dataHoraBrasilia(atual.dataHora)}.`);
    const atualizado = await prisma.agendamentoAtendimento.update({
      where: { id },
      data: { status: faltou ? 'FALTOU' : 'REALIZADO', encerradoEm: new Date(), historico: comEvento(atual.historico, faltou ? 'Não compareceu' : 'Atendido', userId) as any },
    });
    await concludeProtocolFromApp({ protocolId: atual.protocolId, app: APP, actorId: userId, message, outcome: faltou ? 'INDEFERIDO' : 'DEFERIDO' });
    return atualizado;
  }

  async cancelar(id: string, scope: AppScope, userId: string, motivo: string) {
    const atual = await this.exigir(id, scope);
    if (!ABERTOS.includes(atual.status)) throw new Error('Este atendimento já foi encerrado');
    const texto = String(motivo || '').trim();
    if (!texto) throw new Error('Escreva o motivo para o cidadão');
    const atualizado = await prisma.agendamentoAtendimento.update({
      where: { id },
      data: { status: 'CANCELADO', encerradoEm: new Date(), historico: comEvento(atual.historico, `Cancelado: ${texto}`, userId) as any },
    });
    await concludeProtocolFromApp({ protocolId: atual.protocolId, app: APP, actorId: userId, message: texto, outcome: 'INDEFERIDO' });
    return atualizado;
  }

  /** Servidores que podem atender (das secretarias de quem usa). */
  async profissionais(scope: AppScope) {
    return prisma.user.findMany({
      where: { isActive: true, ...(scope ? { department: { code: { in: scope } } } : {}) },
      select: { id: true, name: true, department: { select: { code: true } } },
      orderBy: { name: 'asc' },
      take: 500,
    });
  }

  async stats(scope: AppScope, hoje: string) {
    const dia = brasiliaDayBounds(hoje);
    const inicioMes = brasiliaDayBounds(`${hoje.slice(0, 7)}-01`).start;
    const escopo = scopeWhere(scope);
    const [aguardando, deHoje, marcados, realizados, faltas] = await Promise.all([
      prisma.agendamentoAtendimento.count({ where: { ...escopo, status: 'AGUARDANDO' } }),
      prisma.agendamentoAtendimento.count({ where: { ...escopo, status: 'AGENDADO', dataHora: { gte: dia.start, lt: dia.end } } }),
      prisma.agendamentoAtendimento.count({ where: { ...escopo, status: 'AGENDADO' } }),
      prisma.agendamentoAtendimento.count({ where: { ...escopo, status: 'REALIZADO', encerradoEm: { gte: inicioMes } } }),
      prisma.agendamentoAtendimento.count({ where: { ...escopo, status: 'FALTOU', encerradoEm: { gte: inicioMes } } }),
    ]);
    return { aguardando, hoje: deHoje, marcados, realizadosNoMes: realizados, faltasNoMes: faltas };
  }
}

export default new AgendaAtendimentosService();
