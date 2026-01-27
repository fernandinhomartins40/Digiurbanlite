/**
 * ============================================================================
 * CITIZEN CATEGORIES EXPANDED SEED - Categorias com Novos Recursos
 * ============================================================================
 *
 * Versão 2.0 - Adiciona:
 * - Relacionamentos entre categorias
 * - Validade e renovação
 * - Progressão por níveis
 * - Badges e conquistas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeedExpanded {
  code: string;
  name: string;
  description: string;
  department: string;
  icon: string;
  color: string;
  triggerServices: string[];
  active: boolean;

  // NOVOS CAMPOS
  level?: number;
  parentCategoryCode?: string; // Código da categoria pai
  prerequisiteCategories?: string[];
  complementaryCategories?: string[];
  conflictingCategories?: string[];

  hasValidity?: boolean;
  validityDays?: number;
  requiresRenewal?: boolean;
  renewalReminderDays?: number;
  autoDeactivateOnExpiry?: boolean;

  hasProgression?: boolean;
  nextLevelCategory?: string;
  progressionCriteria?: any;

  categoryType?: string;
  priority?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  benefits?: any;
  restrictions?: any;
}

const categoriesExpanded: CategorySeedExpanded[] = [
  // ========== AGRICULTURA - COM PROGRESSÃO ==========
  {
    code: 'PRODUTOR_RURAL',
    name: 'Produtor Rural',
    description: 'Cidadão cadastrado como produtor rural no município',
    department: 'Agricultura',
    icon: 'tractor',
    color: '#10b981',
    triggerServices: ['CADASTRO_PRODUTOR'],
    active: true,
    level: 1,
    complementaryCategories: ['PROPRIETARIO_RURAL', 'BENEFICIARIO_PROGRAMA_RURAL'],
    hasProgression: true,
    nextLevelCategory: 'PRODUTOR_RURAL_ATIVO',
    progressionCriteria: {
      minProtocolCount: 3,
      minDaysActive: 90,
      description: 'Complete 3 serviços e mantenha cadastro por 90 dias',
    },
    benefits: {
      list: [
        'Acesso a programas de assistência técnica',
        'Participação em feiras do produtor',
        'Prioridade em cursos rurais',
      ],
    },
  },
  {
    code: 'PRODUTOR_RURAL_ATIVO',
    name: 'Produtor Rural Ativo',
    description: 'Produtor rural com histórico ativo de participação',
    department: 'Agricultura',
    icon: 'award',
    color: '#059669',
    triggerServices: [], // Não é atribuída automaticamente, apenas por progressão
    active: true,
    level: 2,
    parentCategoryCode: 'PRODUTOR_RURAL',
    prerequisiteCategories: ['PRODUTOR_RURAL'],
    hasProgression: true,
    nextLevelCategory: 'PRODUTOR_RURAL_DESTAQUE',
    progressionCriteria: {
      minProtocolCount: 10,
      minExperiencePoints: 500,
      minDaysActive: 365,
      description: 'Complete 10 serviços, 500 XP e 1 ano ativo',
    },
    categoryType: 'PREMIUM',
    benefits: {
      list: [
        'Todos os benefícios de Produtor Rural',
        'Descontos em insumos',
        'Acesso prioritário a maquinário',
        'Participação em comitês técnicos',
      ],
    },
  },
  {
    code: 'PRODUTOR_RURAL_DESTAQUE',
    name: 'Produtor Rural Destaque',
    description: 'Produtor rural modelo com excelente histórico',
    department: 'Agricultura',
    icon: 'trophy',
    color: '#eab308',
    triggerServices: [],
    active: true,
    level: 3,
    parentCategoryCode: 'PRODUTOR_RURAL_ATIVO',
    prerequisiteCategories: ['PRODUTOR_RURAL_ATIVO'],
    categoryType: 'PREMIUM',
    benefits: {
      list: [
        'Todos os benefícios anteriores',
        'Certificado de excelência',
        'Possibilidade de ministrar cursos',
        'Visitas técnicas gratuitas',
      ],
    },
  },
  {
    code: 'PROPRIETARIO_RURAL',
    name: 'Proprietário Rural',
    description: 'Cidadão cadastrado como proprietário de propriedade rural',
    department: 'Agricultura',
    icon: 'home',
    color: '#84cc16',
    triggerServices: ['CADASTRO_PROPRIEDADE_RURAL'],
    active: true,
    level: 1,
    complementaryCategories: ['PRODUTOR_RURAL'],
  },
  {
    code: 'BENEFICIARIO_PROGRAMA_RURAL',
    name: 'Beneficiário de Programa Rural',
    description: 'Cidadão inscrito em programas de apoio à agricultura',
    department: 'Agricultura',
    icon: 'leaf',
    color: '#22c55e',
    triggerServices: ['INSCRICAO_PROGRAMA_RURAL'],
    active: true,
    level: 1,
    prerequisiteCategories: ['PRODUTOR_RURAL'], // Precisa ser produtor para se inscrever
  },

  // ========== CULTURA - COM PROGRESSÃO ==========
  {
    code: 'ARTISTA_LOCAL',
    name: 'Artista Local',
    description: 'Cidadão cadastrado como artista local no município',
    department: 'Cultura',
    icon: 'palette',
    color: '#f59e0b',
    triggerServices: ['CADASTRO_ARTISTA'],
    active: true,
    level: 1,
    hasProgression: true,
    nextLevelCategory: 'ARTISTA_LOCAL_RECONHECIDO',
    progressionCriteria: {
      minProtocolCount: 5,
      minDaysActive: 180,
      requiredBadges: ['APRESENTACAO_PUBLICA'],
    },
  },
  {
    code: 'ARTISTA_LOCAL_RECONHECIDO',
    name: 'Artista Local Reconhecido',
    description: 'Artista com reconhecimento e participação ativa',
    department: 'Cultura',
    icon: 'award',
    color: '#dc2626',
    triggerServices: [],
    active: true,
    level: 2,
    parentCategoryCode: 'ARTISTA_LOCAL',
    prerequisiteCategories: ['ARTISTA_LOCAL'],
    categoryType: 'PREMIUM',
  },
  {
    code: 'MEMBRO_GRUPO_ARTISTICO',
    name: 'Membro de Grupo Artístico',
    description: 'Cidadão membro de grupo artístico cadastrado',
    department: 'Cultura',
    icon: 'users',
    color: '#f97316',
    triggerServices: ['CADASTRO_GRUPO_ARTISTICO'],
    active: true,
    level: 1,
    complementaryCategories: ['ARTISTA_LOCAL'],
  },
  {
    code: 'PARTICIPANTE_OFICINA_CULTURAL',
    name: 'Participante de Oficina Cultural',
    description: 'Cidadão inscrito em oficinas culturais',
    department: 'Cultura',
    icon: 'music',
    color: '#eab308',
    triggerServices: ['INSCRICAO_OFICINA_CULTURAL'],
    active: true,
    level: 1,
  },

  // ========== ESPORTES ==========
  {
    code: 'ATLETA',
    name: 'Atleta',
    description: 'Cidadão cadastrado como atleta no município',
    department: 'Esportes',
    icon: 'trophy',
    color: '#3b82f6',
    triggerServices: ['CADASTRO_ATLETA'],
    active: true,
    level: 1,
  },
  {
    code: 'PARTICIPANTE_MODALIDADE_ESPORTIVA',
    name: 'Participante de Modalidade Esportiva',
    description: 'Cidadão inscrito em modalidades esportivas',
    department: 'Esportes',
    icon: 'activity',
    color: '#06b6d4',
    triggerServices: ['INSCRICAO_MODALIDADE'],
    active: true,
    level: 1,
    complementaryCategories: ['ATLETA'],
  },

  // ========== SAÚDE - COM VALIDADE ==========
  {
    code: 'PACIENTE_TFD',
    name: 'Paciente TFD',
    description: 'Paciente com histórico de Tratamento Fora do Domicílio',
    department: 'Saúde',
    icon: 'ambulance',
    color: '#ef4444',
    triggerServices: ['ENCAMINHAMENTOS_TFD'],
    active: true,
    level: 1,
    hasValidity: true,
    validityDays: 365, // Validade de 1 ano
    requiresRenewal: true,
    renewalReminderDays: 30,
    autoDeactivateOnExpiry: false, // Manter histórico mesmo expirado
  },
  {
    code: 'USUARIO_TRANSPORTE_SAUDE',
    name: 'Usuário de Transporte para Saúde',
    description: 'Cidadão beneficiário de transporte para tratamento de saúde',
    department: 'Saúde',
    icon: 'car',
    color: '#dc2626',
    triggerServices: ['TRANSPORTE_PACIENTES'],
    active: true,
    level: 1,
  },

  // ========== MEIO AMBIENTE - COM VALIDADE ==========
  {
    code: 'LICENCIADO_AMBIENTAL',
    name: 'Licenciado Ambiental',
    description: 'Cidadão ou empresa com licença ambiental ativa',
    department: 'Meio Ambiente',
    icon: 'trees',
    color: '#059669',
    triggerServices: ['LICENCA_AMBIENTAL'],
    active: true,
    level: 1,
    hasValidity: true,
    validityDays: 730, // 2 anos
    requiresRenewal: true,
    renewalReminderDays: 60,
    autoDeactivateOnExpiry: true, // Desativar automaticamente quando expirar
    requiresApproval: true,
  },

  // ========== EDUCAÇÃO ==========
  {
    code: 'ALUNO_REDE_MUNICIPAL',
    name: 'Aluno da Rede Municipal',
    description: 'Aluno matriculado na rede municipal de ensino',
    department: 'Educação',
    icon: 'graduation-cap',
    color: '#8b5cf6',
    triggerServices: ['MATRICULA_ESCOLAR', 'MATRICULA_ALUNO'],
    active: true,
    level: 1,
  },
  {
    code: 'USUARIO_TRANSPORTE_ESCOLAR',
    name: 'Usuário de Transporte Escolar',
    description: 'Cidadão beneficiário de transporte escolar',
    department: 'Educação',
    icon: 'bus',
    color: '#a855f7',
    triggerServices: ['TRANSPORTE_ESCOLAR'],
    active: true,
    level: 1,
    prerequisiteCategories: ['ALUNO_REDE_MUNICIPAL'], // Precisa ser aluno
  },

  // ========== OUTROS ==========
  {
    code: 'BENEFICIARIO_PROGRAMA_SOCIAL',
    name: 'Beneficiário de Programas Sociais',
    description: 'Cidadão beneficiário de programas de assistência social',
    department: 'Assistência Social',
    icon: 'heart-handshake',
    color: '#ec4899',
    triggerServices: ['INSCRICAO_PROGRAMA_SOCIAL', 'CADASTRO_BENEFICIARIO'],
    active: true,
    level: 1,
  },
  {
    code: 'FAMILIA_VULNERAVEL',
    name: 'Família em Situação de Vulnerabilidade',
    description: 'Família cadastrada em programas de atenção social',
    department: 'Assistência Social',
    icon: 'home-heart',
    color: '#f43f5e',
    triggerServices: ['CADASTRO_FAMILIA_VULNERAVEL'],
    active: true,
    level: 1,
  },
  {
    code: 'PRESTADOR_SERVICO_TURISTICO',
    name: 'Prestador de Serviço Turístico',
    description: 'Cidadão cadastrado como prestador de serviço turístico',
    department: 'Turismo',
    icon: 'map-pin',
    color: '#0ea5e9',
    triggerServices: ['CADASTRO_PRESTADOR_TURISTICO'],
    active: true,
    level: 1,
  },
  {
    code: 'GUIA_TURISTICO',
    name: 'Guia Turístico',
    description: 'Cidadão cadastrado como guia turístico local',
    department: 'Turismo',
    icon: 'compass',
    color: '#06b6d4',
    triggerServices: ['CADASTRO_GUIA_TURISTICO'],
    active: true,
    level: 1,
    prerequisiteCategories: ['PRESTADOR_SERVICO_TURISTICO'],
  },
  {
    code: 'MICROEMPREENDEDOR',
    name: 'Microempreendedor',
    description: 'Cidadão cadastrado como microempreendedor local',
    department: 'Desenvolvimento Econômico',
    icon: 'briefcase',
    color: '#6366f1',
    triggerServices: ['CADASTRO_MICROEMPREENDEDOR'],
    active: true,
    level: 1,
  },
  {
    code: 'FEIRA_EMPREENDEDOR',
    name: 'Participante de Feira de Empreendedores',
    description: 'Empreendedor cadastrado em feiras locais',
    department: 'Desenvolvimento Econômico',
    icon: 'store',
    color: '#4f46e5',
    triggerServices: ['INSCRICAO_FEIRA_EMPREENDEDOR'],
    active: true,
    level: 1,
    prerequisiteCategories: ['MICROEMPREENDEDOR'],
  },
  {
    code: 'BENEFICIARIO_PROGRAMA_HABITACIONAL',
    name: 'Beneficiário de Programa Habitacional',
    description: 'Cidadão inscrito em programas habitacionais',
    department: 'Habitação',
    icon: 'house',
    color: '#14b8a6',
    triggerServices: ['INSCRICAO_PROGRAMA_HABITACIONAL'],
    active: true,
    level: 1,
  },
];

export async function seedCitizenCategoriesExpanded() {
  console.log('🏷️  Seeding Expanded Citizen Categories...');

  let created = 0;
  let updated = 0;
  const parentMapping = new Map<string, string>(); // code -> id

  // Primeira passagem: criar/atualizar categorias
  for (const category of categoriesExpanded) {
    const existing = await prisma.citizenCategory.findUnique({
      where: { code: category.code },
    });

    const data = {
      name: category.name,
      description: category.description,
      department: category.department,
      icon: category.icon,
      color: category.color,
      triggerServices: category.triggerServices,
      active: category.active,

      // Novos campos
      level: category.level || 1,
      prerequisiteCategories: category.prerequisiteCategories || [],
      complementaryCategories: category.complementaryCategories || [],
      conflictingCategories: category.conflictingCategories || [],

      hasValidity: category.hasValidity || false,
      validityDays: category.validityDays,
      requiresRenewal: category.requiresRenewal || false,
      renewalReminderDays: category.renewalReminderDays || 30,
      autoDeactivateOnExpiry: category.autoDeactivateOnExpiry || false,

      hasProgression: category.hasProgression || false,
      nextLevelCategory: category.nextLevelCategory,
      progressionCriteria: category.progressionCriteria,

      categoryType: category.categoryType || 'STANDARD',
      priority: category.priority || 5,
      isPublic: category.isPublic !== false,
      requiresApproval: category.requiresApproval || false,
      benefits: category.benefits,
      restrictions: category.restrictions,
    };

    if (existing) {
      await prisma.citizenCategory.update({
        where: { code: category.code },
        data,
      });
      updated++;
      parentMapping.set(category.code, existing.id);
    } else {
      const created_category = await prisma.citizenCategory.create({
        data: {
          code: category.code,
          ...data,
        },
      });
      created++;
      parentMapping.set(category.code, created_category.id);
    }
  }

  // Segunda passagem: atualizar parentCategoryId
  for (const category of categoriesExpanded) {
    if (category.parentCategoryCode) {
      const parentId = parentMapping.get(category.parentCategoryCode);
      if (parentId) {
        await prisma.citizenCategory.update({
          where: { code: category.code },
          data: { parentCategoryId: parentId },
        });
      }
    }
  }

  console.log(`✅ Expanded Categories seeded: ${created} created, ${updated} updated`);
  console.log(`📊 Total categories: ${categoriesExpanded.length}`);
}

export default seedCitizenCategoriesExpanded;

// Executar se chamado diretamente
if (require.main === module) {
  seedCitizenCategoriesExpanded()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Error seeding expanded categories:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
