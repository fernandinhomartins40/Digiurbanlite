/**
 * SEED DE UNIDADES EDUCACIONAIS
 * Popula tabela de escolas para SELECTs dinâmicos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const unidadesEducacaoData = [
  {
    nome: 'EMEF José de Alencar',
    tipo: 'EMEF',
    endereco: 'Rua da Educação, 100',
    bairro: 'Centro',
    telefone: '(11) 3100-1000',
    email: 'emef.alencar@educacao.gov.br',
    niveisEnsino: ['Fundamental I', 'Fundamental II'],
    turnos: ['Matutino', 'Vespertino'],
    vagas: 800,
    isActive: true
  },
  {
    nome: 'EMEI Monteiro Lobato',
    tipo: 'EMEI',
    endereco: 'Avenida das Crianças, 50',
    bairro: 'Jardim Esperança',
    telefone: '(11) 3100-1001',
    email: 'emei.lobato@educacao.gov.br',
    niveisEnsino: ['Infantil'],
    turnos: ['Matutino', 'Vespertino', 'Integral'],
    vagas: 200,
    isActive: true
  },
  {
    nome: 'EMEF Cecília Meireles',
    tipo: 'EMEF',
    endereco: 'Rua dos Estudantes, 300',
    bairro: 'Vila Nova',
    telefone: '(11) 3100-1002',
    email: 'emef.cecilia@educacao.gov.br',
    niveisEnsino: ['Fundamental I', 'Fundamental II'],
    turnos: ['Matutino', 'Vespertino'],
    vagas: 600,
    isActive: true
  },
  {
    nome: 'EJA Noturno Centro',
    tipo: 'EJA',
    endereco: 'Avenida Central, 500',
    bairro: 'Centro',
    telefone: '(11) 3100-1003',
    email: 'eja.centro@educacao.gov.br',
    niveisEnsino: ['EJA Fundamental', 'EJA Médio'],
    turnos: ['Noturno'],
    vagas: 300,
    isActive: true
  },
  {
    nome: 'CEI Pequenos Sonhos',
    tipo: 'CEI',
    endereco: 'Rua das Flores, 80',
    bairro: 'Jardim Primavera',
    telefone: '(11) 3100-1004',
    email: 'cei.sonhos@educacao.gov.br',
    niveisEnsino: ['Creche'],
    turnos: ['Integral'],
    vagas: 150,
    isActive: true
  },
  {
    nome: 'EMEF Carlos Drummond de Andrade',
    tipo: 'EMEF',
    endereco: 'Rua Poética, 200',
    bairro: 'Bela Vista',
    telefone: '(11) 3100-1005',
    email: 'emef.drummond@educacao.gov.br',
    niveisEnsino: ['Fundamental I', 'Fundamental II'],
    turnos: ['Matutino', 'Vespertino', 'Integral'],
    vagas: 900,
    isActive: true
  }
];

export async function seedUnidadesEducacao() {
  console.log('🎓 Criando Unidades Educacionais...');

  for (const unidade of unidadesEducacaoData) {
    await prisma.unidadeEducacao.upsert({
      where: { nome: unidade.nome },
      update: unidade,
      create: unidade
    });
    console.log(`   ✅ ${unidade.nome}`);
  }

  console.log(`✅ ${unidadesEducacaoData.length} unidades educacionais criadas\n`);
}

if (require.main === module) {
  seedUnidadesEducacao()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
