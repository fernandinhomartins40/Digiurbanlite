/**
 * Backfill de ProtocolDataField a partir do customData dos protocolos.
 *
 * Contexto: os campos de dados (aba "Dados" do /admin/protocolos/[id]) só eram
 * materializados na CRIAÇÃO do protocolo, de forma não-fatal. Protocolos antigos
 * — ou aqueles cuja criação de campos falhou — ficam com a aba vazia mesmo tendo
 * customData preenchido. Este script reconcilia esses protocolos.
 *
 * Idempotente: protocolos que já possuem ProtocolDataField são ignorados.
 *
 * Uso:
 *   npx ts-node src/scripts/backfill-protocol-data-fields.ts          # dry-run (só relata)
 *   npx ts-node src/scripts/backfill-protocol-data-fields.ts --apply  # aplica de fato
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { backfillDataFieldsForProtocol } from '../services/protocol-data-field.service';

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');

  console.log(`\n🔧 Backfill de ProtocolDataField ${apply ? '(APLICANDO)' : '(DRY-RUN)'}\n`);

  // Protocolos que têm customData e NÃO têm nenhum ProtocolDataField ainda.
  const candidates = await prisma.protocolSimplified.findMany({
    where: {
      dataFields: { none: {} },
      NOT: { customData: { equals: Prisma.JsonNull } },
    },
    select: { id: true, number: true, customData: true },
  });

  console.log(`   → ${candidates.length} protocolo(s) candidato(s) (sem data-fields, com customData)\n`);

  let touched = 0;
  let fieldsCreated = 0;
  let skipped = 0;

  for (const protocol of candidates) {
    const custom = protocol.customData;
    const hasData =
      custom && typeof custom === 'object' && !Array.isArray(custom) &&
      Object.keys(custom as Record<string, any>).length > 0;

    if (!hasData) {
      skipped++;
      continue;
    }

    if (!apply) {
      touched++;
      const keys = Object.keys(custom as Record<string, any>).length;
      console.log(`   [dry] ${protocol.number ?? protocol.id}: ${keys} campo(s) em customData`);
      continue;
    }

    try {
      const created = await backfillDataFieldsForProtocol(protocol.id);
      if (created > 0) {
        touched++;
        fieldsCreated += created;
        console.log(`   ✅ ${protocol.number ?? protocol.id}: ${created} campo(s) criado(s)`);
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.error(`   ❌ ${protocol.number ?? protocol.id}: ${error?.message ?? error}`);
    }
  }

  console.log(`\n📊 Resultado ${apply ? '' : '(estimado)'}:`);
  console.log(`   Protocolos afetados: ${touched}`);
  if (apply) console.log(`   Campos criados: ${fieldsCreated}`);
  console.log(`   Ignorados (sem dados / já preenchidos): ${skipped}`);
  if (!apply) console.log(`\n   ℹ️  Rode novamente com --apply para efetivar.`);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro no backfill:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
