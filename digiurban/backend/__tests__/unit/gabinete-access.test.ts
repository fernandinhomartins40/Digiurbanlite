/**
 * Gabinete do Prefeito: acesso pelo perfil "Gabinete" do servidor, não pelo
 * papel de Administrador do sistema.
 */

import { hasGabineteAccess } from '../../src/middleware/gabinete-auth';

describe('acesso ao Gabinete do Prefeito', () => {
  it('vale o perfil Gabinete, qualquer que seja o papel', () => {
    expect(hasGabineteAccess({ role: 'USER', gabineteAccess: true })).toBe(true);
    expect(hasGabineteAccess({ role: 'MANAGER', gabineteAccess: true })).toBe(true);
  });

  it('administrador do sistema sem o perfil não entra (ex.: técnico de TI)', () => {
    expect(hasGabineteAccess({ role: 'ADMIN', gabineteAccess: false })).toBe(false);
  });

  it('super-admin da plataforma sempre entra; sem usuário, ninguém', () => {
    expect(hasGabineteAccess({ role: 'SUPER_ADMIN' })).toBe(true);
    expect(hasGabineteAccess(null)).toBe(false);
  });
});
