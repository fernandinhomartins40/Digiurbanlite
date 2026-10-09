/**
 * Cursos e Capacitações (app geral, 2026-10-09).
 *
 * Qualificação profissional, inclusão digital, cursos para mulheres, cursos
 * rurais, treinamentos... O pedido do portal chega como inscrição aguardando
 * turma. A equipe cadastra o curso (vagas, local, horário, aulas), coloca a
 * pessoa na turma (sem vaga = lista de espera), lança a frequência e, ao
 * concluir o curso, cada pedido é encerrado com o resultado (concluiu ou não,
 * pela frequência mínima). Desistência abre a vaga para o primeiro da espera.
 * Cultura (oficinas) e Esportes (escolinhas) têm apps próprios.
 */

import { prisma } from '../../lib/prisma';
import { parseBrasiliaDateTime } from '../agenda-medica/brasilia-time';
import { concludeProtocolFromApp, markProtocolInProgressFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';
import { AppScope, campo, comEvento, dataBrasilia, numerosDosPedidos, origemDoPedido, pickDepartment, scopeWhere } from './common';

const APP = 'Cursos e Capacitações';

export const CURSOS_DEPARTMENTS = [
  'ADMINISTRACAO', 'AGRICULTURA', 'ASSISTENCIA_SOCIAL', 'DEFESA_CIVIL', 'DESENVOLVIMENTO_ECONOMICO', 'EDUCACAO', 'HABITACAO',
  'MEIO_AMBIENTE', 'MOBILIDADE_URBANA', 'POLITICAS_MULHERES', 'SEGURANCA_PUBLICA', 'TECNOLOGIA_INOVACAO', 'TRANSPORTES_TRANSITO', 'TURISMO',
];
const ESPERANDO = ['AGUARDANDO', 'LISTA_ESPERA'];

/** Frequência em % (curso sem aulas lançadas conta como 100%). */
export function frequenciaDe(presencas: number, totalAulas: number): number {
  if (!totalAulas || totalAulas <= 0) return 100;
  return Math.min(100, Math.round((Math.max(0, presencas) / totalAulas) * 100));
}

export function concluiuOCurso(presencas: number, totalAulas: number, minimo: number): boolean {
  return frequenciaDe(presencas, totalAulas) >= (minimo || 0);
}

function detalhesDoCurso(curso: { nome: string; local?: string | null; horario?: string | null; dataInicio?: Date | null; instrutor?: string | null }) {
  return [
    curso.dataInicio ? `Início: ${dataBrasilia(curso.dataInicio)}.` : null,
    curso.horario ? `Horário: ${curso.horario}.` : null,
    curso.local ? `Local: ${curso.local}.` : null,
    curso.instrutor ? `Instrutor(a): ${curso.instrutor}.` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

class CursosService {
  private async inscricao(id: string, scope: AppScope) {
    const atual = await prisma.inscricaoCurso.findFirst({ where: { id, ...scopeWhere(scope) }, include: { curso: true } });
    if (!atual) throw new Error('Inscrição não encontrada');
    return atual;
  }

  private async curso(id: string, scope: AppScope) {
    const atual = await prisma.cursoMunicipal.findFirst({ where: { id, ...scopeWhere(scope) } });
    if (!atual) throw new Error('Curso não encontrado');
    return atual;
  }

  private ocupadas(cursoId: string) {
    return prisma.inscricaoCurso.count({ where: { cursoId, status: { in: ['INSCRITO', 'CONCLUIU', 'NAO_CONCLUIU'] } } });
  }

  async fromPortal(protocol: { id: string; citizenId?: string | null; customData?: any }) {
    if (await prisma.inscricaoCurso.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
    const origem = await origemDoPedido(protocol.id);
    const data = protocol.customData || {};
    await prisma.inscricaoCurso.create({
      data: {
        protocolId: protocol.id,
        departmentCode: CURSOS_DEPARTMENTS.includes(origem.departmentCode) ? origem.departmentCode : CURSOS_DEPARTMENTS[0],
        interesse: campo(data, 'curso', 'cursoDesejado', 'nomeCurso', 'areaInteresse', 'oficina') || origem.servico,
        citizenId: protocol.citizenId || null,
        nome: origem.citizen?.name || campo(data, 'nome', 'nomeCompleto') || 'Cidadão',
        telefone: campo(data, 'telefone') || origem.citizen?.phone || null,
        escolaridade: campo(data, 'escolaridade'),
        observacoes: campo(data, 'observacoes', 'motivo', 'descricao'),
        historico: comEvento(null, 'Inscrição recebida, aguardando turma') as any,
      },
    });
  }

  // ------------------------------------------------------------------ cursos
  async listCursos(scope: AppScope, incluirEncerrados = false) {
    const cursos = await prisma.cursoMunicipal.findMany({
      where: { ...scopeWhere(scope), ...(incluirEncerrados ? {} : { status: { in: ['INSCRICOES', 'EM_ANDAMENTO'] } }) },
      orderBy: [{ status: 'asc' }, { dataInicio: 'asc' }],
      include: { _count: { select: { inscricoes: true } } },
      take: 300,
    });
    const contagem = await prisma.inscricaoCurso.groupBy({
      by: ['cursoId', 'status'],
      where: { cursoId: { in: cursos.map((c) => c.id) } },
      _count: { _all: true },
    });
    const soma = (cursoId: string, status: string[]) =>
      contagem.filter((c) => c.cursoId === cursoId && status.includes(c.status)).reduce((t, c) => t + c._count._all, 0);
    return cursos.map((c) => ({ ...c, inscritos: soma(c.id, ['INSCRITO', 'CONCLUIU', 'NAO_CONCLUIU']), espera: soma(c.id, ['LISTA_ESPERA']) }));
  }

  async saveCurso(scope: AppScope, id: string | null, data: any) {
    const nome = String(data?.nome || '').trim();
    if (!nome) throw new Error('Informe o nome do curso');
    const vagas = Math.max(1, Number(data.vagas) || 20);
    const campos = {
      nome,
      descricao: data.descricao || null,
      publicoAlvo: data.publicoAlvo || null,
      local: data.local || null,
      horario: data.horario || null,
      instrutor: data.instrutor || null,
      dataInicio: data.dataInicio ? parseBrasiliaDateTime(String(data.dataInicio)) : null,
      dataFim: data.dataFim ? parseBrasiliaDateTime(String(data.dataFim)) : null,
      vagas,
      totalAulas: Math.max(0, Number(data.totalAulas) || 0),
      frequenciaMinima: Math.min(100, Math.max(0, Number(data.frequenciaMinima ?? 75))),
    };
    if (id) {
      const atual = await this.curso(id, scope);
      if (['CONCLUIDO', 'CANCELADO'].includes(atual.status)) throw new Error('Este curso já foi encerrado');
      const ocupadas = await this.ocupadas(id);
      if (vagas < ocupadas) throw new Error(`O curso já tem ${ocupadas} inscritos; não dá para deixar menos vagas`);
      return prisma.cursoMunicipal.update({ where: { id }, data: campos });
    }
    return prisma.cursoMunicipal.create({ data: { ...campos, departmentCode: pickDepartment(scope, CURSOS_DEPARTMENTS, data?.departmentCode) } });
  }

  async iniciarCurso(id: string, scope: AppScope) {
    const atual = await this.curso(id, scope);
    if (atual.status !== 'INSCRICOES') throw new Error('O curso não está em inscrições');
    return prisma.cursoMunicipal.update({ where: { id }, data: { status: 'EM_ANDAMENTO' } });
  }

  /** Encerra o curso: cada inscrito recebe o resultado no pedido. */
  async concluirCurso(id: string, scope: AppScope, userId: string) {
    const curso = await this.curso(id, scope);
    if (['CONCLUIDO', 'CANCELADO'].includes(curso.status)) throw new Error('Este curso já foi encerrado');
    const inscritos = await prisma.inscricaoCurso.findMany({ where: { cursoId: id, status: 'INSCRITO' } });
    let concluiram = 0;
    for (const inscrito of inscritos) {
      const freq = frequenciaDe(inscrito.presencas, curso.totalAulas);
      const ok = concluiuOCurso(inscrito.presencas, curso.totalAulas, curso.frequenciaMinima);
      if (ok) concluiram++;
      await prisma.inscricaoCurso.update({
        where: { id: inscrito.id },
        data: { status: ok ? 'CONCLUIU' : 'NAO_CONCLUIU', encerradoEm: new Date(), historico: comEvento(inscrito.historico, `Curso encerrado — frequência ${freq}%`, userId) as any },
      });
      await concludeProtocolFromApp({
        protocolId: inscrito.protocolId,
        app: APP,
        actorId: userId,
        outcome: ok ? 'DEFERIDO' : 'INDEFERIDO',
        message: ok
          ? `Parabéns! Você concluiu o curso "${curso.nome}" com ${freq}% de frequência.`
          : `O curso "${curso.nome}" terminou. A sua frequência foi de ${freq}%, abaixo do mínimo de ${curso.frequenciaMinima}% para concluir. Você pode pedir vaga na próxima turma.`,
      });
    }
    await prisma.cursoMunicipal.update({ where: { id }, data: { status: 'CONCLUIDO' } });
    return { inscritos: inscritos.length, concluiram };
  }

  /** Turma cancelada: quem estava nela volta a esperar turma (o pedido continua aberto). */
  async cancelarCurso(id: string, scope: AppScope, userId: string, motivo: string) {
    const curso = await this.curso(id, scope);
    if (['CONCLUIDO', 'CANCELADO'].includes(curso.status)) throw new Error('Este curso já foi encerrado');
    const texto = String(motivo || '').trim();
    if (!texto) throw new Error('Escreva o motivo');
    const afetados = await prisma.inscricaoCurso.findMany({ where: { cursoId: id, status: { in: ['INSCRITO', 'LISTA_ESPERA'] } } });
    for (const inscrito of afetados) {
      await prisma.inscricaoCurso.update({
        where: { id: inscrito.id },
        data: { status: 'AGUARDANDO', cursoId: null, presencas: 0, historico: comEvento(inscrito.historico, `Turma cancelada: ${texto}`, userId) as any },
      });
      await noteProtocolFromApp({
        protocolId: inscrito.protocolId,
        app: APP,
        actorId: userId,
        message: `A turma do curso "${curso.nome}" foi cancelada: ${texto}. A sua inscrição continua valendo para a próxima turma.`,
      });
    }
    await prisma.cursoMunicipal.update({ where: { id }, data: { status: 'CANCELADO' } });
    return { afetados: afetados.length };
  }

  // -------------------------------------------------------------- inscrições
  async listInscricoes(scope: AppScope, filters: { status?: string; cursoId?: string; esperando?: boolean }) {
    const itens = await prisma.inscricaoCurso.findMany({
      where: {
        ...scopeWhere(scope),
        ...(filters.cursoId ? { cursoId: filters.cursoId } : {}),
        ...(filters.esperando ? { status: { in: ESPERANDO } } : filters.status ? { status: filters.status } : {}),
      },
      include: { curso: { select: { id: true, nome: true, totalAulas: true, frequenciaMinima: true, status: true } } },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    });
    const numeros = await numerosDosPedidos(itens.map((i) => i.protocolId));
    return itens.map((i) => ({ ...i, protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  /** Inscrição feita no balcão (sem pedido do portal). */
  async createInscricao(scope: AppScope, data: any, userId?: string) {
    const nome = String(data?.nome || '').trim();
    if (!nome) throw new Error('Informe o nome');
    const curso = data?.cursoId ? await this.curso(data.cursoId, scope) : null;
    const criada = await prisma.inscricaoCurso.create({
      data: {
        departmentCode: curso?.departmentCode || pickDepartment(scope, CURSOS_DEPARTMENTS, data?.departmentCode),
        interesse: curso?.nome || String(data?.interesse || '').trim() || 'Curso',
        nome,
        telefone: data?.telefone || null,
        escolaridade: data?.escolaridade || null,
        historico: comEvento(null, 'Inscrição feita no balcão', userId) as any,
      },
    });
    return curso ? this.colocarNaTurma(criada.id, curso.id, scope, userId || '') : criada;
  }

  /** Põe na turma; sem vaga, vai para a lista de espera dela. */
  async colocarNaTurma(inscricaoId: string, cursoId: string, scope: AppScope, userId: string) {
    const inscricao = await this.inscricao(inscricaoId, scope);
    if (!ESPERANDO.includes(inscricao.status)) throw new Error('Esta inscrição já foi encerrada ou já está numa turma');
    const curso = await this.curso(cursoId, scope);
    if (!['INSCRICOES', 'EM_ANDAMENTO'].includes(curso.status)) throw new Error('Este curso não está recebendo inscrições');
    const temVaga = (await this.ocupadas(cursoId)) < curso.vagas;
    const atualizada = await prisma.inscricaoCurso.update({
      where: { id: inscricaoId },
      data: {
        cursoId,
        status: temVaga ? 'INSCRITO' : 'LISTA_ESPERA',
        historico: comEvento(inscricao.historico, temVaga ? `Inscrito em "${curso.nome}"` : `Lista de espera de "${curso.nome}"`, userId) as any,
      },
    });
    if (temVaga) {
      await markProtocolInProgressFromApp({
        protocolId: inscricao.protocolId,
        app: APP,
        actorId: userId,
        message: `A sua vaga no curso "${curso.nome}" está garantida. ${detalhesDoCurso(curso)}`.trim(),
      });
    } else {
      const posicao = await prisma.inscricaoCurso.count({ where: { cursoId, status: 'LISTA_ESPERA', createdAt: { lte: inscricao.createdAt } } });
      await markProtocolInProgressFromApp({
        protocolId: inscricao.protocolId,
        app: APP,
        actorId: userId,
        message: `As vagas do curso "${curso.nome}" acabaram. Você está na lista de espera (posição ${posicao}) e será avisado se abrir vaga.`,
      });
    }
    return atualizada;
  }

  async lancarFrequencia(inscricaoId: string, scope: AppScope, presencas: number) {
    const inscricao = await this.inscricao(inscricaoId, scope);
    if (inscricao.status !== 'INSCRITO') throw new Error('Só dá para lançar frequência de quem está na turma');
    const total = inscricao.curso?.totalAulas || 0;
    const valor = Math.max(0, Math.round(Number(presencas) || 0));
    if (total > 0 && valor > total) throw new Error(`O curso tem ${total} aulas`);
    return prisma.inscricaoCurso.update({ where: { id: inscricaoId }, data: { presencas: valor } });
  }

  /** Recusar (não atende ao público do curso) ou desistência — encerra o pedido; a vaga vai para o primeiro da espera. */
  async encerrarInscricao(inscricaoId: string, scope: AppScope, userId: string, data: { tipo: 'RECUSADA' | 'DESISTIU'; mensagem: string }) {
    const inscricao = await this.inscricao(inscricaoId, scope);
    if (!['AGUARDANDO', 'LISTA_ESPERA', 'INSCRITO'].includes(inscricao.status)) throw new Error('Esta inscrição já foi encerrada');
    const texto = String(data.mensagem || '').trim();
    if (!texto) throw new Error('Escreva a resposta para o cidadão');
    const status = data.tipo === 'DESISTIU' ? 'DESISTIU' : 'RECUSADA';
    await prisma.inscricaoCurso.update({
      where: { id: inscricaoId },
      data: { status, encerradoEm: new Date(), historico: comEvento(inscricao.historico, `${status === 'DESISTIU' ? 'Desistiu' : 'Recusada'}: ${texto}`, userId) as any },
    });
    await concludeProtocolFromApp({ protocolId: inscricao.protocolId, app: APP, actorId: userId, message: texto, outcome: 'INDEFERIDO' });

    let chamado: string | null = null;
    if (inscricao.status === 'INSCRITO' && inscricao.cursoId && inscricao.curso) {
      const proximo = await prisma.inscricaoCurso.findFirst({ where: { cursoId: inscricao.cursoId, status: 'LISTA_ESPERA' }, orderBy: { createdAt: 'asc' } });
      if (proximo) {
        await prisma.inscricaoCurso.update({
          where: { id: proximo.id },
          data: { status: 'INSCRITO', historico: comEvento(proximo.historico, `Chamado da lista de espera para "${inscricao.curso.nome}"`, userId) as any },
        });
        await noteProtocolFromApp({
          protocolId: proximo.protocolId,
          app: APP,
          actorId: userId,
          message: `Abriu vaga! Você saiu da lista de espera e está inscrito no curso "${inscricao.curso.nome}". ${detalhesDoCurso(inscricao.curso)}`.trim(),
        });
        chamado = proximo.nome;
      }
    }
    return { ok: true, chamadoDaEspera: chamado };
  }

  async stats(scope: AppScope) {
    const escopo = scopeWhere(scope);
    const [aguardando, espera, cursosAbertos, concluiram] = await Promise.all([
      prisma.inscricaoCurso.count({ where: { ...escopo, status: 'AGUARDANDO' } }),
      prisma.inscricaoCurso.count({ where: { ...escopo, status: 'LISTA_ESPERA' } }),
      prisma.cursoMunicipal.count({ where: { ...escopo, status: { in: ['INSCRICOES', 'EM_ANDAMENTO'] } } }),
      prisma.inscricaoCurso.count({ where: { ...escopo, status: 'CONCLUIU' } }),
    ]);
    return { aguardando, espera, cursosAbertos, concluiram };
  }
}

export default new CursosService();
