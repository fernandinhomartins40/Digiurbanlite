/**
 * SEED DE UNIDADES DE SAÚDE
 * Popula tabela de unidades para SELECTs dinâmicos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const unidadesSaudeData = [
  {
    nome: 'UBS Central',
    tipo: 'UBS',
    endereco: 'Rua Principal, 100',
    bairro: 'Centro',
    telefone: '(11) 3000-1000',
    horario: 'Segunda a Sexta: 7h às 17h',
    especialidades: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Enfermagem'],
    isActive: true
  },
  {
    nome: 'UBS Jardim Esperança',
    tipo: 'UBS',
    endereco: 'Avenida das Flores, 500',
    bairro: 'Jardim Esperança',
    telefone: '(11) 3000-1001',
    horario: 'Segunda a Sexta: 7h às 17h',
    especialidades: ['Clínico Geral', 'Pediatria', 'Enfermagem'],
    isActive: true
  },
  {
    nome: 'UBS Vila Nova',
    tipo: 'UBS',
    endereco: 'Rua das Palmeiras, 250',
    bairro: 'Vila Nova',
    telefone: '(11) 3000-1002',
    horario: 'Segunda a Sexta: 7h às 17h',
    especialidades: ['Clínico Geral', 'Pediatria', 'Odontologia'],
    isActive: true
  },
  {
    nome: 'UPA 24h Centro',
    tipo: 'UPA',
    endereco: 'Avenida Brasil, 800',
    bairro: 'Centro',
    telefone: '(11) 3000-2000',
    horario: '24 horas',
    especialidades: ['Emergência', 'Clínico Geral', 'Pediatria', 'Ortopedia'],
    isActive: true
  },
  {
    nome: 'Hospital Municipal São João',
    tipo: 'Hospital',
    endereco: 'Rua Hospitalar, 1000',
    bairro: 'Centro',
    telefone: '(11) 3000-3000',
    horario: '24 horas',
    especialidades: ['Emergência', 'UTI', 'Cirurgia', 'Cardiologia', 'Ortopedia', 'Neurologia'],
    isActive: true
  },
  {
    nome: 'Clínica da Família Zona Sul',
    tipo: 'Clínica',
    endereco: 'Rua do Sul, 300',
    bairro: 'Zona Sul',
    telefone: '(11) 3000-1003',
    horario: 'Segunda a Sábado: 7h às 19h',
    especialidades: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Psicologia', 'Nutrição'],
    isActive: true
  }
];

export async function seedUnidadesSaude() {
  console.log('🏥 Criando Unidades de Saúde...');

  for (const unidade of unidadesSaudeData) {
    await prisma.unidadeSaude.upsert({
      where: { nome: unidade.nome },
      update: unidade,
      create: unidade
    });
    console.log(`   ✅ ${unidade.nome}`);
  }

  console.log(`✅ ${unidadesSaudeData.length} unidades de saúde criadas\n`);
}

if (require.main === module) {
  seedUnidadesSaude()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
