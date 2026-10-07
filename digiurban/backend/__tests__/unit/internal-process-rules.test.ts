/**
 * Processo interno: quem vê, quem age e a sugestão de unidade de destino.
 */

import { canActOnProcess, canViewProcess, suggestUnits } from '../../src/services/internal-process/rules';

const base = {
  confidential: false,
  createdById: 'u-criador',
  originUnitId: 'un-obras',
  currentUnitId: 'un-juridico',
  currentUserId: null,
  originDepartmentId: 'd-obras',
  currentDepartmentId: 'd-adm',
  involvedUnitIds: ['un-obras', 'un-juridico'],
  involvedUserIds: ['u-criador'],
};
const actor = (over: Partial<{ id: string; role: string; unitIds: string[]; departmentIds: string[] }>) => ({
  id: 'u-x',
  role: 'USER',
  unitIds: [] as string[],
  departmentIds: [] as string[],
  ...over,
});

describe('processo interno — quem vê e quem age', () => {
  it('quem participa vê; atendente de fora não vê', () => {
    expect(canViewProcess(actor({ unitIds: ['un-juridico'] }), base)).toBe(true);
    expect(canViewProcess(actor({ id: 'u-criador' }), base)).toBe(true);
    expect(canViewProcess(actor({ unitIds: ['un-saude'] }), base)).toBe(false);
  });

  it('gestor da secretaria por onde passa vê; administrador vê', () => {
    expect(canViewProcess(actor({ role: 'MANAGER', departmentIds: ['d-obras'] }), base)).toBe(true);
    expect(canViewProcess(actor({ role: 'MANAGER', departmentIds: ['d-saude'] }), base)).toBe(false);
    expect(canViewProcess(actor({ role: 'ADMIN' }), base)).toBe(true);
  });

  it('sigiloso: só quem participa, nem o administrador', () => {
    const secret = { ...base, confidential: true };
    expect(canViewProcess(actor({ role: 'ADMIN' }), secret)).toBe(false);
    expect(canViewProcess(actor({ unitIds: ['un-juridico'] }), secret)).toBe(true);
  });

  it('só a unidade atual (ou a pessoa com ele) age', () => {
    expect(canActOnProcess(actor({ unitIds: ['un-juridico'] }), base)).toBe(true);
    expect(canActOnProcess(actor({ unitIds: ['un-obras'] }), base)).toBe(false);
    expect(canActOnProcess(actor({ id: 'u-p' }), { ...base, currentUserId: 'u-p' })).toBe(true);
  });
});

describe('processo interno — sugestão de destino', () => {
  const units = [
    { id: 'a', nome: 'Diretoria de Pavimentação', competencias: ['buracos', 'asfalto', 'calçadas'], departmentName: 'Obras Públicas' },
    { id: 'b', nome: 'Procuradoria Jurídica', competencias: ['pareceres jurídicos', 'contratos', 'licitações'], departmentName: 'Administração' },
    { id: 'c', nome: 'Setor de Compras', competencias: ['compras', 'material'], departmentName: 'Administração' },
  ];

  it('acha a unidade pelas competências', () => {
    expect(suggestUnits('Pedido de parecer jurídico sobre contrato', units)[0].id).toBe('b');
    expect(suggestUnits('Asfalto da rua Sete precisa de reparo', units)[0].id).toBe('a');
    expect(suggestUnits('Requisição de material de escritório', units)[0].id).toBe('c');
  });

  it('sem palavra útil, não sugere nada', () => {
    expect(suggestUnits('de para a o', units)).toEqual([]);
  });
});
