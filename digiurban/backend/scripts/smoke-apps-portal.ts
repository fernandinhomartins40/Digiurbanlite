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
