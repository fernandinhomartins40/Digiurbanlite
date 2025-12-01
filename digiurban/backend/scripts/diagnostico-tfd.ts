/**
 * 🔍 SCRIPT DE DIAGNÓSTICO TFD
 *
 * Verifica:
 * 1. Protocolos TFD criados
 * 2. Solicitações TFD geradas
 * 3. Status de conversão
 * 4. Problemas na integração
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticoTFD() {
  console.log('\n🔍 ============================================');
  console.log('   DIAGNÓSTICO DO SISTEMA TFD');
  console.log('============================================\n');

  try {
    // 1. Buscar todos os protocolos TFD
    console.log('📋 1. PROTOCOLOS TFD...\n');
    const protocolosTFD = await prisma.protocolSimplified.findMany({
      where: {
        OR: [
          { moduleType: { contains: 'TFD' } },
          { moduleType: 'ENCAMINHAMENTOS_TFD' },
          { title: { contains: 'TFD', mode: 'insensitive' } }
        ]
      },
      include: {
        service: true,
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (protocolosTFD.length === 0) {
      console.log('   ⚠️  Nenhum protocolo TFD encontrado!\n');
    } else {
      console.log(`   ✅ ${protocolosTFD.length} protocolo(s) TFD encontrado(s)\n`);

      protocolosTFD.forEach((p, idx) => {
        console.log(`   ${idx + 1}. Protocolo: ${p.number}`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Cidadão: ${p.citizen.name} (${p.citizen.cpf})`);
        console.log(`      Serviço: ${p.service?.name || 'N/A'}`);
        console.log(`      Module Type: ${p.moduleType || 'N/A'}`);
        console.log(`      Status: ${p.status}`);
        console.log(`      Criado em: ${p.createdAt.toLocaleDateString('pt-BR')}`);

        // Verificar customData
        const customData = p.customData as any;
        if (customData) {
          console.log(`      CustomData:`);
          console.log(`         - TFD Solicitação ID: ${customData.tfdSolicitacaoId || 'NÃO CONVERTIDO'}`);
          console.log(`         - Convertido: ${customData.convertedToTFD ? 'SIM' : 'NÃO'}`);
          console.log(`         - Data conversão: ${customData.convertedAt || 'N/A'}`);
          console.log(`         - Especialidade: ${customData.especialidade || 'N/A'}`);
          console.log(`         - Cidade Destino: ${customData.cidadeDestino || 'N/A'}`);
        }
        console.log('');
      });
    }

    // 2. Buscar todas as solicitações TFD
    console.log('\n🏥 2. SOLICITAÇÕES TFD...\n');
    const solicitacoesTFD = await prisma.solicitacaoTFD.findMany({
      include: {
        viagens: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (solicitacoesTFD.length === 0) {
      console.log('   ⚠️  Nenhuma solicitação TFD encontrada!\n');
    } else {
      console.log(`   ✅ ${solicitacoesTFD.length} solicitação(ões) TFD encontrada(s)\n`);

      solicitacoesTFD.forEach((s, idx) => {
        console.log(`   ${idx + 1}. Solicitação ID: ${s.id}`);
        console.log(`      Protocolo ID: ${s.protocolId}`);
        console.log(`      Workflow ID: ${s.workflowId}`);
        console.log(`      Cidadão ID: ${s.citizenId}`);
        console.log(`      Especialidade: ${s.especialidade}`);
        console.log(`      Cidade Destino: ${s.cidadeDestino}`);
        console.log(`      Status: ${s.status}`);
        console.log(`      Prioridade: ${s.prioridade}`);
        console.log(`      Viagens: ${s.viagens.length}`);
        console.log(`      Criado em: ${s.createdAt.toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    }

    // 3. Verificar discrepâncias
    console.log('\n🔎 3. ANÁLISE DE DISCREPÂNCIAS...\n');

    const protocolosNaoConvertidos = protocolosTFD.filter(p => {
      const customData = p.customData as any;
      return !customData?.tfdSolicitacaoId;
    });

    if (protocolosNaoConvertidos.length > 0) {
      console.log(`   ⚠️  ${protocolosNaoConvertidos.length} protocolo(s) TFD NÃO CONVERTIDO(S):\n`);
      protocolosNaoConvertidos.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.number} - ${p.citizen.name}`);
        console.log(`      Motivo: customData.tfdSolicitacaoId não encontrado`);
        console.log(`      ID do Protocolo: ${p.id}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Todos os protocolos TFD foram convertidos!\n');
    }

    // 4. Verificar solicitações órfãs (sem protocolo)
    const solicitacoesOrfas = await prisma.solicitacaoTFD.findMany({
      where: {
        protocolId: {
          notIn: protocolosTFD.map(p => p.id)
        }
      }
    });

    if (solicitacoesOrfas.length > 0) {
      console.log(`\n   ⚠️  ${solicitacoesOrfas.length} solicitação(ões) TFD ÓRFÃ(S) (sem protocolo correspondente):\n`);
      solicitacoesOrfas.forEach((s, idx) => {
        console.log(`   ${idx + 1}. Solicitação ID: ${s.id}`);
        console.log(`      Protocolo ID (inválido): ${s.protocolId}`);
        console.log('');
      });
    }

    // 5. Resumo
    console.log('\n📊 4. RESUMO...\n');
    console.log(`   Total de Protocolos TFD: ${protocolosTFD.length}`);
    console.log(`   Total de Solicitações TFD: ${solicitacoesTFD.length}`);
    console.log(`   Protocolos Convertidos: ${protocolosTFD.length - protocolosNaoConvertidos.length}`);
    console.log(`   Protocolos NÃO Convertidos: ${protocolosNaoConvertidos.length}`);
    console.log(`   Solicitações Órfãs: ${solicitacoesOrfas.length}`);

    // 6. Status das solicitações
    if (solicitacoesTFD.length > 0) {
      console.log('\n   Status das Solicitações:');
      const statusCount = solicitacoesTFD.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}`);
      });
    }

    console.log('\n============================================');
    console.log('   FIM DO DIAGNÓSTICO');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ ERRO durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
diagnosticoTFD();
