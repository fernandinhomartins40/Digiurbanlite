/**
 * Script para criar usuário Super Admin
 * Execute: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Criando usuário Super Admin...\n');

    // Credenciais do Super Admin
    const email = 'superadmin@digiurban.com';
    const password = 'DigiUrban@2024!';
    const name = 'Super Administrador';

    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('⚠️  Super Admin já existe!');
      console.log('\n📧 Email:', email);
      console.log('🔑 Senha: (não alterada)\n');

      // Garantir que tem role SUPER_ADMIN
      if (existing.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { email },
          data: { role: 'SUPER_ADMIN' }
        });
        console.log('✅ Role atualizado para SUPER_ADMIN\n');
      }

      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Campo password já armazena o hash
        name,
        role: 'SUPER_ADMIN',
        isActive: true
      }
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
