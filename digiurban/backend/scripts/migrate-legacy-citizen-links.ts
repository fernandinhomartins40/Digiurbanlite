/**
 * ============================================================================
 * MIGRATE LEGACY CITIZEN LINKS
 * ============================================================================
 * Script para migrar campos legacy de vínculos de cidadãos
 * para a nova estrutura ProtocolCitizenLink
 *
 * USO:
 *   npm run migrate:citizen-links
 *   npm run migrate:citizen-links -- --dry-run
 *   npm run migrate:citizen-links -- --module-type MATRICULA_ESCOLAR
 */

import { PrismaClient, CitizenLinkType, ServiceRole } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalProtocols: number;
  protocolsWithLinks: number;
  linksCreated: number;
  linksVerified: number;
  errors: number;
  skipped: number;
}

const stats: MigrationStats = {
  totalProtocols: 0,
  protocolsWithLinks: 0,
  linksCreated: 0,
  linksVerified: 0,
  errors: 0,
  skipped: 0
};

// Argumentos de linha de comando
const isDryRun = process.argv.includes('--dry-run');
const moduleTypeArg = process.argv.find(arg => arg.startsWith('--module-type='));
const targetModuleType = moduleTypeArg ? moduleTypeArg.split('=')[1] : null;

/**
 * Migrar protocolo individual
 */
async function migrateProtocol(protocol: any) {
  const customData = protocol.customData || {};
  const links: any[] = [];

  try {
    // Educação: Aluno
    if (customData.cpfAluno) {
      const studentLink = await createStudentLink(protocol, customData);
      if (studentLink) links.push(studentLink);
    }

    // Saúde: Acompanhante
    if (customData.cpfAcompanhante) {
      const companionLink = await createCompanionLink(protocol, customData);
      if (companionLink) links.push(companionLink);
    }

    // Saúde: Familiar Autorizado
    if (customData.cpfFamiliarAutorizado) {
      const authorizedLink = await createAuthorizedPersonLink(protocol, customData);
      if (authorizedLink) links.push(authorizedLink);
    }

    // Criar links no banco de dados
    if (links.length > 0 && !isDryRun) {
      await prisma.protocolCitizenLink.createMany({
        data: links,
        skipDuplicates: true
      });

      stats.protocolsWithLinks++;
      stats.linksCreated += links.length;
      stats.linksVerified += links.filter(l => l.isVerified).length;

      console.log(
        `  ✓ Protocolo ${protocol.number}: ${links.length} vínculo(s) criado(s)`
      );
    } else if (links.length > 0) {
      stats.protocolsWithLinks++;
      stats.linksCreated += links.length;
      stats.linksVerified += links.filter(l => l.isVerified).length;

      console.log(
        `  [DRY-RUN] Protocolo ${protocol.number}: ${links.length} vínculo(s) seriam criado(s)`
      );
    } else {
      stats.skipped++;
    }
  } catch (error: any) {
    stats.errors++;
    console.error(`  ✗ Erro no protocolo ${protocol.number}:`, error.message);
  }
}

/**
 * Criar vínculo de aluno
 */
async function createStudentLink(protocol: any, customData: any) {
  const citizen = await findCitizenByCPF(customData.cpfAluno);
  if (!citizen) {
    console.log(`    - Aluno não encontrado: ${customData.cpfAluno}`);
    return null;
  }

  // Verificar composição familiar
  const familyLink = await prisma.familyComposition.findFirst({
    where: {
      headId: protocol.citizenId,
      memberId: citizen.id
    }
  });

  return {
    protocolId: protocol.id,
    linkedCitizenId: citizen.id,
    linkType: CitizenLinkType.STUDENT,
    relationship: familyLink?.relationship || customData.parentescoResponsavel || null,
    role: ServiceRole.BENEFICIARY,
    contextData: {
      serie: customData.serie,
      turno: customData.turno,
      escola: customData.escola,
      anoLetivo: customData.anoLetivo
    },
    isVerified: !!familyLink,
    verifiedAt: familyLink ? new Date() : null,
    verifiedBy: familyLink ? 'MIGRATION_SCRIPT' : null
  };
}

/**
 * Criar vínculo de acompanhante
 */
async function createCompanionLink(protocol: any, customData: any) {
  const citizen = await findCitizenByCPF(customData.cpfAcompanhante);
  if (!citizen) {
    console.log(`    - Acompanhante não encontrado: ${customData.cpfAcompanhante}`);
    return null;
  }

  const familyLink = await prisma.familyComposition.findFirst({
    where: {
      headId: protocol.citizenId,
      memberId: citizen.id
    }
  });

  return {
    protocolId: protocol.id,
    linkedCitizenId: citizen.id,
    linkType: CitizenLinkType.COMPANION,
    relationship: familyLink?.relationship || customData.parentescoAcompanhante || null,
    role: ServiceRole.COMPANION,
    contextData: {
      motivoAcompanhamento: customData.motivoAcompanhamento,
      dataViagem: customData.dataViagem,
      destino: customData.destino
    },
    isVerified: !!familyLink,
    verifiedAt: familyLink ? new Date() : null,
    verifiedBy: familyLink ? 'MIGRATION_SCRIPT' : null
  };
}

/**
 * Criar vínculo de pessoa autorizada
 */
async function createAuthorizedPersonLink(protocol: any, customData: any) {
  const citizen = await findCitizenByCPF(customData.cpfFamiliarAutorizado);
  if (!citizen) {
    console.log(`    - Familiar autorizado não encontrado: ${customData.cpfFamiliarAutorizado}`);
    return null;
  }

  const familyLink = await prisma.familyComposition.findFirst({
    where: {
      headId: protocol.citizenId,
      memberId: citizen.id
    }
  });

  return {
    protocolId: protocol.id,
    linkedCitizenId: citizen.id,
    linkType: CitizenLinkType.AUTHORIZED_PERSON,
    relationship: familyLink?.relationship || customData.parentescoFamiliar || null,
    role: ServiceRole.AUTHORIZED,
    contextData: {
      tipoAutorizacao: customData.tipoAutorizacao,
      validadeAutorizacao: customData.validadeAutorizacao
    },
    isVerified: !!familyLink,
    verifiedAt: familyLink ? new Date() : null,
    verifiedBy: familyLink ? 'MIGRATION_SCRIPT' : null
  };
}

/**
 * Buscar cidadão por CPF
 */
async function findCitizenByCPF(cpf: string) {
  if (!cpf) return null;

  return await prisma.citizen.findFirst({
    where: { cpf }
  });
}

/**
 * Função principal
 */
async function main() {
  console.log('====================================');
  console.log('MIGRAÇÃO DE VÍNCULOS DE CIDADÃOS');
  console.log('====================================\n');

  if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita no banco de dados\n');
  }

  if (targetModuleType) {
    console.log(`🎯 Filtrando por módulo: ${targetModuleType}\n`);
  }

  // Buscar protocolos
  const where: any = {
    customData: {
      not: null
    }
  };

  if (targetModuleType) {
    where.moduleType = targetModuleType;
  }

  console.log('📋 Buscando protocolos...\n');

  const protocols = await prisma.protocolSimplified.findMany({
    where,
    select: {
      id: true,
      number: true,
      citizenId: true,
      moduleType: true,
      customData: true
    },
    orderBy: { createdAt: 'asc' }
  });

  stats.totalProtocols = protocols.length;

  console.log(`Encontrados ${protocols.length} protocolos\n`);
  console.log('🔄 Iniciando migração...\n');

  // Migrar cada protocolo
  for (const protocol of protocols) {
    await migrateProtocol(protocol);
  }

  // Exibir estatísticas
  console.log('\n====================================');
  console.log('ESTATÍSTICAS DA MIGRAÇÃO');
  console.log('====================================\n');

  console.log(`Total de protocolos analisados: ${stats.totalProtocols}`);
  console.log(`Protocolos com vínculos: ${stats.protocolsWithLinks}`);
  console.log(`Vínculos criados: ${stats.linksCreated}`);
  console.log(`Vínculos verificados: ${stats.linksVerified} (${((stats.linksVerified / stats.linksCreated) * 100 || 0).toFixed(1)}%)`);
  console.log(`Protocolos ignorados: ${stats.skipped}`);
  console.log(`Erros: ${stats.errors}`);

  console.log('\n====================================\n');

  if (isDryRun) {
    console.log('✅ Dry-run concluído. Execute sem --dry-run para aplicar as mudanças.\n');
  } else {
    console.log('✅ Migração concluída com sucesso!\n');
  }
}

// Executar
main()
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
