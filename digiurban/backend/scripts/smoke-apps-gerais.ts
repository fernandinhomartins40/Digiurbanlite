/**
 * Smoke dos apps gerais de 2026-10-09 (requer banco e Redis).
 *
 *   DATABASE_URL=... REDIS_URL=... JWT_SECRET=... npx tsx scripts/smoke-apps-gerais.ts
 *
 * Agenda de Atendimentos, Cursos e Capacitações, Feiras e Mercados, Cemitérios
 * e pedidos de insumos da Agricultura: abre o pedido como o portal, confere que
 * chegou ao app com a secretaria certa, decide e confere que o pedido do
 * cidadão foi encerrado. Também confere que cada secretaria só vê o que é dela.
 * Apaga tudo no fim.
 */
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import { convertProtocolToAppOnCreate } from '../src/services/apps/protocol-to-app.service';

const STAMP = Date.now();
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ✅ ${label}`);
  else {
    failures++;
    console.log(`  ❌ ${label}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    failures++;
    console.log(`  ❌ ${label} (erro): ${String(error?.message || error).split('\n').slice(-3).join(' ')}`);
    return null;
  }
}

async function main() {
  const tenant = await runAsPlatform(() =>
    prisma.tenant.create({
      data: {
        slug: `smoke-ger-${STAMP}`,
        nome: 'Smoke Apps Gerais',
        cnpj: `${String(STAMP).slice(-8, -6)}.${String(STAMP).slice(-6, -3)}.${String(STAMP).slice(-3)}/0009-${String(STAMP).slice(-2)}`,
        nomeMunicipio: 'Smoke Apps Gerais',
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
        'agendamentoAtendimento', 'inscricaoCurso', 'cursoMunicipal', 'permissaoUsoEspaco', 'espacoComercial', 'pedidoCemiterio', 'sepultamentoRegistro',
        'jazigoCemiterio', 'pedidoInsumoAgricola', 'distribuicaoSemente', 'estoqueSemente', 'produtorRural', 'auditLog', 'notification',
        'protocolSimplified', 'serviceSimplified', 'citizen', 'user', 'department',
      ];
      for (const table of tables) await (prisma as any)[table]?.deleteMany({ where }).catch(() => undefined);
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch((e) => console.warn('limpeza:', e.message));
    });
  }
}

async function scenario() {
  const depts: Record<string, string> = {};
  for (const code of ['DESENVOLVIMENTO_ECONOMICO', 'ASSISTENCIA_SOCIAL', 'POLITICAS_MULHERES', 'SERVICOS_PUBLICOS', 'AGRICULTURA']) {
    depts[code] = (await prisma.department.create({ data: { name: code, code } as any })).id;
  }
  const user = await prisma.user.create({
    data: { name: 'Servidora Smoke', email: `s-${STAMP}@t.local`, password: 'x', role: 'ADMIN', departmentId: depts.DESENVOLVIMENTO_ECONOMICO, isActive: true } as any,
  });
  const citizen = await prisma.citizen.create({
    data: { name: 'Maria Cidadã', cpf: String(STAMP).slice(-11).padStart(11, '0'), email: `c-${STAMP}@t.local`, password: 'x', phone: '44999990000' } as any,
  });
  const outra = await prisma.citizen.create({
    data: { name: 'João Cidadão', cpf: String(STAMP + 7).slice(-11).padStart(11, '0'), email: `j-${STAMP}@t.local`, password: 'x', phone: '44988880000' } as any,
  });

  let seq = 0;
  const open = async (action: string, dept: string, serviceName: string, customData: Record<string, unknown>, citizenId = citizen.id) => {
    const service = await prisma.serviceSimplified.create({ data: { name: serviceName, departmentId: depts[dept], serviceType: 'COM_DADOS', estimatedDays: 10 } as any });
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: `SMKGER-${STAMP}-${++seq}`,
        title: serviceName,
        citizenId,
        serviceId: service.id,
        departmentId: depts[dept],
        status: 'VINCULADO',
        customData,
        address: 'Rua das Palmeiras, 100',
      } as any,
    });
    await convertProtocolToAppOnCreate({ ...protocol, moduleType: action } as any);
    return protocol;
  };
  const statusOf = async (id: string) => (await prisma.protocolSimplified.findFirst({ where: { id }, select: { status: true } }))?.status;
  const encerrado = async (id: string) => ['CONCLUIDO', 'CANCELADO'].includes(String(await statusOf(id)));

  // ----------------------------------------------------- Agenda de Atendimentos
  console.log('Agenda de Atendimentos');
  await step('agenda', async () => {
    const { default: agenda } = await import('../src/services/apps-gerais/agenda-atendimentos.service');
    const p = await open('AGENDAMENTO_ATENDIMENTO', 'DESENVOLVIMENTO_ECONOMICO', 'Agendamento Sala do Empreendedor', { assunto: 'Abrir MEI' });
    const ag = await prisma.agendamentoAtendimento.findFirst({ where: { protocolId: p.id } });
    check('pedido chegou à agenda com a secretaria e o assunto', ag?.departmentCode === 'DESENVOLVIMENTO_ECONOMICO' && ag?.assunto === 'Abrir MEI' && ag?.status === 'AGUARDANDO', ag);
    if (!ag) return;
    const outraSecretaria = await agenda.list(['ASSISTENCIA_SOCIAL'], { abertos: true });
    check('outra secretaria não vê o atendimento', !outraSecretaria.some((i) => i.id === ag.id));

    await agenda.agendar(ag.id, null, user.id, { dataHora: '2030-03-10T14:00', local: 'Sala do Empreendedor', profissionalId: user.id });
    check('marcar horário põe o pedido em andamento', (await statusOf(p.id)) === 'PROGRESSO', await statusOf(p.id));
    const marcado = await prisma.agendamentoAtendimento.findFirst({ where: { id: ag.id } });
    check('horário gravado em Brasília (14h = 17h UTC)', marcado?.dataHora?.toISOString() === '2030-03-10T17:00:00.000Z', marcado?.dataHora);

    // mesmo servidor no mesmo horário = recusa
    const p2 = await open('AGENDAMENTO_ATENDIMENTO', 'DESENVOLVIMENTO_ECONOMICO', 'Solicitação de Consultoria Empresarial', {}, outra.id);
    const ag2 = await prisma.agendamentoAtendimento.findFirst({ where: { protocolId: p2.id } });
    const choque = await agenda.agendar(ag2!.id, null, user.id, { dataHora: '2030-03-10T14:15', local: 'Sala 2', profissionalId: user.id }).then(() => false, () => true);
    check('não marca o mesmo servidor em horário que se choca', choque);
    await agenda.registrarResultado(ag.id, null, user.id, { resultado: 'REALIZADO' });
    check('atendido encerra o pedido', await encerrado(p.id), await statusOf(p.id));
    await agenda.cancelar(ag2!.id, null, user.id, 'Pedido em duplicidade');
    check('cancelar encerra o pedido', await encerrado(p2.id), await statusOf(p2.id));

    const p3 = await open('AGENDA_VISITA_DOMICILIAR', 'ASSISTENCIA_SOCIAL', 'Visita Domiciliar', { assunto: 'Idoso acamado' });
    const visita = await prisma.agendamentoAtendimento.findFirst({ where: { protocolId: p3.id } });
    check('visita domiciliar chega como "na casa da pessoa" com o endereço', visita?.modalidade === 'DOMICILIAR' && !!visita?.endereco, visita);
  });

  // ----------------------------------------------------- Cursos e Capacitações
  console.log('Cursos e Capacitações');
  await step('cursos', async () => {
    const { default: cursos } = await import('../src/services/apps-gerais/cursos.service');
    const curso = await cursos.saveCurso(null, null, { nome: 'Informática Básica', vagas: 1, totalAulas: 10, frequenciaMinima: 75, departmentCode: 'POLITICAS_MULHERES' });
    const p1 = await open('INSCRICAO_CURSO', 'POLITICAS_MULHERES', 'Curso de Informática para Mulheres', {});
    const p2 = await open('INSCRICAO_CURSO', 'POLITICAS_MULHERES', 'Curso de Informática para Mulheres', {}, outra.id);
    const i1 = await prisma.inscricaoCurso.findFirst({ where: { protocolId: p1.id } });
    const i2 = await prisma.inscricaoCurso.findFirst({ where: { protocolId: p2.id } });
    check('pedidos viraram inscrições aguardando turma', i1?.status === 'AGUARDANDO' && i2?.status === 'AGUARDANDO' && i1?.interesse === 'Curso de Informática para Mulheres', [i1, i2]);
    if (!i1 || !i2) return;
    await cursos.colocarNaTurma(i1.id, curso.id, null, user.id);
    const espera = await cursos.colocarNaTurma(i2.id, curso.id, null, user.id);
    check('sem vaga vai para a lista de espera', espera.status === 'LISTA_ESPERA', espera.status);
    const r = await cursos.encerrarInscricao(i1.id, null, user.id, { tipo: 'DESISTIU', mensagem: 'Mudou de cidade' });
    const chamada = await prisma.inscricaoCurso.findFirst({ where: { id: i2.id } });
    check('desistência encerra o pedido e chama o primeiro da espera', (await encerrado(p1.id)) && chamada?.status === 'INSCRITO' && !!r.chamadoDaEspera, { s: await statusOf(p1.id), c: chamada?.status });
    await cursos.lancarFrequencia(i2.id, null, 8);
    const fim = await cursos.concluirCurso(curso.id, null, user.id);
    const concluida = await prisma.inscricaoCurso.findFirst({ where: { id: i2.id } });
    check('concluir o curso dá o resultado pela frequência e encerra o pedido', fim.concluiram === 1 && concluida?.status === 'CONCLUIU' && (await encerrado(p2.id)), { fim, s: concluida?.status });
  });

  // -------------------------------------------------------- Feiras e Mercados
  console.log('Feiras e Mercados');
  await step('feiras', async () => {
    const { default: feiras } = await import('../src/services/apps-gerais/feiras.service');
    const box1 = await feiras.saveEspaco(null, null, { local: 'Mercado Municipal', identificacao: 'Box 1', departmentCode: 'SERVICOS_PUBLICOS' });
    const box2 = await feiras.saveEspaco(null, null, { local: 'Mercado Municipal', identificacao: 'Box 2', departmentCode: 'SERVICOS_PUBLICOS' });
    const p = await open('PERMISSAO_ESPACO_FEIRA', 'SERVICOS_PUBLICOS', 'Permissão de Box em Mercado Municipal', { atividade: 'Hortaliças' });
    const pedido = await prisma.permissaoUsoEspaco.findFirst({ where: { protocolId: p.id } });
    check('pedido chegou com o que vende', pedido?.status === 'AGUARDANDO' && pedido?.atividade === 'Hortaliças', pedido);
    if (!pedido) return;
    await feiras.conceder(pedido.id, null, user.id, { espacoId: box1.id, validade: '2031-12-31' });
    const ocupado = await prisma.espacoComercial.findFirst({ where: { id: box1.id } });
    check('conceder ocupa o box e encerra o pedido', ocupado?.status === 'OCUPADO' && (await encerrado(p.id)), { box: ocupado?.status, s: await statusOf(p.id) });
    const repetir = await feiras.conceder(pedido.id, null, user.id, { espacoId: box2.id, validade: '2031-12-31' }).then(() => false, () => true);
    check('não decide duas vezes', repetir);

    const pr = await open('RELOCACAO_PONTO_FEIRA', 'SERVICOS_PUBLICOS', 'Relocação de Ponto em Feira Livre', {});
    const relocacao = await prisma.permissaoUsoEspaco.findFirst({ where: { protocolId: pr.id } });
    await feiras.conceder(relocacao!.id, null, user.id, { espacoId: box2.id, validade: '2031-12-31' });
    const [livre, antiga] = await Promise.all([prisma.espacoComercial.findFirst({ where: { id: box1.id } }), prisma.permissaoUsoEspaco.findFirst({ where: { id: pedido.id } })]);
    check('troca de ponto libera o box antigo e encerra a permissão anterior', livre?.status === 'LIVRE' && antiga?.status === 'ENCERRADA' && (await encerrado(pr.id)), { box: livre?.status, antiga: antiga?.status });

    const pa = await open('INSCRICAO_FEIRA', 'AGRICULTURA', 'Inscrição na Feira do Produtor', {}, outra.id);
    const inscricao = await prisma.permissaoUsoEspaco.findFirst({ where: { protocolId: pa.id } });
    const soServicos = await feiras.listPermissoes(['SERVICOS_PUBLICOS'], { pendentes: true });
    check('inscrição da Agricultura não aparece para Serviços Públicos', inscricao?.departmentCode === 'AGRICULTURA' && !soServicos.some((i) => i.id === inscricao?.id));
    await feiras.recusar(inscricao!.id, null, user.id, 'Vagas da feira esgotadas');
    check('recusar encerra o pedido', await encerrado(pa.id));
  });

  // ---------------------------------------------------------------- Cemitérios
  console.log('Cemitérios');
  await step('cemitério', async () => {
    const { default: cemiterio } = await import('../src/services/apps-gerais/cemiterio.service');
    const jazigo = await cemiterio.saveJazigo(null, { cemiterio: 'Cemitério Municipal', quadra: 'A', numero: '10' });
    const p = await open('CONCESSAO_SEPULTURA', 'SERVICOS_PUBLICOS', 'Concessão de Sepultura', {});
    const pedido = await prisma.pedidoCemiterio.findFirst({ where: { protocolId: p.id } });
    check('pedido de concessão chegou', pedido?.tipo === 'CONCESSAO' && pedido?.status === 'AGUARDANDO', pedido);
    if (!pedido) return;
    await cemiterio.atender(pedido.id, user.id, { jazigoId: jazigo.id, anos: 5 });
    const concedido = await prisma.jazigoCemiterio.findFirst({ where: { id: jazigo.id } });
    check('concessão grava o titular e o prazo e encerra o pedido', concedido?.status === 'CONCEDIDO' && concedido?.titularNome === 'Maria Cidadã' && !!concedido?.concessaoAte && (await encerrado(p.id)), concedido);

    await cemiterio.registrarSepultamento(jazigo.id, { falecidoNome: 'José Antigo', dataSepultamento: '2029-01-10T10:00' });
    const pe = await open('EXUMACAO', 'SERVICOS_PUBLICOS', 'Solicitação de Exumação', { nomeFalecido: 'José Antigo' });
    const exumacao = await prisma.pedidoCemiterio.findFirst({ where: { protocolId: pe.id } });
    const cedo = await cemiterio.agendarExumacao(exumacao!.id, user.id, { jazigoId: jazigo.id, dataAgendada: '2030-02-01T09:00' }).then(() => false, () => true);
    check('exumação antes de 3 anos é recusada (sem ordem judicial)', cedo);
    await cemiterio.agendarExumacao(exumacao!.id, user.id, { jazigoId: jazigo.id, dataAgendada: '2030-02-01T09:00', ordemJudicial: true });
    check('com ordem judicial marca o dia e o pedido fica em andamento', (await statusOf(pe.id)) === 'PROGRESSO', await statusOf(pe.id));
    await cemiterio.atender(exumacao!.id, user.id, { destinoRestos: 'Ossuário municipal' });
    const depois = await prisma.jazigoCemiterio.findFirst({ where: { id: jazigo.id } });
    check('exumação feita encerra o pedido e a sepultura volta a "concedida"', depois?.status === 'CONCEDIDO' && (await encerrado(pe.id)), depois?.status);
  });

  // ---------------------------------------------------- Insumos da Agricultura
  console.log('Insumos da Agricultura');
  await step('insumos', async () => {
    const { default: insumos } = await import('../src/services/agricultura/pedido-insumo.service');
    const estoque = await prisma.estoqueSemente.create({ data: { tipo: 'CALCARIO', cultura: 'Calcário dolomítico', unidadeMedida: 'tonelada', quantidade: 10 } });
    const p = await open('DISTRIBUICAO_INSUMOS', 'AGRICULTURA', 'Distribuição de Calcário', { quantidade: '2 toneladas', areaPlantio: 3 });
    const pedido = await prisma.pedidoInsumoAgricola.findFirst({ where: { protocolId: p.id } });
    check('pedido chegou com tipo, quantidade e área', pedido?.tipo === 'CALCARIO' && pedido?.quantidade === '2 toneladas' && pedido?.areaHectares === 3, pedido);
    if (!pedido) return;
    const demais = await insumos.entregar(pedido.id, user.id, { estoqueId: estoque.id, quantidade: 50 }).then(() => false, () => true);
    check('não entrega mais do que tem no estoque', demais);
    await insumos.entregar(pedido.id, user.id, { estoqueId: estoque.id, quantidade: 2 });
    const [baixa, produtor] = await Promise.all([
      prisma.estoqueSemente.findFirst({ where: { id: estoque.id } }),
      prisma.produtorRural.findFirst({ where: { citizenId: citizen.id } }),
    ]);
    check('entregar baixa o estoque, cria o produtor e encerra o pedido', baixa?.quantidade === 8 && !!produtor && (await encerrado(p.id)), { q: baixa?.quantidade, produtor: !!produtor, s: await statusOf(p.id) });
  });
}

main()
  .then(async () => {
    console.log(failures ? `\n${failures} falha(s)` : '\nTudo certo');
    await prisma.$disconnect();
    process.exit(failures ? 1 : 0);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
