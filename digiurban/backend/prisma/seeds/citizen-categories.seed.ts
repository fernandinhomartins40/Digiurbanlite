/**
 * ============================================================================
 * CITIZEN CATEGORIES SEED - Categorias de Cidadãos
 * ============================================================================
 *
 * Define as categorias padrão de cidadãos que são atribuídas automaticamente
 * após a aprovação de determinados serviços.
 *
 * Cada categoria possui:
 * - code: Identificador único da categoria
 * - name: Nome exibido na UI
 * - description: Descrição da categoria
 * - department: Departamento responsável
 * - icon: Ícone para UI (Lucide icons)
 * - color: Cor em hexadecimal para badges
 * - triggerServices: Array de moduleTypes que ativam esta categoria
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  code: string;
  name: string;
  description: string;
  department: string;
  icon: string;
  color: string;
  triggerServices: string[];
  active: boolean;
}

const categories: CategorySeed[] = [
  // ========== AGRICULTURA ==========
  {
    code: 'PRODUTOR_RURAL',
    name: 'Produtor Rural',
    description: 'Cidadão cadastrado como produtor rural no município',
    department: 'Agricultura',
    icon: 'tractor',
    color: '#10b981', // green-500
    triggerServices: ['CADASTRO_PRODUTOR'],
    active: true,
  },
  {
    code: 'PROPRIETARIO_RURAL',
    name: 'Proprietário Rural',
    description: 'Cidadão cadastrado como proprietário de propriedade rural',
    department: 'Agricultura',
    icon: 'home',
    color: '#84cc16', // lime-500
    triggerServices: ['CADASTRO_PROPRIEDADE_RURAL'],
    active: true,
  },
  {
    code: 'BENEFICIARIO_PROGRAMA_RURAL',
    name: 'Beneficiário de Programa Rural',
    description: 'Cidadão inscrito em programas de apoio à agricultura',
    department: 'Agricultura',
    icon: 'leaf',
    color: '#22c55e', // green-500
    triggerServices: ['INSCRICAO_PROGRAMA_RURAL'],
    active: true,
  },

  // ========== CULTURA ==========
  {
    code: 'ARTISTA_LOCAL',
    name: 'Artista Local',
    description: 'Cidadão cadastrado como artista local no município',
    department: 'Cultura',
    icon: 'palette',
    color: '#f59e0b', // amber-500
    triggerServices: ['CADASTRO_ARTISTA'],
    active: true,
  },
  {
    code: 'MEMBRO_GRUPO_ARTISTICO',
    name: 'Membro de Grupo Artístico',
    description: 'Cidadão membro de grupo artístico cadastrado',
    department: 'Cultura',
    icon: 'users',
    color: '#f97316', // orange-500
    triggerServices: ['CADASTRO_GRUPO_ARTISTICO'],
    active: true,
  },
  {
    code: 'PARTICIPANTE_OFICINA_CULTURAL',
    name: 'Participante de Oficina Cultural',
    description: 'Cidadão inscrito em oficinas culturais',
    department: 'Cultura',
    icon: 'music',
    color: '#eab308', // yellow-500
    triggerServices: ['INSCRICAO_OFICINA_CULTURAL'],
    active: true,
  },

  // ========== ESPORTES ==========
  {
    code: 'ATLETA',
    name: 'Atleta',
    description: 'Cidadão cadastrado como atleta no município',
    department: 'Esportes',
    icon: 'trophy',
    color: '#3b82f6', // blue-500
    triggerServices: ['CADASTRO_ATLETA'],
    active: true,
  },
  {
    code: 'PARTICIPANTE_MODALIDADE_ESPORTIVA',
    name: 'Participante de Modalidade Esportiva',
    description: 'Cidadão inscrito em modalidades esportivas',
    department: 'Esportes',
    icon: 'activity',
    color: '#06b6d4', // cyan-500
    triggerServices: ['INSCRICAO_MODALIDADE'],
    active: true,
  },

  // ========== ASSISTÊNCIA SOCIAL ==========
  {
    code: 'BENEFICIARIO_PROGRAMA_SOCIAL',
    name: 'Beneficiário de Programas Sociais',
    description: 'Cidadão beneficiário de programas de assistência social',
    department: 'Assistência Social',
    icon: 'heart-handshake',
    color: '#ec4899', // pink-500
    triggerServices: ['INSCRICAO_PROGRAMA_SOCIAL', 'CADASTRO_BENEFICIARIO'],
    active: true,
  },
  {
    code: 'FAMILIA_VULNERAVEL',
    name: 'Família em Situação de Vulnerabilidade',
    description: 'Família cadastrada em programas de atenção social',
    department: 'Assistência Social',
    icon: 'home-heart',
    color: '#f43f5e', // rose-500
    triggerServices: ['CADASTRO_FAMILIA_VULNERAVEL'],
    active: true,
  },

  // ========== EDUCAÇÃO ==========
  {
    code: 'ALUNO_REDE_MUNICIPAL',
    name: 'Aluno da Rede Municipal',
    description: 'Aluno matriculado na rede municipal de ensino',
    department: 'Educação',
    icon: 'graduation-cap',
    color: '#8b5cf6', // violet-500
    triggerServices: ['MATRICULA_ESCOLAR', 'MATRICULA_ALUNO'],
    active: true,
  },
  {
    code: 'USUARIO_TRANSPORTE_ESCOLAR',
    name: 'Usuário de Transporte Escolar',
    description: 'Cidadão beneficiário de transporte escolar',
    department: 'Educação',
    icon: 'bus',
    color: '#a855f7', // purple-500
    triggerServices: ['TRANSPORTE_ESCOLAR'],
    active: true,
  },

  // ========== SAÚDE ==========
  {
    code: 'PACIENTE_TFD',
    name: 'Paciente TFD',
    description: 'Paciente com histórico de Tratamento Fora do Domicílio',
    department: 'Saúde',
    icon: 'ambulance',
    color: '#ef4444', // red-500
    triggerServices: ['ENCAMINHAMENTOS_TFD'],
    active: true,
  },
  {
    code: 'USUARIO_TRANSPORTE_SAUDE',
    name: 'Usuário de Transporte para Saúde',
    description: 'Cidadão beneficiário de transporte para tratamento de saúde',
    department: 'Saúde',
    icon: 'car',
    color: '#dc2626', // red-600
    triggerServices: ['TRANSPORTE_PACIENTES'],
    active: true,
  },

  // ========== MEIO AMBIENTE ==========
  {
    code: 'LICENCIADO_AMBIENTAL',
    name: 'Licenciado Ambiental',
    description: 'Cidadão ou empresa com licença ambiental ativa',
    department: 'Meio Ambiente',
    icon: 'trees',
    color: '#059669', // emerald-600
    triggerServices: ['LICENCA_AMBIENTAL'],
    active: true,
  },

  // ========== TURISMO ==========
  {
    code: 'PRESTADOR_SERVICO_TURISTICO',
    name: 'Prestador de Serviço Turístico',
    description: 'Cidadão cadastrado como prestador de serviço turístico',
    department: 'Turismo',
    icon: 'map-pin',
    color: '#0ea5e9', // sky-500
    triggerServices: ['CADASTRO_PRESTADOR_TURISTICO'],
    active: true,
  },
  {
    code: 'GUIA_TURISTICO',
    name: 'Guia Turístico',
    description: 'Cidadão cadastrado como guia turístico local',
    department: 'Turismo',
    icon: 'compass',
    color: '#06b6d4', // cyan-500
    triggerServices: ['CADASTRO_GUIA_TURISTICO'],
    active: true,
  },

  // ========== EMPREENDEDORISMO ==========
  {
    code: 'MICROEMPREENDEDOR',
    name: 'Microempreendedor',
    description: 'Cidadão cadastrado como microempreendedor local',
    department: 'Desenvolvimento Econômico',
    icon: 'briefcase',
    color: '#6366f1', // indigo-500
    triggerServices: ['CADASTRO_MICROEMPREENDEDOR'],
    active: true,
  },
  {
    code: 'FEIRA_EMPREENDEDOR',
    name: 'Participante de Feira de Empreendedores',
    description: 'Empreendedor cadastrado em feiras locais',
    department: 'Desenvolvimento Econômico',
    icon: 'store',
    color: '#4f46e5', // indigo-600
    triggerServices: ['INSCRICAO_FEIRA_EMPREENDEDOR'],
    active: true,
  },

  // ========== HABITAÇÃO ==========
  {
    code: 'BENEFICIARIO_PROGRAMA_HABITACIONAL',
    name: 'Beneficiário de Programa Habitacional',
    description: 'Cidadão inscrito em programas habitacionais',
    department: 'Habitação',
    icon: 'house',
    color: '#14b8a6', // teal-500
    triggerServices: ['INSCRICAO_PROGRAMA_HABITACIONAL'],
    active: true,
  },
];

export async function seedCitizenCategories() {
  console.log('🏷️  Seeding Citizen Categories...');

  let created = 0;
  let updated = 0;

  // ⚠️ MULTI-TENANT (corrigido 2026-09-15): CitizenCategory tem
  // `@@unique([tenantId, code])`, então `where: { code }` não valida no Prisma:
  //   Argument `where` needs at least one of `id` or `tenantId_code`
  // Usamos findFirst (a tenant extension escopa) + update/create por id — assim
  // o seed funciona tanto no tenant default quanto em qualquer outro.
  const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant-default';

  for (const category of categories) {
    const existing = await prisma.citizenCategory.findFirst({
      where: { code: category.code, tenantId: TENANT_ID },
      select: { id: true },
    });

    if (existing) {
      await prisma.citizenCategory.update({
        where: { id: existing.id },
        data: {
          name: category.name,
          description: category.description,
          department: category.department,
          icon: category.icon,
          color: category.color,
          triggerServices: category.triggerServices,
          active: category.active,
        },
      });
      updated++;
    } else {
      await prisma.citizenCategory.create({
        data: { ...category, tenantId: TENANT_ID } as any,
      });
      created++;
    }
  }

  console.log(`✅ Citizen Categories seeded: ${created} created, ${updated} updated`);
  console.log(`📊 Total categories: ${categories.length}`);
}

export default seedCitizenCategories;

// Executar se chamado diretamente
if (require.main === module) {
  seedCitizenCategories()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Error seeding citizen categories:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
