/**
 * 🔍 LISTAR TODOS OS PROTOCOLOS
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listarProtocolos() {
  console.log('\n🔍 ============================================');
  console.log('   LISTAGEM DE PROTOCOLOS');
  console.log('============================================\n');

  try {
    const protocolos = await prisma.protocolSimplified.findMany({
      include: {
        service: {
          select: {
            name: true,
            moduleType: true
          }
        },
        citizen: {
          select: {
            name: true,
            cpf: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`   Total: ${protocolos.length} protocolo(s)\n`);

    protocolos.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.number} - ${p.title}`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Cidadão: ${p.citizen.name}`);
      console.log(`      Serviço: ${p.service?.name || 'N/A'}`);
      console.log(`      Module Type: ${p.service?.moduleType || p.moduleType || 'N/A'}`);
      console.log(`      Status: ${p.status}`);
      console.log(`      Criado: ${p.createdAt.toLocaleString('pt-BR')}`);

      // Se tem customData, mostrar
      const customData = p.customData as any;
      if (customData) {
        console.log(`      CustomData keys: ${Object.keys(customData).join(', ')}`);

        if (customData.especialidade || customData.cidadeDestino) {
          console.log(`      🏥 Dados TFD detectados:`);
          if (customData.especialidade) console.log(`         - Especialidade: ${customData.especialidade}`);
          if (customData.cidadeDestino) console.log(`         - Cidade: ${customData.cidadeDestino}`);
          if (customData.tfdSolicitacaoId) console.log(`         - Solicitação TFD: ${customData.tfdSolicitacaoId}`);
        }
      }
      console.log('');
    });

    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listarProtocolos();
