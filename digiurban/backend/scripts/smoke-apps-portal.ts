/**
 * Smoke "pedido do portal → app → volta ao pedido" (requer banco).
 *
 *   DATABASE_URL=... JWT_SECRET=... npx tsx scripts/smoke-apps-portal.ts
 *
 * Cria um município efêmero, abre um pedido de cada tipo da Fase 1 da
 * auditoria de 2026-10-08 (matrícula, transporte escolar, benefício social,
 * renovação de credencial, consulta, remédio), confere que cada um virou caso
 * no app e que a decisão da equipe encerra o pedido. Apaga tudo no fim.
 */
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import { convertProtocolToAppOnCreate } from '../src/services/apps/protocol-to-app.service';
import {
  alteracaoCredencialQueue,
  pedidoConsultaQueue,
  pedidoMedicamentoQueue,
  transporteEscolarQueue,
} from '../src/services/apps/portal-queues.service';
import matriculaService from '../src/services/matricula/matricula.service';
import programaSocialService from '../src/services/programa-social/programa-social.service';
import { odontoService, preNatalService, visitaDomiciliarService } from '../src/services/saude/cuidado.service';
import atividadeColetivaService from '../src/services/saude/atividade-coletiva.service';

const STAMP = Date.now();
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ✅ ${label}`);
  else {
    failures++;
    console.log(`  ❌ ${label}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

async function main() {
  const tenant = await runAsPlatform(() =>
    prisma.tenant.create({
      data: {
        slug: `smoke-apps-${STAMP}`,
        nome: 'Smoke Apps',
        cnpj: `${String(STAMP).slice(-8, -6)}.${String(STAMP).slice(-6, -3)}.${String(STAMP).slice(-3)}/0008-${String(STAMP).slice(-2)}`,
        nomeMunicipio: 'Smoke Apps',
        ufMunicipio: 'PR',
        status: 'ACTIVE',
      },
    })
  );

  try {
    await runAsTenant(tenant.id, async () => scenario());
  } finally {
    await runAsPlatform(async () => {
      const where = { tenantId: tenant.id };
      const tables = [
        'encaminhamentoEmprego', 'vagaEmprego', 'curriculoTrabalhador', 'servicoMecanizacao', 'maquinaAgricola', 'ocorrenciaSeguranca', 'prestadorTuristico', 'eventoTuristico',
        'participanteAtividade', 'atividadeColetiva', 'visitaDomiciliar', 'examePreNatal', 'consultaPreNatal', 'acompanhamentoPreNatal',
        'procedimentoOdonto', 'atendimentoOdontologico', 'atendimentoMedico', 'filaAtendimento', 'unidadeSaude',
        'solicitacaoAssistenciaTecnica', 'produtorRural', 'matricula', 'inscricaoMatricula', 'solicitacaoTransporteEscolar', 'alunoRota', 'rotaEscolar', 'veiculoEscolar',
        'inscricaoProgramaSocial', 'programaSocial', 'alteracaoCredencial', 'credencialTransporte',
        'solicitacaoConsulta', 'solicitacaoMedicamento', 'turma', 'unidadeEducacao', 'workflowInstance', 'workflowDefinition',
        'notification', 'familyComposition', 'protocolSimplified', 'serviceSimplified', 'citizen', 'user', 'department',
      ];
      for (const table of tables) {
        await (prisma as any)[table]?.deleteMany({ where }).catch(() => undefined);
      }
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch((e) => console.warn('limpeza:', e.message));
    });
  }
}

async function scenario() {
  const dept = await prisma.department.create({ data: { name: `Geral ${STAMP}`, code: `GERAL_${STAMP}` } as any });
  const user = await prisma.user.create({
    data: { name: 'Servidor Smoke', email: `s-${STAMP}@t.local`, password: 'x', role: 'ADMIN', departmentId: dept.id, isActive: true } as any,
  });
  const cpf = (n: number) => String(STAMP + n).slice(-11).padStart(11, '0');
  const citizen = await prisma.citizen.create({
    data: { name: 'Maria Responsável', cpf: cpf(1), email: `c-${STAMP}@t.local`, password: 'x' } as any,
  });
  const filho = await prisma.citizen.create({
    data: { name: 'João Aluno da Silva', cpf: cpf(2), email: '', password: 'x', birthDate: new Date('2018-03-10') } as any,
  });
  await prisma.familyComposition.create({
    data: { headId: citizen.id, memberId: filho.id, relationship: 'SON', isDependent: true, status: 'ACTIVE' } as any,
  });
  const service = await prisma.serviceSimplified.create({
    data: { name: 'Serviço smoke', departmentId: dept.id, serviceType: 'COM_DADOS', estimatedDays: 10 } as any,
  });

  let seq = 0;
  const open = async (action: string, customData: Record<string, unknown>, citizenId: string = citizen.id) => {
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: `SMKAPP-${STAMP}-${++seq}`,
        title: action,
        citizenId,
        serviceId: service.id,
        departmentId: dept.id,
        status: 'VINCULADO',
        customData,
      } as any,
    });
    await convertProtocolToAppOnCreate({ ...protocol, moduleType: action } as any);
    return protocol;
  };
  const statusOf = async (id: string) =>
    (await prisma.protocolSimplified.findFirst({ where: { id }, select: { status: true } }))?.status;

  // ---------------------------------------------------------------- matrícula
  console.log('\nMatrícula escolar');
  const escola = await prisma.unidadeEducacao.create({
    data: { nome: 'Escola Municipal Smoke', tipo: 'Escola', endereco: 'Rua A, 1', isActive: true } as any,
  }).catch(async (e) => {
    console.log('   (unidade com campos mínimos falhou, tentando listar exigências)', e.message.split('\n').slice(-3).join(' '));
    throw e;
  });
  const turma = await prisma.turma.create({
    data: {
      unidadeEducacaoId: escola.id, nome: '1º A', codigo: `1A-${STAMP}`, serie: '1º Ano', turno: 'MATUTINO',
      ano: new Date().getFullYear(), capacidade: 30, vagasOcupadas: 0, vagasDisponiveis: 30, isActive: true,
    } as any,
  });
  const pMat = await open('MATRICULA_ESCOLAR', {
    nomeAluno: 'joão aluno da silva', dataNascimentoAluno: '2018-03-10', sexoAluno: 'Masculino', grauParentesco: 'Mãe',
    escolaPreferencial: 'escola municipal smoke', serie: '1º Ano', turnoDesejado: 'Matutino',
  });
  const insc = await prisma.inscricaoMatricula.findFirst({ where: { protocolId: pMat.id } });
  check('pedido virou inscrição de matrícula', !!insc);
  check('aluno achado na família do responsável', insc?.alunoId === filho.id, insc?.alunoId);
  check('escola preferida reconhecida pelo nome', insc?.escolaPreferencia1 === escola.id, insc?.escolaPreferencia1);
  check('turno traduzido', insc?.turno === 'MATUTINO', insc?.turno);
  if (insc) {
    await matriculaService.validarDocumentos({ inscricaoId: insc.id, validadorId: user.id, aprovado: true });
    check('validar documentos tira o pedido de "vinculado"', (await statusOf(pMat.id)) === 'PROGRESSO', await statusOf(pMat.id));
    const recado = await prisma.protocolInteraction.findFirst({ where: { protocolId: pMat.id, isInternal: false } });
    check('cidadão recebe o recado no pedido', !!recado?.message?.includes('Documentos conferidos'), recado?.message);
    await matriculaService.atribuirVaga({ inscricaoId: insc.id, turmaId: turma.id, gestorId: user.id });
    const mat = await matriculaService.confirmarMatricula({ inscricaoId: insc.id, responsavelId: user.id, dataInicio: new Date() });
    check('matrícula criada', !!mat?.numeroMatricula);
    check('confirmar matrícula conclui o pedido', (await statusOf(pMat.id)) === 'CONCLUIDO', await statusOf(pMat.id));
  }

  const pMat2 = await open('MATRICULA_ESCOLAR', {
    nomeAluno: 'Criança Sem Cadastro', dataNascimentoAluno: '2019-01-01', serie: 'Pré II', turnoDesejado: 'Tanto faz', escolaPreferencial: 'Outra escola',
  });
  const insc2 = await prisma.inscricaoMatricula.findFirst({ where: { protocolId: pMat2.id } });
  check('aluno sem cadastro: inscrição entra mesmo assim, com o nome', !!insc2 && !insc2.alunoId && insc2.nomeAluno === 'Criança Sem Cadastro', insc2);
  if (insc2) {
    await matriculaService.indeferir(insc2.id, user.id, 'Fora da idade para a série');
    check('recusar a inscrição conclui o pedido', (await statusOf(pMat2.id)) === 'CONCLUIDO', await statusOf(pMat2.id));
  }

  // -------------------------------------------------------- transporte escolar
  console.log('\nTransporte escolar');
  const pTr = await open('TRANSPORTE_ESCOLAR', {
    nomeAluno: 'João Aluno da Silva', unidadeEscolar: 'Escola Municipal Smoke', serie: '1º Ano', turno: 'Matutino',
    enderecoEmbarque: 'Estrada do Sítio, km 4', distanciaEscola: 7.5,
  });
  const ped = await prisma.solicitacaoTransporteEscolar.findFirst({ where: { protocolId: pTr.id } });
  check('pedido entrou na fila do transporte', !!ped && ped.alunoId === filho.id && ped.distanciaKm === 7.5, ped);
  const veiculo = await prisma.veiculoEscolar.create({
    data: { placa: `SMK${String(STAMP).slice(-4)}`, modelo: 'Ônibus', capacidade: 40, status: 'DISPONIVEL' } as any,
  });
  const rota = await prisma.rotaEscolar.create({
    data: { nome: 'Rota Sítio', veiculoId: veiculo.id, motoristaId: user.id, turno: 'MATUTINO', horarioSaida: '06:30', horarioRetorno: '12:10', pontos: [] } as any,
  });
  if (ped) {
    await transporteEscolarQueue.atender(ped.id, user.id, { rotaId: rota.id });
    check('aluno colocado na rota', !!(await prisma.alunoRota.findFirst({ where: { rotaId: rota.id, alunoId: filho.id } })));
    check('atender conclui o pedido', (await statusOf(pTr.id)) === 'CONCLUIDO', await statusOf(pTr.id));
  }

  // ---------------------------------------------------------- benefício social
  console.log('\nAssistência Social');
  const programa = await prisma.programaSocial.create({ data: { nome: 'Cesta Básica', isActive: true } as any });
  const pBen = await open('CESTA_BASICA', { quantidadePessoasFamilia: 4, motivoSolicitacao: 'Desemprego', situacaoEmergencial: 'Desemprego' });
  const ben = await prisma.inscricaoProgramaSocial.findFirst({ where: { protocolId: pBen.id } });
  check('pedido virou inscrição no programa', !!ben && ben.programaId === programa.id && ben.tipoSolicitado === 'Cesta Básica', ben);
  check('sem família no CadÚnico a inscrição entra mesmo assim', !!ben && ben.familiaId === null);
  if (ben) {
    await programaSocialService.analisarInscricao({ inscricaoId: ben.id, analistaId: user.id, aprovado: true });
    await programaSocialService.aprovarInscricao({ inscricaoId: ben.id, gestorId: user.id, dataInicio: new Date() });
    check('liberar o benefício conclui o pedido', (await statusOf(pBen.id)) === 'CONCLUIDO', await statusOf(pBen.id));
  }

  // ---------------------------------------------------------------- credencial
  console.log('\nCredencial (renovação)');
  const cred = await prisma.credencialTransporte.create({
    data: { tipo: 'TAXI', titularNome: citizen.name, citizenId: citizen.id, veiculoPlaca: 'ABC1D23', status: 'ATIVA', numeroCredencial: `CRD-${STAMP}`, validade: new Date() } as any,
  });
  const pRen = await open('RENOVACAO_CREDENCIAMENTO', { numeroCredencial: `CRD-${STAMP}`, tipoCredencial: 'Táxi', placaVeiculo: 'ABC1D23' });
  const alt = await prisma.alteracaoCredencial.findFirst({ where: { protocolId: pRen.id } });
  check('pedido achou a credencial pelo número', alt?.credencialId === cred.id && alt?.tipo === 'RENOVACAO', alt);
  if (alt) {
    await alteracaoCredencialQueue.aprovar(alt.id, user.id, {});
    const renovada = await prisma.credencialTransporte.findFirst({ where: { id: cred.id } });
    check('validade renovada', !!renovada?.validade && renovada.validade.getTime() > Date.now() + 300 * 86400000);
    check('aprovar conclui o pedido', (await statusOf(pRen.id)) === 'CONCLUIDO', await statusOf(pRen.id));
  }

  // ------------------------------------------------------------------ consulta
  console.log('\nPedido de consulta');
  const pCon = await open('AGENDAMENTO_CONSULTA', { cartaoSUS: '123456789012345', especialidade: 'Pediatria', unidadeSaude: 'UBS Centro' });
  const con = await prisma.solicitacaoConsulta.findFirst({ where: { protocolId: pCon.id } });
  check('pedido entrou na fila de consultas', con?.especialidade === 'Pediatria' && con?.status === 'PENDENTE', con);
  if (con) {
    await pedidoConsultaQueue.recusar(con.id, user.id, 'Sem agenda de pediatria este mês');
    check('recusar conclui o pedido', (await statusOf(pCon.id)) === 'CONCLUIDO', await statusOf(pCon.id));
  }

  // -------------------------------------------------------------------- remédio
  console.log('\nPedido de remédio');
  const pMed = await open('CONTROLE_MEDICAMENTOS', { cartaoSUS: '123456789012345', medicamento: 'Losartana', dosagem: '50 mg', usoContinuo: true });
  const med = await prisma.solicitacaoMedicamento.findFirst({ where: { protocolId: pMed.id } });
  check('pedido entrou na fila da farmácia', med?.medicamento === 'Losartana' && med?.usoContinuo === true && med?.altoCusto === false, med);
  if (med) {
    await pedidoMedicamentoQueue.aguardarEstoque(med.id, user.id, 'chega na sexta');
    check('"em falta" avisa e mantém o pedido aberto', (await statusOf(pMed.id)) === 'PROGRESSO', await statusOf(pMed.id));
    await pedidoMedicamentoQueue.marcarEntregue(med.id, user.id);
    check('entregar conclui o pedido', (await statusOf(pMed.id)) === 'CONCLUIDO', await statusOf(pMed.id));
  }

  // ------------------------------------- pedido aberto no nome do dependente
  console.log('\nMatrícula pedida no nome da criança');
  const pDep = await open('MATRICULA_ESCOLAR', { serie: '2º Ano', turnoDesejado: 'Vespertino' }, filho.id);
  const inscDep = await prisma.inscricaoMatricula.findFirst({ where: { protocolId: pDep.id } });
  check('aluno = a criança, responsável = chefe da família', inscDep?.alunoId === filho.id && inscDep?.responsavelId === citizen.id, inscDep);

  // ------------------------------------------- assistência técnica sem cadastro
  console.log('\nAssistência técnica rural (sem cadastro de produtor)');
  const servicoAt = await prisma.serviceSimplified.create({
    data: { name: 'Assistência Técnica smoke', departmentId: dept.id, serviceType: 'COM_DADOS', estimatedDays: 10, destination: 'APP', appAction: 'ASSISTENCIA_TECNICA' } as any,
  });
  const pAt = await prisma.protocolSimplified.create({
    data: { number: `SMKAPP-${STAMP}-AT`, title: 'AT', citizenId: citizen.id, serviceId: servicoAt.id, departmentId: dept.id, status: 'VINCULADO', customData: { tipoAssistencia: 'Análise de solo' } } as any,
  });
  await convertProtocolToAppOnCreate({ ...pAt, moduleType: 'ASSISTENCIA_TECNICA' } as any);
  check('sem produtor: pedido espera e o cidadão é avisado',
    !(await prisma.solicitacaoAssistenciaTecnica.findFirst({ where: { protocolId: pAt.id } })) &&
    !!(await prisma.protocolInteraction.findFirst({ where: { protocolId: pAt.id, message: { contains: 'cadastro de produtor' } } })));
  const { default: agriculturaService } = await import('../src/services/agricultura/agricultura.service');
  await agriculturaService.createProdutor({ citizenId: citizen.id, cpf: citizen.cpf, nome: citizen.name });
  check('cadastro de produtor destrava o pedido de assistência', !!(await prisma.solicitacaoAssistenciaTecnica.findFirst({ where: { protocolId: pAt.id } })));

  // ------------------------------------------- Saúde: linhas de cuidado (Fase 2)
  console.log('\nSaúde — dentista, pré-natal, visita e atividade coletiva');
  const ubs = await prisma.unidadeSaude.create({ data: { nome: 'UBS Smoke', tipo: 'UBS' } as any });
  const entrada = await prisma.filaAtendimento.create({
    data: { citizenId: citizen.id, profissionalId: user.id, tipoAtendimento: 'AGENDADO', motivoBusca: 'Dor de dente', unidadeId: ubs.id } as any,
  });
  check('paciente aparece na fila do dentista', (await odontoService.minhaFila(user.id)).some((f) => f.id === entrada.id));
  const odonto = await odontoService.salvar(user.id, {
    filaAtendimentoId: entrada.id,
    odontograma: { '16': { condicao: 'CARIADO' }, '36': { condicao: 'OBTURADO' }, '46': { condicao: 'PERDIDO' } },
    diagnostico: 'Cárie no 16',
    procedimentos: [{ descricao: 'Restauração com resina', dente: '16' }],
  });
  check('atendimento odontológico gravado com CPO-D e procedimento', (odonto?.indicesCPOD as any)?.cpod === 3 && odonto?.procedimentos.length === 1, odonto);
  await odontoService.salvar(user.id, { filaAtendimentoId: entrada.id, odontograma: { '16': { condicao: 'OBTURADO' } }, finalizar: true });
  const odonto2 = await odontoService.porFila(entrada.id);
  check('salvar de novo atualiza (não duplica) e mantém o procedimento', odonto2?.procedimentos.length === 1 && (odonto2?.indicesCPOD as any)?.obturados === 1);
  check('finalizar encerra a entrada da fila', (await prisma.filaAtendimento.findFirst({ where: { id: entrada.id } }))?.status === 'FINALIZADO');
  check('histórico odontológico do cidadão', (await odontoService.historico(citizen.id)).length === 1);

  const dum = new Date(Date.now() - 84 * 86400000);
  const pn = await preNatalService.iniciar({ citizenId: citizen.id, dum: dum.toISOString(), pesoInicial: 60, alturaInicial: 1.6 });
  check('pré-natal iniciado com semanas e data do parto', pn?.semanas === 12 && pn?.trimestre === 1 && Math.round((pn.dpp.getTime() - dum.getTime()) / 86400000) === 280 && pn.imcInicial === 23.4, pn && { semanas: pn.semanas, imc: pn.imcInicial });
  let repetido = '';
  await preNatalService.iniciar({ citizenId: citizen.id, dum: dum.toISOString() }).catch((e) => (repetido = e.message));
  check('não abre dois pré-natais para a mesma gestante', repetido.includes('em andamento'), repetido);
  const pn2 = await preNatalService.registrarConsulta(pn!.id, user.id, { peso: 61.5, pressaoArterial: '110/70', bcf: 150 });
  check('consulta de pré-natal com idade gestacional', pn2?.consultas.length === 1 && pn2.consultas[0].idadeGestacional === '12s 0d', pn2?.consultas[0]);
  const pn3 = await preNatalService.solicitarExame(pn!.id, { tipoExame: 'VDRL' });
  const pn4 = await preNatalService.registrarResultado(pn3!.exames[0].id, { resultado: 'Não reagente' });
  check('exame pedido e resultado registrado', pn4?.exames[0].resultado === 'Não reagente');
  check('resumo conta a gestante', (await preNatalService.resumo()).emAcompanhamento === 1);
  const pn5 = await preNatalService.encerrar(pn!.id, { tipoDesfecho: 'PARTO_NORMAL' });
  check('encerrar com parto', pn5?.status === 'FINALIZADO');

  const visita = await visitaDomiciliarService.registrar(user.id, { citizenId: citizen.id, tipoVisita: 'ACOMPANHAMENTO', motivoVisita: 'Acompanhar pressão', encaminhamentoUBS: true, motivoEncaminhamento: 'Pressão alta' });
  check('visita domiciliar registrada', !!visita.id && visita.encaminhamentoUBS);
  let semMotivo = '';
  await visitaDomiciliarService.registrar(user.id, { tipoVisita: 'ACOMPANHAMENTO', motivoVisita: 'x', encaminhamentoUBS: true }).catch((e) => (semMotivo = e.message));
  check('encaminhamento exige o motivo', semMotivo.includes('encaminhada'), semMotivo);
  const prod = await visitaDomiciliarService.resumo(new Date(Date.now() - 86400000), new Date(Date.now() + 86400000));
  check('produção do agente no período', prod.total === 1 && prod.encaminhamentos === 1 && prod.porAgente[0]?.visitas === 1, prod);

  const atividade = await atividadeColetivaService.criar({ tipo: 'GRUPO_HIPERTENSOS', tema: 'Sal e pressão', dataHora: new Date().toISOString(), local: 'UBS', unidadeId: ubs.id, createdBy: user.id });
  await atividadeColetivaService.adicionarParticipante(atividade.id, { citizenId: citizen.id, pressaoArterial: '130/80' });
  let duplicado = '';
  await atividadeColetivaService.adicionarParticipante(atividade.id, { citizenId: citizen.id }).catch((e) => (duplicado = e.message));
  const [listada] = await atividadeColetivaService.listar({});
  check('atividade coletiva com responsável, presença e contagem', listada?.profissionais.length === 1 && listada.participantes.length === 1 && listada.numeroParticipantes === 1 && duplicado.includes('já está'));
  check('lista de atividades não expõe senha de ninguém', !JSON.stringify(listada).includes('password'));

  // ------------------------------------------------- Apps novos (Fase 3)
  console.log('Fase 3 — mecanização, empregos, segurança e turismo');
  const { default: mecanizacaoService } = await import('../src/services/agricultura/mecanizacao.service');
  const { default: empregoService } = await import('../src/services/emprego/emprego.service');
  const { default: segurancaService } = await import('../src/services/seguranca/seguranca.service');
  const { default: turismoService } = await import('../src/services/turismo/turismo.service');

  // Mecanização
  const pMaq = await open('SOLICITACAO_MAQUINAS', { tipoMaquina: 'Trator', dataDesejada: '2026-11-10', areaTrabalho: 3.5 });
  const servico = await prisma.servicoMecanizacao.findFirst({ where: { protocolId: pMaq.id } });
  check('pedido de máquina entrou na mecanização', servico?.tipoMaquina === 'Trator' && servico?.areaHectares === 3.5 && servico?.solicitanteNome === citizen.name, servico);
  const trator = await mecanizacaoService.saveMaquina(null, { tipo: 'Trator', identificacao: `Trator ${STAMP}`, valorHoraUso: 100 });
  await mecanizacaoService.agendar(servico!.id, user.id, { maquinaId: trator.id, dataAgendada: '2026-11-10', operador: 'Zé' });
  check('agendar avisa o produtor e põe o pedido em andamento', (await statusOf(pMaq.id)) === 'PROGRESSO');
  const outro = await mecanizacaoService.create({ tipoMaquina: 'Trator', solicitanteNome: 'Outro produtor' });
  let conflito = '';
  await mecanizacaoService.agendar(outro.id, user.id, { maquinaId: trator.id, dataAgendada: '2026-11-10' }).catch((e) => (conflito = e.message));
  check('a mesma máquina não é reservada duas vezes no mesmo dia', conflito.includes('já está reservada'), conflito);
  await mecanizacaoService.iniciar(servico!.id);
  const feito = await mecanizacaoService.concluir(servico!.id, user.id, { horasRealizadas: 4 });
  const tratorDepois = await prisma.maquinaAgricola.findFirst({ where: { id: trator.id } });
  check('concluir calcula o valor, soma as horas e libera a máquina', feito.valorCobrado === 400 && tratorDepois?.horasUso === 4 && tratorDepois?.status === 'Disponível', { valor: feito.valorCobrado, horas: tratorDepois?.horasUso });
  check('concluir encerra o pedido de máquina', (await statusOf(pMaq.id)) === 'CONCLUIDO');

  // Balcão de empregos
  const pCur = await open('CADASTRO_BALCAO_EMPREGOS', { escolaridade: 'Médio Completo', areaInteresse: 'cozinha', experiencia: 'Dois anos em restaurante', disponibilidadeImediata: true });
  const cv = await prisma.curriculoTrabalhador.findFirst({ where: { protocolId: pCur.id } });
  check('currículo cadastrado e pedido concluído na hora', cv?.areaInteresse === 'cozinha' && (await statusOf(pCur.id)) === 'CONCLUIDO', cv);
  const denovo = await empregoService.saveCurriculo(null, { citizenId: citizen.id, nome: citizen.name, areaInteresse: 'cozinha industrial' });
  check('novo cadastro da mesma pessoa atualiza o currículo (não duplica)', denovo.id === cv!.id && (await prisma.curriculoTrabalhador.count({ where: { citizenId: citizen.id } })) === 1);
  const vaga = await empregoService.saveVaga(null, { empresa: 'Restaurante Bom Sabor', titulo: 'Auxiliar de cozinha', area: 'Alimentação', descricao: 'Preparo de refeições em restaurante', escolaridadeMinima: 'Fundamental Completo', contato: 'Falar com Ana, 9999-0000' });
  const comCandidatos = await empregoService.vagaComCandidatos(vaga.id);
  check('a vaga sugere o trabalhador com os motivos', comCandidatos.sugestoes[0]?.curriculo.id === cv!.id && comCandidatos.sugestoes[0].nota >= 45 && comCandidatos.sugestoes[0].motivos.length > 0, comCandidatos.sugestoes[0]);
  const enc = await empregoService.encaminhar(vaga.id, cv!.id, user.id);
  let repetidoEnc = '';
  await empregoService.encaminhar(vaga.id, cv!.id, user.id).catch((e) => (repetidoEnc = e.message));
  check('não encaminha a mesma pessoa duas vezes para a mesma vaga', repetidoEnc.includes('já foi encaminhada'));
  await empregoService.resultado(enc.id, 'CONTRATADO');
  check('contratado: currículo vira empregado e a vaga fecha', (await prisma.curriculoTrabalhador.findFirst({ where: { id: cv!.id } }))?.status === 'EMPREGADO' && (await prisma.vagaEmprego.findFirst({ where: { id: vaga.id } }))?.status === 'PREENCHIDA');

  // Segurança
  const pOco = await open('REGISTRO_OCORRENCIA', { tipoOcorrencia: 'Perturbação do Sossego', localOcorrencia: 'Rua das Flores, 10', relatoDetalhado: 'Som alto todas as noites depois das 23 horas na casa ao lado' });
  const oco = await prisma.ocorrenciaSeguranca.findFirst({ where: { protocolId: pOco.id } });
  check('ocorrência registrada com número', !!oco?.numero?.startsWith('OCS-') && oco?.natureza === 'Perturbação do Sossego' && oco?.citizenId === citizen.id, oco);
  const pDen = await open('DENUNCIA_ANONIMA', { descricao: 'Venda de produto roubado em frente à praça todo sábado' });
  const den = await prisma.ocorrenciaSeguranca.findFirst({ where: { protocolId: pDen.id } });
  check('denúncia anônima não guarda quem fez', den?.anonima === true && den?.citizenId === null && den?.solicitanteNome === null && den?.prioridade === 'ALTA', den);
  const fila = await segurancaService.list({ abertas: true });
  check('fila: a denúncia (alta) vem antes da ocorrência (média) e não mostra o denunciante', fila[0]?.id === den!.id && fila[0].citizen === null && fila.find((f: any) => f.id === oco!.id)?.citizen?.name === citizen.name);
  await segurancaService.assumir(oco!.id, user.id, 'Viatura 02');
  check('assumir põe o pedido em andamento', (await statusOf(pOco.id)) === 'PROGRESSO');
  await segurancaService.registrarProvidencia(oco!.id, user.id, 'Guarda foi ao local');
  await segurancaService.encerrar(oco!.id, user.id, { resultado: 'RESOLVIDA', mensagem: 'A Guarda orientou os moradores e o som foi desligado.' });
  check('resolver encerra o pedido com a resposta', (await statusOf(pOco.id)) === 'CONCLUIDO');
  let jaEncerrada = '';
  await segurancaService.assumir(oco!.id, user.id).catch((e) => (jaEncerrada = e.message));
  check('ocorrência encerrada não pode ser assumida de novo', jaEncerrada.includes('já foi encerrada'));

  // Turismo
  const pTur = await open('CADASTRO_ESTABELECIMENTO_TURISTICO', { tipoEstabelecimento: 'Pousada', nomeEstabelecimento: 'Pousada do Vale', cnpj: '12345678000199', enderecoEstabelecimento: 'Estrada do Vale, km 2', descricaoServicos: 'Hospedagem com café da manhã' });
  const pousada = await prisma.prestadorTuristico.findFirst({ where: { protocolId: pTur.id } });
  check('pedido virou cadastro turístico', pousada?.tipo === 'ESTABELECIMENTO' && pousada?.nome === 'Pousada do Vale' && pousada?.categoria === 'Pousada', pousada);
  const aprovada = await turismoService.aprovar(pousada!.id, user.id);
  check('aprovar emite número, validade e conclui o pedido', !!aprovada.numero?.startsWith('TUR-') && !!aprovada.validade && aprovada.publicado && (await statusOf(pTur.id)) === 'CONCLUIDO');
  const pEv = await open('REGISTRO_EVENTO_TURISTICO', { nomeEvento: 'Festa do Milho', tipoEvento: 'Festa', dataEvento: '2026-12-05', localEvento: 'Praça Central', descricaoEvento: 'Festa tradicional', publicoEstimado: 2000 });
  const festa = await prisma.eventoTuristico.findFirst({ where: { protocolId: pEv.id } });
  check('pedido virou evento com data', festa?.nome === 'Festa do Milho' && festa?.publicoEstimado === 2000 && !!festa?.dataInicio, festa);
  await turismoService.indeferirEvento(festa!.id, user.id, 'Praça em reforma na data');
  check('não aprovar o evento encerra o pedido', (await statusOf(pEv.id)) === 'CONCLUIDO');

  // ---------------------------------------------------------------- idempotência
  await convertProtocolToAppOnCreate({ ...pMed, moduleType: 'CONTROLE_MEDICAMENTOS' } as any);
  check('repetir a conversão não duplica', (await prisma.solicitacaoMedicamento.count({ where: { protocolId: pMed.id } })) === 1);
}

main()
  .then(() => {
    console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ Tudo certo');
    process.exit(failures ? 1 : 0);
  })
  .catch((error) => {
    console.error('Smoke quebrou:', error);
    process.exit(1);
  });
