/**
 * Script de migração: Corrige metadata de mensagens antigas do bot
 *
 * Problema: Mensagens criadas antes da correção não tinham metadata.quickReplies
 * Solução: Adiciona quickReplies em mensagens de menu que não possuem
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBotMessageMetadata() {
  console.log('🔧 Iniciando migração de metadata do bot...\n');

  try {
    // 1. Buscar todas as mensagens do bot sem metadata ou com metadata vazio
    const messages = await prisma.botMessage.findMany({
      where: {
        role: 'bot',
        OR: [
          { metadata: null },
          { metadata: {} },
        ]
      },
      include: {
        conversation: {
          include: {
            citizen: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${messages.length} mensagens para migrar\n`);

    let updated = 0;
    const defaultQuickReplies = [
      '📋 Solicitar Serviço',
      '🔍 Consultar Protocolo',
      '📄 Enviar Documentos',
      '👤 Atualizar Perfil',
      '❓ Outras Dúvidas'
    ];

    // 2. Atualizar cada mensagem
    for (const message of messages) {
      // Verifica se é uma mensagem de menu (contém saudação)
      const isMenuMessage =
        message.content.includes('Como posso ajudar') ||
        message.content.includes('posso te ajudar') ||
        message.intent === 'MENU_PRINCIPAL' ||
        message.intent === 'CLARIFICATION';

      if (isMenuMessage) {
        await prisma.botMessage.update({
          where: { id: message.id },
          data: {
            messageType: 'quick_reply',
            metadata: {
              quickReplies: defaultQuickReplies
            }
          }
        });

        updated++;
        console.log(`✅ Atualizada mensagem ${message.id} - ${message.conversation.citizen?.name || 'Unknown'}`);
      }
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`   - Total de mensagens verificadas: ${messages.length}`);
    console.log(`   - Mensagens atualizadas: ${updated}`);
    console.log(`   - Mensagens ignoradas: ${messages.length - updated}`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateBotMessageMetadata()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
