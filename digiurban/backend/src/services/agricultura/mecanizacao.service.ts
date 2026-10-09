/**
 * Mecanização agrícola (patrulha de máquinas) — Agricultura.
 * Fase 3 da auditoria de 2026-10-08: a tela era "em desenvolvimento".
 *
 * Pedido de máquina (portal ou balcão) → agendado numa máquina e num dia →
 * em execução → concluído (soma as horas na máquina e calcula o valor, se o
 * município cobra hora-máquina). Cada passo volta ao pedido do cidadão.
 */

import { prisma } from '../../lib/prisma';
import { concludeProtocolFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';

const APP = 'Mecanização Agrícola';
const fmt = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/** Mesmo dia do calendário de Brasília? (uma máquina faz um serviço por dia) */
export function mesmoDia(a: Date, b: Date): boolean {
  const key = (d: Date) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return key(a) === key(b);
}

/** Valor do serviço: horas × valor da hora (0 quando o município não cobra). */
export function valorDoServico(horas: number, valorHora?: number | null): number {
  if (!valorHora || valorHora <= 0 || !(horas > 0)) return 0;
  return Math.round(horas * valorHora * 100) / 100;
}

function parseDate(value: unknown, campo: string): Date {
  const text = String(value || '');
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T12:00:00-03:00` : text);
  if (!text || Number.isNaN(date.getTime())) throw new Error(`Informe ${campo}`);
  return date;
}

class MecanizacaoService {
  // -------------------------------------------------------------------- máquinas
  async listMaquinas() {
    return prisma.maquinaAgricola.findMany({ where: { isActive: true }, orderBy: [{ tipo: 'asc' }, { identificacao: 'asc' }] });
  }

  async saveMaquina(id: string | null, data: any) {
    const tipo = String(data?.tipo || '').trim();
    const identificacao = String(data?.identificacao || '').trim();
    if (!tipo || !identificacao) throw new Error('Informe o tipo e a identificação da máquina (ex.: Trator 01)');
    const campos = {
      tipo,
      identificacao,
      modelo: data.modelo || null,
      potencia: data.potencia || null,
      valorHoraUso: data.valorHoraUso === '' || data.valorHoraUso == null ? null : Number(data.valorHoraUso),
      ...(data.status ? { status: String(data.status) } : {}),
    };
    const repetida = await prisma.maquinaAgricola.findFirst({ where: { identificacao, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (repetida) throw new Error('Já existe uma máquina com essa identificação');
    return id ? prisma.maquinaAgricola.update({ where: { id }, data: campos }) : prisma.maquinaAgricola.create({ data: campos });
  }

  async removeMaquina(id: string) {
    const emUso = await prisma.servicoMecanizacao.count({ where: { maquinaId: id, status: { in: ['AGENDADO', 'EM_EXECUCAO'] } } });
    if (emUso) throw new Error('Esta máquina tem serviço agendado ou em execução');
    return prisma.maquinaAgricola.update({ where: { id }, data: { isActive: false } });
  }

  // -------------------------------------------------------------------- serviços
  async list(filters?: { status?: string }) {
    const servicos = await prisma.servicoMecanizacao.findMany({
      where: filters?.status ? { status: filters.status } : {},
      orderBy: [{ dataAgendada: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    const maquinaIds = servicos.map((s) => s.maquinaId).filter(Boolean) as string[];
    const protocolIds = servicos.map((s) => s.protocolId).filter(Boolean) as string[];
    const [maquinas, protocolos] = await Promise.all([
      maquinaIds.length ? prisma.maquinaAgricola.findMany({ where: { id: { in: maquinaIds } }, select: { id: true, tipo: true, identificacao: true } }) : [],
      protocolIds.length ? prisma.protocolSimplified.findMany({ where: { id: { in: protocolIds } }, select: { id: true, number: true } }) : [],
    ]);
    const maquinaPorId = new Map(maquinas.map((m) => [m.id, m]));
    const numeroPorId = new Map(protocolos.map((p) => [p.id, p.number]));
    return servicos.map((s) => ({
      ...s,
      maquina: s.maquinaId ? maquinaPorId.get(s.maquinaId) || null : null,
      protocolNumber: s.protocolId ? numeroPorId.get(s.protocolId) || null : null,
    }));
  }

  async create(data: any) {
    const tipoMaquina = String(data?.tipoMaquina || '').trim();
    if (!tipoMaquina) throw new Error('Informe o tipo de máquina');
    return prisma.servicoMecanizacao.create({
      data: {
        protocolId: data.protocolId || null,
        citizenId: data.citizenId || null,
        produtorId: data.produtorId || null,
        solicitanteNome: data.solicitanteNome || null,
        telefone: data.telefone || null,
        tipoMaquina,
        local: data.local || null,
        areaHectares: data.areaHectares == null || data.areaHectares === '' ? null : Number(data.areaHectares),
        descricao: data.descricao || null,
        dataDesejada: data.dataDesejada ? parseDate(data.dataDesejada, 'a data desejada') : null,
      },
    });
  }

  /** Reserva a máquina para um dia (uma máquina = um serviço por dia). */
  async agendar(id: string, userId: string, data: { maquinaId?: string; dataAgendada?: string; operador?: string; horasPrevistas?: number }) {
    const servico = await prisma.servicoMecanizacao.findFirst({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado');
    if (!['SOLICITADO', 'AGENDADO'].includes(servico.status)) throw new Error('Este serviço não pode mais ser agendado');
    if (!data.maquinaId) throw new Error('Escolha a máquina');
    const maquina = await prisma.maquinaAgricola.findFirst({ where: { id: data.maquinaId, isActive: true } });
    if (!maquina) throw new Error('Máquina não encontrada');
    if (maquina.status === 'Manutenção') throw new Error('Esta máquina está em manutenção');
    const quando = parseDate(data.dataAgendada, 'a data do serviço');

    const doDia = await prisma.servicoMecanizacao.findMany({
      where: { maquinaId: maquina.id, status: { in: ['AGENDADO', 'EM_EXECUCAO'] }, NOT: { id } },
      select: { dataAgendada: true, solicitanteNome: true },
    });
    const conflito = doDia.find((s) => s.dataAgendada && mesmoDia(s.dataAgendada, quando));
    if (conflito) throw new Error(`${maquina.identificacao} já está reservada nesse dia${conflito.solicitanteNome ? ` (${conflito.solicitanteNome})` : ''}`);

    const atualizado = await prisma.servicoMecanizacao.update({
      where: { id },
      data: {
        status: 'AGENDADO',
        maquinaId: maquina.id,
        dataAgendada: quando,
        operador: data.operador || null,
        horasPrevistas: data.horasPrevistas ? Number(data.horasPrevistas) : null,
      },
    });
    await noteProtocolFromApp({
      protocolId: servico.protocolId,
      app: APP,
      actorId: userId,
      message: `Serviço de ${maquina.tipo.toLowerCase()} agendado para ${fmt(quando)}${data.operador ? `, com o operador ${data.operador}` : ''}. Deixe o acesso à área liberado.`,
    });
    return atualizado;
  }

  async iniciar(id: string) {
    const servico = await prisma.servicoMecanizacao.findFirst({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado');
    if (servico.status !== 'AGENDADO') throw new Error('Só serviço agendado pode ser iniciado');
    if (servico.maquinaId) await prisma.maquinaAgricola.update({ where: { id: servico.maquinaId }, data: { status: 'Emprestada' } });
    return prisma.servicoMecanizacao.update({ where: { id }, data: { status: 'EM_EXECUCAO', iniciadoEm: new Date() } });
  }

  /** Encerra o serviço: soma as horas na máquina, calcula o valor e conclui o pedido. */
  async concluir(id: string, userId: string, data: { horasRealizadas?: number; observacoes?: string }) {
    const servico = await prisma.servicoMecanizacao.findFirst({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado');
    if (!['AGENDADO', 'EM_EXECUCAO'].includes(servico.status)) throw new Error('Este serviço não está em andamento');
    const horas = Number(data.horasRealizadas);
    if (!(horas > 0)) throw new Error('Informe quantas horas a máquina trabalhou');
    const maquina = servico.maquinaId ? await prisma.maquinaAgricola.findFirst({ where: { id: servico.maquinaId } }) : null;
    const valor = valorDoServico(horas, maquina?.valorHoraUso);
    if (maquina) {
      await prisma.maquinaAgricola.update({ where: { id: maquina.id }, data: { status: 'Disponível', horasUso: { increment: Math.round(horas) } } });
    }
    const atualizado = await prisma.servicoMecanizacao.update({
      where: { id },
      data: { status: 'CONCLUIDO', horasRealizadas: horas, valorCobrado: valor, observacoes: data.observacoes || null, concluidoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: servico.protocolId,
      app: APP,
      actorId: userId,
      message: `Serviço de máquina concluído: ${horas} hora(s)${valor ? `, valor R$ ${valor.toFixed(2).replace('.', ',')}` : ''}.`,
      outcome: 'DEFERIDO',
    });
    return atualizado;
  }

  async recusar(id: string, userId: string, motivo?: string) {
    const texto = String(motivo || '').trim();
    if (!texto) throw new Error('Informe o motivo (o produtor vai ler)');
    const servico = await prisma.servicoMecanizacao.findFirst({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado');
    if (['CONCLUIDO', 'RECUSADO', 'CANCELADO'].includes(servico.status)) throw new Error('Este serviço já foi encerrado');
    if (servico.status === 'EM_EXECUCAO' && servico.maquinaId) {
      await prisma.maquinaAgricola.update({ where: { id: servico.maquinaId }, data: { status: 'Disponível' } });
    }
    const atualizado = await prisma.servicoMecanizacao.update({ where: { id }, data: { status: 'RECUSADO', motivo: texto } });
    await concludeProtocolFromApp({
      protocolId: servico.protocolId,
      app: APP,
      actorId: userId,
      message: `Pedido de máquina não atendido: ${texto}`,
      outcome: 'INDEFERIDO',
    });
    return atualizado;
  }

  async stats() {
    const [porStatus, maquinas] = await Promise.all([
      prisma.servicoMecanizacao.groupBy({ by: ['status'], _count: { _all: true }, _sum: { horasRealizadas: true, valorCobrado: true } }),
      prisma.maquinaAgricola.count({ where: { isActive: true } }),
    ]);
    const conta = (status: string) => porStatus.find((p) => p.status === status)?._count._all || 0;
    const concluido = porStatus.find((p) => p.status === 'CONCLUIDO');
    return {
      maquinas,
      aguardando: conta('SOLICITADO'),
      agendados: conta('AGENDADO'),
      emExecucao: conta('EM_EXECUCAO'),
      concluidos: conta('CONCLUIDO'),
      horasTrabalhadas: concluido?._sum.horasRealizadas || 0,
      valorTotal: concluido?._sum.valorCobrado || 0,
    };
  }
}

export default new MecanizacaoService();
