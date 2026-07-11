/**
 * ============================================================================
 * SEED CLI — PRIMEIRO OPERADOR DE PLATAFORMA (Fase C Multi-Tenant)
 * ============================================================================
 * Cria (ou reativa) um PlatformUser PLATFORM_ADMIN. Deliberadamente um script
 * CLI, não um endpoint — o bootstrap do primeiro operador não pode depender de
 * um endpoint público nem do SUPER_ADMIN de tenant (achado R2).
 *
 * Uso:
 *   DATABASE_URL=... npx ts-node --transpile-only scripts/create-platform-admin.ts \
 *     --email admin@plataforma.com --name "Operador" [--password <senha>]
 *
 * Sem --password: gera senha temporária, exibe UMA vez e marca
 * mustChangePassword.
 */

import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform } from '../src/lib/tenant-context';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const email = getArg('--email');
  const name = getArg('--name');
  const explicitPassword = getArg('--password');

  if (!email || !name) {
    console.error('Uso: create-platform-admin.ts --email <email> --name "<nome>" [--password <senha>]');
    process.exit(1);
  }

  const password = explicitPassword || crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await runAsPlatform(async () =>
    prisma.platformUser.upsert({
      where: { email },
      update: {
        name,
        password: passwordHash,
        isActive: true,
        mustChangePassword: !explicitPassword,
      },
      create: {
        email,
        name,
        password: passwordHash,
        role: 'PLATFORM_ADMIN',
        mustChangePassword: !explicitPassword,
      },
    })
  );

  console.log('✅ Operador de plataforma pronto:');
  console.log(`   id:    ${user.id}`);
  console.log(`   email: ${user.email}`);
  console.log(`   role:  ${user.role}`);
  if (!explicitPassword) {
    console.log(`   senha temporária (exibida UMA única vez): ${password}`);
    console.log('   ⚠️  Troque no primeiro login (mustChangePassword ativo).');
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('Erro ao criar operador de plataforma:', error);
  process.exit(1);
});
