/**
 * Qual sessão vale nesta chamada.
 *
 * O mesmo navegador pode ter a sessão de servidor E a de cidadão (ex.: um
 * servidor que também usa o portal). Antes a de servidor sempre vencia, e no
 * portal do cidadão o chat funcionava "como servidor". Agora vale a do portal
 * em que a pessoa está: pelo `portal` que a tela informa (tempo real) ou pela
 * página de origem da chamada (HTTP).
 */

export type Portal = 'citizen' | 'admin' | 'platform';

export function portalFrom(hint?: unknown, referer?: string): Portal {
  if (hint === 'citizen' || hint === 'admin' || hint === 'platform') return hint;
  try {
    const path = referer ? new URL(referer).pathname : '';
    if (path.startsWith('/cidadao') || path.startsWith('/convites')) return 'citizen';
    if (path.startsWith('/super-admin')) return 'platform';
  } catch {
    // referer inválido: segue o padrão
  }
  return 'admin';
}

export function pickSessionToken(cookies: Record<string, string | undefined>, portal: Portal): string | undefined {
  const admin = cookies.digiurban_admin_token;
  const citizen = cookies.digiurban_citizen_token;
  const platform = cookies.digiurban_platform_token;
  if (portal === 'citizen') return citizen || admin || platform;
  if (portal === 'platform') return platform || admin || citizen;
  return admin || citizen || platform;
}

/**
 * O backend emite `type` ('admin' | 'citizen' | 'platform'); o chat usa
 * `userType` (SERVER | CITIZEN). Operador da plataforma entra como SERVER
 * "platform:<id>", sem município.
 */
export function normalizeChatPayload<T extends Record<string, any>>(payload: T): T & { userId?: string; userType?: any; isPlatformOperator?: boolean } {
  const out: any = { ...payload };
  if (out.type === 'platform' && out.platformUserId) {
    out.userId = `platform:${out.platformUserId}`;
    out.userType = 'SERVER';
    out.name = out.name || 'Equipe DigiUrban';
    out.isPlatformOperator = true;
  }
  if (!out.userId && out.citizenId) out.userId = out.citizenId;
  if (!out.userType && out.type) out.userType = out.type === 'citizen' ? 'CITIZEN' : 'SERVER';
  return out;
}

export function parseCookieHeader(header?: string): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce(
    (acc, part) => {
      const index = part.indexOf('=');
      if (index > 0) {
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        try {
          acc[key] = decodeURIComponent(value);
        } catch {
          acc[key] = value;
        }
      }
      return acc;
    },
    {} as Record<string, string>
  );
}
