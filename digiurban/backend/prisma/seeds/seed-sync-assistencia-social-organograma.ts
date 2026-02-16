import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando sincronização: Assistência Social → Organograma...');

  // 1. Find the Department for "Secretaria de Assistência Social"
  const assDept = await prisma.department.findFirst({
    where: {
      name: {
        contains: 'Assistência Social',
        mode: 'insensitive',
      },
    },
  });

  if (!assDept) {
    throw new Error('Department "Secretaria de Assistência Social" não encontrado. Verifique se o departamento existe no banco.');
  }

  console.log(`Departamento encontrado: ${assDept.name} (id=${assDept.id})`);

  // 2. Find or create root OrganizationalUnit for "Secretaria de Assistência Social"
  let rootOrgUnit = await prisma.organizationalUnit.findFirst({
    where: {
      departmentId: assDept.id,
      nivel: 1,
      tipo: 'SECRETARIA',
    },
  });

  if (!rootOrgUnit) {
    console.log('Unidade organizacional raiz não encontrada. Criando...');
    rootOrgUnit = await prisma.organizationalUnit.create({
      data: {
        nome: 'Secretaria de Assistência Social',
        tipo: 'SECRETARIA',
        nivel: 1,
        parentId: null,
        departmentId: assDept.id,
      },
    });
    console.log(`Unidade raiz criada: ${rootOrgUnit.nome} (id=${rootOrgUnit.id})`);
  } else {
    console.log(`Unidade raiz encontrada: ${rootOrgUnit.nome} (id=${rootOrgUnit.id})`);
  }

  // 3. Find all UnidadeCRAS where organizationalUnitId is null
  const unidadesSemVinculo = await prisma.unidadeCRAS.findMany({
    where: {
      organizationalUnitId: null,
    },
  });

  console.log(`UnidadeCRAS sem vínculo encontradas: ${unidadesSemVinculo.length}`);

  if (unidadesSemVinculo.length === 0) {
    console.log('Nenhuma unidade para sincronizar. Encerrando.');
    return;
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const unit of unidadesSemVinculo) {
    try {
      // 4a. Create OrganizationalUnit for the UnidadeCRAS
      const newOrgUnit = await prisma.organizationalUnit.create({
        data: {
          nome: unit.nome,
          tipo: 'SETOR',
          nivel: 3,
          parentId: rootOrgUnit.id,
          departmentId: assDept.id,
        },
      });
      created++;

      // 4b. Update UnidadeCRAS.organizationalUnitId
      await prisma.unidadeCRAS.update({
        where: { id: unit.id },
        data: { organizationalUnitId: newOrgUnit.id },
      });
      updated++;

      console.log(`  ✓ ${unit.nome} → OrganizationalUnit id=${newOrgUnit.id}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ Erro ao processar "${unit.nome}":`, err);
    }
  }

  // 5. Log summary
  console.log('\n--- Resumo da Sincronização ---');
  console.log(`Total de unidades processadas : ${unidadesSemVinculo.length}`);
  console.log(`OrganizationalUnits criadas   : ${created}`);
  console.log(`UnidadeCRAS atualizadas       : ${updated}`);
  console.log(`Erros                         : ${errors}`);
  console.log('Sincronização concluída.');
}

main()
  .catch((err) => {
    console.error('Erro fatal na sincronização:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
