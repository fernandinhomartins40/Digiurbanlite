import { prisma } from '../../src/lib/prisma';
import { syncCitizenPersonIdentity, syncUserPersonIdentity } from '../../src/services/person-identity.service';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      personId: true,
      cpf: true,
      name: true,
      email: true,
      telefone: true,
      rg: true,
      dataNascimento: true,
      isActive: true,
    },
  });

  for (const user of users) {
    await prisma.$transaction(async (tx) => {
      await syncUserPersonIdentity(tx, {
        userId: user.id,
        currentPersonId: user.personId,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        phone: user.telefone,
        rg: user.rg,
        birthDate: user.dataNascimento,
        isActive: user.isActive,
      });
    });
  }

  const citizens = await prisma.citizen.findMany({
    select: {
      id: true,
      personId: true,
      cpf: true,
      name: true,
      email: true,
      phone: true,
      rg: true,
      birthDate: true,
      isActive: true,
    },
  });

  for (const citizen of citizens) {
    await prisma.$transaction(async (tx) => {
      await syncCitizenPersonIdentity(tx, {
        citizenId: citizen.id,
        currentPersonId: citizen.personId,
        cpf: citizen.cpf,
        name: citizen.name,
        email: citizen.email,
        phone: citizen.phone,
        rg: citizen.rg,
        birthDate: citizen.birthDate,
        isActive: citizen.isActive,
      });
    });
  }

  console.log(
    `[person-backfill] Usuários sincronizados: ${users.length}; cidadãos sincronizados: ${citizens.length}`
  );
}

main()
  .catch((error) => {
    console.error('[person-backfill] Falha ao sincronizar identidades:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
