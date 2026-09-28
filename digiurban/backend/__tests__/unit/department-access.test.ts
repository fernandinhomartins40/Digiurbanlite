import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));
jest.mock('../../src/middleware/admin-auth', () => ({ adminAuthMiddleware: jest.fn() }));

import { canAccessDepartmentApp } from '../../src/middleware/department-access';

describe('canAccessDepartmentApp', () => {
  it('ADMIN e SUPER_ADMIN acessam qualquer app', () => {
    expect(canAccessDepartmentApp('ADMIN', [], ['SAUDE'])).toBe(true);
    expect(canAccessDepartmentApp('SUPER_ADMIN', ['CULTURA'], ['SAUDE'])).toBe(true);
  });

  it('equipe acessa o app da própria secretaria, em qualquer role', () => {
    for (const role of ['USER', 'COORDINATOR', 'MANAGER']) {
      expect(canAccessDepartmentApp(role, ['SAUDE'], ['SAUDE'])).toBe(true);
    }
  });

  it('equipe de outra secretaria não acessa', () => {
    expect(canAccessDepartmentApp('MANAGER', ['CULTURA'], ['SAUDE'])).toBe(false);
    expect(canAccessDepartmentApp('USER', [], ['SAUDE'])).toBe(false);
  });

  it('app compartilhado (licenciamento) aceita qualquer uma das secretarias', () => {
    const codes = ['OBRAS_PUBLICAS', 'PLANEJAMENTO_URBANO'];
    expect(canAccessDepartmentApp('USER', ['PLANEJAMENTO_URBANO'], codes)).toBe(true);
    expect(canAccessDepartmentApp('USER', ['HABITACAO'], codes)).toBe(false);
  });

  it('vínculo secundário conta e a comparação ignora caixa', () => {
    expect(canAccessDepartmentApp('USER', ['EDUCACAO', 'SAUDE'], ['saude'])).toBe(true);
  });
});
