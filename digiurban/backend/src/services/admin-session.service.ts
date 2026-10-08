/**
 * Sessão do painel que se renova sozinha enquanto está em uso.
 *
 * O cookie do servidor vale 1 hora (ADMIN_EXPIRES_IN). Antes ele caía 1 hora
 * depois do login mesmo com a pessoa usando (o Painel na TV desligava).
 * Agora, a cada uso com mais de 10 minutos desde o último cookie, sai um cookie
 * novo de 1 hora — parado por 1 hora, a sessão cai como antes. Limite total de
 * 24 horas desde o login (`loginAt`), depois disso pede a senha de novo.
 */

import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { SECURITY_CONFIG } from '../config/security';

const RENEW_AFTER_SECONDS = 10 * 60;
export const ADMIN_SESSION_MAX_SECONDS = 24 * 60 * 60;
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

/** Regra pura: renovar agora? */
export function shouldRenewAdminSession(payload: { iat?: number; loginAt?: number }, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!payload.iat) return false;
  const loginAt = payload.loginAt || payload.iat;
  if (nowSeconds - loginAt >= ADMIN_SESSION_MAX_SECONDS) return false;
  return nowSeconds - payload.iat >= RENEW_AFTER_SECONDS;
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie('digiurban_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

/** Renova o cookie do painel (só quando o token veio do cookie) */
export function renewAdminSession(req: Request, res: Response, decoded: Record<string, any>) {
  try {
    if (!req.cookies?.digiurban_admin_token || res.headersSent) return;
    if (!shouldRenewAdminSession(decoded)) return;
    const { iat, exp, nbf, ...payload } = decoded;
    const token = jwt.sign({ ...payload, loginAt: decoded.loginAt || iat }, process.env.JWT_SECRET!, {
      expiresIn: SECURITY_CONFIG.JWT.ADMIN_EXPIRES_IN as any,
    });
    setAdminCookie(res, token);
  } catch {
    // renovar é melhoria: nunca derruba a requisição
  }
}
