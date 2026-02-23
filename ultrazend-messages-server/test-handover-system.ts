/**
 * Script de teste para sistema de Handover Bot → Humano
 *
 * Execute: npx ts-node test-handover-system.ts
 */

import prisma from './src/utils/prisma';

async function testHandoverSystem() {
  console.log('🧪 Iniciando testes do sistema de Handover...\n');

  try {
    // ====================================
    // TESTE 1: Verificar schema atualizado
    // ====================================
    console.log('📋 TESTE 1: Verificando schema atualizado...');

    const conversation = await prisma.conversation.findFirst({
      where: { isBotConversation: true },
      include: {
        activeFlowExecution: true,
      },
    });

    if (conversation) {
      console.log('✅ activeFlowExecutionId:', conversation.activeFlowExecutionId || '(null)');
      if (conversation.activeFlowExecution) {
        console.log('✅ FlowExecution vinculado:');
        console.log('   - ID:', conversation.activeFlowExecution.id);
        console.log('   - isPaused:', conversation.activeFlowExecution.isPaused);
        console.log('   - pausedAt:', conversation.activeFlowExecution.pausedAt || '(null)');
      }
    } else {
      console.log('⚠️  Nenhuma conversa de bot encontrada para testar');
    }

    // ====================================
    // TESTE 2: Verificar campos queryable em Message
    // ====================================
    console.log('\n📋 TESTE 2: Verificando campos queryable em Message...');

    const botMessage = await prisma.message.findFirst({
      where: {
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (botMessage) {
      console.log('✅ Mensagem do bot encontrada:');
      console.log('   - isBotMessage:', botMessage.isBotMessage);
      console.log('   - botInteractionType:', (botMessage as any).botInteractionType || '(null)');
      console.log('   - botFlowNodeId:', (botMessage as any).botFlowNodeId || '(null)');
      console.log('   - botSelectedOption:', (botMessage as any).botSelectedOption || '(null)');
    } else {
      console.log('⚠️  Nenhuma mensagem de bot encontrada');
    }

    // ====================================
    // TESTE 3: Simular fila de handover
    // ====================================
    console.log('\n📋 TESTE 3: Testando fila de handover...');

    const pausedExecutions = await prisma.flowExecution.findMany({
      where: {
        isPaused: true,
        status: 'ACTIVE',
      },
      include: {
        activeInConversation: true,
        citizen: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (pausedExecutions.length > 0) {
      console.log(`✅ Encontradas ${pausedExecutions.length} execuções pausadas:`);
      for (const exec of pausedExecutions) {
        const waitTime = exec.pausedAt
          ? Math.floor((Date.now() - exec.pausedAt.getTime()) / 1000)
          : 0;
        console.log(`   - ${exec.citizen.name} | Pausado há ${waitTime}s | Razão: ${exec.pauseReason || 'N/A'}`);
      }
    } else {
      console.log('ℹ️  Nenhuma execução pausada no momento');
    }

    // ====================================
    // TESTE 4: Analytics com campos queryable
    // ====================================
    console.log('\n📋 TESTE 4: Testando analytics queryable...');

    const menuInteractions = await prisma.message.count({
      where: {
        botInteractionType: 'menu',
      },
    });

    const formInteractions = await prisma.message.count({
      where: {
        botInteractionType: 'form',
      },
    });

    console.log(`✅ Interações de menu: ${menuInteractions}`);
    console.log(`✅ Interações de formulário: ${formInteractions}`);

    // Query mais complexa: opções mais selecionadas
    const topOptions = await prisma.$queryRaw<Array<{ bot_selected_option: string; count: bigint }>>`
      SELECT bot_selected_option, COUNT(*) as count
      FROM messages
      WHERE bot_interaction_type = 'menu'
        AND bot_selected_option IS NOT NULL
      GROUP BY bot_selected_option
      ORDER BY count DESC
      LIMIT 5
    `;

    if (topOptions.length > 0) {
      console.log('\n📊 Top 5 opções de menu mais selecionadas:');
      for (const option of topOptions) {
        console.log(`   - ${option.bot_selected_option}: ${option.count} vezes`);
      }
    }

    // ====================================
    // TESTE 5: Verificar campos removidos
    // ====================================
    console.log('\n📋 TESTE 5: Verificando se campos antigos foram removidos...');

    const rawConv = await prisma.$queryRaw<Array<any>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'conversations'
        AND column_name IN ('bot_flow_type', 'bot_flow_step', 'bot_flow_data', 'bot_context', 'bot_last_interaction_at')
    `;

    if (rawConv.length > 0) {
      console.log('❌ ERRO: Campos antigos ainda existem:', rawConv.map((r) => r.column_name).join(', '));
      console.log('   Execute a migration: npx prisma migrate deploy');
    } else {
      console.log('✅ Campos antigos removidos corretamente');
    }

    console.log('\n✅ Todos os testes concluídos!\n');
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testHandoverSystem()
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
