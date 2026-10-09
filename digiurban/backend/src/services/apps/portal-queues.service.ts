/**
 * Decisões da equipe nas filas de pedidos do portal (Fase 1 da auditoria de
 * 2026-10-08): transporte escolar, renovação/troca de ponto de credencial,
 * pedido de consulta e pedido de remédio.
 *
 * Toda decisão volta para o pedido do cidadão pela ponte única
 * (`app-protocol-bridge.service.ts`): novidade = mensagem no pedido;
 * decisão final = pedido concluído com o motivo.
 */

import { prisma } from '../../lib/prisma';
import { concludeProtocolFromApp, noteProtocolFromApp } from './app-protocol-bridge.service';

const fmtDate = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const fmtTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

function requireMotivo(motivo?: string) {
  const texto = String(motivo || '').trim();
  if (!texto) throw new Error('Informe o motivo (o cidadão vai ler)');
  return texto;
}

/** Anexa {nome, cpf} do cidadão a cada item (campo informado). */
async function withCitizens<T extends Record<string, any>>(items: T[], key: keyof T = 'citizenId') {
  const ids = Array.from(new Set(items.map((item) => item[key]).filter(Boolean))) as string[];
  if (!ids.length) return items.map((item) => ({ ...item, citizen: null }));
  const people = await prisma.citizen.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, cpf: true, phone: true } });
  const byId = new Map(people.map((p) => [p.id, p]));
  return items.map((item) => ({ ...item, citizen: byId.get(item[key] as string) || null }));
}

const protocolNumbers = async (items: Array<{ protocolId?: string | null }>) => {
  const ids = items.map((item) => item.protocolId).filter(Boolean) as string[];
  if (!ids.length) return new Map<string, string>();
  const protocols = await prisma.protocolSimplified.findMany({ where: { id: { in: ids } }, select: { id: true, number: true } });
  return new Map(protocols.map((p) => [p.id, p.number]));
};

async function withProtocolNumber<T extends { protocolId?: string | null }>(items: T[]) {
  const numbers = await protocolNumbers(items);
  return items.map((item) => ({ ...item, protocolNumber: item.protocolId ? numbers.get(item.protocolId) || null : null }));
}

// ============================================================================
// TRANSPORTE ESCOLAR
// ============================================================================

export const transporteEscolarQueue = {
  APP: 'Transporte Escolar',

  async list(status?: string) {
    const items = await prisma.solicitacaoTransporteEscolar.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    return withProtocolNumber(await withCitizens(items, 'responsavelId'));
  },

  /** Coloca o aluno na rota (mesma regra do vínculo manual) e encerra o pedido. */
  async atender(id: string, userId: string, input: { rotaId: string; pontoEmbarque?: string; alunoId?: string }) {
    const pedido = await prisma.solicitacaoTransporteEscolar.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'PENDENTE') throw new Error('Este pedido já foi decidido');
    const alunoId = input.alunoId || pedido.alunoId;
    if (!alunoId) {
      throw new Error(`Escolha o cadastro do aluno (${pedido.nomeAluno}). Se não tiver, o responsável inclui como dependente em "Minha família" ou no balcão.`);
    }
    const rota = await prisma.rotaEscolar.findFirst({ where: { id: input.rotaId } });
    if (!rota) throw new Error('Rota não encontrada');

    const { default: transporteEscolarService } = await import('../transporte-escolar/transporte-escolar.service');
    const ponto = input.pontoEmbarque || pedido.enderecoEmbarque || 'A combinar';
    const vinculo = await transporteEscolarService.vincularAluno({ rotaId: rota.id, alunoId, paradaId: ponto } as any);

    const atualizado = await prisma.solicitacaoTransporteEscolar.update({
      where: { id },
      data: { status: 'ATENDIDA', alunoId, rotaId: rota.id, alunoRotaId: vinculo.id, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Vaga no transporte escolar liberada: rota ${rota.nome}, saída às ${rota.horarioSaida}, embarque em ${ponto}.`,
      outcome: 'DEFERIDO',
    });
    return atualizado;
  },

  async indeferir(id: string, userId: string, motivo?: string) {
    const texto = requireMotivo(motivo);
    const pedido = await prisma.solicitacaoTransporteEscolar.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'PENDENTE') throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.solicitacaoTransporteEscolar.update({
      where: { id },
      data: { status: 'INDEFERIDA', motivo: texto, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Pedido de transporte escolar não atendido: ${texto}`,
      outcome: 'INDEFERIDO',
    });
    return atualizado;
  },
};

// ============================================================================
// CREDENCIAIS (renovação e troca de ponto)
// ============================================================================

export const alteracaoCredencialQueue = {
  APP: 'Credenciamentos',

  async list(status?: string) {
    const items = await prisma.alteracaoCredencial.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    const credIds = items.map((i) => i.credencialId).filter(Boolean) as string[];
    const creds = credIds.length
      ? await prisma.credencialTransporte.findMany({
          where: { id: { in: credIds } },
          select: { id: true, numeroCredencial: true, titularNome: true, veiculoPlaca: true, ponto: true, validade: true, status: true, tipo: true },
        })
      : [];
    const byId = new Map(creds.map((c) => [c.id, c]));
    const withCred = items.map((i) => ({ ...i, credencial: i.credencialId ? byId.get(i.credencialId) || null : null }));
    return withProtocolNumber(await withCitizens(withCred));
  },

  async aprovar(id: string, userId: string, input: { credencialId?: string; validadeMeses?: number }) {
    const pedido = await prisma.alteracaoCredencial.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'PENDENTE') throw new Error('Este pedido já foi decidido');
    const credencialId = input.credencialId || pedido.credencialId;
    if (!credencialId) throw new Error('Escolha a credencial do pedido (não foi achada pelo número/placa informados)');

    const { default: transitoService } = await import('../transito/transito.service');
    let mensagem: string;
    if (pedido.tipo === 'RENOVACAO') {
      const cred = await transitoService.renovarCredencial(credencialId, input.validadeMeses);
      mensagem = `Credencial ${cred.numeroCredencial || ''} renovada até ${cred.validade ? fmtDate(cred.validade) : '-'}.`;
    } else {
      if (!pedido.pontoDesejado) throw new Error('O pedido não informa o ponto desejado');
      const cred = await prisma.credencialTransporte.findFirst({ where: { id: credencialId } });
      if (!cred) throw new Error('Credencial não encontrada');
      await prisma.credencialTransporte.update({ where: { id: cred.id }, data: { ponto: pedido.pontoDesejado } });
      mensagem = `Troca de ponto aprovada: a credencial ${cred.numeroCredencial || ''} passa a valer no ponto ${pedido.pontoDesejado}.`;
    }

    const atualizado = await prisma.alteracaoCredencial.update({
      where: { id },
      data: { status: 'APROVADA', credencialId, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: this.APP, actorId: userId, message: mensagem, outcome: 'DEFERIDO' });
    return atualizado;
  },

  async recusar(id: string, userId: string, motivo?: string) {
    const texto = requireMotivo(motivo);
    const pedido = await prisma.alteracaoCredencial.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'PENDENTE') throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.alteracaoCredencial.update({
      where: { id },
      data: { status: 'RECUSADA', motivoDecisao: texto, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `${pedido.tipo === 'RENOVACAO' ? 'Renovação' : 'Troca de ponto'} não aprovada: ${texto}`,
      outcome: 'INDEFERIDO',
    });
    return atualizado;
  },
};

// ============================================================================
// SAÚDE — PEDIDO DE CONSULTA
// ============================================================================

export const pedidoConsultaQueue = {
  APP: 'Agendamento de Consultas',

  async list(status?: string) {
    const items = await prisma.solicitacaoConsulta.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    return withProtocolNumber(await withCitizens(items));
  },

  /** Chamado depois que a consulta foi marcada na agenda (POST /consultas com solicitacaoId). */
  async marcarAgendada(id: string, userId: string, consulta: { id: string; agendaId: string; dataHora: Date; citizenId: string }) {
    const pedido = await prisma.solicitacaoConsulta.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.citizenId !== consulta.citizenId) throw new Error('A consulta marcada é de outra pessoa');
    await prisma.solicitacaoConsulta.update({
      where: { id },
      data: { status: 'AGENDADA', consultaAgendadaId: consulta.id, decididoPor: userId, decididoEm: new Date() },
    });

    const agenda = await prisma.agendaMedica.findFirst({
      where: { id: consulta.agendaId },
      select: { profissionalId: true, unidadeId: true, especialidade: { select: { nome: true } } },
    });
    const [profissional, unidade] = await Promise.all([
      agenda ? prisma.user.findFirst({ where: { id: agenda.profissionalId }, select: { name: true } }) : null,
      agenda ? prisma.unidadeSaude.findFirst({ where: { id: agenda.unidadeId }, select: { nome: true } }) : null,
    ]);
    const quando = new Date(consulta.dataHora);
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Consulta marcada para ${fmtDate(quando)} às ${fmtTime(quando)}${agenda?.especialidade?.nome ? ` (${agenda.especialidade.nome})` : ''}${profissional?.name ? ` com ${profissional.name}` : ''}${unidade?.nome ? ` na ${unidade.nome}` : ''}. Leve documento com foto e o Cartão SUS.`,
      outcome: 'DEFERIDO',
    });
  },

  async recusar(id: string, userId: string, motivo?: string) {
    const texto = requireMotivo(motivo);
    const pedido = await prisma.solicitacaoConsulta.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'PENDENTE') throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.solicitacaoConsulta.update({
      where: { id },
      data: { status: 'RECUSADA', motivo: texto, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Não foi possível marcar a consulta: ${texto}`,
      outcome: 'INDEFERIDO',
    });
    return atualizado;
  },
};

// ============================================================================
// SAÚDE — PEDIDO DE REMÉDIO (Farmácia)
// ============================================================================

export const pedidoMedicamentoQueue = {
  APP: 'Farmácia',

  async list(status?: string) {
    const items = await prisma.solicitacaoMedicamento.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    return withProtocolNumber(await withCitizens(items));
  },

  async get(id: string) {
    const item = await prisma.solicitacaoMedicamento.findFirst({ where: { id } });
    if (!item) return null;
    const [comCidadao] = await withCitizens([item]);
    return comCidadao;
  },

  /** Sem o remédio agora: avisa o cidadão e mantém na fila. */
  async aguardarEstoque(id: string, userId: string, mensagem?: string) {
    const pedido = await prisma.solicitacaoMedicamento.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (['ENTREGUE', 'RECUSADA'].includes(pedido.status)) throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.solicitacaoMedicamento.update({
      where: { id },
      data: { status: 'AGUARDANDO_ESTOQUE', motivo: mensagem || null },
    });
    await noteProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `O remédio ${pedido.medicamento} está em falta no momento${mensagem ? ` (${mensagem})` : ''}. Avisaremos quando puder retirar.`,
    });
    return atualizado;
  },

  /** Remédio entregue (pela tela de dispensação ou marcado à mão, ex.: alto custo pelo Estado). */
  async marcarEntregue(id: string, userId: string, observacao?: string) {
    const pedido = await prisma.solicitacaoMedicamento.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (['ENTREGUE', 'RECUSADA'].includes(pedido.status)) throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.solicitacaoMedicamento.update({
      where: { id },
      data: { status: 'ENTREGUE', motivo: observacao || null, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Remédio ${pedido.medicamento} entregue${observacao ? ` — ${observacao}` : ''}.`,
      outcome: 'DEFERIDO',
    });
    return atualizado;
  },

  async recusar(id: string, userId: string, motivo?: string) {
    const texto = requireMotivo(motivo);
    const pedido = await prisma.solicitacaoMedicamento.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (['ENTREGUE', 'RECUSADA'].includes(pedido.status)) throw new Error('Este pedido já foi decidido');
    const atualizado = await prisma.solicitacaoMedicamento.update({
      where: { id },
      data: { status: 'RECUSADA', motivo: texto, decididoPor: userId, decididoEm: new Date() },
    });
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: this.APP,
      actorId: userId,
      message: `Pedido do remédio ${pedido.medicamento} não atendido: ${texto}`,
      outcome: 'INDEFERIDO',
    });
    return atualizado;
  },
};
