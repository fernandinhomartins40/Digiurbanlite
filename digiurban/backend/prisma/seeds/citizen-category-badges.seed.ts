/**
 * ============================================================================
 * CITIZEN CATEGORY BADGES SEED - Sistema de Badges e Conquistas
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BadgeSeed {
  categoryCode: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: any;
  requiredProtocolCount?: number;
  requiredExperiencePoints?: number;
  requiredDays?: number;
  priority?: number;
}

const badges: BadgeSeed[] = [
  // AGRICULTURA
  {
    categoryCode: 'PRODUTOR_RURAL',
    code: 'PRIMEIRO_CADASTRO',
    name: 'Primeiro Passo',
    description: 'Completou o primeiro cadastro como produtor rural',
    icon: 'sprout',
    color: '#10b981',
    criteria: { type: 'automatic', triggerOn: 'firstProtocol' },
    requiredProtocolCount: 1,
    priority: 1,
  },
  {
    categoryCode: 'PRODUTOR_RURAL',
    code: 'CINCO_SERVICOS',
    name: 'Agricultor Dedicado',
    description: 'Utilizou 5 serviços da agricultura',
    icon: 'award',
    color: '#059669',
    criteria: { type: 'protocolCount', minCount: 5 },
    requiredProtocolCount: 5,
    priority: 2,
  },
  {
    categoryCode: 'PRODUTOR_RURAL',
    code: 'VETERANO',
    name: 'Veterano do Campo',
    description: 'Cadastrado há mais de 1 ano',
    icon: 'calendar-check',
    color: '#eab308',
    criteria: { type: 'daysActive', minDays: 365 },
    requiredDays: 365,
    priority: 3,
  },
  {
    categoryCode: 'PRODUTOR_RURAL_ATIVO',
    code: 'PRODUTOR_EXEMPLAR',
    name: 'Produtor Exemplar',
    description: 'Atingiu nível ativo com excelente participação',
    icon: 'medal',
    color: '#dc2626',
    criteria: { type: 'automatic', triggerOn: 'levelUp' },
    requiredExperiencePoints: 500,
    priority: 5,
  },

  // CULTURA
  {
    categoryCode: 'ARTISTA_LOCAL',
    code: 'APRESENTACAO_PUBLICA',
    name: 'Primeira Apresentação',
    description: 'Realizou primeira apresentação pública registrada',
    icon: 'music',
    color: '#f59e0b',
    criteria: { type: 'manual', requiresApproval: true },
    priority: 2,
  },
  {
    categoryCode: 'ARTISTA_LOCAL',
    code: 'ARTISTA_ATIVO',
    name: 'Artista Ativo',
    description: 'Participou de 3 eventos culturais',
    icon: 'star',
    color: '#f97316',
    criteria: { type: 'protocolCount', minCount: 3 },
    requiredProtocolCount: 3,
    priority: 2,
  },
  {
    categoryCode: 'ARTISTA_LOCAL_RECONHECIDO',
    code: 'RECONHECIMENTO_MUNICIPAL',
    name: 'Reconhecimento Municipal',
    description: 'Artista reconhecido oficialmente pelo município',
    icon: 'trophy',
    color: '#dc2626',
    criteria: { type: 'automatic', triggerOn: 'levelUp' },
    priority: 5,
  },

  // ESPORTES
  {
    categoryCode: 'ATLETA',
    code: 'PRIMEIRA_COMPETICAO',
    name: 'Primeira Competição',
    description: 'Participou da primeira competição oficial',
    icon: 'flag',
    color: '#3b82f6',
    criteria: { type: 'manual', requiresApproval: true },
    priority: 2,
  },
  {
    categoryCode: 'ATLETA',
    code: 'ATLETA_DEDICADO',
    name: 'Atleta Dedicado',
    description: 'Treina regularmente há 6 meses',
    icon: 'dumbbell',
    color: '#06b6d4',
    criteria: { type: 'daysActive', minDays: 180 },
    requiredDays: 180,
    priority: 3,
  },

  // MEIO AMBIENTE
  {
    categoryCode: 'LICENCIADO_AMBIENTAL',
    code: 'LICENCA_ATIVA',
    name: 'Licença em Dia',
    description: 'Mantém licença ambiental ativa e regular',
    icon: 'shield-check',
    color: '#059669',
    criteria: { type: 'automatic', triggerOn: 'renewal' },
    priority: 2,
  },
  {
    categoryCode: 'LICENCIADO_AMBIENTAL',
    code: 'RENOVACAO_PONTUAL',
    name: 'Renovação Pontual',
    description: 'Renovou licença antes do vencimento 3 vezes',
    icon: 'clock',
    color: '#10b981',
    criteria: { type: 'renewalCount', minCount: 3 },
    priority: 3,
  },

  // EMPREENDEDORISMO
  {
    categoryCode: 'MICROEMPREENDEDOR',
    code: 'EMPREENDEDOR_INICIANTE',
    name: 'Empreendedor Iniciante',
    description: 'Formalizou seu primeiro negócio',
    icon: 'briefcase',
    color: '#6366f1',
    criteria: { type: 'automatic', triggerOn: 'firstProtocol' },
    requiredProtocolCount: 1,
    priority: 1,
  },
  {
    categoryCode: 'FEIRA_EMPREENDEDOR',
    code: 'FEIRANTE_REGULAR',
    name: 'Feirante Regular',
    description: 'Participou de 5 feiras do empreendedor',
    icon: 'store',
    color: '#4f46e5',
    criteria: { type: 'protocolCount', minCount: 5 },
    requiredProtocolCount: 5,
    priority: 2,
  },
];

export async function seedCitizenCategoryBadges() {
  console.log('🏅 Seeding Citizen Category Badges...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const badge of badges) {
    // Buscar categoria
    // ⚠️ MULTI-TENANT (2026-09-15): unique composta (`tenantId_code`) —
    // findFirst em vez de findUnique (a extension escopa por tenant).
    const category = await prisma.citizenCategory.findFirst({
      where: { code: badge.categoryCode },
    });

    if (!category) {
      console.warn(`⚠️  Categoria ${badge.categoryCode} não encontrada, pulando badge ${badge.code}`);
      skipped++;
      continue;
    }

    const existing = await prisma.citizenCategoryBadge.findUnique({
      where: { code: badge.code },
    });

    const data = {
      categoryId: category.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      criteria: badge.criteria,
      requiredProtocolCount: badge.requiredProtocolCount,
      requiredExperiencePoints: badge.requiredExperiencePoints,
      requiredDays: badge.requiredDays,
      priority: badge.priority || 5,
      active: true,
      isPublic: true,
    };

    if (existing) {
      await prisma.citizenCategoryBadge.update({
        where: { code: badge.code },
        data,
      });
      updated++;
    } else {
      await prisma.citizenCategoryBadge.create({
        data: {
          code: badge.code,
          ...data,
        },
      });
      created++;
    }
  }

  console.log(`✅ Badges seeded: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log(`📊 Total badges: ${badges.length}`);
}

export default seedCitizenCategoryBadges;

// Executar se chamado diretamente
if (require.main === module) {
  seedCitizenCategoryBadges()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Error seeding badges:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
