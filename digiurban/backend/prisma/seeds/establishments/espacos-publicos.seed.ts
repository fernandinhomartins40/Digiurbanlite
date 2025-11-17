/**
 * SEED DE ESPAÇOS PÚBLICOS
 * Popula tabela de espaços para SELECTs dinâmicos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const espacosPublicosData = [
  {
    nome: 'Ginásio Municipal de Esportes',
    tipo: 'Ginásio',
    categoria: 'Esportivo',
    endereco: 'Avenida dos Esportes, 100',
    bairro: 'Centro',
    telefone: '(11) 3300-1000',
    capacidade: 2000,
    comodidades: ['Quadra Poliesportiva', 'Vestiários', 'Arquibancadas', 'Iluminação'],
    horario: 'Segunda a Domingo: 6h às 22h',
    isActive: true
  },
  {
    nome: 'Quadra Poliesportiva Vila Nova',
    tipo: 'Quadra',
    categoria: 'Esportivo',
    endereco: 'Rua do Esporte, 50',
    bairro: 'Vila Nova',
    telefone: '(11) 3300-1001',
    capacidade: 200,
    comodidades: ['Quadra Coberta', 'Vestiários', 'Iluminação'],
    horario: 'Segunda a Sábado: 7h às 21h',
    isActive: true
  },
  {
    nome: 'Teatro Municipal',
    tipo: 'Teatro',
    categoria: 'Cultural',
    endereco: 'Praça da Cultura, 1',
    bairro: 'Centro',
    telefone: '(11) 3300-2000',
    capacidade: 500,
    comodidades: ['Palco', 'Camarins', 'Sistema de Som', 'Iluminação Cênica', 'Ar Condicionado'],
    horario: 'Terça a Domingo: 14h às 22h',
    isActive: true
  },
  {
    nome: 'Centro Cultural Machado de Assis',
    tipo: 'Centro Cultural',
    categoria: 'Cultural',
    endereco: 'Avenida Cultural, 300',
    bairro: 'Centro',
    telefone: '(11) 3300-2001',
    capacidade: 300,
    comodidades: ['Salas de Oficina', 'Galeria de Arte', 'Biblioteca', 'Auditório'],
    horario: 'Segunda a Sábado: 9h às 18h',
    isActive: true
  },
  {
    nome: 'Campo de Futebol Sociedade Esportiva',
    tipo: 'Campo',
    categoria: 'Esportivo',
    endereco: 'Rua do Estádio, 500',
    bairro: 'Jardim Esportivo',
    telefone: '(11) 3300-1002',
    capacidade: 1000,
    comodidades: ['Campo Gramado', 'Vestiários', 'Arquibancadas', 'Iluminação'],
    horario: 'Segunda a Domingo: 6h às 22h',
    isActive: true
  },
  {
    nome: 'Piscina Olímpica Municipal',
    tipo: 'Piscina',
    categoria: 'Esportivo',
    endereco: 'Avenida Aquática, 200',
    bairro: 'Centro',
    telefone: '(11) 3300-1003',
    capacidade: 300,
    comodidades: ['Piscina 50m', 'Piscina Infantil', 'Vestiários', 'Sauna', 'Arquibancadas'],
    horario: 'Segunda a Domingo: 6h às 20h',
    isActive: true
  },
  {
    nome: 'Praça da Juventude',
    tipo: 'Praça',
    categoria: 'Lazer',
    endereco: 'Rua da Alegria, 100',
    bairro: 'Jardim Feliz',
    telefone: null,
    capacidade: 500,
    comodidades: ['Playground', 'Quadra', 'Pista de Skate', 'Academia ao Ar Livre', 'Quiosques'],
    horario: '24 horas (áreas abertas)',
    isActive: true
  },
  {
    nome: 'Auditório da Prefeitura',
    tipo: 'Auditório',
    categoria: 'Misto',
    endereco: 'Praça Prefeitura, s/n',
    bairro: 'Centro',
    telefone: '(11) 3300-3000',
    capacidade: 250,
    comodidades: ['Sistema de Som', 'Projetor', 'Ar Condicionado', 'Cadeiras Confortáveis'],
    horario: 'Segunda a Sexta: 8h às 18h',
    isActive: true
  }
];

export async function seedEspacosPublicos() {
  console.log('🏛️  Criando Espaços Públicos...');

  for (const espaco of espacosPublicosData) {
    await prisma.espacoPublico.upsert({
      where: { nome: espaco.nome },
      update: espaco,
      create: espaco
    });
    console.log(`   ✅ ${espaco.nome}`);
  }

  console.log(`✅ ${espacosPublicosData.length} espaços públicos criados\n`);
}

if (require.main === module) {
  seedEspacosPublicos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
