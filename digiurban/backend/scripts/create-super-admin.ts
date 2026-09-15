/**
 * Script para criar usuário Super Admin
 * Execute: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Criando usuário Super Admin...\n');

    // Credenciais do Super Admin
    const email = 'superadmin@digiurban.com';
    const password = 'DigiUrban@2024!';
    const name = 'Super Administrador';

    // ⚠️ MULTI-TENANT (corrigido 2026-09-15): este script usava
    // `findUnique({ where: { email } })` e criava o usuário SEM tenantId — padrão
    // pré-multi-tenant. Desde o plano 2026-07-13 a unique de User é COMPOSTA
    // (`users_tenantId_email_key`), então `findUnique` por email sozinho nem
    // compila no Prisma e o seed falhava em TODO deploy com
    // PrismaClientValidationError. O deploy seguia (o passo é não-fatal), mas o
    // banco ficava SEM nenhum super-admin — impossível logar no painel.
    //
    // Correção: `findFirst` (a tenant extension escopa) + tenantId explícito.
    // `runAsPlatform` roda fora do escopo de tenant, necessário para criar/ler
    // o próprio tenant default.
    await runAsPlatform(async () => {
      // O tenant default precisa existir antes do usuário (FK + unique composta).
      // Idempotente: em banco já provisionado o upsert não altera nada.
      await prisma.tenant.upsert({
        where: { id: DEFAULT_TENANT_ID },
        update: {},
        create: {
          id: DEFAULT_TENANT_ID,
          slug: 'default',
          nome: 'Município Padrão',
          cnpj: '00000000000000',
          nomeMunicipio: 'Município Padrão',
          ufMunicipio: 'SP',
          status: 'ACTIVE',
        } as any,
      });

      // Verificar se já existe — findFirst, não findUnique (unique é composta)
      const existing = await prisma.user.findFirst({
        where: { email, tenantId: DEFAULT_TENANT_ID },
      });

      if (existing) {
        console.log('⚠️  Super Admin já existe!');
        console.log('\n📧 Email:', email);
        console.log('🔑 Senha: (não alterada)\n');

        // Garantir que tem role SUPER_ADMIN
        if (existing.role !== 'SUPER_ADMIN') {
          await prisma.user.update({
            where: { id: existing.id },
            data: { role: 'SUPER_ADMIN' },
          });
          console.log('✅ Role atualizado para SUPER_ADMIN\n');
        }

        return;
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      await prisma.user.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          email,
          password: hashedPassword, // Campo password já armazena o hash
          name,
          role: 'SUPER_ADMIN',
          isActive: true,
        } as any,
      });
    });

    console.log('✅ Super Admin criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIAIS DE ACESSO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Senha:    ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 URL:      http://localhost:3000/super-admin/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (error) {
    console.error('❌ Erro ao criar Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('✨ Script finalizado!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
