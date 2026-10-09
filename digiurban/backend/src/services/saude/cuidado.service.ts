/**
 * Atendimento de Saúde — linhas de cuidado que tinham tabela e não tinham
 * rota nem tela (Fase 2 da auditoria de 2026-10-08): atendimento
 * odontológico, pré-natal e visita domiciliar do agente de saúde.
 *
 * Regras puras (idade gestacional, data provável do parto, CPO-D) ficam em
 * funções exportadas e testadas (`__tests__/unit/saude-cuidado.test.ts`).
 */

import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERSON = { id: true, name: true, cpf: true, birthDate: true, phone: true } as const;

// ============================================================================
// REGRAS PURAS
// ============================================================================

/** Data provável do parto = DUM + 280 dias (regra de Naegele) */
export function dataProvavelParto(dum: Date): Date {
  return new Date(dum.getTime() + 280 * DAY_MS);
}

/** Idade gestacional em semanas e dias a partir da DUM ("12s 3d") */
export function idadeGestacional(dum: Date, em: Date = new Date()): { semanas: number; dias: number; texto: string } {
  const total = Math.max(0, Math.floor((em.getTime() - dum.getTime()) / DAY_MS));
  const semanas = Math.floor(total / 7);
  const dias = total % 7;
  return { semanas, dias, texto: `${semanas}s ${dias}d` };
}

/** Trimestre da gestação pela idade gestacional (1 a 3) */
export function trimestre(semanas: number): 1 | 2 | 3 {
  if (semanas < 14) return 1;
  if (semanas < 28) return 2;
  return 3;
}

export type CondicaoDente = 'HIGIDO' | 'CARIADO' | 'OBTURADO' | 'PERDIDO' | 'EXTRACAO_INDICADA' | 'AUSENTE' | 'SELANTE' | 'PROTESE';

/** Índice CPO-D a partir do odontograma: cariados + perdidos + obturados */
export function calcularCPOD(odontograma: Record<string, { condicao?: string }> | null | undefined) {
  const dentes = Object.values(odontograma || {});
  const conta = (...condicoes: string[]) => dentes.filter((d) => condicoes.includes(String(d?.condicao || ''))).length;
  const cariados = conta('CARIADO');
  const perdidos = conta('PERDIDO', 'EXTRACAO_INDICADA');
  const obturados = conta('OBTURADO');
  return { cariados, perdidos, obturados, cpod: cariados + perdidos + obturados, dentes: dentes.length };
}

function requireDate(value: unknown, campo: string): Date {
  const date = new Date(String(value));
  if (!value || Number.isNaN(date.getTime())) throw new Error(`Informe ${campo}`);
  return date;
}

const optNumber = (value: unknown) => (value === undefined || value === null || value === '' ? null : Number(value));
const optText = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

// ============================================================================
// ODONTOLOGIA
// ============================================================================

export const odontoService = {
  /** Atendimento odontológico da entrada da fila (cria o atendimento se ainda não existe). */
  async salvar(dentistaId: string, input: any) {
    if (!input?.filaAtendimentoId) throw new Error('Escolha o paciente na fila');
    const fila = await prisma.filaAtendimento.findFirst({ where: { id: input.filaAtendimentoId } });
    if (!fila) throw new Error('Entrada na fila não encontrada');

    let atendimento = await prisma.atendimentoMedico.findFirst({ where: { filaAtendimentoId: fila.id } });
    if (!atendimento) {
      atendimento = await prisma.atendimentoMedico.create({
        data: {
          workflowId: `workflow-${fila.id}`,
          citizenId: fila.citizenId,
          unidadeId: fila.unidadeId,
          tipo: fila.tipoAtendimento as any,
          status: 'EM_CONSULTA',
          profissionalId: dentistaId,
          filaAtendimentoId: fila.id,
          horarioConsulta: new Date(),
        },
      });
    }

    const odontograma = input.odontograma && typeof input.odontograma === 'object' ? input.odontograma : {};
    const dados = {
      odontograma,
      indicesCPOD: calcularCPOD(odontograma),
      queixaPrincipal: optText(input.queixaPrincipal),
      exameBucal: optText(input.exameBucal),
      diagnostico: optText(input.diagnostico),
      planoTratamento: optText(input.planoTratamento),
      orientacoes: optText(input.orientacoes),
      observacoes: optText(input.observacoes),
    };
    const existente = await prisma.atendimentoOdontologico.findFirst({ where: { atendimentoId: atendimento.id } });
    const odonto = existente
      ? await prisma.atendimentoOdontologico.update({ where: { id: existente.id }, data: dados })
      : await prisma.atendimentoOdontologico.create({ data: { ...dados, atendimentoId: atendimento.id, dentistaId } });

    // Procedimentos novos deste salvamento (os já gravados não são regravados)
    const procedimentos = Array.isArray(input.procedimentos) ? input.procedimentos : [];
    const tenantId = tryGetTenantId() || null;
    for (const proc of procedimentos) {
      if (proc?.id || !proc?.descricao) continue;
      await prisma.procedimentoOdonto.create({
        data: {
          tenantId,
          atendimentoOdontoId: odonto.id,
          codigoSIGTAP: String(proc.codigoSIGTAP || '').trim() || 'NAO_INFORMADO',
          descricao: String(proc.descricao).trim(),
          dente: optText(proc.dente),
          face: optText(proc.face),
          quantidade: Number(proc.quantidade) > 0 ? Number(proc.quantidade) : 1,
          observacoes: optText(proc.observacoes),
        },
      });
    }

    if (input.finalizar === true) {
      await prisma.filaAtendimento.update({ where: { id: fila.id }, data: { status: 'FINALIZADO', dataHoraFim: new Date() } });
      await prisma.atendimentoMedico.update({ where: { id: atendimento.id }, data: { status: 'CONSULTA_CONCLUIDA' } });
    } else if (fila.status === 'AGUARDANDO') {
      await prisma.filaAtendimento.update({ where: { id: fila.id }, data: { status: 'EM_CONSULTA' } }).catch(() => undefined);
    }
    return this.porFila(fila.id);
  },

  async porFila(filaAtendimentoId: string) {
    const atendimento = await prisma.atendimentoMedico.findFirst({ where: { filaAtendimentoId }, select: { id: true } });
    if (!atendimento) return null;
    return prisma.atendimentoOdontologico.findFirst({
      where: { atendimentoId: atendimento.id },
      include: { procedimentos: { orderBy: { dataHora: 'asc' } } },
    });
  },

  /** Histórico odontológico do cidadão (mais recente primeiro) — o último odontograma serve de ponto de partida. */
  async historico(citizenId: string) {
    return prisma.atendimentoOdontologico.findMany({
      where: { atendimento: { citizenId } },
      include: { procedimentos: true, dentista: { select: { id: true, name: true } } },
      orderBy: { dataHora: 'desc' },
      take: 30,
    });
  },

  /** Pacientes aguardando ou em atendimento com o dentista logado, hoje. */
  async minhaFila(dentistaId: string, unidadeId?: string) {
    const inicio = new Date();
    inicio.setHours(inicio.getHours() - 18);
    const fila = await prisma.filaAtendimento.findMany({
      where: {
        profissionalId: dentistaId,
        status: { notIn: ['FINALIZADO', 'ENCAMINHADO_EXTERNO', 'INTERNADO', 'NAO_AGUARDOU', 'TRANSFERIDO', 'RESOLVIDO_ACOLHIMENTO'] },
        dataHoraChegada: { gte: inicio },
        ...(unidadeId ? { unidadeId } : {}),
      },
      include: { citizen: { select: PERSON }, unidade: { select: { id: true, nome: true } } },
      orderBy: [{ prioridade: 'desc' }, { dataHoraChegada: 'asc' }],
    });
    return fila;
  },
};

// ============================================================================
// PRÉ-NATAL
// ============================================================================

function comIdade<T extends { dum: Date; status: string; dataFim?: Date | null }>(pn: T) {
  const referencia = pn.status === 'EM_ANDAMENTO' ? new Date() : pn.dataFim || new Date();
  const ig = idadeGestacional(pn.dum, referencia);
  return { ...pn, idadeGestacional: ig.texto, semanas: ig.semanas, trimestre: trimestre(ig.semanas) };
}

export const preNatalService = {
  async listar(filtros: { status?: string; risco?: string }) {
    const lista = await prisma.acompanhamentoPreNatal.findMany({
      where: {
        ...(filtros.status ? { status: filtros.status as any } : {}),
        ...(filtros.risco ? { riscoGestacional: filtros.risco as any } : {}),
      },
      include: {
        citizen: { select: PERSON },
        consultas: { orderBy: { dataConsulta: 'desc' }, take: 1, select: { dataConsulta: true, proximaConsulta: true } },
        _count: { select: { consultas: true, exames: true } },
      },
      orderBy: { dpp: 'asc' },
      take: 500,
    });
    return lista.map(comIdade);
  },

  async buscar(id: string) {
    const pn = await prisma.acompanhamentoPreNatal.findFirst({
      where: { id },
      include: {
        citizen: { select: PERSON },
        consultas: { orderBy: { dataConsulta: 'desc' } },
        exames: { orderBy: { dataSolicitacao: 'desc' } },
      },
    });
    return pn ? comIdade(pn) : null;
  },

  /** Abre o acompanhamento (uma gestação em andamento por gestante). */
  async iniciar(input: any) {
    if (!input?.citizenId) throw new Error('Escolha a gestante');
    const dum = requireDate(input.dum, 'a data da última menstruação');
    if (dum > new Date()) throw new Error('A data da última menstruação não pode ser no futuro');
    const existente = await prisma.acompanhamentoPreNatal.findFirst({ where: { citizenId: input.citizenId } });
    if (existente?.status === 'EM_ANDAMENTO') throw new Error('Esta gestante já tem um pré-natal em andamento');

    const peso = optNumber(input.pesoInicial);
    const altura = optNumber(input.alturaInicial);
    const dados = {
      dum,
      dpp: dataProvavelParto(dum),
      gravidez: Number(input.gravidez) > 0 ? Number(input.gravidez) : 1,
      partos: Number(input.partos) || 0,
      abortos: Number(input.abortos) || 0,
      cesarianas: Number(input.cesarianas) || 0,
      nascidosVivos: Number(input.nascidosVivos) || 0,
      nascidosMortos: Number(input.nascidosMortos) || 0,
      riscoGestacional: (input.riscoGestacional === 'ALTO_RISCO' ? 'ALTO_RISCO' : 'HABITUAL') as any,
      fatoresRisco: Array.isArray(input.fatoresRisco) ? input.fatoresRisco : undefined,
      grupoSanguineo: optText(input.grupoSanguineo),
      fatorRh: optText(input.fatorRh),
      pesoInicial: peso,
      alturaInicial: altura,
      imcInicial: peso && altura ? Number((peso / (altura * altura)).toFixed(1)) : null,
      observacoes: optText(input.observacoes),
      status: 'EM_ANDAMENTO' as any,
      dataInicio: new Date(),
      dataFim: null,
      tipoDesfecho: null,
      dataDesfecho: null,
      observacoesDesfecho: null,
    };
    // Gestação anterior encerrada: o cadastro é único por gestante — a nova
    // gestação reaproveita a linha e as consultas/exames antigos são apagados
    // do acompanhamento (ficam no prontuário pelas consultas médicas).
    if (existente) {
      await prisma.consultaPreNatal.deleteMany({ where: { preNatalId: existente.id } });
      await prisma.examePreNatal.deleteMany({ where: { preNatalId: existente.id } });
      await prisma.acompanhamentoPreNatal.update({ where: { id: existente.id }, data: dados });
      return this.buscar(existente.id);
    }
    const criado = await prisma.acompanhamentoPreNatal.create({ data: { ...dados, citizenId: input.citizenId } });
    return this.buscar(criado.id);
  },

  async atualizarRisco(id: string, input: any) {
    await prisma.acompanhamentoPreNatal.update({
      where: { id },
      data: {
        riscoGestacional: (input?.riscoGestacional === 'ALTO_RISCO' ? 'ALTO_RISCO' : 'HABITUAL') as any,
        fatoresRisco: Array.isArray(input?.fatoresRisco) ? input.fatoresRisco : undefined,
      },
    });
    return this.buscar(id);
  },

  async registrarConsulta(id: string, profissionalId: string, input: any) {
    const pn = await prisma.acompanhamentoPreNatal.findFirst({ where: { id } });
    if (!pn) throw new Error('Pré-natal não encontrado');
    if (pn.status !== 'EM_ANDAMENTO') throw new Error('Este pré-natal já foi encerrado');
    const dataConsulta = input?.dataConsulta ? requireDate(input.dataConsulta, 'a data da consulta') : new Date();
    await prisma.consultaPreNatal.create({
      data: {
        tenantId: tryGetTenantId() || null,
        preNatalId: id,
        profissionalId,
        dataConsulta,
        idadeGestacional: idadeGestacional(pn.dum, dataConsulta).texto,
        peso: optNumber(input?.peso),
        pressaoArterial: optText(input?.pressaoArterial),
        alturaUterina: optNumber(input?.alturaUterina),
        bcf: optNumber(input?.bcf),
        movimentosFetais: typeof input?.movimentosFetais === 'boolean' ? input.movimentosFetais : null,
        edema: optText(input?.edema),
        apresentacaoFetal: optText(input?.apresentacaoFetal),
        queixas: optText(input?.queixas),
        orientacoes: optText(input?.orientacoes),
        conduta: optText(input?.conduta),
        proximaConsulta: input?.proximaConsulta ? requireDate(input.proximaConsulta, 'a data da próxima consulta') : null,
      },
    });
    return this.buscar(id);
  },

  async solicitarExame(id: string, input: any) {
    if (!input?.tipoExame) throw new Error('Escolha o exame');
    await prisma.examePreNatal.create({
      data: {
        tenantId: tryGetTenantId() || null,
        preNatalId: id,
        tipoExame: input.tipoExame,
        observacoes: optText(input.observacoes),
      },
    });
    return this.buscar(id);
  },

  async registrarResultado(exameId: string, input: any) {
    const exame = await prisma.examePreNatal.findFirst({ where: { id: exameId } });
    if (!exame) throw new Error('Exame não encontrado');
    await prisma.examePreNatal.update({
      where: { id: exameId },
      data: {
        resultado: optText(input?.resultado),
        dataRealizacao: input?.dataRealizacao ? requireDate(input.dataRealizacao, 'a data do exame') : new Date(),
        observacoes: optText(input?.observacoes) ?? exame.observacoes,
      },
    });
    return this.buscar(exame.preNatalId);
  },

  async encerrar(id: string, input: any) {
    const tipos = ['PARTO_NORMAL', 'CESAREA', 'ABORTO', 'INTERRUPCAO'];
    if (!tipos.includes(input?.tipoDesfecho)) throw new Error('Escolha como a gestação terminou');
    const dataDesfecho = input?.dataDesfecho ? requireDate(input.dataDesfecho, 'a data') : new Date();
    await prisma.acompanhamentoPreNatal.update({
      where: { id },
      data: {
        status: (input.tipoDesfecho === 'PARTO_NORMAL' || input.tipoDesfecho === 'CESAREA' ? 'FINALIZADO' : 'INTERROMPIDO') as any,
        tipoDesfecho: input.tipoDesfecho,
        dataDesfecho,
        dataFim: dataDesfecho,
        observacoesDesfecho: optText(input.observacoes),
      },
    });
    return this.buscar(id);
  },

  /** Números do painel: gestantes em acompanhamento, alto risco, parto nos próximos 30 dias, sem consulta há 30+ dias. */
  async resumo() {
    const ativas = await prisma.acompanhamentoPreNatal.findMany({
      where: { status: 'EM_ANDAMENTO' },
      select: { riscoGestacional: true, dpp: true, dataInicio: true, consultas: { orderBy: { dataConsulta: 'desc' }, take: 1, select: { dataConsulta: true } } },
    });
    const agora = Date.now();
    return {
      emAcompanhamento: ativas.length,
      altoRisco: ativas.filter((a) => a.riscoGestacional === 'ALTO_RISCO').length,
      partoEm30Dias: ativas.filter((a) => a.dpp.getTime() - agora <= 30 * DAY_MS).length,
      semConsultaHa30Dias: ativas.filter((a) => agora - (a.consultas[0]?.dataConsulta || a.dataInicio).getTime() > 30 * DAY_MS).length,
    };
  },
};

// ============================================================================
// VISITA DOMICILIAR (agente comunitário de saúde)
// ============================================================================

const TIPOS_VISITA = ['CADASTRAMENTO', 'ACOMPANHAMENTO', 'BUSCA_ATIVA', 'CONTROLE_AMBIENTAL', 'EDUCACAO_SAUDE', 'CONVOCACAO'];

export const visitaDomiciliarService = {
  async listar(filtros: { acsId?: string; citizenId?: string; inicio?: Date; fim?: Date; encaminhadas?: boolean }) {
    return prisma.visitaDomiciliar.findMany({
      where: {
        ...(filtros.acsId ? { acsId: filtros.acsId } : {}),
        ...(filtros.citizenId ? { citizenId: filtros.citizenId } : {}),
        ...(filtros.encaminhadas ? { encaminhamentoUBS: true } : {}),
        ...(filtros.inicio || filtros.fim
          ? { dataVisita: { ...(filtros.inicio ? { gte: filtros.inicio } : {}), ...(filtros.fim ? { lte: filtros.fim } : {}) } }
          : {}),
      },
      include: { citizen: { select: PERSON }, acs: { select: { id: true, name: true } } },
      orderBy: { dataVisita: 'desc' },
      take: 300,
    });
  },

  async registrar(acsId: string, input: any) {
    if (!TIPOS_VISITA.includes(input?.tipoVisita)) throw new Error('Escolha o tipo da visita');
    const motivo = optText(input?.motivoVisita);
    if (!motivo) throw new Error('Escreva o motivo da visita');
    const dataVisita = input?.dataVisita ? requireDate(input.dataVisita, 'a data da visita') : new Date();
    if (input?.encaminhamentoUBS && !optText(input?.motivoEncaminhamento)) {
      throw new Error('Escreva por que a pessoa foi encaminhada à unidade');
    }
    return prisma.visitaDomiciliar.create({
      data: {
        acsId,
        citizenId: input.citizenId || null,
        dataVisita,
        turno: ['MANHA', 'TARDE', 'NOITE'].includes(input?.turno) ? input.turno : null,
        tipoVisita: input.tipoVisita,
        motivoVisita: motivo,
        atividadesRealizadas: Array.isArray(input?.atividadesRealizadas) ? input.atividadesRealizadas : [],
        acompanhamentosRealizados: input?.acompanhamentosRealizados && typeof input.acompanhamentosRealizados === 'object' ? input.acompanhamentosRealizados : undefined,
        encaminhamentoUBS: Boolean(input?.encaminhamentoUBS),
        motivoEncaminhamento: optText(input?.motivoEncaminhamento),
        desfecho: optText(input?.desfecho),
        observacoes: optText(input?.observacoes),
        latitude: optNumber(input?.latitude),
        longitude: optNumber(input?.longitude),
      },
      include: { citizen: { select: PERSON }, acs: { select: { id: true, name: true } } },
    });
  },

  /** Produção do período: visitas por agente e por tipo, e quantas viraram encaminhamento. */
  async resumo(inicio: Date, fim: Date) {
    const visitas = await prisma.visitaDomiciliar.findMany({
      where: { dataVisita: { gte: inicio, lte: fim } },
      select: { acsId: true, tipoVisita: true, encaminhamentoUBS: true, acs: { select: { name: true } } },
    });
    const porAgente = new Map<string, { acsId: string; nome: string; visitas: number; encaminhamentos: number }>();
    const porTipo: Record<string, number> = {};
    for (const v of visitas) {
      const item = porAgente.get(v.acsId) || { acsId: v.acsId, nome: v.acs?.name || 'Agente', visitas: 0, encaminhamentos: 0 };
      item.visitas++;
      if (v.encaminhamentoUBS) item.encaminhamentos++;
      porAgente.set(v.acsId, item);
      porTipo[v.tipoVisita] = (porTipo[v.tipoVisita] || 0) + 1;
    }
    return {
      total: visitas.length,
      encaminhamentos: visitas.filter((v) => v.encaminhamentoUBS).length,
      porAgente: [...porAgente.values()].sort((a, b) => b.visitas - a.visitas),
      porTipo,
    };
  },
};
