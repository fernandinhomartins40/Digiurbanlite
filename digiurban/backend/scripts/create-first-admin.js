/**
 * Script para criar primeiro usuário ADMIN
 * Uso: node scripts/create-first-admin.js
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstAdmin() {
  try {
    console.log('🔐 Criando primeiro usuário ADMIN...\n');

    // Verificar se já existe algum admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('⚠️  Já existe um usuário ADMIN no sistema:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}\n`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('Deseja criar outro admin mesmo assim? (s/N): ', async (answer) => {
          readline.close();
          if (answer.toLowerCase() !== 's') {
            console.log('❌ Operação cancelada.');
            await prisma.$disconnect();
            process.exit(0);
          }
          await createAdmin();
          resolve();
        });
      });
    } else {
      await createAdmin();
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function createAdmin() {
  // Dados do admin
  const adminData = {
    email: 'admin@digiurban.com',
    password: 'Admin@123',
    name: 'Administrador DigiUrban',
    role: 'ADMIN'
  };

  // Hash da senha
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // Criar usuário
  const admin = await prisma.user.create({
    data: {
      email: adminData.email,
      password: hashedPassword,
      name: adminData.name,
      role: adminData.role,
      isActive: true
    }
  });

  console.log('✅ Usuário ADMIN criado com sucesso!\n');
  console.log('📧 Email:', adminData.email);
  console.log('🔑 Senha:', adminData.password);
  console.log('👤 Nome:', adminData.name);
  console.log('🎭 Role:', adminData.role);
  console.log('🆔 ID:', admin.id);
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  await prisma.$disconnect();
  process.exit(0);
}

createFirstAdmin();
