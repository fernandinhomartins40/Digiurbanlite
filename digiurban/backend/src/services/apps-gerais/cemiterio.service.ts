/**
 * Cemitérios (app de Serviços Públicos, 2026-10-09).
 *
 * Cadastro das sepulturas/jazigos (cemitério, quadra, número, titular e prazo
 * da concessão), registro de sepultamentos e os pedidos do portal: concessão,
 * renovação, transferência de titularidade, sepultamento e exumação. Atender
 * o pedido grava no jazigo e encerra o pedido com a resposta; exumação é
 * marcada antes (o cidadão recebe a data) e só depois do prazo mínimo.
 */

import { prisma } from '../../lib/prisma';
import { parseBrasiliaDateTime } from '../agenda-medica/brasilia-time';
import { concludeProtocolFromApp, markProtocolInProgressFromApp } from '../apps/app-protocol-bridge.service';
import { campo, comEvento, dataBrasilia, dataHoraBrasilia, dataOuNulo, numerosDosPedidos, origemDoPedido, proximoNumero } from './common';

const APP = 'Cemitérios';

export const TIPOS_JAZIGO = ['SEPULTURA', 'JAZIGO', 'GAVETA', 'OSSUARIO'];

/** Porta do app → tipo de pedido */
export const TIPO_PEDIDO_CEMITERIO: Record<string, string> = {
  CONCESSAO_SEPULTURA: 'CONCESSAO',
  RENOVACAO_CONCESSAO_SEPULTURA: 'RENOVACAO',
  TRANSFERENCIA_JAZIGO: 'TRANSFERENCIA',
  EXUMACAO: 'EXUMACAO',
  SEPULTAMENTO: 'SEPULTAMENTO',
};

/** Prazo mínimo entre sepultamento e exumação (anos). */
export const ANOS_MINIMOS_EXUMACAO = 3;

const ANO_MS = 365.25 * 24 * 3600_000;

/** Nova data da concessão: soma a partir do fim atual (ou de hoje, se já venceu). */
export function novaValidadeConcessao(atual: Date | null, anos: number, agora = new Date()): Date {
  const base = atual && atual.getTime() > agora.getTime() ? new Date(atual) : new Date(agora);
  base.setFullYear(base.getFullYear() + anos);
  return base;
}

/** Já passou o prazo mínimo desde o sepultamento? */
export function podeExumar(dataSepultamento: Date, agora = new Date(), anosMinimos = ANOS_MINIMOS_EXUMACAO): boolean {
  return agora.getTime() - dataSepultamento.getTime() >= anosMinimos * ANO_MS;
}

function anosValidos(valor: unknown): number {
  const anos = Math.round(Number(valor));
  if (!(anos >= 1 && anos <= 99)) throw new Error('Informe o prazo em anos (1 a 99)');
  return anos;
}

function nomeDoJazigo(j: { cemiterio: string; quadra?: string | null; numero: string }) {
  return `${j.cemiterio}${j.quadra ? `, quadra ${j.quadra}` : ''}, nº ${j.numero}`;
}

class CemiterioService {
  private async pedido(id: string) {
    const atual = await prisma.pedidoCemiterio.findFirst({ where: { id }, include: { jazigo: true } });
    if (!atual) throw new Error('Pedido não encontrado');
    return atual;
  }

  private async jazigo(id?: string | null) {
    if (!id) throw new Error('Escolha a sepultura/jazigo');
    const atual = await prisma.jazigoCemiterio.findFirst({ where: { id } });
    if (!atual) throw new Error('Sepultura/jazigo não encontrado');
    return atual;
  }

  async fromPortal(protocol: { id: string; citizenId?: string | null; customData?: any }, action: string) {
    if (await prisma.pedidoCemiterio.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
    const origem = await origemDoPedido(protocol.id);
    const data = protocol.customData || {};
    const localizacao = [campo(data, 'cemiterio'), campo(data, 'quadra'), campo(data, 'numeroJazigo', 'numeroSepultura', 'sepultura', 'jazigo', 'localizacao')]
      .filter(Boolean)
      .join(' · ');
    await prisma.pedidoCemiterio.create({
      data: {
        protocolId: protocol.id,
        numero: await proximoNumero('pedidoCemiterio', 'CEM'),
        tipo: TIPO_PEDIDO_CEMITERIO[action] || 'CONCESSAO',
        cemiterioDesejado: campo(data, 'cemiterio', 'cemiterioDesejado'),
        localizacaoInformada: localizacao || null,
        citizenId: protocol.citizenId || null,
        solicitanteNome: origem.citizen?.name || campo(data, 'nome', 'nomeCompleto') || 'Cidadão',
        telefone: campo(data, 'telefone') || origem.citizen?.phone || null,
        falecidoNome: campo(data, 'nomeFalecido', 'falecido', 'nomeDoFalecido'),
        dataObito: dataOuNulo(campo(data, 'dataObito', 'dataFalecimento')),
        novoTitularNome: campo(data, 'novoTitular', 'nomeNovoTitular'),
        novoTitularDocumento: campo(data, 'cpfNovoTitular', 'documentoNovoTitular'),
        historico: comEvento(null, 'Pedido recebido') as any,
      },
    });
  }

  // ----------------------------------------------------------------- jazigos
  async listJazigos(filters: { cemiterio?: string; status?: string; busca?: string }) {
    const busca = String(filters.busca || '').trim();
    return prisma.jazigoCemiterio.findMany({
      where: {
        status: filters.status ? filters.status : { not: 'INATIVO' },
        ...(filters.cemiterio ? { cemiterio: filters.cemiterio } : {}),
        ...(busca
          ? {
              OR: [
                { numero: { contains: busca, mode: 'insensitive' } },
                { titularNome: { contains: busca, mode: 'insensitive' } },
                { sepultamentos: { some: { falecidoNome: { contains: busca, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: { sepultamentos: { orderBy: { dataSepultamento: 'desc' } } },
      orderBy: [{ cemiterio: 'asc' }, { quadra: 'asc' }, { numero: 'asc' }],
      take: 1000,
    });
  }

  async cemiterios() {
    const grupos = await prisma.jazigoCemiterio.groupBy({ by: ['cemiterio'], _count: { _all: true } });
    return grupos.map((g) => g.cemiterio).sort();
  }

  async saveJazigo(id: string | null, data: any) {
    const cemiterio = String(data?.cemiterio || '').trim();
    const numero = String(data?.numero || '').trim();
    if (!cemiterio || !numero) throw new Error('Informe o cemitério e o número');
    const campos = {
      cemiterio,
      quadra: String(data.quadra || '').trim() || null,
      numero,
      tipo: TIPOS_JAZIGO.includes(data.tipo) ? data.tipo : 'SEPULTURA',
      titularNome: String(data.titularNome || '').trim() || null,
      titularDocumento: String(data.titularDocumento || '').trim() || null,
      concessaoAte: data.concessaoAte ? parseBrasiliaDateTime(String(data.concessaoAte)) : null,
      observacoes: data.observacoes || null,
    };
    if (id) {
      const atual = await this.jazigo(id);
      const status = atual.status === 'LIVRE' && campos.titularNome ? 'CONCEDIDO' : atual.status;
      return prisma.jazigoCemiterio.update({ where: { id }, data: { ...campos, status } });
    }
    const repetido = await prisma.jazigoCemiterio.findFirst({ where: { cemiterio, quadra: campos.quadra, numero }, select: { id: true } });
    if (repetido) throw new Error('Já existe uma sepultura com esse número nessa quadra');
    return prisma.jazigoCemiterio.create({ data: { ...campos, status: campos.titularNome ? 'CONCEDIDO' : 'LIVRE' } });
  }

  /** Sepultamento registrado pela equipe (com ou sem pedido). */
  async registrarSepultamento(jazigoId: string, data: any) {
    const jazigo = await this.jazigo(jazigoId);
    if (jazigo.status === 'INATIVO') throw new Error('Esta sepultura está desativada');
    const falecidoNome = String(data?.falecidoNome || '').trim();
    if (!falecidoNome) throw new Error('Informe o nome de quem foi sepultado');
    const dataSepultamento = data?.dataSepultamento ? parseBrasiliaDateTime(String(data.dataSepultamento)) : new Date();
    const registro = await prisma.sepultamentoRegistro.create({
      data: {
        jazigoId,
        falecidoNome,
        dataObito: data?.dataObito ? parseBrasiliaDateTime(String(data.dataObito)) : null,
        dataSepultamento,
        certidaoObito: data?.certidaoObito || null,
      },
    });
    await prisma.jazigoCemiterio.update({ where: { id: jazigoId }, data: { status: 'OCUPADO' } });
    return registro;
  }

  // ----------------------------------------------------------------- pedidos
  async listPedidos(filters: { status?: string; pendentes?: boolean }) {
    const itens = await prisma.pedidoCemiterio.findMany({
      where: filters.pendentes ? { status: { in: ['AGUARDANDO', 'AGENDADO'] } } : filters.status ? { status: filters.status } : {},
      include: { jazigo: { select: { id: true, cemiterio: true, quadra: true, numero: true, titularNome: true, concessaoAte: true, status: true } } },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    });
    const numeros = await numerosDosPedidos(itens.map((i) => i.protocolId));
    return itens.map((i) => ({ ...i, protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  /** Exumação: marca o dia (o cidadão recebe a data). */
  async agendarExumacao(id: string, userId: string, data: { jazigoId?: string; dataAgendada?: string; ordemJudicial?: boolean }) {
    const pedido = await this.pedido(id);
    if (pedido.tipo !== 'EXUMACAO') throw new Error('Só exumação é marcada');
    if (!['AGUARDANDO', 'AGENDADO'].includes(pedido.status)) throw new Error('Este pedido já foi encerrado');
    const jazigo = await this.jazigo(data.jazigoId || pedido.jazigoId);
    const ultimo = await prisma.sepultamentoRegistro.findFirst({ where: { jazigoId: jazigo.id, exumadoEm: null }, orderBy: { dataSepultamento: 'desc' } });
    if (!ultimo) throw new Error('Não há sepultamento registrado nesta sepultura');
    if (!data.ordemJudicial && !podeExumar(ultimo.dataSepultamento)) {
      throw new Error(`O sepultamento foi em ${dataBrasilia(ultimo.dataSepultamento)}; a exumação só pode ser feita depois de ${ANOS_MINIMOS_EXUMACAO} anos (ou com ordem judicial)`);
    }
    if (!data.dataAgendada) throw new Error('Escolha o dia e a hora');
    const quando = parseBrasiliaDateTime(String(data.dataAgendada));
    if (Number.isNaN(quando.getTime())) throw new Error('Data inválida');
    const atualizado = await prisma.pedidoCemiterio.update({
      where: { id },
      data: { status: 'AGENDADO', jazigoId: jazigo.id, dataAgendada: quando, historico: comEvento(pedido.historico, `Exumação marcada para ${dataHoraBrasilia(quando)}`, userId) as any },
    });
    await markProtocolInProgressFromApp({
      protocolId: pedido.protocolId,
      app: APP,
      actorId: userId,
      message: `A exumação de ${ultimo.falecidoNome} (${nomeDoJazigo(jazigo)}) foi marcada para ${dataHoraBrasilia(quando)}. Compareça ao cemitério com documento com foto.`,
    });
    return atualizado;
  }

  /** Atende o pedido: grava na sepultura e encerra o pedido. */
  async atender(id: string, userId: string, data: any) {
    const pedido = await this.pedido(id);
    if (!['AGUARDANDO', 'AGENDADO'].includes(pedido.status)) throw new Error('Este pedido já foi encerrado');
    const jazigo = await this.jazigo(data?.jazigoId || pedido.jazigoId);
    let message = '';
    let evento = '';

    if (pedido.tipo === 'CONCESSAO') {
      if (jazigo.status !== 'LIVRE') throw new Error(`${nomeDoJazigo(jazigo)} não está livre`);
      const ate = novaValidadeConcessao(null, anosValidos(data?.anos));
      const citizen = pedido.citizenId ? await prisma.citizen.findFirst({ where: { id: pedido.citizenId }, select: { cpf: true } }) : null;
      await prisma.jazigoCemiterio.update({
        where: { id: jazigo.id },
        data: { status: 'CONCEDIDO', titularNome: pedido.solicitanteNome, titularCitizenId: pedido.citizenId, titularDocumento: citizen?.cpf || null, concessaoAte: ate },
      });
      evento = `Concessão até ${dataBrasilia(ate)}`;
      message = `Concessão aprovada: ${nomeDoJazigo(jazigo)}, em seu nome, válida até ${dataBrasilia(ate)}.`;
    } else if (pedido.tipo === 'RENOVACAO') {
      const ate = novaValidadeConcessao(jazigo.concessaoAte, anosValidos(data?.anos));
      await prisma.jazigoCemiterio.update({ where: { id: jazigo.id }, data: { concessaoAte: ate, ...(jazigo.status === 'LIVRE' ? { status: 'CONCEDIDO' } : {}) } });
      evento = `Renovada até ${dataBrasilia(ate)}`;
      message = `Concessão renovada: ${nomeDoJazigo(jazigo)}, agora válida até ${dataBrasilia(ate)}.`;
    } else if (pedido.tipo === 'TRANSFERENCIA') {
      const novoNome = String(data?.novoTitularNome || pedido.novoTitularNome || pedido.solicitanteNome || '').trim();
      if (!novoNome) throw new Error('Informe o novo titular');
      const novoDocumento = String(data?.novoTitularDocumento || pedido.novoTitularDocumento || '').trim() || null;
      const paraQuemPediu = novoNome === pedido.solicitanteNome;
      await prisma.jazigoCemiterio.update({
        where: { id: jazigo.id },
        data: { titularNome: novoNome, titularDocumento: novoDocumento, titularCitizenId: paraQuemPediu ? pedido.citizenId : null, ...(jazigo.status === 'LIVRE' ? { status: 'CONCEDIDO' } : {}) },
      });
      evento = `Titular: ${jazigo.titularNome || '—'} → ${novoNome}`;
      message = `Titularidade transferida: ${nomeDoJazigo(jazigo)} agora está em nome de ${novoNome}.`;
    } else if (pedido.tipo === 'SEPULTAMENTO') {
      const falecidoNome = String(data?.falecidoNome || pedido.falecidoNome || '').trim();
      const registro = await this.registrarSepultamento(jazigo.id, {
        falecidoNome,
        dataObito: data?.dataObito || pedido.dataObito?.toISOString(),
        dataSepultamento: data?.dataSepultamento,
        certidaoObito: data?.certidaoObito,
      });
      evento = `Sepultamento de ${falecidoNome}`;
      message = `Sepultamento de ${falecidoNome} registrado em ${nomeDoJazigo(jazigo)} (${dataHoraBrasilia(registro.dataSepultamento)}).`;
    } else if (pedido.tipo === 'EXUMACAO') {
      if (pedido.status !== 'AGENDADO') throw new Error('Marque o dia da exumação antes');
      const ultimo = await prisma.sepultamentoRegistro.findFirst({ where: { jazigoId: jazigo.id, exumadoEm: null }, orderBy: { dataSepultamento: 'desc' } });
      if (!ultimo) throw new Error('Não há sepultamento a exumar nesta sepultura');
      const destino = String(data?.destinoRestos || '').trim() || 'ossuário';
      await prisma.sepultamentoRegistro.update({ where: { id: ultimo.id }, data: { exumadoEm: new Date(), destinoRestos: destino } });
      const restantes = await prisma.sepultamentoRegistro.count({ where: { jazigoId: jazigo.id, exumadoEm: null } });
      if (!restantes) await prisma.jazigoCemiterio.update({ where: { id: jazigo.id }, data: { status: jazigo.titularNome ? 'CONCEDIDO' : 'LIVRE' } });
      evento = `Exumação de ${ultimo.falecidoNome} (destino: ${destino})`;
      message = `Exumação de ${ultimo.falecidoNome} realizada. Os restos foram para: ${destino}.`;
    } else {
      throw new Error('Tipo de pedido desconhecido');
    }

    const extra = String(data?.mensagem || '').trim();
    const atualizado = await prisma.pedidoCemiterio.update({
      where: { id },
      data: { status: 'ATENDIDO', jazigoId: jazigo.id, encerradoEm: new Date(), historico: comEvento(pedido.historico, evento, userId) as any },
    });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: APP, actorId: userId, outcome: 'DEFERIDO', message: [message, extra].filter(Boolean).join(' ') });
    return atualizado;
  }

  async recusar(id: string, userId: string, mensagem: string) {
    const pedido = await this.pedido(id);
    if (!['AGUARDANDO', 'AGENDADO'].includes(pedido.status)) throw new Error('Este pedido já foi encerrado');
    const texto = String(mensagem || '').trim();
    if (!texto) throw new Error('Escreva o motivo para o cidadão');
    const atualizado = await prisma.pedidoCemiterio.update({
      where: { id },
      data: { status: 'RECUSADO', encerradoEm: new Date(), historico: comEvento(pedido.historico, `Recusado: ${texto}`, userId) as any },
    });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: APP, actorId: userId, message: texto, outcome: 'INDEFERIDO' });
    return atualizado;
  }

  async stats() {
    const agora = new Date();
    const em90dias = new Date(agora.getTime() + 90 * 24 * 3600_000);
    const [pendentes, livres, ocupados, concessoesVencendo] = await Promise.all([
      prisma.pedidoCemiterio.count({ where: { status: { in: ['AGUARDANDO', 'AGENDADO'] } } }),
      prisma.jazigoCemiterio.count({ where: { status: 'LIVRE' } }),
      prisma.jazigoCemiterio.count({ where: { status: 'OCUPADO' } }),
      prisma.jazigoCemiterio.count({ where: { concessaoAte: { lte: em90dias }, status: { in: ['CONCEDIDO', 'OCUPADO'] } } }),
    ]);
    return { pendentes, livres, ocupados, concessoesVencendo };
  }
}

export default new CemiterioService();
