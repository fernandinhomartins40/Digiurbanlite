/**
 * Gabinete do Prefeito: quem tem o perfil "Gabinete" marcado no cadastro do
 * servidor (prefeito, vice, chefe de gabinete, equipe). Antes era "ser
 * Administrador" — e o técnico de TI via o painel do prefeito, enquanto a
 * equipe do gabinete precisava virar administradora do sistema inteiro.
 * O Super-admin (plataforma) sempre pode.
 */

import { NextFunction, Request, Response } from 'express';

export function hasGabineteAccess(user: { role?: string | null; gabineteAccess?: boolean | null } | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.gabineteAccess === true);
}

export function requireGabinete(req: Request, res: Response, next: NextFunction): void {
  if (!hasGabineteAccess((req as any).user)) {
    res.status(403).json({ error: 'Acesso restrito ao Gabinete do Prefeito' });
    return;
  }
  next();
}
