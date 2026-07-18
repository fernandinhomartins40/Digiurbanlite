import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Escolinhas & Espaços Esportivos (Fase 2, blueprints B5 + B6 + B3-lite)
 * — Secretaria de Esportes.
 *
 * B6 Escolinhas: turma (modalidade/vagas/horários) ← matrícula (de protocolo
 * ou manual; INSCRITA → MATRICULADA com controle de vagas | LISTA_ESPERA) +
 * frequência por aula (1 registro por turma+dia, presentes = matriculaIds).
 * B5 Reservas: reaproveita EspacoPublico; confirmação detecta conflito de
 * horário com reservas já confirmadas no mesmo espaço/dia.
 * Competições: cadastro + inscrições (confirmação simples).
 * B3-lite Empréstimos: solicitação → emprestado → devolvido.
 * Desfechos que atendem o pedido concluem o protocolo de origem (NÃO-FATAL).
 */

const MODALIDADES = [
  'FUTEBOL',
  'BASQUETE',
  'VOLEI',
  'NATACAO',
  'JUDO',
  'CAPOEIRA',
  'GINASTICA',
  'OUTRA',
];

class EsportesService {
  // ------------------------------------------------------------------ turmas

  async listTurmas(incluirInativas = false) {
    const turmas = await prisma.turmaEscolinha.findMany({
      where: incluirInativas ? {} : { isActive: true },
      include: { _count: { select: { matriculas: { where: { status: 'MATRICULADA' } } } } },
      orderBy: [{ modalidade: 'asc' }, { nome: 'asc' }],
    });
    const espacoIds = Array.from(new Set(turmas.map((t) => t.espacoId).filter(Boolean))) as string[];
    const espacos = espacoIds.length
      ? await prisma.espacoPublico.findMany({
          where: { id: { in: espacoIds } },
          select: { id: true, nome: true },
        })
      : [];
    const espacoPorId = new Map(espacos.map((e) => [e.id, e]));
    return turmas.map((t) => ({
      ...t,
      matriculados: t._count.matriculas,
      espaco: t.espacoId ? espacoPorId.get(t.espacoId) || null : null,
    }));
  }

  async createTurma(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    if (!data?.modalidade || !MODALIDADES.includes(data.modalidade)) {
      throw new Error(`modalidade é obrigatória (${MODALIDADES.join(', ')})`);
    }
    const jaExiste = await prisma.turmaEscolinha.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe turma "${data.nome}"`);
    return prisma.turmaEscolinha.create({
      data: {
        nome: data.nome,
        modalidade: data.modalidade,
        faixaEtaria: data.faixaEtaria,
        professor: data.professor,
        espacoId: data.espacoId,
        diasHorarios: data.diasHorarios,
        vagas: data.vagas != null ? Number(data.vagas) : null,
      },
    });
  }

  async updateTurma(id: string, data: any) {
    const turma = await prisma.turmaEscolinha.findFirst({ where: { id } });
    if (!turma) throw new Error('Turma não encontrada');
    return prisma.turmaEscolinha.update({
      where: { id: turma.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.modalidade && MODALIDADES.includes(data.modalidade)
          ? { modalidade: data.modalidade }
          : {}),
        ...(data.faixaEtaria !== undefined ? { faixaEtaria: data.faixaEtaria } : {}),
        ...(data.professor !== undefined ? { professor: data.professor } : {}),
        ...(data.espacoId !== undefined ? { espacoId: data.espacoId || null } : {}),
        ...(data.diasHorarios !== undefined ? { diasHorarios: data.diasHorarios } : {}),
        ...(data.vagas !== undefined ? { vagas: data.vagas != null ? Number(data.vagas) : null } : {}),
        ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
      },
    });
  }

  // -------------------------------------------------------------- matrículas

  async listMatriculas(filters?: { turmaId?: string; status?: string; busca?: string }) {
    return prisma.matriculaEscolinha.findMany({
      where: {
        ...(filters?.turmaId ? { turmaId: filters.turmaId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { nomeAluno: { contains: filters.busca, mode: 'insensitive' as const } },
                { responsavelNome: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { turma: { select: { id: true, nome: true, modalidade: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createMatricula(data: any) {
    return prisma.matriculaEscolinha.create({
      data: {
        protocolId: data.protocolId,
        turmaId: data.turmaId,
        modalidadePretendida: data.modalidadePretendida,
        nomeAluno: data.nomeAluno,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        responsavelNome: data.responsavelNome,
        telefone: data.telefone,
        citizenId: data.citizenId,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  private async vagasDisponiveis(turmaId: string) {
    const turma = await prisma.turmaEscolinha.findFirst({ where: { id: turmaId } });
    if (!turma) throw new Error('Turma não encontrada');
    if (turma.vagas == null) return { turma, disponiveis: null };
    const ocupadas = await prisma.matriculaEscolinha.count({
      where: { turmaId, status: 'MATRICULADA' },
    });
    return { turma, disponiveis: turma.vagas - ocupadas };
  }

  /** Matricula na turma respeitando vagas; sem vaga vai para LISTA_ESPERA. */
  async matricular(matriculaId: string, turmaId: string) {
    const matricula = await prisma.matriculaEscolinha.findFirst({ where: { id: matriculaId } });
    if (!matricula) throw new Error('Matrícula não encontrada');
    if (['CANCELADA', 'DESLIGADA'].includes(matricula.status)) {
      throw new Error('Matrícula encerrada');
    }
    const { disponiveis } = await this.vagasDisponiveis(turmaId);
    const semVaga = disponiveis != null && disponiveis <= 0;
    const atualizada = await prisma.matriculaEscolinha.update({
      where: { id: matricula.id },
      data: { turmaId, status: semVaga ? 'LISTA_ESPERA' : 'MATRICULADA' },
    });
    if (!semVaga) {
      await this.concluirProtocolo(atualizada.protocolId, 'Aluno matriculado');
    }
    return atualizada;
  }

  async atualizarMatricula(id: string, data: any) {
    const matricula = await prisma.matriculaEscolinha.findFirst({ where: { id } });
    if (!matricula) throw new Error('Matrícula não encontrada');
    return prisma.matriculaEscolinha.update({
      where: { id: matricula.id },
      data: {
        ...(data.nomeAluno !== undefined ? { nomeAluno: data.nomeAluno } : {}),
        ...(data.responsavelNome !== undefined ? { responsavelNome: data.responsavelNome } : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
        ...(data.status && ['DESLIGADA', 'CANCELADA'].includes(data.status)
          ? { status: data.status }
          : {}),
      },
    });
  }

  // -------------------------------------------------------------- frequência

  /** Registra (ou substitui) a chamada de uma turma num dia. */
  async registrarFrequencia(
    turmaId: string,
    params: { data: string; presentes: string[]; registradoPor?: string }
  ) {
    const turma = await prisma.turmaEscolinha.findFirst({ where: { id: turmaId } });
    if (!turma) throw new Error('Turma não encontrada');
    if (!params?.data) throw new Error('data é obrigatória');
    const dia = new Date(`${params.data}T00:00:00.000Z`);
    const presentes = Array.isArray(params.presentes) ? params.presentes.map(String) : [];
    const existente = await prisma.frequenciaEscolinha.findFirst({
      where: { turmaId, data: dia },
    });
    if (existente) {
      return prisma.frequenciaEscolinha.update({
        where: { id: existente.id },
        data: { presentes, registradoPor: params.registradoPor },
      });
    }
    return prisma.frequenciaEscolinha.create({
      data: { turmaId, data: dia, presentes, registradoPor: params.registradoPor },
    });
  }

  async listFrequencias(turmaId: string) {
    return prisma.frequenciaEscolinha.findMany({
      where: { turmaId },
      orderBy: { data: 'desc' },
      take: 60,
    });
  }

  // ------------------------------------------------------------------ espaços

  async listEspacos() {
    return prisma.espacoPublico.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
  }

  // ----------------------------------------------------------------- reservas

  async listReservas(filters?: { espacoId?: string; status?: string; data?: string }) {
    const reservas = await prisma.reservaEspaco.findMany({
      where: {
        area: 'ESPORTES',
        ...(filters?.espacoId ? { espacoId: filters.espacoId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.data ? { data: new Date(`${filters.data}T00:00:00.000Z`) } : {}),
      },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      take: 500,
    });
    const espacoIds = Array.from(new Set(reservas.map((r) => r.espacoId).filter(Boolean))) as string[];
    const espacos = espacoIds.length
      ? await prisma.espacoPublico.findMany({
          where: { id: { in: espacoIds } },
          select: { id: true, nome: true },
        })
      : [];
    const espacoPorId = new Map(espacos.map((e) => [e.id, e]));
    return reservas.map((r) => ({
      ...r,
      espaco: r.espacoId ? espacoPorId.get(r.espacoId) || null : null,
    }));
  }

  async createReserva(data: any) {
    return prisma.reservaEspaco.create({
      data: {
        protocolId: data.protocolId,
        area: 'ESPORTES',
        espacoId: data.espacoId,
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        data: data.data ? new Date(`${String(data.data).slice(0, 10)}T00:00:00.000Z`) : null,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        finalidade: data.finalidade,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async atualizarReserva(id: string, data: any) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id } });
    if (!reserva) throw new Error('Reserva não encontrada');
    if (['RECUSADA', 'CANCELADA'].includes(reserva.status)) throw new Error('Reserva encerrada');
    return prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: {
        ...(data.espacoId !== undefined ? { espacoId: data.espacoId || null } : {}),
        ...(data.data !== undefined
          ? { data: data.data ? new Date(`${String(data.data).slice(0, 10)}T00:00:00.000Z`) : null }
          : {}),
        ...(data.horaInicio !== undefined ? { horaInicio: data.horaInicio } : {}),
        ...(data.horaFim !== undefined ? { horaFim: data.horaFim } : {}),
        ...(data.finalidade !== undefined ? { finalidade: data.finalidade } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  /** Confirma reserva, recusando conflito de horário no mesmo espaço/dia. */
  async confirmarReserva(id: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id } });
    if (!reserva) throw new Error('Reserva não encontrada');
    if (reserva.status !== 'SOLICITADA') throw new Error('Somente reservas solicitadas podem ser confirmadas');
    if (!reserva.espacoId || !reserva.data || !reserva.horaInicio || !reserva.horaFim) {
      throw new Error('Defina espaço, data e horário antes de confirmar');
    }
    const confirmadas = await prisma.reservaEspaco.findMany({
      where: { espacoId: reserva.espacoId, data: reserva.data, status: 'CONFIRMADA' },
      select: { id: true, horaInicio: true, horaFim: true },
    });
    const conflito = confirmadas.find(
      (c) =>
        c.horaInicio &&
        c.horaFim &&
        reserva.horaInicio! < c.horaFim &&
        c.horaInicio < reserva.horaFim!
    );
    if (conflito) {
      throw new Error(
        `Conflito de horário: já existe reserva confirmada ${conflito.horaInicio}-${conflito.horaFim} neste espaço`
      );
    }
    const atualizada = await prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'CONFIRMADA' },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Reserva confirmada');
    return atualizada;
  }

  async recusarReserva(id: string, motivo?: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id } });
    if (!reserva) throw new Error('Reserva não encontrada');
    const atualizada = await prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'RECUSADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Reserva recusada');
    return atualizada;
  }

  async cancelarReserva(id: string, motivo?: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id } });
    if (!reserva) throw new Error('Reserva não encontrada');
    return prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'CANCELADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  // -------------------------------------------------------------- competições

  async listCompeticoes() {
    const competicoes = await prisma.competicao.findMany({
      include: { _count: { select: { inscricoes: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return competicoes.map((c) => ({ ...c, totalInscricoes: c._count.inscricoes }));
  }

  async createCompeticao(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    const jaExiste = await prisma.competicao.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe competição "${data.nome}"`);
    return prisma.competicao.create({
      data: {
        nome: data.nome,
        modalidade: data.modalidade,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        local: data.local,
        descricao: data.descricao,
      },
    });
  }

  async atualizarCompeticao(id: string, data: any) {
    const competicao = await prisma.competicao.findFirst({ where: { id } });
    if (!competicao) throw new Error('Competição não encontrada');
    return prisma.competicao.update({
      where: { id: competicao.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.modalidade !== undefined ? { modalidade: data.modalidade } : {}),
        ...(data.local !== undefined ? { local: data.local } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.status &&
        ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'ENCERRADA', 'CANCELADA'].includes(data.status)
          ? { status: data.status }
          : {}),
      },
    });
  }

  async listInscricoesCompeticao(filters?: { competicaoId?: string; status?: string }) {
    return prisma.inscricaoCompeticao.findMany({
      where: {
        ...(filters?.competicaoId ? { competicaoId: filters.competicaoId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: { competicao: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createInscricaoCompeticao(data: any) {
    return prisma.inscricaoCompeticao.create({
      data: {
        protocolId: data.protocolId,
        competicaoId: data.competicaoId,
        participante: data.participante,
        categoria: data.categoria,
        citizenId: data.citizenId,
        telefone: data.telefone,
        dados: data.dados,
      },
    });
  }

  /** Confirma inscrição (vinculando à competição, se informada) e conclui o protocolo. */
  async confirmarInscricaoCompeticao(id: string, competicaoId?: string) {
    const inscricao = await prisma.inscricaoCompeticao.findFirst({ where: { id } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (inscricao.status === 'CANCELADA') throw new Error('Inscrição cancelada');
    if (!inscricao.competicaoId && !competicaoId) {
      throw new Error('Vincule a inscrição a uma competição antes de confirmar');
    }
    const atualizada = await prisma.inscricaoCompeticao.update({
      where: { id: inscricao.id },
      data: { status: 'CONFIRMADA', ...(competicaoId ? { competicaoId } : {}) },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Inscrição confirmada');
    return atualizada;
  }

  async cancelarInscricaoCompeticao(id: string) {
    const inscricao = await prisma.inscricaoCompeticao.findFirst({ where: { id } });
    if (!inscricao) throw new Error('Inscrição não encontrada');
    return prisma.inscricaoCompeticao.update({
      where: { id: inscricao.id },
      data: { status: 'CANCELADA' },
    });
  }

  // -------------------------------------------------------------- empréstimos

  async listEmprestimos(filters?: { status?: string }) {
    return prisma.emprestimoMaterial.findMany({
      where: { ...(filters?.status ? { status: filters.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async createEmprestimo(data: any) {
    return prisma.emprestimoMaterial.create({
      data: {
        protocolId: data.protocolId,
        item: data.item,
        quantidade: data.quantidade != null ? Number(data.quantidade) : 1,
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        telefone: data.telefone,
        dataPrevistaDevolucao: data.dataPrevistaDevolucao
          ? new Date(data.dataPrevistaDevolucao)
          : null,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async emprestar(id: string, dataPrevistaDevolucao?: string) {
    const emprestimo = await prisma.emprestimoMaterial.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    if (emprestimo.status !== 'SOLICITADO') throw new Error('Somente solicitações podem ser emprestadas');
    return prisma.emprestimoMaterial.update({
      where: { id: emprestimo.id },
      data: {
        status: 'EMPRESTADO',
        dataEmprestimo: new Date(),
        ...(dataPrevistaDevolucao
          ? { dataPrevistaDevolucao: new Date(dataPrevistaDevolucao) }
          : {}),
      },
    });
  }

  async devolver(id: string) {
    const emprestimo = await prisma.emprestimoMaterial.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    if (emprestimo.status !== 'EMPRESTADO') throw new Error('Material não está emprestado');
    const atualizado = await prisma.emprestimoMaterial.update({
      where: { id: emprestimo.id },
      data: { status: 'DEVOLVIDO', dataDevolucao: new Date() },
    });
    await this.concluirProtocolo(atualizado.protocolId, 'Material devolvido');
    return atualizado;
  }

  async cancelarEmprestimo(id: string, motivo?: string) {
    const emprestimo = await prisma.emprestimoMaterial.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    return prisma.emprestimoMaterial.update({
      where: { id: emprestimo.id },
      data: { status: 'CANCELADO', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  // -------------------------------------------------------------------- geral

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(protocolId: string | null | undefined, motivo: string) {
    if (!protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(`Esportes: falha ao concluir protocolo ${protocolId} (não-fatal) — ${motivo}`, error);
    }
  }

  async getStatistics() {
    const hoje = new Date();
    const inicioDia = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
    const [matriculados, aguardando, reservasPendentes, reservasHoje, emprestados, competicoesAbertas] =
      await Promise.all([
        prisma.matriculaEscolinha.count({ where: { status: 'MATRICULADA' } }),
        prisma.matriculaEscolinha.count({ where: { status: { in: ['INSCRITA', 'LISTA_ESPERA'] } } }),
        prisma.reservaEspaco.count({ where: { area: 'ESPORTES', status: 'SOLICITADA' } }),
        prisma.reservaEspaco.count({
          where: { area: 'ESPORTES', status: 'CONFIRMADA', data: { gte: inicioDia } },
        }),
        prisma.emprestimoMaterial.count({ where: { status: 'EMPRESTADO' } }),
        prisma.competicao.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
      ]);
    return {
      alunosMatriculados: matriculados,
      inscricoesAguardando: aguardando,
      reservasPendentes,
      reservasConfirmadasFuturas: reservasHoje,
      materiaisEmprestados: emprestados,
      competicoesComInscricoesAbertas: competicoesAbertas,
    };
  }
}

export default new EsportesService();
