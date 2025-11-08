const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCitizen() {
  try {
    // Buscar o cidadão pelo CPF
    const citizen = await prisma.citizen.findFirst({
      where: {
        cpf: '05282248913'
      }
    });

    if (!citizen) {
      console.log('❌ Cidadão não encontrado');
      return;
    }

    console.log('📝 Atualizando dados do cidadão:', citizen.name);

    // Atualizar com dados de exemplo
    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id
      },
      data: {
        rg: '123456789',
        birthDate: new Date('1990-01-15'),
        motherName: 'Maria Oliveira',
        maritalStatus: 'Casado(a)',
        occupation: 'Empresário',
        familyIncome: '3 a 5 salários mínimos',
        phoneSecondary: '42988887777',
        address: {
          ...citizen.address,
          pontoReferencia: 'Próximo à prefeitura'
        }
      }
    });

    console.log('✅ Dados atualizados com sucesso!');
    console.log({
      rg: updated.rg,
      birthDate: updated.birthDate,
      motherName: updated.motherName,
      maritalStatus: updated.maritalStatus,
      occupation: updated.occupation,
      familyIncome: updated.familyIncome,
      phoneSecondary: updated.phoneSecondary
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCitizen();
