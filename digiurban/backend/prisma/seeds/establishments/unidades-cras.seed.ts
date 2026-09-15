/**
 * SEED DE UNIDADES CRAS/CREAS
 * Popula tabela de assistência social para SELECTs dinâmicos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const unidadesCRASData = [
  {
    nome: 'CRAS Central',
    tipo: 'CRAS',
    endereco: 'Avenida da Assistência, 100',
    bairro: 'Centro',
    telefone: '(11) 3200-1000',
    email: 'cras.central@social.gov.br',
    horario: 'Segunda a Sexta: 8h às 17h',
    programas: ['CadÚnico', 'Bolsa Família', 'BPC', 'Grupos de Convivência', 'Oficinas'],
    isActive: true
  },
  {
    nome: 'CRAS Zona Norte',
    tipo: 'CRAS',
    endereco: 'Rua do Norte, 500',
    bairro: 'Zona Norte',
    telefone: '(11) 3200-1001',
    email: 'cras.zonanorte@social.gov.br',
    horario: 'Segunda a Sexta: 8h às 17h',
    programas: ['CadÚnico', 'Bolsa Família', 'Cestas Básicas', 'Grupos de Mulheres'],
    isActive: true
  },
  {
    nome: 'CRAS Vila Esperança',
    tipo: 'CRAS',
    endereco: 'Avenida Esperança, 300',
    bairro: 'Vila Esperança',
    telefone: '(11) 3200-1002',
    email: 'cras.esperanca@social.gov.br',
    horario: 'Segunda a Sexta: 8h às 17h',
    programas: ['CadÚnico', 'Bolsa Família', 'Grupos de Idosos', 'Atividades para Crianças'],
    isActive: true
  },
  {
    nome: 'CREAS Municipal',
    tipo: 'CREAS',
    endereco: 'Rua da Proteção, 200',
    bairro: 'Centro',
    telefone: '(11) 3200-2000',
    email: 'creas@social.gov.br',
    horario: 'Segunda a Sexta: 8h às 18h',
    programas: ['Atendimento a Violência', 'Medidas Socioeducativas', 'Abuso Sexual', 'Situação de Rua'],
    isActive: true
  }
];

export async function seedUnidadesCRAS() {
  console.log('🤝 Criando Unidades CRAS/CREAS...');

  // ⚠️ (corrigido 2026-09-15) `where: { nome }` não valida: a unique de
  // UnidadeCRAS aceita apenas `id` ou `organizationalUnitId`. Resolvemos o id
  // com findFirst (a tenant extension escopa) e então criamos/atualizamos.
  for (const unidade of unidadesCRASData) {
    const existente = await prisma.unidadeCRAS.findFirst({
      where: { nome: unidade.nome },
      select: { id: true },
    });

    if (existente) {
      await prisma.unidadeCRAS.update({ where: { id: existente.id }, data: unidade });
    } else {
      await prisma.unidadeCRAS.create({ data: unidade });
    }
    console.log(`   ✅ ${unidade.nome}`);
  }

  console.log(`✅ ${unidadesCRASData.length} unidades CRAS/CREAS criadas\n`);
}

if (require.main === module) {
  seedUnidadesCRAS()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
