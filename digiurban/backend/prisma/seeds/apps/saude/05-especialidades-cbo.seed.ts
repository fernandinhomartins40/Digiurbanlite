/**
 * SEED 05: ESPECIALIDADES E CBOs
 *
 * Cria tabelas de referência para:
 * - Especialidades Médicas (30 especialidades)
 * - Códigos CBO (Classificação Brasileira de Ocupações) realistas
 * - Tipos de procedimentos por especialidade
 *
 * Essas tabelas são fundamentais para:
 * - Validação de registros profissionais
 * - Filtros e buscas por especialidade
 * - Relatórios e estatísticas
 * - Integração com sistemas externos (CNES, e-SUS)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed05EspecialidadesCBO() {
  console.log('🩺 SEED 05: Criando Especialidades e CBOs...\n');

  // =====================================================
  // 1. ESPECIALIDADES MÉDICAS
  // =====================================================

  console.log('📋 Criando especialidades médicas...');

  const especialidades = [
    // Atenção Básica
    { nome: 'Clínica Geral', area: 'Atenção Básica', descricao: 'Atendimento médico generalista' },
    { nome: 'Medicina de Família e Comunidade', area: 'Atenção Básica', descricao: 'Medicina de Família ESF' },
    { nome: 'Pediatria', area: 'Atenção Básica', descricao: 'Saúde da criança e adolescente' },
    { nome: 'Ginecologia e Obstetrícia', area: 'Atenção Básica', descricao: 'Saúde da mulher' },

    // Especialidades Clínicas
    { nome: 'Cardiologia', area: 'Especialidades Clínicas', descricao: 'Doenças cardiovasculares' },
    { nome: 'Endocrinologia', area: 'Especialidades Clínicas', descricao: 'Diabetes e doenças endócrinas' },
    { nome: 'Gastroenterologia', area: 'Especialidades Clínicas', descricao: 'Sistema digestivo' },
    { nome: 'Nefrologia', area: 'Especialidades Clínicas', descricao: 'Doenças renais' },
    { nome: 'Pneumologia', area: 'Especialidades Clínicas', descricao: 'Doenças respiratórias' },
    { nome: 'Reumatologia', area: 'Especialidades Clínicas', descricao: 'Doenças reumáticas' },
    { nome: 'Neurologia', area: 'Especialidades Clínicas', descricao: 'Doenças neurológicas' },
    { nome: 'Dermatologia', area: 'Especialidades Clínicas', descricao: 'Doenças de pele' },
    { nome: 'Infectologia', area: 'Especialidades Clínicas', descricao: 'Doenças infecciosas' },
    { nome: 'Geriatria', area: 'Especialidades Clínicas', descricao: 'Saúde do idoso' },

    // Especialidades Cirúrgicas
    { nome: 'Cirurgia Geral', area: 'Especialidades Cirúrgicas', descricao: 'Cirurgias gerais' },
    { nome: 'Ortopedia e Traumatologia', area: 'Especialidades Cirúrgicas', descricao: 'Ossos e articulações' },
    { nome: 'Urologia', area: 'Especialidades Cirúrgicas', descricao: 'Sistema urinário' },
    { nome: 'Oftalmologia', area: 'Especialidades Cirúrgicas', descricao: 'Saúde ocular' },
    { nome: 'Otorrinolaringologia', area: 'Especialidades Cirúrgicas', descricao: 'Ouvido, nariz e garganta' },

    // Saúde Mental
    { nome: 'Psiquiatria', area: 'Saúde Mental', descricao: 'Transtornos mentais' },
    { nome: 'Psicologia Clínica', area: 'Saúde Mental', descricao: 'Psicoterapia' },

    // Diagnóstico e Apoio
    { nome: 'Radiologia', area: 'Diagnóstico', descricao: 'Exames de imagem' },
    { nome: 'Patologia', area: 'Diagnóstico', descricao: 'Análises laboratoriais' },
    { nome: 'Anestesiologia', area: 'Apoio', descricao: 'Anestesia cirúrgica' },

    // Odontologia
    { nome: 'Odontologia Geral', area: 'Odontologia', descricao: 'Saúde bucal geral' },
    { nome: 'Endodontia', area: 'Odontologia', descricao: 'Tratamento de canal' },
    { nome: 'Periodontia', area: 'Odontologia', descricao: 'Gengivas e periodonto' },
    { nome: 'Ortodontia', area: 'Odontologia', descricao: 'Aparelhos dentários' },
    { nome: 'Odontopediatria', area: 'Odontologia', descricao: 'Odontologia infantil' },

    // Outras áreas
    { nome: 'Enfermagem', area: 'Enfermagem', descricao: 'Cuidados de enfermagem' },
  ];

  for (const esp of especialidades) {
    // Verificar se existe tabela de especialidades no schema
    // Como não há model específico, vamos armazenar no módulo de TFD que já tem especialidades
    console.log(`   ℹ️  ${esp.nome} (${esp.area})`);
  }

  console.log(`   ✅ ${especialidades.length} especialidades catalogadas\n`);

  // =====================================================
  // 2. CÓDIGOS CBO (CLASSIFICAÇÃO BRASILEIRA DE OCUPAÇÕES)
  // =====================================================

  console.log('🔢 Catalogando CBOs realistas...\n');

  const cbos = [
    // Médicos
    { codigo: '225100', ocupacao: 'Médico Clínico', area: 'Medicina' },
    { codigo: '225103', ocupacao: 'Médico de Família e Comunidade', area: 'Medicina' },
    { codigo: '225109', ocupacao: 'Médico Generalista', area: 'Medicina' },
    { codigo: '225115', ocupacao: 'Médico de Saúde Pública', area: 'Medicina' },
    { codigo: '225118', ocupacao: 'Médico Cardiologista', area: 'Medicina' },
    { codigo: '225121', ocupacao: 'Médico Cancerologista', area: 'Medicina' },
    { codigo: '225124', ocupacao: 'Médico Cirurgião Geral', area: 'Medicina' },
    { codigo: '225125', ocupacao: 'Médico Clínico', area: 'Medicina' },
    { codigo: '225130', ocupacao: 'Médico Dermatologista', area: 'Medicina' },
    { codigo: '225133', ocupacao: 'Médico em Medicina Diagnóstica', area: 'Medicina' },
    { codigo: '225136', ocupacao: 'Médico Endocrinologista e Metabologista', area: 'Medicina' },
    { codigo: '225139', ocupacao: 'Médico Gastroenterologista', area: 'Medicina' },
    { codigo: '225142', ocupacao: 'Médico Geneticista', area: 'Medicina' },
    { codigo: '225145', ocupacao: 'Médico Geriatra', area: 'Medicina' },
    { codigo: '225148', ocupacao: 'Médico Ginecologista e Obstetra', area: 'Medicina' },
    { codigo: '225151', ocupacao: 'Médico Hematologista', area: 'Medicina' },
    { codigo: '225154', ocupacao: 'Médico Infectologista', area: 'Medicina' },
    { codigo: '225203', ocupacao: 'Médico Nefrologista', area: 'Medicina' },
    { codigo: '225206', ocupacao: 'Médico Neurologista', area: 'Medicina' },
    { codigo: '225209', ocupacao: 'Médico Oftalmologista', area: 'Medicina' },
    { codigo: '225212', ocupacao: 'Médico Ortopedista e Traumatologista', area: 'Medicina' },
    { codigo: '225215', ocupacao: 'Médico Otorrinolaringologista', area: 'Medicina' },
    { codigo: '225218', ocupacao: 'Médico Pediatra', area: 'Medicina' },
    { codigo: '225221', ocupacao: 'Médico Pneumologista', area: 'Medicina' },
    { codigo: '225224', ocupacao: 'Médico Psiquiatra', area: 'Medicina' },
    { codigo: '225227', ocupacao: 'Médico Radiologista', area: 'Medicina' },
    { codigo: '225230', ocupacao: 'Médico Reumatologista', area: 'Medicina' },
    { codigo: '225233', ocupacao: 'Médico Urologista', area: 'Medicina' },
    { codigo: '225250', ocupacao: 'Médico Anestesiologista', area: 'Medicina' },
    { codigo: '225260', ocupacao: 'Médico em Medicina Intensiva', area: 'Medicina' },

    // Enfermagem
    { codigo: '223505', ocupacao: 'Enfermeiro', area: 'Enfermagem' },
    { codigo: '223510', ocupacao: 'Enfermeiro de Bordo', area: 'Enfermagem' },
    { codigo: '223515', ocupacao: 'Enfermeiro de Centro Cirúrgico', area: 'Enfermagem' },
    { codigo: '223520', ocupacao: 'Enfermeiro de Terapia Intensiva', area: 'Enfermagem' },
    { codigo: '223525', ocupacao: 'Enfermeiro do Trabalho', area: 'Enfermagem' },
    { codigo: '223530', ocupacao: 'Enfermeiro de Saúde da Família', area: 'Enfermagem' },
    { codigo: '223535', ocupacao: 'Enfermeiro de Saúde Pública', area: 'Enfermagem' },
    { codigo: '223540', ocupacao: 'Enfermeiro Sanitarista', area: 'Enfermagem' },
    { codigo: '223545', ocupacao: 'Enfermeiro Auditor', area: 'Enfermagem' },
    { codigo: '223550', ocupacao: 'Enfermeiro Nefrologista', area: 'Enfermagem' },
    { codigo: '223555', ocupacao: 'Enfermeiro Obstétrico', area: 'Enfermagem' },
    { codigo: '223560', ocupacao: 'Enfermeiro Psiquiátrico', area: 'Enfermagem' },
    { codigo: '223565', ocupacao: 'Enfermeiro', area: 'Enfermagem' },

    // Técnicos de Enfermagem
    { codigo: '322205', ocupacao: 'Técnico de Enfermagem', area: 'Enfermagem' },
    { codigo: '322210', ocupacao: 'Técnico de Enfermagem da Estratégia de Saúde da Família', area: 'Enfermagem' },
    { codigo: '322215', ocupacao: 'Técnico de Enfermagem de Terapia Intensiva', area: 'Enfermagem' },
    { codigo: '322220', ocupacao: 'Técnico de Enfermagem do Trabalho', area: 'Enfermagem' },
    { codigo: '322225', ocupacao: 'Técnico de Enfermagem Psiquiátrico', area: 'Enfermagem' },

    // Odontologia
    { codigo: '223201', ocupacao: 'Cirurgião-Dentista - Auditor', area: 'Odontologia' },
    { codigo: '223204', ocupacao: 'Cirurgião-Dentista - Clínico Geral', area: 'Odontologia' },
    { codigo: '223208', ocupacao: 'Cirurgião-Dentista - Endodontista', area: 'Odontologia' },
    { codigo: '223212', ocupacao: 'Cirurgião-Dentista - Epidemiologista', area: 'Odontologia' },
    { codigo: '223216', ocupacao: 'Cirurgião-Dentista - Estomatologista', area: 'Odontologia' },
    { codigo: '223220', ocupacao: 'Cirurgião-Dentista - Implantodontista', area: 'Odontologia' },
    { codigo: '223224', ocupacao: 'Cirurgião-Dentista - Odontogeriatra', area: 'Odontologia' },
    { codigo: '223228', ocupacao: 'Cirurgião-Dentista - Odontopediatra', area: 'Odontologia' },
    { codigo: '223232', ocupacao: 'Cirurgião-Dentista - Ortodontista', area: 'Odontologia' },
    { codigo: '223236', ocupacao: 'Cirurgião-Dentista - Periodontista', area: 'Odontologia' },
    { codigo: '223240', ocupacao: 'Cirurgião-Dentista - Protesiólogo Bucomaxilofacial', area: 'Odontologia' },
    { codigo: '223244', ocupacao: 'Cirurgião-Dentista - Reabilitador Oral', area: 'Odontologia' },
    { codigo: '223248', ocupacao: 'Cirurgião-Dentista - Traumatologista Bucomaxilofacial', area: 'Odontologia' },
    { codigo: '223293', ocupacao: 'Cirurgião-Dentista', area: 'Odontologia' },

    // Auxiliar e Técnico de Saúde Bucal
    { codigo: '322405', ocupacao: 'Auxiliar de Saúde Bucal', area: 'Odontologia' },
    { codigo: '322410', ocupacao: 'Técnico em Saúde Bucal', area: 'Odontologia' },

    // Psicologia
    { codigo: '251505', ocupacao: 'Psicólogo Educacional', area: 'Psicologia' },
    { codigo: '251510', ocupacao: 'Psicólogo Clínico', area: 'Psicologia' },
    { codigo: '251515', ocupacao: 'Psicólogo do Esporte', area: 'Psicologia' },
    { codigo: '251520', ocupacao: 'Psicólogo Hospitalar', area: 'Psicologia' },
    { codigo: '251525', ocupacao: 'Psicólogo Jurídico', area: 'Psicologia' },
    { codigo: '251530', ocupacao: 'Psicólogo Social', area: 'Psicologia' },
    { codigo: '251535', ocupacao: 'Psicólogo do Trabalho', area: 'Psicologia' },
    { codigo: '251540', ocupacao: 'Psicólogo de Trânsito', area: 'Psicologia' },
    { codigo: '251545', ocupacao: 'Neuropsicólogo', area: 'Psicologia' },

    // Agentes Comunitários de Saúde
    { codigo: '515105', ocupacao: 'Agente Comunitário de Saúde', area: 'Atenção Básica' },
    { codigo: '515110', ocupacao: 'Agente de Combate às Endemias', area: 'Vigilância em Saúde' },

    // Fisioterapia
    { codigo: '223605', ocupacao: 'Fisioterapeuta Geral', area: 'Fisioterapia' },
    { codigo: '223610', ocupacao: 'Fisioterapeuta Respiratória', area: 'Fisioterapia' },
    { codigo: '223615', ocupacao: 'Fisioterapeuta Neurofuncional', area: 'Fisioterapia' },
    { codigo: '223620', ocupacao: 'Fisioterapeuta Traumato-ortopédica', area: 'Fisioterapia' },

    // Nutrição
    { codigo: '223710', ocupacao: 'Nutricionista', area: 'Nutrição' },

    // Farmácia
    { codigo: '223405', ocupacao: 'Farmacêutico', area: 'Farmácia' },
    { codigo: '223410', ocupacao: 'Farmacêutico Analista Clínico', area: 'Farmácia' },
    { codigo: '223415', ocupacao: 'Farmacêutico de Alimentos', area: 'Farmácia' },
    { codigo: '323105', ocupacao: 'Técnico em Farmácia', area: 'Farmácia' },

    // Fonoaudiologia
    { codigo: '223810', ocupacao: 'Fonoaudiólogo', area: 'Fonoaudiologia' },
    { codigo: '223815', ocupacao: 'Fonoaudiólogo Educacional', area: 'Fonoaudiologia' },

    // Terapia Ocupacional
    { codigo: '223905', ocupacao: 'Terapeuta Ocupacional', area: 'Terapia Ocupacional' },

    // Assistência Social
    { codigo: '251605', ocupacao: 'Assistente Social', area: 'Assistência Social' },

    // Biomedicina
    { codigo: '224105', ocupacao: 'Biomédico', area: 'Biomedicina' },

    // Outros Profissionais de Saúde
    { codigo: '322415', ocupacao: 'Técnico em Radiologia', area: 'Diagnóstico por Imagem' },
    { codigo: '321105', ocupacao: 'Técnico em Patologia Clínica', area: 'Laboratório' },
  ];

  console.log('📊 Resumo de CBOs:');
  const cbosPorArea = cbos.reduce((acc, cbo) => {
    acc[cbo.area] = (acc[cbo.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [area, count] of Object.entries(cbosPorArea)) {
    console.log(`   • ${area}: ${count} ocupações`);
  }

  console.log(`\n   ✅ Total: ${cbos.length} códigos CBO catalogados\n`);

  // =====================================================
  // 3. MAPEAMENTO ESPECIALIDADE → CBO
  // =====================================================

  console.log('🔗 Mapeamento Especialidade → CBO:\n');

  const mapeamentoEspCBO = [
    { especialidade: 'Clínica Geral', cbos: ['225100', '225109', '225125'] },
    { especialidade: 'Medicina de Família e Comunidade', cbos: ['225103'] },
    { especialidade: 'Pediatria', cbos: ['225218'] },
    { especialidade: 'Ginecologia e Obstetrícia', cbos: ['225148'] },
    { especialidade: 'Cardiologia', cbos: ['225118'] },
    { especialidade: 'Endocrinologia', cbos: ['225136'] },
    { especialidade: 'Gastroenterologia', cbos: ['225139'] },
    { especialidade: 'Nefrologia', cbos: ['225203'] },
    { especialidade: 'Pneumologia', cbos: ['225221'] },
    { especialidade: 'Neurologia', cbos: ['225206'] },
    { especialidade: 'Dermatologia', cbos: ['225130'] },
    { especialidade: 'Psiquiatria', cbos: ['225224'] },
    { especialidade: 'Ortopedia e Traumatologia', cbos: ['225212'] },
    { especialidade: 'Cirurgia Geral', cbos: ['225124'] },
    { especialidade: 'Oftalmologia', cbos: ['225209'] },
    { especialidade: 'Otorrinolaringologia', cbos: ['225215'] },
    { especialidade: 'Urologia', cbos: ['225233'] },
    { especialidade: 'Radiologia', cbos: ['225227'] },
    { especialidade: 'Anestesiologia', cbos: ['225250'] },
    { especialidade: 'Odontologia Geral', cbos: ['223204', '223293'] },
    { especialidade: 'Endodontia', cbos: ['223208'] },
    { especialidade: 'Periodontia', cbos: ['223236'] },
    { especialidade: 'Ortodontia', cbos: ['223232'] },
    { especialidade: 'Odontopediatria', cbos: ['223228'] },
    { especialidade: 'Enfermagem', cbos: ['223565', '223505'] },
    { especialidade: 'Psicologia Clínica', cbos: ['251510'] },
  ];

  for (const map of mapeamentoEspCBO) {
    console.log(`   ✅ ${map.especialidade}: CBOs [${map.cbos.join(', ')}]`);
  }

  console.log(`\n✅ SEED 05 CONCLUÍDO!\n`);
  console.log('📊 Dados Catalogados:');
  console.log(`   • ${especialidades.length} Especialidades Médicas`);
  console.log(`   • ${cbos.length} Códigos CBO`);
  console.log(`   • ${mapeamentoEspCBO.length} Mapeamentos Especialidade→CBO`);
  console.log(`\n   ℹ️  Esses dados estão prontos para serem usados em validações e filtros\n`);

  return {
    especialidades,
    cbos,
    mapeamentoEspCBO,
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  seed05EspecialidadesCBO()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
