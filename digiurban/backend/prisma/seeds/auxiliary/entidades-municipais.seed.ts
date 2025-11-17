import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// CONJUNTOS HABITACIONAIS
// ========================================

export const conjuntosHabitacionaisData = [
  {
    nome: 'Residencial Esperança',
    endereco: 'Rua das Flores, 1000',
    bairro: 'Jardim Esperança',
    totalUnidades: 200,
    unidadesOcupadas: 185,
    unidadesDisponiveis: 15,
    tipologias: ['1 quarto', '2 quartos', '3 quartos'],
    programaOrigem: 'MCMV',
    latitude: -23.5505,
    longitude: -46.6333,
    infraestrutura: ['água', 'esgoto', 'pavimentação', 'iluminação pública'],
  },
  {
    nome: 'Conjunto Vila Nova',
    endereco: 'Av. Central, 2500',
    bairro: 'Vila Nova',
    totalUnidades: 150,
    unidadesOcupadas: 150,
    unidadesDisponiveis: 0,
    tipologias: ['2 quartos', '3 quartos'],
    programaOrigem: 'CDHU',
    latitude: -23.5605,
    longitude: -46.6433,
    infraestrutura: ['água', 'esgoto', 'pavimentação'],
  },
  {
    nome: 'Residencial Bela Vista',
    endereco: 'Rua Bela Vista, 500',
    bairro: 'Bela Vista',
    totalUnidades: 100,
    unidadesOcupadas: 75,
    unidadesDisponiveis: 25,
    tipologias: ['1 quarto', '2 quartos'],
    programaOrigem: 'Municipal',
    latitude: -23.5705,
    longitude: -46.6533,
    infraestrutura: ['água', 'esgoto'],
  },
  {
    nome: 'Conjunto Jardim das Acácias',
    endereco: 'Rua das Acácias, 300',
    bairro: 'Jardim das Acácias',
    totalUnidades: 80,
    unidadesOcupadas: 60,
    unidadesDisponiveis: 20,
    tipologias: ['2 quartos'],
    programaOrigem: 'MCMV',
    latitude: -23.5805,
    longitude: -46.6633,
    infraestrutura: ['água', 'esgoto', 'pavimentação', 'iluminação pública'],
  },
];

export async function seedConjuntosHabitacionais() {
  console.log('   🏘️  Conjuntos Habitacionais...');

  for (const data of conjuntosHabitacionaisData) {
    await prisma.conjuntoHabitacional.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${conjuntosHabitacionaisData.length} conjuntos habitacionais criados`);
}

// ========================================
// VIATURAS DE SEGURANÇA
// ========================================

export const viaturasSegurancaData = [
  {
    codigo: 'VT-001',
    tipo: 'Patrulha',
    placa: 'ABC-1234',
    modelo: 'Toyota Hilux',
    ano: 2022,
    status: 'Ativa',
    equipamentos: ['Rádio', 'Câmera', 'GPS', 'Sirene'],
    baseOperacional: 'Base Central',
    horasUso: 1200,
    kmRodados: 35000,
  },
  {
    codigo: 'VT-002',
    tipo: 'Moto',
    placa: 'DEF-5678',
    modelo: 'Honda CG 160',
    ano: 2023,
    status: 'Ativa',
    equipamentos: ['Rádio', 'GPS'],
    baseOperacional: 'Base Norte',
    horasUso: 800,
    kmRodados: 18000,
  },
  {
    codigo: 'VT-003',
    tipo: 'Patrulha',
    placa: 'GHI-9012',
    modelo: 'Ford Ranger',
    ano: 2021,
    status: 'Manutenção',
    equipamentos: ['Rádio', 'Câmera', 'GPS'],
    baseOperacional: 'Base Sul',
    horasUso: 1500,
    kmRodados: 42000,
  },
  {
    codigo: 'VT-004',
    tipo: 'Bicicleta',
    modelo: 'Caloi Mountain Bike',
    ano: 2023,
    status: 'Ativa',
    equipamentos: ['Rádio Portátil'],
    baseOperacional: 'Base Centro',
    horasUso: 400,
    kmRodados: 5000,
  },
  {
    codigo: 'VT-005',
    tipo: 'Viatura Especial',
    placa: 'JKL-3456',
    modelo: 'Mercedes Sprinter',
    ano: 2022,
    status: 'Ativa',
    equipamentos: ['Rádio', 'Câmera', 'GPS', 'Equipamento Tático'],
    baseOperacional: 'Base Central',
    horasUso: 600,
    kmRodados: 15000,
  },
];

export async function seedViaturasSeguranca() {
  console.log('   🚔 Viaturas de Segurança...');

  for (const data of viaturasSegurancaData) {
    await prisma.viaturaSeguranca.upsert({
      where: { codigo: data.codigo },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${viaturasSegurancaData.length} viaturas de segurança criadas`);
}

// ========================================
// PARQUES E PRAÇAS
// ========================================

export const parquesPracasData = [
  {
    nome: 'Parque Municipal',
    tipo: 'Parque',
    endereco: 'Av. Principal, s/n',
    bairro: 'Centro',
    latitude: -23.5505,
    longitude: -46.6333,
    area: 50000, // m²
    equipamentos: ['Playground', 'Quadra Poliesportiva', 'Pista de Caminhada', 'Academia ao Ar Livre'],
    horarioFuncionamento: '06:00 às 22:00',
    permiteEventos: true,
    capacidadeEventos: 500,
  },
  {
    nome: 'Praça da Matriz',
    tipo: 'Praça',
    endereco: 'Praça da Matriz, s/n',
    bairro: 'Centro',
    latitude: -23.5605,
    longitude: -46.6433,
    area: 5000,
    equipamentos: ['Bancos', 'Iluminação', 'Chafariz'],
    horarioFuncionamento: '24 horas',
    permiteEventos: true,
    capacidadeEventos: 200,
  },
  {
    nome: 'Praça das Flores',
    tipo: 'Praça',
    endereco: 'Rua das Flores, s/n',
    bairro: 'Jardim Esperança',
    latitude: -23.5705,
    longitude: -46.6533,
    area: 2000,
    equipamentos: ['Playground', 'Bancos'],
    horarioFuncionamento: '24 horas',
    permiteEventos: false,
  },
  {
    nome: 'Parque Ecológico',
    tipo: 'Parque',
    endereco: 'Estrada Rural, km 5',
    bairro: 'Zona Rural',
    latitude: -23.5805,
    longitude: -46.6633,
    area: 100000,
    equipamentos: ['Trilhas', 'Área de Piquenique', 'Mirante'],
    horarioFuncionamento: '08:00 às 18:00',
    permiteEventos: true,
    capacidadeEventos: 1000,
  },
  {
    nome: 'Jardim Botânico Municipal',
    tipo: 'Jardim',
    endereco: 'Av. Verde, 1000',
    bairro: 'Vila Verde',
    latitude: -23.5905,
    longitude: -46.6733,
    area: 30000,
    equipamentos: ['Estufas', 'Lago', 'Trilhas', 'Centro de Visitantes'],
    horarioFuncionamento: '09:00 às 17:00',
    permiteEventos: true,
    capacidadeEventos: 300,
  },
];

export async function seedParquesPracas() {
  console.log('   🌳 Parques e Praças...');

  for (const data of parquesPracasData) {
    await prisma.parquePraca.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${parquesPracasData.length} parques e praças criados`);
}

// ========================================
// ESTABELECIMENTOS TURÍSTICOS
// ========================================

export const estabelecimentosTuristicosData = [
  {
    nome: 'Hotel Central',
    tipo: 'Hotel',
    endereco: 'Av. Principal, 100',
    bairro: 'Centro',
    telefone: '(11) 3333-4444',
    email: 'contato@hotelcentral.com',
    site: 'https://hotelcentral.com',
    categoria: '3 estrelas',
    latitude: -23.5505,
    longitude: -46.6333,
    capacidade: 80,
    servicos: ['Wi-Fi', 'Estacionamento', 'Café da Manhã', 'Ar Condicionado'],
    horario: '24 horas',
  },
  {
    nome: 'Pousada Aconchego',
    tipo: 'Pousada',
    endereco: 'Rua Tranquila, 50',
    bairro: 'Bela Vista',
    telefone: '(11) 3333-5555',
    email: 'pousadaaconchego@email.com',
    categoria: 'Categoria Turística',
    latitude: -23.5605,
    longitude: -46.6433,
    capacidade: 20,
    servicos: ['Wi-Fi', 'Café da Manhã', 'Jardim'],
  },
  {
    nome: 'Restaurante Sabor Regional',
    tipo: 'Restaurante',
    endereco: 'Praça da Matriz, 10',
    bairro: 'Centro',
    telefone: '(11) 3333-6666',
    email: 'saborregional@email.com',
    categoria: 'Culinária Regional',
    latitude: -23.5705,
    longitude: -46.6533,
    capacidade: 100,
    servicos: ['Estacionamento', 'Acessibilidade', 'Delivery'],
    horario: '11:00 às 23:00',
  },
  {
    nome: 'Museu Histórico Municipal',
    tipo: 'Atração Turística',
    endereco: 'Rua da História, 200',
    bairro: 'Centro',
    telefone: '(11) 3333-7777',
    email: 'museu@prefeitura.gov.br',
    categoria: 'Museu',
    latitude: -23.5805,
    longitude: -46.6633,
    capacidade: 50,
    servicos: ['Acessibilidade', 'Guia Turístico', 'Loja de Souvenirs'],
    horario: 'Terça a Domingo, 09:00 às 17:00',
  },
];

export async function seedEstabelecimentosTuristicos() {
  console.log('   🏨 Estabelecimentos Turísticos...');

  for (const data of estabelecimentosTuristicosData) {
    await prisma.estabelecimentoTuristico.upsert({
      where: { nome: data.nome },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${estabelecimentosTuristicosData.length} estabelecimentos turísticos criados`);
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function seedEntidadesMunicipais() {
  console.log('\n═══ ENTIDADES MUNICIPAIS ═══\n');

  await seedConjuntosHabitacionais();
  await seedViaturasSeguranca();
  await seedParquesPracas();
  await seedEstabelecimentosTuristicos();

  console.log('\n✅ Entidades Municipais criadas com sucesso!\n');
}
