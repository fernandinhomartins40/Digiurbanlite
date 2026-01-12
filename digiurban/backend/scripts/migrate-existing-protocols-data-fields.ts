/**
 * ============================================================================
 * MIGRATION: Popular ProtocolDataField para protocolos existentes
 * ============================================================================
 *
 * Cria campos de dados para protocolos que já existem e têm customData,
 * mas foram criados antes da implementação do sistema de aprovação granular.
 */

import { PrismaClient } from '@prisma/client';
import * as dataFieldService from '../src/services/protocol-data-field.service';

const prisma = new PrismaClient();

async function migrateExistingProtocols() {
  console.log('🔄 Iniciando migração de campos de dados...\n');

  try {
    // Buscar protocolos COM_DADOS que têm customData mas não têm campos
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        customData: {
          not: null
        }
      },
      include: {
        dataFields: true,
        service: {
          select: {
            serviceType: true
          }
        }
      }
    });

    console.log(`📊 Total de protocolos com customData: ${protocols.length}`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const protocol of protocols) {
      try {
        // Pular se já tem campos criados
        if (protocol.dataFields && protocol.dataFields.length > 0) {
          skipped++;
          continue;
        }

        // Pular se customData está vazio
        const customData = protocol.customData as Record<string, any>;
        if (!customData || typeof customData !== 'object') {
          skipped++;
          continue;
        }

        // Filtrar campos internos
        const dataToMigrate = Object.fromEntries(
          Object.entries(customData).filter(([key]) => !key.startsWith('_'))
        );

        if (Object.keys(dataToMigrate).length === 0) {
          skipped++;
          continue;
        }

        // Criar campos
        console.log(`\n📝 Protocolo ${protocol.number}:`);
        console.log(`   - ${Object.keys(dataToMigrate).length} campos encontrados`);

        await dataFieldService.createDataFieldsFromCustomData({
          protocolId: protocol.id,
          customData: dataToMigrate,
          requiredFields: [] // TODO: puxar do schema do serviço se necessário
        });

        migrated++;
        console.log(`   ✅ Migrado com sucesso`);

      } catch (error) {
        errors++;
        console.error(`   ❌ Erro no protocolo ${protocol.number}:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Migrados com sucesso: ${migrated}`);
    console.log(`⏭️  Pulados (já tinham campos): ${skipped}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📦 Total processados: ${protocols.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
migrateExistingProtocols()
  .then(() => {
    console.log('\n✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migração falhou:', error);
    process.exit(1);
  });
