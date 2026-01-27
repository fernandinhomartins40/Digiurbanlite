import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ============================================================================
 * SEED: Regras de Unicidade de Serviços
 * ============================================================================
 *
 * Este seed configura as regras de unicidade para serviços existentes.
 *
 * IMPORTANTE: Este seed deve ser executado APÓS a migration add_protocol_uniqueness_fields
 * e APÓS os seeds de serviços básicos.
 */

interface ServiceUniquenessConfig {
  // Identificadores do serviço (usar pelo menos um)
  serviceId?: string;
  serviceName?: string;
  moduleType?: string;

  // Configurações de unicidade
  allowMultipleActiveProtocols: boolean;
  uniquenessScope?: 'CITIZEN' | 'CUSTOM' | 'CITIZEN_PER_FIELD';
  uniquenessRules?: any;
}

/**
 * ============================================================================
 * CONFIGURAÇÕES DE UNICIDADE POR TIPO DE SERVIÇO
 * ============================================================================
 */

const UNIQUENESS_CONFIGS: ServiceUniquenessConfig[] = [
  // ==========================================================================
  // CATEGORIA: CADASTROS (Geralmente 1 por cidadão)
  // ==========================================================================

  {
    serviceName: 'Cadastro de Produtor Rural',
    moduleType: 'CADASTRO_PRODUTOR',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_PRODUTOR',
      validationFunction: 'validateCadastroProdutor',
      errorMessage: 'Você já possui um cadastro de produtor rural em andamento'
    }
  },

  {
    serviceName: 'Cadastro de Propriedade Rural',
    moduleType: 'CADASTRO_PROPRIEDADE',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_PROPRIEDADE',
      validationFunction: 'validateCadastroPropriedade',
      errorMessage: 'Você já possui um cadastro para esta propriedade'
    }
  },

  {
    serviceName: 'Cartão SUS',
    moduleType: 'CARTAO_SUS',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN',
    uniquenessRules: null
  },

  // ==========================================================================
  // CATEGORIA: LICENÇAS E ALVARÁS (1 ativo por CNPJ/CPF)
  // ==========================================================================

  {
    serviceName: 'Licença de Funcionamento',
    moduleType: 'LICENCA_FUNCIONAMENTO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'LICENCA_FUNCIONAMENTO',
      validationFunction: 'validateLicencaFuncionamento',
      errorMessage: 'Já existe uma solicitação de licença ativa para este CNPJ'
    }
  },

  {
    serviceName: 'Alvará de Construção',
    moduleType: 'ALVARA_CONSTRUCAO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN_PER_FIELD',
    uniquenessRules: {
      field: 'enderecoObra',
      fieldLabel: 'endereço da obra',
      errorMessage: 'Já existe uma solicitação de alvará ativa para este endereço'
    }
  },

  // ==========================================================================
  // CATEGORIA: MATRÍCULAS E VÍNCULOS (1 por dependente/aluno)
  // ==========================================================================

  {
    serviceName: 'Matrícula Escolar',
    moduleType: 'MATRICULA_ALUNO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN_PER_FIELD',
    uniquenessRules: {
      field: 'cpfAluno',
      fieldLabel: 'CPF do aluno',
      errorMessage: 'Este aluno já possui uma solicitação de matrícula em andamento'
    }
  },

  {
    serviceName: 'Transferência Escolar',
    moduleType: 'TRANSFERENCIA_ALUNO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN_PER_FIELD',
    uniquenessRules: {
      field: 'cpfAluno',
      fieldLabel: 'CPF do aluno',
      errorMessage: 'Este aluno já possui uma solicitação de transferência em andamento'
    }
  },

  // ==========================================================================
  // CATEGORIA: AGENDAMENTOS E CONSULTAS (Permitir múltiplos)
  // ==========================================================================

  {
    serviceName: 'Agendamento de Consulta Médica',
    moduleType: 'ATENDIMENTOS_SAUDE',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  {
    serviceName: 'Agendamento de Exame',
    moduleType: 'AGENDAMENTO_EXAME',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  // ==========================================================================
  // CATEGORIA: SOLICITAÇÕES GERAIS (Permitir múltiplos)
  // ==========================================================================

  {
    serviceName: 'Solicitação de Iluminação Pública',
    moduleType: 'ILUMINACAO_PUBLICA',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  {
    serviceName: 'Solicitação de Poda de Árvore',
    moduleType: 'PODA_ARVORE',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  {
    serviceName: 'Solicitação de Tapa-Buraco',
    moduleType: 'TAPA_BURACO',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  {
    serviceName: 'Solicitação de Coleta de Lixo',
    moduleType: 'COLETA_LIXO',
    allowMultipleActiveProtocols: true,
    uniquenessScope: undefined,
    uniquenessRules: null
  },

  // ==========================================================================
  // CATEGORIA: AUXÍLIOS E BENEFÍCIOS (1 ativo por cidadão)
  // ==========================================================================

  {
    serviceName: 'Auxílio Alimentação',
    moduleType: 'AUXILIO_ALIMENTACAO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN',
    uniquenessRules: null
  },

  {
    serviceName: 'Auxílio Transporte',
    moduleType: 'AUXILIO_TRANSPORTE',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN',
    uniquenessRules: null
  },

  {
    serviceName: 'Bolsa Família Municipal',
    moduleType: 'BOLSA_FAMILIA',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN',
    uniquenessRules: null
  }
];

/**
 * ============================================================================
 * FUNÇÃO PRINCIPAL DO SEED
 * ============================================================================
 */

async function main() {
  console.log('🔧 Configurando regras de unicidade de serviços...\n');

  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const config of UNIQUENESS_CONFIGS) {
    try {
      // Construir filtro para encontrar o serviço
      const where: any = {};

      if (config.serviceId) {
        where.id = config.serviceId;
      } else if (config.moduleType) {
        where.moduleType = config.moduleType;
      } else if (config.serviceName) {
        where.name = { contains: config.serviceName, mode: 'insensitive' };
      } else {
        console.warn(`⚠️  Configuração sem identificador válido:`, config);
        skipped++;
        continue;
      }

      // Buscar serviço
      const service = await prisma.serviceSimplified.findFirst({
        where,
        select: { id: true, name: true, moduleType: true }
      });

      if (!service) {
        console.log(`❌ Serviço não encontrado:`, {
          name: config.serviceName,
          moduleType: config.moduleType
        });
        notFound++;
        continue;
      }

      // Atualizar serviço com regras de unicidade
      await prisma.serviceSimplified.update({
        where: { id: service.id },
        data: {
          allowMultipleActiveProtocols: config.allowMultipleActiveProtocols,
          uniquenessScope: config.uniquenessScope || null,
          uniquenessRules: config.uniquenessRules || null
        }
      });

      const scopeLabel = config.uniquenessScope || 'N/A';
      const multipleLabel = config.allowMultipleActiveProtocols ? '✅ Permite múltiplos' : '🚫 Único ativo';

      console.log(`✓ ${service.name}`);
      console.log(`  → ${multipleLabel} | Escopo: ${scopeLabel}`);
      if (config.uniquenessScope) {
        console.log(`  → Regras:`, JSON.stringify(config.uniquenessRules, null, 2));
      }
      console.log('');

      updated++;
    } catch (error) {
      console.error(`❌ Erro ao configurar serviço:`, config.serviceName, error);
    }
  }

  console.log('\n========================================');
  console.log('📊 RESUMO:');
  console.log(`   ✓ Serviços atualizados: ${updated}`);
  console.log(`   ❌ Serviços não encontrados: ${notFound}`);
  console.log(`   ⚠️  Configurações ignoradas: ${skipped}`);
  console.log('========================================\n');
}

/**
 * ============================================================================
 * EXECUTAR SEED
 * ============================================================================
 */

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
