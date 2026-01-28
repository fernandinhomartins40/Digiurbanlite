/**
 * Script para atualizar configuração de unicidade dos serviços
 * Garante que serviços de cadastro não permitam duplicatas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateServiceUniqueness() {
  console.log('🔧 Atualizando configuração de unicidade dos serviços...\n');

  try {
    // Serviços que NÃO devem permitir múltiplos protocolos ativos (20 serviços)
    const uniqueServices = [
      // Agricultura (3 serviços)
      { moduleType: 'CADASTRO_PRODUTOR', name: 'Cadastro de Produtor Rural', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_PRODUTOR', validationFunction: 'validateCadastroProdutor' } },
      { moduleType: 'CADASTRO_PISCICULTURA', name: 'Cadastro de Piscicultura', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_PISCICULTURA', validationFunction: 'validateCadastroPiscicultura' } },
      { moduleType: 'CADASTRO_AGROINDUSTRIA', name: 'Cadastro de Agroindústria Familiar', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_AGROINDUSTRIA', validationFunction: 'validateCadastroAgroindustria' } },

      // Social (1 serviço)
      { moduleType: 'CADASTRO_UNICO', name: 'Cadastro Único (CadÚnico)', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_UNICO', validationFunction: 'validateCadastroUnico' } },

      // Meio Ambiente (2 serviços)
      { moduleType: 'CADASTRO_GERADOR_RESIDUOS', name: 'Cadastro Gerador Resíduos', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_GERADOR_RESIDUOS', validationFunction: 'validateCadastroGeradorResiduos' } },
      { moduleType: 'CADASTRO_VIVEIRO_MUDAS', name: 'Cadastro Viveiro Mudas', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_VIVEIRO_MUDAS', validationFunction: 'validateCadastroViveiroMudas' } },

      // Defesa Civil (2 serviços)
      { moduleType: 'CADASTRO_FAMILIA_RISCO', name: 'Cadastro de Família em Área de Risco', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_FAMILIA_RISCO', validationFunction: 'validateCadastroFamiliaRisco' } },
      { moduleType: 'CADASTRO_VOLUNTARIO', name: 'Cadastro de Voluntário da Defesa Civil', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_VOLUNTARIO', validationFunction: 'validateCadastroVoluntario' } },

      // Desenvolvimento Econômico (3 serviços)
      { moduleType: 'CADASTRO_MEI', name: 'Cadastro MEI', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_MEI', validationFunction: 'validateCadastroMei' } },
      { moduleType: 'CADASTRO_FORNECEDOR', name: 'Cadastro de Fornecedor Municipal', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_FORNECEDOR', validationFunction: 'validateCadastroFornecedor' } },
      { moduleType: 'CADASTRO_BALCAO_EMPREGOS', name: 'Cadastro no Balcão de Empregos', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_BALCAO_EMPREGOS', validationFunction: 'validateCadastroBalcaoEmpregos' } },

      // Cultura (2 serviços)
      { moduleType: 'CADASTRO_ARTISTA', name: 'Cadastro de Artistas Locais', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_ARTISTA', validationFunction: 'validateCadastroArtista' } },
      { moduleType: 'CADASTRO_PONTO_CULTURA', name: 'Cadastro Ponto Cultura', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_PONTO_CULTURA', validationFunction: 'validateCadastroPontoCultura' } },

      // Educação (1 serviço)
      { moduleType: 'CADASTRO_PROFESSOR', name: 'Cadastro de Professores', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_PROFESSOR', validationFunction: 'validateCadastroProfessor' } },

      // Esportes (1 serviço)
      { moduleType: 'CADASTRO_ATLETA', name: 'Cadastro de Atleta Municipal', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_ATLETA', validationFunction: 'validateCadastroAtleta' } },

      // Finanças (1 serviço)
      { moduleType: 'CADASTRO_CONTRIBUINTE', name: 'Cadastro de Contribuinte', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_CONTRIBUINTE', validationFunction: 'validateCadastroContribuinte' } },

      // Habitação (1 serviço)
      { moduleType: 'CADASTRO_DEFICIT_HABITACIONAL', name: 'Cadastro em Déficit Habitacional', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_DEFICIT_HABITACIONAL', validationFunction: 'validateCadastroDeficitHabitacional' } },

      // Turismo (1 serviço)
      { moduleType: 'CADASTRO_GUIA_TURISTICO', name: 'Cadastro de Guia Turístico', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_GUIA_TURISTICO', validationFunction: 'validateCadastroGuiaTuristico' } },

      // Tecnologia e Inovação (2 serviços)
      { moduleType: 'CADASTRO_LOGIN_UNICO', name: 'Cadastro no Login Único Gov.br', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_LOGIN_UNICO', validationFunction: 'validateCadastroLoginUnico' } },
      { moduleType: 'CADASTRO_STARTUP', name: 'Cadastro de Startup/Empresa de Tecnologia', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'CADASTRO_STARTUP', validationFunction: 'validateCadastroStartup' } },

      // Saúde (1 serviço)
      { moduleType: 'PROGRAMA_SAUDE_FAMILIA', name: 'Cadastro no Programa Saúde da Família', uniquenessScope: 'CUSTOM', uniquenessRules: { moduleType: 'PROGRAMA_SAUDE_FAMILIA', validationFunction: 'validateProgramaSaudeFamilia' } }
    ];

    // Atualizar cada serviço
    for (const config of uniqueServices) {
      const service = await prisma.serviceSimplified.findFirst({
        where: { moduleType: config.moduleType }
      });

      if (service) {
        await prisma.serviceSimplified.update({
          where: { id: service.id },
          data: {
            allowMultipleActiveProtocols: false,
            uniquenessScope: config.uniquenessScope,
            uniquenessRules: config.uniquenessRules
          }
        });
        console.log(`✅ ${config.name} - Configurado para NÃO permitir duplicatas`);
      } else {
        console.log(`⚠️  ${config.name} - Não encontrado no banco`);
      }
    }

    // Serviços que DEVEM permitir múltiplos protocolos ativos
    const multipleServices = [
      { moduleType: 'CADASTRO_PROPRIEDADE_RURAL', name: 'Cadastro de Propriedade Rural' },
      { moduleType: 'PROGRAMA_AMBIENTAL', name: 'Cadastro em Programa Ambiental' },
      { moduleType: 'CADASTRO_GRUPO_ARTISTICO', name: 'Cadastro de Grupo Artístico' },
      { moduleType: 'CADASTRO_EVENTO_CULTURAL', name: 'Cadastro de Evento Cultural' },
      { moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO', name: 'Cadastro de Estabelecimento Turístico' },
      { moduleType: 'CADASTRO_ATRACAO_TURISTICA', name: 'Cadastro de Atração Turística' },
      { moduleType: 'CADASTRO_PONTO_CRITICO', name: 'Cadastro de Ponto Crítico' },
      { moduleType: 'CADASTRO_CAMERAS_BAIRRO', name: 'Cadastro de Câmeras de Segurança de Bairro' },
      { moduleType: 'GRUPO_WHATSAPP_VIZINHANCA', name: 'Cadastro em Grupo de WhatsApp de Segurança de Vizinhança' }
    ];

    for (const config of multipleServices) {
      const service = await prisma.serviceSimplified.findFirst({
        where: { moduleType: config.moduleType }
      });

      if (service) {
        await prisma.serviceSimplified.update({
          where: { id: service.id },
          data: {
            allowMultipleActiveProtocols: true,
            uniquenessScope: null,
            uniquenessRules: null
          }
        });
        console.log(`✅ ${config.name} - Permite múltiplos protocolos`);
      } else {
        console.log(`⚠️  ${config.name} - Não encontrado no banco`);
      }
    }

    console.log('\n✅ Configuração de unicidade atualizada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateServiceUniqueness()
  .then(() => {
    console.log('\n🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
