/**
 * Equipe da plataforma (PlatformUser): quem opera o console /super-admin.
 * Papéis: PLATFORM_ADMIN (tudo) e PLATFORM_SUPPORT (consulta e ajuda).
 *
 * Regras de segurança:
 *   - ninguém desativa nem rebaixa a si mesmo;
 *   - a plataforma nunca fica sem nenhum administrador ativo;
 *   - senhas novas/redefinidas são temporárias (troca obrigatória no 1º acesso);
 *   - o SUPER_ADMIN legado de mesmo e-mail (tenant default) acompanha a senha,
 *     para as duas identidades não divergirem.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { DEFAULT_TENANT_ID, runAsPlatform } from '../lib/tenant-context';

export type PlatformRoleName = 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT';

export class TeamError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

const tempPassword = () => crypto.randomBytes(9).toString('base64url');

async function syncLegacyPassword(email: string, hash: string, mustChange: boolean): Promise<void> {
  await prisma.user
    .updateMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: 'SUPER_ADMIN',
        OR: [{ tenantId: DEFAULT_TENANT_ID }, { tenantId: null }],
      },
      data: { password: hash, mustChangePassword: mustChange },
    })
    .catch(() => undefined);
}

export async function listTeam() {
  return runAsPlatform(async () =>
    prisma.platformUser.findMany({ select: PUBLIC_FIELDS, orderBy: [{ isActive: 'desc' }, { name: 'asc' }] })
  );
}

export async function inviteMember(input: { name: string; email: string; role: PlatformRoleName }) {
  const email = input.email.trim().toLowerCase();
  const password = tempPassword();
  return runAsPlatform(async () => {
    const exists = await prisma.platformUser.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (exists) throw new TeamError('Já existe alguém da equipe com este e-mail', 409);
    const member = await prisma.platformUser.create({
      data: { name: input.name.trim(), email, role: input.role, password: await bcrypt.hash(password, 12), mustChangePassword: true },
      select: PUBLIC_FIELDS,
    });
    return { member, temporaryPassword: password };
  });
}

async function assertKeepsAnAdmin(targetId: string) {
  const admins = await prisma.platformUser.count({
    where: { role: 'PLATFORM_ADMIN', isActive: true, id: { not: targetId } },
  });
  if (admins === 0) throw new TeamError('A plataforma precisa de pelo menos um administrador ativo');
}

export async function updateMember(
  actorId: string,
  id: string,
  input: { name?: string; role?: PlatformRoleName; isActive?: boolean }
) {
  return runAsPlatform(async () => {
    const member = await prisma.platformUser.findUnique({ where: { id } });
    if (!member) throw new TeamError('Pessoa não encontrada', 404);

    const demoting = input.role && input.role !== 'PLATFORM_ADMIN' && member.role === 'PLATFORM_ADMIN';
    const deactivating = input.isActive === false && member.isActive;
    if ((demoting || deactivating) && id === actorId) {
      throw new TeamError('Você não pode tirar o seu próprio acesso de administrador');
    }
    if ((demoting || deactivating) && member.role === 'PLATFORM_ADMIN') await assertKeepsAnAdmin(id);

    return prisma.platformUser.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
      },
      select: PUBLIC_FIELDS,
    });
  });
}

export async function resetMemberPassword(id: string) {
  const password = tempPassword();
  return runAsPlatform(async () => {
    const member = await prisma.platformUser.findUnique({ where: { id } });
    if (!member) throw new TeamError('Pessoa não encontrada', 404);
    const hash = await bcrypt.hash(password, 12);
    await prisma.platformUser.update({ where: { id }, data: { password: hash, mustChangePassword: true } });
    await syncLegacyPassword(member.email, hash, true);
    return { temporaryPassword: password };
  });
}

export async function changeOwnPassword(id: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) throw new TeamError('A nova senha precisa ter pelo menos 8 caracteres');
  return runAsPlatform(async () => {
    const member = await prisma.platformUser.findUnique({ where: { id } });
    if (!member) throw new TeamError('Pessoa não encontrada', 404);
    if (!(await bcrypt.compare(currentPassword, member.password))) throw new TeamError('Senha atual incorreta', 401);
    if (await bcrypt.compare(newPassword, member.password)) throw new TeamError('A nova senha precisa ser diferente da atual');
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.platformUser.update({ where: { id }, data: { password: hash, mustChangePassword: false } });
    await syncLegacyPassword(member.email, hash, false);
  });
}
