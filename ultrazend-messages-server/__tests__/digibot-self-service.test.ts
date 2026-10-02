/**
 * DigiBot — conversas-roteiro do autoatendimento (perfil, ajuda, avaliação,
 * documentos) e das palavras reservadas. Sem banco: o "sistema" é simulado.
 * Se uma mudança quebrar um caminho do cidadão, o teste falha no build.
 */
import { CitizenSelfService, SelfServiceContext } from '../src/bot/ai/CitizenSelfService';
import { CitizenAiSessionState } from '../src/bot/ai/types';
import { detectReservedAction } from '../src/bot/ReservedKeywords';

type Call = { name: string; params: Record<string, unknown> };

function harness(data: Partial<Record<string, any>> = {}) {
  const calls: Call[] = [];
  let saved: CitizenAiSessionState | null = null;
  const actions: Record<string, (p: any) => any> = {
    getCitizenProfile: () => ({ profile: { name: 'Maria Souza', cpf: '52998224725', email: 'm@t.local', phone: '43999990000', address: { cidade: 'Londrina', uf: 'PR' } } }),
    updateCitizenProfile: () => ({ profile: {} }),
    getDocuments: () => ({ documents: data.documents || [] }),
    getProtocols: () => ({ protocols: data.protocols || [] }),
    getProtocolDocuments: () => ({ documents: [] }),
    getFamilyMembers: () => ({ members: data.members || [] }),
    getNotifications: (p: any) => ({ notifications: p.unreadOnly ? data.unread || [] : data.all || [] }),
    markNotificationsAsRead: () => ({ marked: true }),
    getPendingEvaluations: () => ({ protocols: data.evaluations || [] }),
    submitEvaluation: () => ({ evaluation: {} }),
  };
  const ctx: SelfServiceContext = {
    execution: { id: 'ex1', flowId: 'f1', citizenId: 'c1' } as any,
    runAction: async (name, params) => {
      calls.push({ name, params });
      return actions[name]?.(params) ?? {};
    },
    meta: (session) => ({ nodeId: session.stage } as any),
    persist: async (session) => {
      saved = session;
    },
    welcome: () => ({ message: 'MENU', messageType: 'menu', data: { options: [] } }),
    requestHuman: async (session) => ({ session: { ...session, stage: 'paused_human' }, requestHumanHandover: true, response: { message: 'ATENDENTE', messageType: 'text' } }),
    faqs: () => data.faqs || [],
  };
  const svc = new CitizenSelfService(ctx);
  const base: CitizenAiSessionState = { engine: 'ai_assistant', stage: 'triage' };
  return { svc, calls, base, saved: () => saved };
}

const optionIds = (d: any) => (d.response.data?.options || []).map((o: any) => o.id);

describe('Ajuda', () => {
  it('menu de ajuda → perguntas frequentes → resposta', async () => {
    const { svc, base } = harness();
    let d = await svc.enter('ajuda', base);
    expect(d.session.stage).toBe('help_menu');
    expect(optionIds(d)).toEqual(expect.arrayContaining(['como_funciona', 'perguntas', 'falar_atendente', 'voltar_menu']));
    d = (await svc.handle(d.session, 'perguntas'))!;
    expect(d.session.stage).toBe('faq_menu');
    d = (await svc.handle(d.session, '1'))!; // pela posição
    expect(d.response.message).toMatch(/prazo/i);
  });

  it('usa as perguntas do município quando existem', async () => {
    const { svc, base } = harness({ faqs: [{ id: 'f1', question: 'Qual o horário?', answer: 'Das 8h às 17h.' }] });
    let d = await svc.enter('ajuda', base);
    d = (await svc.handle(d.session, 'perguntas'))!;
    expect(optionIds(d)).toContain('faq_f1');
    d = (await svc.handle(d.session, 'faq_f1'))!;
    expect(d.response.message).toContain('Das 8h às 17h.');
  });

  it('falar com atendente pela ajuda', async () => {
    const { svc, base } = harness();
    const d = await svc.enter('ajuda', base);
    const h = (await svc.handle(d.session, 'falar_atendente'))!;
    expect(h.requestHumanHandover).toBe(true);
  });

  it('opção que não é desta etapa devolve null (o assistente trata)', async () => {
    const { svc, base } = harness();
    const d = await svc.enter('ajuda', base);
    expect(await svc.handle(d.session, 'consultar_protocolo')).toBeNull();
  });
});

describe('Meu perfil', () => {
  it('mostra dados com CPF mascarado', async () => {
    const { svc, base } = harness();
    const d = await svc.enter('meu_perfil', base);
    expect(d.response.message).toContain('529.***.***-25');
    expect(d.response.message).not.toContain('52998224725');
  });

  it('valida e salva e-mail', async () => {
    const { svc, base, calls } = harness();
    let d = await svc.enter('meu_perfil', base);
    d = (await svc.handle(d.session, 'atualizar_dados'))!;
    d = (await svc.handle(d.session, 'email'))!;
    d = (await svc.handle(d.session, 'nao-e-email'))!;
    expect(d.response.message).toMatch(/não parece válido/);
    expect(calls.some((c) => c.name === 'updateCitizenProfile')).toBe(false);
    d = (await svc.handle(d.session, 'Nova@Email.com'))!;
    expect(calls.find((c) => c.name === 'updateCitizenProfile')?.params).toEqual({ email: 'nova@email.com' });
    expect(d.response.message).toMatch(/atualizados/);
  });

  it('endereço passo a passo, com complemento opcional', async () => {
    const { svc, base, calls } = harness();
    let d = await svc.enter('meu_perfil', base);
    d = (await svc.handle(d.session, 'atualizar_dados'))!;
    d = (await svc.handle(d.session, 'address'))!;
    for (const v of ['86010000', 'Rua A', '10', 'pular', 'Centro', 'Londrina', 'pr']) d = (await svc.handle(d.session, v))!;
    expect(calls.find((c) => c.name === 'updateCitizenProfile')?.params).toEqual({
      address: { cep: '86010-000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Londrina', uf: 'PR' },
    });
  });

  it('telefone precisa de DDD', async () => {
    const { svc, base } = harness();
    let d = await svc.enter('meu_perfil', base);
    d = (await svc.handle(d.session, 'atualizar_dados'))!;
    d = (await svc.handle(d.session, 'phone'))!;
    d = (await svc.handle(d.session, '99999'))!;
    expect(d.response.message).toMatch(/DDD/);
  });
});

describe('Avaliação', () => {
  it('escolhe atendimento, dá nota e comenta', async () => {
    const { svc, base, calls } = harness({ evaluations: [{ id: 'p1', label: '#2026-1 - Poda' }] });
    let d = await svc.enter('avaliacao', base);
    expect(optionIds(d)).toContain('p1');
    d = (await svc.handle(d.session, 'p1'))!;
    d = (await svc.handle(d.session, '5'))!;
    expect(d.session.stage).toBe('evaluation_comment');
    await svc.handle(d.session, 'Muito bom');
    expect(calls.find((c) => c.name === 'submitEvaluation')?.params).toEqual({ protocolId: 'p1', rating: 5, comment: 'Muito bom' });
  });

  it('sem pendências avisa e volta ao menu', async () => {
    const { svc, base } = harness();
    const d = await svc.enter('avaliacao', base);
    expect(d.response.message).toMatch(/não tem atendimentos para avaliar/);
    expect(d.session.stage).toBe('triage');
  });
});

describe('Documentos e avisos', () => {
  it('sem documentos: mensagem clara', async () => {
    const { svc, base } = harness();
    const d = await svc.enter('documentos', base);
    expect(d.response.message).toMatch(/ainda não tem documentos/);
  });

  it('marca avisos como lidos', async () => {
    const { svc, base, calls } = harness({ unread: [{ id: 'n1', label: 'Pedido concluído', description: 'ok', metadata: {} }] });
    let d = await svc.enter('notificacoes', base);
    expect(d.response.message).toContain('Pedido concluído');
    d = (await svc.handle(d.session, 'marcar_lidos'))!;
    expect(calls.some((c) => c.name === 'markNotificationsAsRead')).toBe(true);
  });
});

describe('Palavras reservadas', () => {
  it('comandos curtos funcionam', () => {
    expect(detectReservedAction('menu')).toBe('menu');
    expect(detectReservedAction('sair')).toBe('cancel');
    expect(detectReservedAction('quero falar com atendente')).toBe('human');
  });
  it('frase longa com a expressão NÃO vira comando', () => {
    expect(detectReservedAction('não entendi a cobrança do IPTU que chegou, quero revisar o valor')).toBeNull();
  });
});
