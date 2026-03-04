import { PrismaClient } from '@prisma/client';
import { syncDepartmentRootOrganizationalUnits } from '../../src/services/department-organogram.service';

const prisma = new PrismaClient();

async function main() {
  const syncedDepartments = await syncDepartmentRootOrganizationalUnits(prisma, {
    missingOnly: false,
  });

  console.log(`Secretarias sincronizadas: ${syncedDepartments.length}`);
  for (const department of syncedDepartments) {
    console.log(
      ` - ${department.departmentName}: ${department.rootUnitSigla || 'sem sigla'} (${department.created ? 'criada' : 'atualizada'})`
    );
  }
}

main()
  .catch((error) => {
    console.error('Erro ao sincronizar secretarias com organograma:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
