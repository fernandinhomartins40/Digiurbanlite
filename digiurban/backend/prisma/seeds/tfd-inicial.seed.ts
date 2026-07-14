/**
 * SEED INICIAL TFD
 * Popular especialidades e destinos iniciais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTFD() {
  console.log('🏥 Populando dados iniciais do APP TFD...\n');

  // ============= ESPECIALIDADES =============
  console.log('📋 Especialidades...');

  const especialidades = [
    { nome: 'Cardiologia', ordem: 1 },
    { nome: 'Oncologia', ordem: 2 },
    { nome: 'Neurologia', ordem: 3 },
    { nome: 'Ortopedia', ordem: 4 },
    { nome: 'Oftalmologia', ordem: 5 },
    { nome: 'Nefrologia', ordem: 6 },
    { nome: 'Urologia', ordem: 7 },
    { nome: 'Cirurgia Cardíaca', ordem: 8 },
    { nome: 'Cirurgia Vascular', ordem: 9 },
    { nome: 'Hematologia', ordem: 10 },
    { nome: 'Endocrinologia', ordem: 11 },
    { nome: 'Gastroenterologia', ordem: 12 },
    { nome: 'Pneumologia', ordem: 13 },
    { nome: 'Reumatologia', ordem: 14 },
    { nome: 'Dermatologia', ordem: 15 },
  ];

  for (const esp of especialidades) {
    // onda 8: unique composta [tenantId, nome] — findFirst é escopado pela tenant-extension
    const existing = await prisma.especialidadeTFD.findFirst({ where: { nome: esp.nome } });
    if (!existing) {
      await prisma.especialidadeTFD.create({ data: esp });
    }
  }
  console.log(`   ✅ ${especialidades.length} especialidades criadas\n`);

  // ============= DESTINOS =============
  console.log('🗺️  Destinos...');

  const destinos = [
    {
      cidade: 'Curitiba',
      estado: 'PR',
      hospital: 'Hospital de Clínicas - UFPR',
      especialidades: ['Oncologia', 'Cardiologia', 'Neurologia'],
      distanciaKm: 80,
      tempoViagem: '1h30min',
    },
    {
      cidade: 'Curitiba',
      estado: 'PR',
      hospital: 'Hospital Erasto Gaertner',
      especialidades: ['Oncologia'],
      distanciaKm: 80,
      tempoViagem: '1h30min',
    },
    {
      cidade: 'Guarapuava',
      estado: 'PR',
      hospital: 'Hospital São Vicente',
      especialidades: ['Cardiologia', 'Ortopedia', 'Neurologia'],
      distanciaKm: 120,
      tempoViagem: '2h',
    },
    {
      cidade: 'Ponta Grossa',
      estado: 'PR',
      hospital: 'Santa Casa de Ponta Grossa',
      especialidades: ['Ortopedia', 'Oftalmologia', 'Cirurgia Geral'],
      distanciaKm: 50,
      tempoViagem: '50min',
    },
    {
      cidade: 'São Paulo',
      estado: 'SP',
      hospital: 'Hospital das Clínicas - USP',
      especialidades: ['Oncologia', 'Cardiologia', 'Neurologia', 'Nefrologia'],
      distanciaKm: 450,
      tempoViagem: '6h',
    },
  ];

  for (const dest of destinos) {
    // onda 8: unique composta [tenantId, cidade, estado, hospital] — findFirst
    // é escopado pela tenant-extension
    const existing = await prisma.destinoTFD.findFirst({
      where: {
        cidade: dest.cidade,
        estado: dest.estado,
        hospital: dest.hospital || '',
      },
    });
    if (!existing) {
      await prisma.destinoTFD.create({ data: dest });
    }
  }
  console.log(`   ✅ ${destinos.length} destinos criados\n`);

  console.log('✅ Seed TFD concluído!');
}

seedTFD()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
