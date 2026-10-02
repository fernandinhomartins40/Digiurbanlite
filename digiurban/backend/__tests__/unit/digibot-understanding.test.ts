/**
 * DigiBot — entendimento SEM IA (busca de serviços, perguntas e proteções da
 * configuração). Frases reais de cidadãos: se alguma deixar de achar o serviço
 * certo, o teste falha antes de chegar em produção.
 */
import { describe, expect, it, jest } from '@jest/globals';

const terms: Array<{ serviceId: string; term: string }> = [];
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    botServiceTerm: { findMany: async ({ where }: any) => terms.filter((t) => where.serviceId.in.includes(t.serviceId)) },
  },
}));
jest.mock('../../src/lib/tenant-context', () => ({ tryGetTenantId: () => 'tenant-teste' }));

import { normalizeText, scoreMatch, tokens } from '../../src/services/digibot/text-match';
import { ESSENTIAL_MENU, sanitizeConfig, searchServicesForBot } from '../../src/services/digibot/digibot.service';

const svc = (id: string, name: string, department: string, description = '', category = '') => ({
  id,
  name,
  description,
  category,
  department: { id: `d-${department}`, name: department },
});

const CATALOG = [
  svc('cartao', 'Cartão do Estudante', 'Secretaria de Mobilidade Urbana', 'Carteira de transporte para estudantes'),
  svc('passe', 'Declaração de Passe Livre', 'Secretaria de Mobilidade Urbana', 'Gratuidade no transporte coletivo'),
  svc('buraco', 'Tapa-buraco e manutenção de vias', 'Secretaria de Obras', 'Reparo de pavimentação e asfalto'),
  svc('luz', 'Iluminação pública', 'Secretaria de Obras', 'Troca de lâmpadas e reparo de postes'),
  svc('poda', 'Poda de árvore', 'Secretaria de Meio Ambiente', 'Poda e remoção de árvores em via pública'),
  svc('remedio', 'Retirada de medicamentos', 'Secretaria de Saúde', 'Farmácia municipal'),
  svc('iptu', 'Segunda via do IPTU', 'Secretaria de Fazenda', 'Emissão de guia do imposto predial'),
  svc('coleta', 'Coleta de entulho', 'Secretaria de Obras', 'Recolhimento de resíduos de construção'),
  svc('certidao', 'Certidão de tempo de serviço', 'Secretaria de Administração'),
];

const best = async (frase: string) => (await searchServicesForBot(frase, CATALOG, 6)).map((s) => s.id);

describe('busca de serviços sem IA', () => {
  const casos: Array<[string, string]> = [
    ['quero o cartão do estudante', 'cartao'],
    ['meu filho precisa fazer a carteirinha pra ir pra escola', 'cartao'],
    ['carterinha de estudnte', 'cartao'],
    ['tem um buraco enorme na minha rua', 'buraco'],
    ['a lampada do poste da esquina queimou', 'luz'],
    ['quero podar uma arvore na calçada', 'poda'],
    ['preciso pegar remedio na farmacia', 'remedio'],
    ['segunda via do iptu', 'iptu'],
    ['como faço pra tirar o entulho da obra', 'coleta'],
  ];
  for (const [frase, esperado] of casos) {
    it(`"${frase}" → ${esperado}`, async () => {
      const ids = await best(frase);
      expect(ids[0]).toBe(esperado);
    });
  }

  it('vencedor claro abre direto (só 1 resultado)', async () => {
    expect(await best('quero o cartão do estudante')).toEqual(['cartao']);
  });

  it('frase sem sentido não inventa serviço', async () => {
    expect(await best('xpto zzz qwerty')).toEqual([]);
    expect(await best('oi bom dia')).toEqual([]);
  });

  it('palavra cadastrada pelo município leva ao serviço', async () => {
    expect((await best('quero meu bilhete unico'))[0]).not.toBe('passe');
    terms.push({ serviceId: 'passe', term: 'bilhete único' });
    expect((await best('quero meu bilhete unico'))[0]).toBe('passe');
    terms.length = 0;
  });
});

describe('texto', () => {
  it('normaliza acentos e pontuação', () => {
    expect(normalizeText('  Cartão  do Estudante!! ')).toBe('cartao do estudante');
  });
  it('tira palavras de enchimento', () => {
    expect(tokens('eu quero fazer o pedido do meu filho')).toEqual(['pedido']);
  });
  it('pergunta frequente: casa pela pergunta e pelas outras formas', () => {
    const doc = { fields: [{ text: 'Qual o horário da prefeitura?', weight: 3 }, { text: 'que horas abre funcionamento', weight: 3 }], phrases: ['que horas abre'] };
    expect(scoreMatch('que horas abre a prefeitura?', doc)).toBeGreaterThanOrEqual(0.6);
    expect(scoreMatch('quero podar uma arvore', doc)).toBeLessThan(0.6);
  });
});

describe('configuração do bot (proteções)', () => {
  it('essenciais nunca saem do menu', () => {
    const cfg = sanitizeConfig({ menu: ESSENTIAL_MENU.map((id) => ({ id, label: 'x', enabled: false })) });
    for (const id of ESSENTIAL_MENU) expect(cfg.menu.find((m) => m.id === id)?.enabled).toBe(true);
  });
  it('itens desconhecidos são descartados e os que faltam voltam', () => {
    const cfg = sanitizeConfig({ menu: [{ id: 'hack', label: 'x', enabled: true }] });
    expect(cfg.menu.some((m) => (m as any).id === 'hack')).toBe(false);
    expect(cfg.menu.some((m) => m.id === 'ajuda')).toBe(true);
  });
  it('textos longos são cortados e vazios voltam ao padrão', () => {
    const cfg = sanitizeConfig({ welcomeMessage: 'x'.repeat(5000), botName: '' });
    expect(cfg.welcomeMessage.length).toBeLessThanOrEqual(400);
    expect(cfg.botName).toBe('DigiBot');
  });
  it('teto de IA fica entre 0 e 50', () => {
    expect(sanitizeConfig({ aiCallsPerConversation: 999 }).aiCallsPerConversation).toBe(50);
    expect(sanitizeConfig({ aiCallsPerConversation: -3 }).aiCallsPerConversation).toBe(0);
    expect(sanitizeConfig({}).aiCallsPerConversation).toBe(15);
  });
});
