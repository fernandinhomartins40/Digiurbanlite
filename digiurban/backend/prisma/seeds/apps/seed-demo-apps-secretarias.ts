/**
 * SEED DE DEMONSTRAÇÃO — APPS DAS SECRETARIAS (Fase 1 do plano de apps)
 *
 * Dados de fundação/catálogo para os apps novos:
 * - Assistência Social: unidades CRAS/CREAS + programas sociais municipais
 * - Agricultura: técnicos + estoque inicial de sementes/mudas
 *
 * NÃO cria dados operacionais (famílias, OS, inscrições) — esses nascem de
 * protocolos reais ou da UI. Idempotente: pode rodar múltiplas vezes.
 *
 * Uso: npm run db:seed:apps  (ou tsx prisma/seeds/apps/seed-demo-apps-secretarias.ts)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveTenantId(): Promise<string | null> {
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
  return tenant?.id ?? null;
}

async function seedAssistenciaSocial(tenantId: string | null) {
  console.log('━━━ Assistência Social: unidades + programas ━━━');

  const unidades = [
    {
      nome: 'CRAS Centro',
      tipo: 'CRAS',
      endereco: 'Rua Principal, 100 — Centro',
      bairro: 'Centro',
      horario: 'Seg–Sex 8h às 17h',
    },
    {
      nome: 'CREAS Municipal',
      tipo: 'CREAS',
      endereco: 'Av. das Flores, 250 — Centro',
      bairro: 'Centro',
      horario: 'Seg–Sex 8h às 17h',
    },
  ];
  for (const u of unidades) {
    const existe = await prisma.unidadeCRAS.findFirst({ where: { nome: u.nome, tenantId } });
    if (existe) {
      console.log(`   ↺ ${u.nome} já existe`);
      continue;
    }
    await prisma.unidadeCRAS.create({ data: { ...u, tenantId } });
    console.log(`   ✅ ${u.nome} criada`);
  }

  const programas = [
    {
      nome: 'Aluguel Social',
      descricao: 'Auxílio financeiro temporário para moradia de famílias em vulnerabilidade',
      tipo: 'TRANSFERENCIA_RENDA',
      valorBeneficio: 600,
      periodicidade: 'MENSAL',
      orgaoResponsavel: 'Secretaria de Assistência Social',
    },
    {
      nome: 'Cesta Básica Municipal',
      descricao: 'Distribuição mensal de cestas básicas a famílias do CadÚnico municipal',
      tipo: 'BENEFICIO_EVENTUAL',
      valorBeneficio: null,
      periodicidade: 'MENSAL',
      orgaoResponsavel: 'Secretaria de Assistência Social',
    },
    {
      nome: 'Auxílio Natalidade',
      descricao: 'Benefício eventual em parcela única para famílias com recém-nascidos',
      tipo: 'BENEFICIO_EVENTUAL',
      valorBeneficio: 400,
      periodicidade: 'UNICA',
      orgaoResponsavel: 'Secretaria de Assistência Social',
    },
  ];
  for (const p of programas) {
    const existe = await prisma.programaSocial.findFirst({ where: { nome: p.nome, tenantId } });
    if (existe) {
      console.log(`   ↺ Programa "${p.nome}" já existe`);
      continue;
    }
    await prisma.programaSocial.create({ data: { ...p, tenantId } });
    console.log(`   ✅ Programa "${p.nome}" criado`);
  }
}

async function seedAgricultura(tenantId: string | null) {
  console.log('━━━ Agricultura: técnicos + estoque de sementes ━━━');

  const tecnicos = [
    { nome: 'Eng. Agr. Maria Campos', registro: 'CREA-12345', especialidade: 'Agronomia' },
    { nome: 'Téc. Agrícola João Terra', registro: 'CFTA-67890', especialidade: 'Manejo de solo' },
  ];
  for (const t of tecnicos) {
    const existe = await prisma.tecnicoAgricola.findFirst({ where: { nome: t.nome, tenantId } });
    if (existe) {
      console.log(`   ↺ ${t.nome} já existe`);
      continue;
    }
    await prisma.tecnicoAgricola.create({ data: { ...t, tenantId } });
    console.log(`   ✅ ${t.nome} criado`);
  }

  const estoque = [
    {
      tipo: 'SEMENTE',
      cultura: 'Milho',
      variedade: 'Híbrido AG-1051',
      unidadeMedida: 'kg',
      quantidade: 500,
      estoqueMinimo: 100,
      origem: 'Convênio estadual',
    },
    {
      tipo: 'SEMENTE',
      cultura: 'Feijão',
      variedade: 'Carioca',
      unidadeMedida: 'kg',
      quantidade: 300,
      estoqueMinimo: 60,
      origem: 'Compra municipal',
    },
    {
      tipo: 'MUDA',
      cultura: 'Alface',
      variedade: 'Crespa',
      unidadeMedida: 'bandeja',
      quantidade: 80,
      estoqueMinimo: 20,
      origem: 'Viveiro municipal',
    },
  ];
  for (const item of estoque) {
    const existe = await prisma.estoqueSemente.findFirst({
      where: { cultura: item.cultura, variedade: item.variedade, tenantId },
    });
    if (existe) {
      console.log(`   ↺ Estoque de ${item.cultura} (${item.variedade}) já existe`);
      continue;
    }
    await prisma.estoqueSemente.create({ data: { ...item, tenantId } });
    console.log(`   ✅ Estoque de ${item.cultura} (${item.variedade}) criado`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🌱 SEED — APPS DAS SECRETARIAS (Fase 1)');
  console.log('═══════════════════════════════════════════════════════\n');

  const tenantId = await resolveTenantId();
  console.log(`Tenant default: ${tenantId ?? '(nenhum — tenantId NULL, normalizado depois)'}\n`);

  await seedAssistenciaSocial(tenantId);
  console.log('');
  await seedAgricultura(tenantId);

  console.log('\n✅ Seed dos apps concluído');
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed dos apps:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
