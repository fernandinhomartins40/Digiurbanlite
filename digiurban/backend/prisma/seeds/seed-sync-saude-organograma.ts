import { PrismaClient, TipoUnidadeOrganizacional, TipoTeam } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando sincronizacao Saude -> Organograma...');

  // 1. Find Department for "Secretaria de Saude"
  const saudeDept = await prisma.department.findFirst({
    where: {
      name: {
        contains: 'Saúde',
        mode: 'insensitive',
      },
    },
  });

  if (!saudeDept) {
    throw new Error('Departamento "Secretaria de Saúde" não encontrado. Verifique se o departamento existe na base de dados.');
  }

  console.log(`Departamento encontrado: ${saudeDept.name} (id: ${saudeDept.id})`);

  // 2. Find or create root OrganizationalUnit of tipo SECRETARIA for Saude department
  let rootOrgUnit = await prisma.organizationalUnit.findFirst({
    where: {
      departmentId: saudeDept.id,
      tipo: TipoUnidadeOrganizacional.SECRETARIA,
      parentId: null,
    },
  });

  if (!rootOrgUnit) {
    console.log('Unidade raiz SECRETARIA não encontrada. Criando...');
    rootOrgUnit = await prisma.organizationalUnit.create({
      data: {
        nome: saudeDept.name,
        tipo: TipoUnidadeOrganizacional.SECRETARIA,
        nivel: 1,
        departmentId: saudeDept.id,
        parentId: null,
        isActive: true,
      },
    });
    console.log(`Unidade raiz criada: ${rootOrgUnit.nome} (id: ${rootOrgUnit.id})`);
  } else {
    console.log(`Unidade raiz encontrada: ${rootOrgUnit.nome} (id: ${rootOrgUnit.id})`);
  }

  // 3. Process UnidadeSaude records with no organizationalUnitId
  const unidadesSemOrgUnit = await prisma.unidadeSaude.findMany({
    where: {
      organizationalUnitId: null,
    },
  });

  console.log(`\nUnidades de Saúde sem OrganizationalUnit: ${unidadesSemOrgUnit.length}`);

  let unitsMapped = 0;

  for (const unit of unidadesSemOrgUnit) {
    try {
      // Create OrganizationalUnit for this UnidadeSaude
      const newOrgUnit = await prisma.organizationalUnit.create({
        data: {
          nome: unit.nome,
          tipo: TipoUnidadeOrganizacional.SETOR,
          nivel: 3,
          departmentId: saudeDept.id,
          parentId: rootOrgUnit.id,
          isActive: true,
        },
      });

      // Update UnidadeSaude with the new organizationalUnitId
      await prisma.unidadeSaude.update({
        where: { id: unit.id },
        data: { organizationalUnitId: newOrgUnit.id },
      });

      console.log(`  [OK] UnidadeSaude "${unit.nome}" -> OrganizationalUnit id: ${newOrgUnit.id}`);
      unitsMapped++;
    } catch (err) {
      console.error(`  [ERRO] Falha ao mapear UnidadeSaude "${unit.nome}":`, err);
    }
  }

  // 4. Process EquipeSaude records with no teamId
  const equipesSemTeam = await prisma.equipeSaude.findMany({
    where: {
      teamId: null,
    },
  });

  console.log(`\nEquipes de Saúde sem Team: ${equipesSemTeam.length}`);

  let teamsMapped = 0;

  for (const equipe of equipesSemTeam) {
    try {
      // Create Team for this EquipeSaude
      const newTeam = await prisma.team.create({
        data: {
          nome: equipe.nome,
          tipo: TipoTeam.PERMANENTE,
          departmentId: saudeDept.id,
          ativo: true,
        },
      });

      // Update EquipeSaude with the new teamId
      await prisma.equipeSaude.update({
        where: { id: equipe.id },
        data: { teamId: newTeam.id },
      });

      console.log(`  [OK] EquipeSaude "${equipe.nome}" -> Team id: ${newTeam.id}`);
      teamsMapped++;
    } catch (err) {
      console.error(`  [ERRO] Falha ao mapear EquipeSaude "${equipe.nome}":`, err);
    }
  }

  // 5. Summary
  console.log('\n========================================');
  console.log('Sincronizacao concluida!');
  console.log(`  Unidades mapeadas : ${unitsMapped} / ${unidadesSemOrgUnit.length}`);
  console.log(`  Equipes mapeadas  : ${teamsMapped} / ${equipesSemTeam.length}`);
  console.log('========================================');
}

main()
  .catch((err) => {
    console.error('Erro fatal durante a sincronizacao:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
