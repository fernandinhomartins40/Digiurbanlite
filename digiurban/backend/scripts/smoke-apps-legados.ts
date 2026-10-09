/**
 * Smoke dos apps que já existiam antes da auditoria de 2026-10-08 (requer banco e Redis).
 *
 *   DATABASE_URL=... REDIS_URL=... JWT_SECRET=... npx tsx scripts/smoke-apps-legados.ts
 *
 * Para cada app: abre o pedido, confere que virou caso no app, decide e confere
 * que o pedido do cidadão foi encerrado. Também prova que CANCELAR no app
 * encerra o pedido (antes ficava aberto para sempre). Apaga tudo no fim.
 */
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, runAsTenant } from '../src/lib/tenant-context';
import { convertProtocolToAppOnCreate, convertProtocolToAppOnApproval } from '../src/services/apps/protocol-to-app.service';

const STAMP = Date.now();
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ✅ ${label}`);
  else {
    failures++;
    console.log(`  ❌ ${label}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

/** Roda um passo e, se quebrar, conta como falha em vez de derrubar o roteiro inteiro. */
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
        slug: `smoke-leg-${STAMP}`,
        nome: 'Smoke Apps Antigos',
        cnpj: `${String(STAMP).slice(-8, -6)}.${String(STAMP).slice(-6, -3)}.${String(STAMP).slice(-3)}/0007-${String(STAMP).slice(-2)}`,
        nomeMunicipio: 'Smoke Apps Antigos',
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
        'apontamentoOS', 'ordemServico', 'parecerLicenciamento', 'processoLicenciamento', 'parecerAmbiental', 'vistoriaAmbiental', 'autoInfracaoAmbiental',
        'processoAmbiental', 'inscricaoHabitacional', 'programaHabitacional', 'familiaAtingida', 'ocorrenciaDefesaCivil', 'encaminhamentoCasoMulher',
        'atendimentoCasoMulher', 'casoMulher', 'matriculaEscolinha', 'turmaEscolinha', 'reservaEspaco', 'matriculaOficina', 'oficinaCultural',
        'credencialTransporte', 'carteiraGratuidade', 'solicitacaoTFD', 'propriedadeRural', 'produtorRural', 'auditLog', 'notification',
        'protocolSimplified', 'serviceSimplified', 'citizen', 'user', 'department',
      ];
      for (const table of tables) await (prisma as any)[table]?.deleteMany({ where }).catch(() => undefined);
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch((e) => console.warn('limpeza:', e.message));
    });
  }
}

async function scenario() {
  const dept = await prisma.department.create({ data: { name: `Geral ${STAMP}`, code: `GERAL_${STAMP}` } as any });
  const user = await prisma.user.create({
    data: { name: 'Servidor Smoke', email: `s-${STAMP}@t.local`, password: 'x', role: 'ADMIN', departmentId: dept.id, isActive: true } as any,
  });
  const citizen = await prisma.citizen.create({
    data: { name: 'Carlos Cidadão', cpf: String(STAMP).slice(-11).padStart(11, '0'), email: `c-${STAMP}@t.local`, password: 'x', phone: '44999990000' } as any,
  });
  const service = await prisma.serviceSimplified.create({
    data: { name: 'Serviço smoke', departmentId: dept.id, serviceType: 'COM_DADOS', estimatedDays: 10 } as any,
  });

  let seq = 0;
  const open = async (action: string, customData: Record<string, unknown>) => {
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: `SMKLEG-${STAMP}-${++seq}`,
        title: action,
        citizenId: citizen.id,
        serviceId: service.id,
        departmentId: dept.id,
        status: 'VINCULADO',
        customData,
        latitude: -23.5,
        longitude: -51.9,
        address: 'Rua das Palmeiras, 100',
      } as any,
    });
    await convertProtocolToAppOnCreate({ ...protocol, moduleType: action } as any);
    return protocol;
  };
  const statusOf = async (id: string) => (await prisma.protocolSimplified.findFirst({ where: { id }, select: { status: true } }))?.status;
  const concluded = async (id: string) => (await statusOf(id)) === 'CONCLUIDO';

  // ------------------------------------------------------------ Ordens de serviço
  console.log('Ordens de serviço');
  await step('ordem de serviço', async () => {
    const { default: os } = await import('../src/services/servicos-publicos/ordem-servico.service');
    const p = await open('ILUMINACAO_PUBLICA', { descricao: 'Poste apagado em frente ao número 100' });
    const ordem = await prisma.ordemServico.findFirst({ where: { protocolId: p.id } });
    check('pedido virou ordem de serviço', !!ordem, ordem);
    if (!ordem) return;
    await os.despachar(ordem.id, { responsavelId: user.id, userId: user.id });
    await os.iniciar(ordem.id, user.id);
    await os.concluir(ordem.id, { userId: user.id, descricao: 'Lâmpada trocada', horas: 1 });
    check('concluir a OS encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('SOLICITACAO_CAPINA', { descricao: 'Mato alto no terreno da esquina' });
    const ordem2 = await prisma.ordemServico.findFirst({ where: { protocolId: p2.id } });
    if (ordem2) await os.cancelar(ordem2.id, { userId: user.id, motivo: 'Terreno particular' });
    check('cancelar a OS encerra o pedido', !!ordem2 && (await concluded(p2.id)), await statusOf(p2.id));

    // pedido de outra secretaria com equipe de campo vira OS DAQUELA secretaria
    const obras = await prisma.department.create({ data: { name: 'Obras Públicas', code: 'OBRAS_PUBLICAS' } as any });
    const p3 = await prisma.protocolSimplified.create({
      data: {
        number: `SMKLEG-${STAMP}-${++seq}`, title: 'Tapa-buraco', citizenId: citizen.id, serviceId: service.id, departmentId: obras.id,
        status: 'VINCULADO', customData: { descricao: 'Buraco grande na rua' }, latitude: -23.5, longitude: -51.9, address: 'Rua das Flores, 50',
      } as any,
    });
    await convertProtocolToAppOnCreate({ ...p3, moduleType: 'MANUTENCAO_VIARIA' } as any);
    const ordem3 = await prisma.ordemServico.findFirst({ where: { protocolId: p3.id } });
    check('pedido de Obras vira OS de Obras com o endereço', ordem3?.departmentCode === 'OBRAS_PUBLICAS' && !!ordem3?.endereco && ordem3?.latitude != null, ordem3);
    const soServicos = await os.listOrdens({}, ['SERVICOS_PUBLICOS']);
    const lista = Array.isArray(soServicos) ? soServicos : (soServicos as any)?.data || (soServicos as any)?.ordens || [];
    check('quem é só de Serviços Públicos não vê a OS de Obras', !lista.some((o: any) => o.id === ordem3?.id), lista.length);
    const escondida = await os.assertScope(ordem3!.id, ['SERVICOS_PUBLICOS']).then(() => false, () => true);
    check('abrir a OS de Obras por outra secretaria é recusado', escondida);
  });

  // ---------------------------------------------------------------- Licenciamento
  console.log('Licenciamento urbano');
  await step('licenciamento', async () => {
    const { default: lic } = await import('../src/services/licenciamento/licenciamento.service');
    const p = await open('ALVARA_CONSTRUCAO', { enderecoObra: 'Rua A, 10', areaConstruida: 120 });
    const proc = await prisma.processoLicenciamento.findFirst({ where: { protocolId: p.id } });
    check('pedido virou processo de licenciamento', !!proc?.numero, proc);
    if (!proc) return;
    await lic.iniciarAnalise(proc.id, user.id);
    await lic.aprovar(proc.id, user.id);
    const emitido = await lic.emitirLicenca(proc.id, { autorId: user.id });
    check('emitir a licença gera número e encerra o pedido', !!(emitido as any)?.licencaNumero && (await concluded(p.id)), { n: (emitido as any)?.licencaNumero, s: await statusOf(p.id) });

    const p2 = await open('APROVACAO_PROJETO', { enderecoObra: 'Rua B, 20' });
    const proc2 = await prisma.processoLicenciamento.findFirst({ where: { protocolId: p2.id } });
    if (proc2) await lic.cancelar(proc2.id, 'Pedido em duplicidade', user.id);
    check('cancelar o processo encerra o pedido', !!proc2 && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // ----------------------------------------------------------------- Meio ambiente
  console.log('Meio ambiente');
  await step('meio ambiente', async () => {
    const { default: amb } = await import('../src/services/meio-ambiente/meio-ambiente.service');
    const p = await open('LICENCA_AMBIENTAL', { atividade: 'Oficina mecânica', endereco: 'Rua C, 30' });
    const proc = await prisma.processoAmbiental.findFirst({ where: { protocolId: p.id } });
    check('pedido virou processo ambiental', !!proc?.numero, proc);
    if (!proc) return;
    await amb.iniciarAnalise(proc.id, user.id);
    check('começar a análise aparece no pedido do cidadão', (await statusOf(p.id)) === 'PROGRESSO', await statusOf(p.id));
    await amb.aprovar(proc.id, user.id);
    await amb.emitirLicenca(proc.id, { autorId: user.id } as any);
    check('emitir a licença ambiental encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('DENUNCIA_AMBIENTAL', { descricao: 'Descarte de óleo no córrego', local: 'Fundos da Rua D' });
    const den = await prisma.processoAmbiental.findFirst({ where: { protocolId: p2.id } });
    check('denúncia virou processo de fiscalização', !!den, den);
    if (den) await amb.arquivar(den.id, 'Não confirmado no local', user.id);
    check('arquivar a denúncia encerra o pedido', !!den && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // --------------------------------------------------------------------- Habitação
  console.log('Habitação');
  await step('habitação', async () => {
    const { default: hab } = await import('../src/services/habitacao/habitacao.service');
    const p = await open('INSCRICAO_PROGRAMA_HABITACIONAL', { rendaFamiliar: 1500, numeroMembros: 4 });
    const insc = await prisma.inscricaoHabitacional.findFirst({ where: { protocolId: p.id } });
    check('pedido virou inscrição habitacional', !!insc, insc);
    if (!insc) return;
    await hab.indeferir(insc.id, 'Renda acima do limite do programa');
    check('indeferir encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('SOLICITACAO_AUXILIO_ALUGUEL', { rendaFamiliar: 800 });
    const insc2 = await prisma.inscricaoHabitacional.findFirst({ where: { protocolId: p2.id } });
    if (insc2) await hab.cancelar(insc2.id, 'Família mudou de cidade');
    check('cancelar a inscrição encerra o pedido', !!insc2 && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // ------------------------------------------------------------------ Defesa civil
  console.log('Defesa civil');
  await step('defesa civil', async () => {
    const { default: dc } = await import('../src/services/defesa-civil/defesa-civil.service');
    const p = await open('VISTORIA_AREA_RISCO', { descricao: 'Rachadura no barranco atrás da casa', endereco: 'Rua E, 40' });
    const oco = await prisma.ocorrenciaDefesaCivil.findFirst({ where: { protocolId: p.id } });
    check('pedido virou ocorrência da defesa civil', !!oco?.numero, oco);
    if (!oco) return;
    await dc.iniciarAtendimento(oco.id, user.id);
    await dc.concluir(oco.id, 'Vistoria feita, sem risco imediato');
    check('concluir a ocorrência encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('DENUNCIA_AREA_RISCO', { descricao: 'Casa em encosta', endereco: 'Rua F, 50' });
    const oco2 = await prisma.ocorrenciaDefesaCivil.findFirst({ where: { protocolId: p2.id } });
    if (oco2) await dc.cancelar(oco2.id, 'Endereço não existe');
    check('cancelar a ocorrência encerra o pedido', !!oco2 && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // -------------------------------------------------------------- Rede da mulher
  console.log('Rede de atendimento à mulher');
  await step('rede da mulher', async () => {
    const { default: mulher } = await import('../src/services/politicas-mulheres/caso-mulher.service');
    const ctx = { userId: user.id, role: 'ADMIN' };
    const p = await open('ACOMPANHAMENTO_SOCIAL', { relato: 'Preciso de orientação e acompanhamento' });
    const caso = await prisma.casoMulher.findFirst({ where: { protocolId: p.id } });
    check('pedido virou caso sigiloso', !!caso, caso && { id: caso.id });
    if (!caso) return;
    const lista = await mulher.listCasos({ userId: 'outra-pessoa', role: 'USER' });
    const visto = (lista as any[]).find((c) => c.id === caso.id);
    check('quem não é da equipe não vê os dados do caso', !visto || !JSON.stringify(visto).includes('Preciso de orientação'), visto);
    await mulher.encerrar(caso.id, 'Acompanhamento concluído', ctx);
    check('encerrar o caso encerra o pedido', await concluded(p.id), await statusOf(p.id));
  });

  // ---------------------------------------------------------------------- Esportes
  console.log('Esportes');
  await step('esportes', async () => {
    const { default: esp } = await import('../src/services/esportes/esportes.service');
    const p = await open('INSCRICAO_ESCOLINHA_FUTEBOL', { nomeAluno: 'Pedro', idade: 10 });
    const mat = await prisma.matriculaEscolinha.findFirst({ where: { protocolId: p.id } });
    check('pedido virou matrícula na escolinha', mat?.modalidadePretendida != null, mat);
    if (!mat) return;
    const turma = await esp.createTurma({ nome: 'Futebol sub-11', modalidade: 'FUTEBOL', vagas: 1, diasHorarios: 'Seg e Qua 8h' });
    await esp.matricular(mat.id, (turma as any).id);
    check('matricular na turma encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('INSCRICAO_ESCOLINHA_FUTEBOL', { nomeAluno: 'Lucas', idade: 10 });
    const mat2 = await prisma.matriculaEscolinha.findFirst({ where: { protocolId: p2.id } });
    const espera = mat2 ? await esp.matricular(mat2.id, (turma as any).id) : null;
    check('turma cheia: o segundo vai para a lista de espera e o pedido continua aberto', (espera as any)?.status === 'LISTA_ESPERA' && !(await concluded(p2.id)), (espera as any)?.status);

    const p3 = await open('RESERVA_ESPACO_ESPORTIVO', { espaco: 'Ginásio', data: '2026-12-01', horario: '19:00' });
    const reserva = await prisma.reservaEspaco.findFirst({ where: { protocolId: p3.id } });
    check('pedido virou reserva de espaço', !!reserva, reserva);
    if (reserva) await esp.cancelarReserva(reserva.id, 'Ginásio em reforma');
    check('cancelar a reserva encerra o pedido', !!reserva && (await concluded(p3.id)), await statusOf(p3.id));
  });

  // ----------------------------------------------------------------------- Cultura
  console.log('Cultura');
  await step('cultura', async () => {
    const { default: cult } = await import('../src/services/cultura/cultura.service');
    const p = await open('INSCRICAO_OFICINA', { nomeParticipante: 'Ana', oficina: 'Violão' });
    const mat = await prisma.matriculaOficina.findFirst({ where: { protocolId: p.id } });
    check('pedido virou matrícula em oficina', !!mat, mat);
    if (!mat) return;
    const oficina = await cult.createOficina({ nome: 'Violão iniciante', categoria: 'MUSICA', vagas: 10 });
    await cult.matricular(mat.id, (oficina as any).id);
    check('matricular na oficina encerra o pedido', await concluded(p.id), await statusOf(p.id));

    const p2 = await open('PROJETO_CULTURAL', { tituloProjeto: 'Festival de Teatro', valorSolicitado: 5000 });
    const projeto = await prisma.projetoCultural.findFirst({ where: { protocolId: p2.id } });
    check('pedido virou projeto cultural', !!projeto, projeto);
    if (projeto) await cult.cancelarProjeto(projeto.id);
    check('cancelar o projeto encerra o pedido', !!projeto && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // ---------------------------------------------------------------------- Trânsito
  console.log('Transportes e trânsito');
  await step('trânsito', async () => {
    const { default: transito } = await import('../src/services/transito/transito.service');
    const p = await open('CREDENCIAMENTO_TAXI', { placaVeiculo: 'ABC1D23', modeloVeiculo: 'Corolla', pontoPretendido: 'Rodoviária' });
    const cred = await prisma.credencialTransporte.findFirst({ where: { protocolId: p.id } });
    check('pedido virou credencial de táxi', cred?.tipo === 'TAXI', cred);
    if (!cred) return;
    await transito.iniciarAnaliseCredencial(cred.id);
    const emitida = await transito.emitirCredencial(cred.id);
    check('emitir a credencial gera número e encerra o pedido', !!(emitida as any)?.numeroCredencial && (await concluded(p.id)), await statusOf(p.id));

    const p2 = await open('CREDENCIAMENTO_MOTOTAXI', { placaVeiculo: 'XYZ9A87' });
    const cred2 = await prisma.credencialTransporte.findFirst({ where: { protocolId: p2.id } });
    if (cred2) await transito.cancelarCredencial(cred2.id, 'Desistência do interessado');
    check('cancelar a credencial em análise encerra o pedido', !!cred2 && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // -------------------------------------------------------------------- Mobilidade
  console.log('Mobilidade urbana');
  await step('mobilidade', async () => {
    const { default: mob } = await import('../src/services/mobilidade/mobilidade.service');
    const p = await open('ISENCAO_IDOSO', { dataNascimento: '1950-01-01' });
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { protocolId: p.id } });
    check('pedido virou carteira de idoso', carteira?.tipo === 'IDOSO', carteira);
    if (!carteira) return;
    await mob.iniciarAnalise(carteira.id);
    const emitida = await mob.emitirCarteira(carteira.id);
    check('emitir a carteira encerra o pedido', !!(emitida as any)?.numeroCarteira && (await concluded(p.id)), await statusOf(p.id));
    const publica = await mob.validarPorCodigo((emitida as any).codigoValidacao);
    check('conferência pública pelo QR não mostra o CPF', !!publica && !JSON.stringify(publica).includes(citizen.cpf), publica);

    const p2 = await open('CARTAO_ESTUDANTE', { escola: 'Escola X' });
    const carteira2 = await prisma.carteiraGratuidade.findFirst({ where: { protocolId: p2.id } });
    if (carteira2) await mob.cancelarCarteira(carteira2.id, 'Pedido repetido');
    check('cancelar a carteira encerra o pedido', !!carteira2 && (await concluded(p2.id)), await statusOf(p2.id));
  });

  // --------------------------------------------------------------------------- TFD
  console.log('TFD');
  await step('tfd', async () => {
    const tfdService = await prisma.serviceSimplified.create({
      data: { name: 'TFD smoke', departmentId: dept.id, serviceType: 'COM_DADOS', estimatedDays: 10, destination: 'APP', appAction: 'ENCAMINHAMENTOS_TFD' } as any,
    });
    const p = await prisma.protocolSimplified.create({
      data: {
        number: `SMKLEG-${STAMP}-TFD`, title: 'TFD', citizenId: citizen.id, serviceId: tfdService.id, departmentId: dept.id, status: 'VINCULADO',
        customData: { especialidade: 'Oncologia', procedimento: 'Consulta', justificativa: 'Não há especialista no município', cidadeDestino: 'Maringá', estadoDestino: 'PR', tipoTransporte: 'Transporte Coletivo', acompanhante: true },
      } as any,
    });
    const { default: conversor } = await import('../src/services/tfd/protocol-to-tfd.service');
    const sol = await conversor.convertProtocolToTFD(p.id);
    check('pedido de TFD virou solicitação com os dados do formulário', sol?.especialidade === 'Oncologia' && sol?.cidadeDestino === 'Maringá' && sol?.estadoDestino === 'PR' && String(sol?.observacoes).includes('acompanhante'), sol && { e: sol.especialidade, c: sol.cidadeDestino, o: sol.observacoes });
    const denovo = await conversor.convertProtocolToTFD(p.id);
    check('converter de novo não duplica a solicitação', denovo?.id === sol?.id);
  });

  // ------------------------------------------------------------------- Agricultura
  console.log('Agricultura');
  await step('agricultura', async () => {
    const svc = await prisma.serviceSimplified.create({
      data: { name: 'Cadastro produtor smoke', departmentId: dept.id, serviceType: 'COM_DADOS', estimatedDays: 10, destination: 'APP', appAction: 'CADASTRO_PRODUTOR' } as any,
    });
    const p = await prisma.protocolSimplified.create({
      data: { number: `SMKLEG-${STAMP}-PR`, title: 'Produtor', citizenId: citizen.id, serviceId: svc.id, departmentId: dept.id, status: 'PROGRESSO', customData: { tipoProdutor: 'Agricultura familiar', dap: '123' } } as any,
    });
    await convertProtocolToAppOnApproval(p.id);
    const produtor = await prisma.produtorRural.findFirst({ where: { protocolId: p.id } });
    check('aprovar o cadastro cria o produtor rural', produtor?.citizenId === citizen.id && produtor?.nome === citizen.name, produtor);
    await convertProtocolToAppOnApproval(p.id);
    check('aprovar de novo não duplica o produtor', (await prisma.produtorRural.count({ where: { citizenId: citizen.id } })) === 1);
  });
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
