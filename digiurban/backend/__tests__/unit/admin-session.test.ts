/** Sessão do painel: renova em uso, cai parada ou depois de 24 h do login */
import { ADMIN_SESSION_MAX_SECONDS, shouldRenewAdminSession } from '../../src/services/admin-session.service';

describe('sessão do painel', () => {
  const now = 1_800_000_000;
  it('não renova cookie recém-emitido', () => {
    expect(shouldRenewAdminSession({ iat: now - 60 }, now)).toBe(false);
  });
  it('renova depois de 10 minutos de uso', () => {
    expect(shouldRenewAdminSession({ iat: now - 11 * 60 }, now)).toBe(true);
  });
  it('não passa de 24 horas desde o login', () => {
    expect(shouldRenewAdminSession({ iat: now - 11 * 60, loginAt: now - ADMIN_SESSION_MAX_SECONDS }, now)).toBe(false);
    expect(shouldRenewAdminSession({ iat: now - 11 * 60, loginAt: now - 3600 }, now)).toBe(true);
  });
});
