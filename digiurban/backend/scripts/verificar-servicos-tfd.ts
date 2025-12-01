/**
 * 🔍 VERIFICAR SERVIÇOS TFD
 *
 * Lista todos os serviços relacionados a TFD
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarServicosTFD() {
  console.log('\n🔍 ============================================');
  console.log('   SERVIÇOS TFD CADASTRADOS');
  console.log('============================================\n');

  try {
    // Buscar serviços TFD
    const servicosTFD = await prisma.serviceSimplified.findMany({
      where: {
        OR: [
          { name: { contains: 'TFD', mode: 'insensitive' } },
          { name: { contains: 'Tratamento Fora', mode: 'insensitive' } },
          { moduleType: { contains: 'TFD' } },
          { moduleType: 'ENCAMINHAMENTOS_TFD' }
        ]
      },
      include: {
        department: true
      }
    });

    if (servicosTFD.length === 0) {
      console.log('   ⚠️  Nenhum serviço TFD cadastrado!\n');
    } else {
      console.log(`   ✅ ${servicosTFD.length} serviço(s) TFD encontrado(s)\n`);

      servicosTFD.forEach((s, idx) => {
        console.log(`   ${idx + 1}. Nome: ${s.name}`);
        console.log(`      ID: ${s.id}`);
        console.log(`      Departamento: ${s.department?.name || 'N/A'}`);
        console.log(`      Module Type: ${s.moduleType || 'N/A'}`);
        console.log(`      Service Type: ${s.serviceType}`);
        console.log(`      Ativo: ${s.isActive ? 'SIM' : 'NÃO'}`);
        console.log(`      Descrição: ${s.description || 'N/A'}`);
        console.log('');
      });
    }

    // Verificar se existe departamento de saúde
    console.log('\n🏥 DEPARTAMENTO DE SAÚDE...\n');
    const deptSaude = await prisma.department.findFirst({
      where: {
        name: { contains: 'Saúde', mode: 'insensitive' }
      }
    });

    if (deptSaude) {
      console.log(`   ✅ Departamento de Saúde: ${deptSaude.name}`);
      console.log(`      ID: ${deptSaude.id}\n`);
    } else {
      console.log('   ⚠️  Departamento de Saúde não encontrado!\n');
    }

    console.log('============================================');
    console.log('   FIM DA VERIFICAÇÃO');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ ERRO durante verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
verificarServicosTFD();
