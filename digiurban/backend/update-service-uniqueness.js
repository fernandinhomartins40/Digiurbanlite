/**
 * Script para atualizar configuração de unicidade dos serviços
 * Garante que serviços de cadastro não permitam duplicatas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateServiceUniqueness() {
  console.log('🔧 Atualizando configuração de unicidade dos serviços...\n');

  try {
    // Serviços que NÃO devem permitir múltiplos protocolos ativos
    const uniqueServices = [
      {
        moduleType: 'CADASTRO_PRODUTOR',
        name: 'Cadastro de Produtor Rural',
        uniquenessScope: 'CUSTOM',
        uniquenessRules: {
          moduleType: 'CADASTRO_PRODUTOR',
          validationFunction: 'validateCadastroProdutor'
        }
      },
      {
        moduleType: 'CADASTRO_PISCICULTURA',
        name: 'Cadastro de Piscicultura',
        uniquenessScope: 'CUSTOM',
        uniquenessRules: {
          moduleType: 'CADASTRO_PISCICULTURA',
          validationFunction: 'validateCadastroPiscicultura'
        }
      },
      {
        moduleType: 'CADASTRO_AGROINDUSTRIA',
        name: 'Cadastro de Agroindústria Familiar',
        uniquenessScope: 'CUSTOM',
        uniquenessRules: {
          moduleType: 'CADASTRO_AGROINDUSTRIA',
          validationFunction: 'validateCadastroAgroindustria'
        }
      },
      {
        moduleType: 'CADASTRO_UNICO',
        name: 'Cadastro Único (CadÚnico)',
        uniquenessScope: 'CUSTOM',
        uniquenessRules: {
          moduleType: 'CADASTRO_UNICO',
          validationFunction: 'validateCadastroUnico'
        }
      }
    ];

    // Atualizar cada serviço
    for (const config of uniqueServices) {
      const service = await prisma.serviceSimplified.findFirst({
        where: { moduleType: config.moduleType }
      });

      if (service) {
        await prisma.serviceSimplified.update({
          where: { id: service.id },
          data: {
            allowMultipleActiveProtocols: false,
            uniquenessScope: config.uniquenessScope,
            uniquenessRules: config.uniquenessRules
          }
        });
        console.log(`✅ ${config.name} - Configurado para NÃO permitir duplicatas`);
      } else {
        console.log(`⚠️  ${config.name} - Não encontrado no banco`);
      }
    }

    // Garantir que CADASTRO_PROPRIEDADE_RURAL permite múltiplos
    const propriedadeService = await prisma.serviceSimplified.findFirst({
      where: { moduleType: 'CADASTRO_PROPRIEDADE_RURAL' }
    });

    if (propriedadeService) {
      await prisma.serviceSimplified.update({
        where: { id: propriedadeService.id },
        data: {
          allowMultipleActiveProtocols: true,
          uniquenessScope: null,
          uniquenessRules: null
        }
      });
      console.log(`✅ Cadastro de Propriedade Rural - Permite múltiplas propriedades`);
    }

    console.log('\n✅ Configuração de unicidade atualizada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateServiceUniqueness()
  .then(() => {
    console.log('\n🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
