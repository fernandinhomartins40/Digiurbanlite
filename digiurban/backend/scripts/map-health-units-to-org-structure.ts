/**
 * Script de Mapeamento: UnidadeSaude → OrganizationalUnit
 *
 * Este script mapeia cada UnidadeSaude para o Sistema Unificado V2.0,
 * criando OrganizationalUnits correspondentes
 *
 * Execução: npx tsx scripts/map-health-units-to-org-structure.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mapUnidadeSaudeToOrgUnits() {
  console.log('🔄 Iniciando mapeamento: UnidadeSaude → OrganizationalUnit');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar ou criar Secretaria Municipal de Saúde
    let secretariaSaude = await prisma.department.findFirst({
      where: {
        OR: [
          { code: 'SMS' },
          { code: 'SAUDE' },
          { name: { contains: 'Saúde', mode: 'insensitive' } },
        ],
      },
    });

    if (!secretariaSaude) {
      console.log('⚠️  Secretaria de Saúde não encontrada. Criando...');
      secretariaSaude = await prisma.department.create({
        data: {
          name: 'Secretaria Municipal de Saúde',
          code: 'SMS',
          description: 'Secretaria responsável pela gestão da saúde pública municipal',
          isActive: true,
        },
      });
      console.log('✅ Secretaria de Saúde criada\n');
    } else {
      console.log(`✅ Secretaria de Saúde encontrada: ${secretariaSaude.name}\n`);
    }

    // 2. Criar OrganizationalUnit para a Secretaria (nível 1)
    let secretariaOrgUnit = await prisma.organizationalUnit.findFirst({
      where: {
        departmentId: secretariaSaude.id,
        tipo: 'SECRETARIA',
      },
    });

    if (!secretariaOrgUnit) {
      secretariaOrgUnit = await prisma.organizationalUnit.create({
        data: {
          nome: secretariaSaude.name,
          sigla: secretariaSaude.code || 'SMS',
          tipo: 'SECRETARIA',
          nivel: 1,
          departmentId: secretariaSaude.id,
          competencias: [
            'Gestão da Política Municipal de Saúde',
            'Administração do SUS municipal',
            'Coordenação da Atenção Básica',
            'Vigilância em Saúde',
            'Assistência Farmacêutica',
          ],
          isActive: true,
        },
      });
      console.log(`✅ OrganizationalUnit criada: ${secretariaOrgUnit.nome}\n`);
    }

    // 3. Criar Diretoria de Atenção Básica (nível 2)
    let diretoriaAB = await prisma.organizationalUnit.findFirst({
      where: {
        departmentId: secretariaSaude.id,
        sigla: 'DAB',
        tipo: 'DIRETORIA',
      },
    });

    if (!diretoriaAB) {
      diretoriaAB = await prisma.organizationalUnit.create({
        data: {
          nome: 'Diretoria de Atenção Básica',
          sigla: 'DAB',
          tipo: 'DIRETORIA',
          nivel: 2,
          departmentId: secretariaSaude.id,
          parentId: secretariaOrgUnit.id,
          competencias: [
            'Coordenação das Unidades Básicas de Saúde',
            'Gestão das Equipes de Saúde da Família',
            'Programas de Atenção Primária',
          ],
          isActive: true,
        },
      });
      console.log(`✅ Diretoria criada: ${diretoriaAB.nome}\n`);
    }

    // 4. Mapear cada UnidadeSaude
    const unidades = await prisma.unidadeSaude.findMany({
      where: {
        organizationalUnitId: null, // Apenas unidades não mapeadas
        isActive: true,
      },
      orderBy: { nome: 'asc' },
    });

    console.log(`📊 Total de unidades a mapear: ${unidades.length}\n`);

    let mapeadas = 0;
    let erros = 0;

    for (const unidade of unidades) {
      try {
        // Determinar tipo de OrganizationalUnit baseado no tipo da unidade
        let tipoOrgUnit: 'UNIDADE' | 'SETOR' = 'UNIDADE';
        if (['HOSPITAL', 'UPA'].includes(unidade.tipo.toUpperCase())) {
          tipoOrgUnit = 'SETOR';
        }

        // Criar OrganizationalUnit para a unidade (nível 3)
        const orgUnit = await prisma.organizationalUnit.create({
          data: {
            nome: unidade.nome,
            sigla: unidade.cnes || unidade.nome.substring(0, 10).toUpperCase(),
            tipo: tipoOrgUnit,
            nivel: 3,
            departmentId: secretariaSaude.id,
            parentId: diretoriaAB.id,
            endereco: unidade.endereco,
            telefone: unidade.telefone,
            email: unidade.email,
            descricao: `${unidade.tipo} - CNES: ${unidade.cnes || 'N/A'}`,
            isActive: unidade.isActive,
          },
        });

        // Vincular UnidadeSaude com OrganizationalUnit
        await prisma.unidadeSaude.update({
          where: { id: unidade.id },
          data: { organizationalUnitId: orgUnit.id },
        });

        console.log(`✅ Mapeada: ${unidade.nome} → ${orgUnit.sigla} (${tipoOrgUnit})`);
        mapeadas++;
      } catch (error: any) {
        console.error(`❌ Erro ao mapear ${unidade.nome}:`, error.message);
        erros++;
      }
    }

    // 5. Verificar unidades já mapeadas
    const unidadesJaMapeadas = await prisma.unidadeSaude.count({
      where: {
        organizationalUnitId: { not: null },
        isActive: true,
      },
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DO MAPEAMENTO:');
    console.log(`   ✅ Novas unidades mapeadas: ${mapeadas}`);
    console.log(`   📋 Unidades já mapeadas: ${unidadesJaMapeadas - mapeadas}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total de unidades ativas: ${unidadesJaMapeadas}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (erros === 0) {
      console.log('✅ Mapeamento concluído com sucesso!\n');
    } else {
      console.log('⚠️  Mapeamento concluído com erros. Revise os logs acima.\n');
    }
  } catch (error) {
    console.error('❌ Erro fatal no mapeamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar mapeamento
mapUnidadeSaudeToOrgUnits()
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
