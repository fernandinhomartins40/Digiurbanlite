import { buildActivationSteps, withDismissedCard, ActivationFacts } from '../../src/services/activation/activation-rules';

const empty: ActivationFacts = {
  hasLogo: false,
  departmentsReviewed: false,
  activeUsers: 1,
  usersWithAssignment: 1,
  activeServices: 400,
  reviewedServices: 0,
  botPublished: false,
  hasMailSender: false,
  linkedProcessRoles: 0,
  protocols: 0,
};

describe('primeiros passos', () => {
  it('município recém-criado: nada feito, todo passo com link (menos o brasão)', () => {
    const r = buildActivationSteps(empty);
    expect(r.feitos).toBe(0);
    expect(r.completo).toBe(false);
    expect(r.percentual).toBe(0);
    for (const s of r.steps) {
      if (s.key === 'municipio') expect(s.link).toBeNull();
      else expect(s.link).toMatch(/^\/admin\//);
    }
  });

  it('o primeiro servidor sozinho não conta como equipe cadastrada', () => {
    const r = buildActivationSteps({ ...empty, activeUsers: 2, usersWithAssignment: 2 });
    const byKey = Object.fromEntries(r.steps.map((s) => [s.key, s.feito]));
    expect(byKey.servidores).toBe(true);
    expect(byKey.lotacoes).toBe(true);
    expect(byKey.servicos).toBe(false);
  });

  it('tudo feito = 100% e completo', () => {
    const r = buildActivationSteps({
      hasLogo: true, departmentsReviewed: true, activeUsers: 5, usersWithAssignment: 3, activeServices: 10,
      reviewedServices: 1, botPublished: true, hasMailSender: true, linkedProcessRoles: 2, protocols: 1,
    });
    expect(r.completo).toBe(true);
    expect(r.percentual).toBe(100);
  });

  it('dispensar mantém o resto das preferências e não repete', () => {
    const layout = { quickAccessUsage: [{ href: '/admin/x' }], dismissedCards: ['welcome'] };
    const a = withDismissedCard(layout, 'activation');
    expect(a.quickAccessUsage).toEqual(layout.quickAccessUsage);
    expect(a.dismissedCards).toEqual(['welcome', 'activation']);
    expect(withDismissedCard(a, 'activation').dismissedCards).toEqual(['welcome', 'activation']);
    expect(withDismissedCard(null, 'welcome').dismissedCards).toEqual(['welcome']);
  });
});
