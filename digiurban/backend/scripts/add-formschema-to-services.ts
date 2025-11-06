/**
 * ============================================================================
 * SCRIPT: ADICIONAR FORMSCHEMA A SERVIÇOS SEM FORMULÁRIO
 * ============================================================================
 *
 * Este script adiciona formSchema (no formato fields[]) a todos os serviços
 * COM_DADOS que não possuem formulário definido no banco de dados.
 *
 * Para cada serviço sem formSchema, cria um formulário básico com campos
 * essenciais baseados no tipo de serviço.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de moduleType para campos de formulário específicos
const MODULE_FORM_SCHEMAS: Record<string, any> = {
  // AGRICULTURA
  CADASTRO_PROPRIEDADE_RURAL: {
    fields: [
      { id: 'propertyName', label: 'Nome da Propriedade', type: 'text', required: true },
      { id: 'area', label: 'Área (hectares)', type: 'number', required: true },
      { id: 'carNumber', label: 'Número do CAR', type: 'text', required: true },
      { id: 'itrNumber', label: 'Número do ITR', type: 'text', required: false },
      { id: 'address', label: 'Endereço/Localização', type: 'textarea', required: true },
      { id: 'activities', label: 'Atividades Desenvolvidas', type: 'textarea', required: true },
    ]
  },
  CADASTRO_PRODUTOR: {
    fields: [
      { id: 'producerName', label: 'Nome do Produtor', type: 'text', required: true },
      { id: 'cpfCnpj', label: 'CPF/CNPJ', type: 'text', required: true },
      { id: 'phone', label: 'Telefone', type: 'text', required: true },
      { id: 'email', label: 'E-mail', type: 'text', required: false },
      { id: 'mainActivity', label: 'Atividade Principal', type: 'text', required: true },
    ]
  },
  ASSISTENCIA_TECNICA: {
    fields: [
      { id: 'requestType', label: 'Tipo de Assistência', type: 'select', required: true, options: ['Agrícola', 'Pecuária', 'Agroindústria', 'Gestão Rural'] },
      { id: 'propertyName', label: 'Nome da Propriedade', type: 'text', required: true },
      { id: 'issue', label: 'Descrição da Necessidade', type: 'textarea', required: true },
      { id: 'urgency', label: 'Urgência', type: 'select', required: true, options: ['Baixa', 'Média', 'Alta'] },
    ]
  },
  INSCRICAO_CURSO_RURAL: {
    fields: [
      { id: 'participantName', label: 'Nome do Participante', type: 'text', required: true },
      { id: 'cpf', label: 'CPF', type: 'text', required: true },
      { id: 'phone', label: 'Telefone', type: 'text', required: true },
      { id: 'interests', label: 'Áreas de Interesse', type: 'textarea', required: true },
    ]
  },
  INSCRICAO_PROGRAMA_RURAL: {
    fields: [
      { id: 'programName', label: 'Nome do Programa', type: 'text', required: true },
      { id: 'participantName', label: 'Nome do Participante', type: 'text', required: true },
      { id: 'cpf', label: 'CPF', type: 'text', required: true },
      { id: 'justification', label: 'Justificativa', type: 'textarea', required: true },
    ]
  },

  // TURISMO
  CADASTRO_EMPREENDIMENTO: {
    fields: [
      { id: 'enterpriseName', label: 'Nome do Empreendimento', type: 'text', required: true },
      { id: 'cnpj', label: 'CNPJ', type: 'text', required: true },
      { id: 'type', label: 'Tipo', type: 'select', required: true, options: ['Hotel', 'Pousada', 'Restaurante', 'Agência de Turismo', 'Guia Turístico', 'Outro'] },
      { id: 'address', label: 'Endereço', type: 'textarea', required: true },
      { id: 'phone', label: 'Telefone', type: 'text', required: true },
      { id: 'email', label: 'E-mail', type: 'text', required: true },
    ]
  },
  CADASTRO_GUIA: {
    fields: [
      { id: 'guideName', label: 'Nome do Guia', type: 'text', required: true },
      { id: 'cpf', label: 'CPF', type: 'text', required: true },
      { id: 'cadasturNumber', label: 'Número do Cadastur', type: 'text', required: false },
      { id: 'languages', label: 'Idiomas', type: 'text', required: true },
      { id: 'specialties', label: 'Especialidades', type: 'textarea', required: true },
    ]
  },
  SOLICITAR_EVENTOS: {
    fields: [
      { id: 'eventName', label: 'Nome do Evento', type: 'text', required: true },
      { id: 'eventDate', label: 'Data do Evento', type: 'text', required: true },
      { id: 'location', label: 'Local', type: 'text', required: true },
      { id: 'expectedAttendees', label: 'Público Esperado', type: 'number', required: true },
      { id: 'eventDescription', label: 'Descrição do Evento', type: 'textarea', required: true },
    ]
  },
  INFORMACOES_TURISTICAS: {
    fields: [
      { id: 'infoType', label: 'Tipo de Informação', type: 'select', required: true, options: ['Atrativos Turísticos', 'Hospedagem', 'Gastronomia', 'Eventos', 'Transporte', 'Outro'] },
      { id: 'details', label: 'Detalhes da Solicitação', type: 'textarea', required: true },
    ]
  },
  PARCERIAS_TURISMO: {
    fields: [
      { id: 'partnerName', label: 'Nome da Empresa/Entidade', type: 'text', required: true },
      { id: 'cnpjCpf', label: 'CNPJ/CPF', type: 'text', required: true },
      { id: 'partnershipType', label: 'Tipo de Parceria', type: 'text', required: true },
      { id: 'proposal', label: 'Proposta de Parceria', type: 'textarea', required: true },
    ]
  },
  DIVULGACAO_EVENTOS: {
    fields: [
      { id: 'eventName', label: 'Nome do Evento', type: 'text', required: true },
      { id: 'eventDate', label: 'Data do Evento', type: 'text', required: true },
      { id: 'organizer', label: 'Organizador', type: 'text', required: true },
      { id: 'description', label: 'Descrição', type: 'textarea', required: true },
    ]
  },
  ROTEIROS_TURISMO: {
    fields: [
      { id: 'routeName', label: 'Nome do Roteiro', type: 'text', required: true },
      { id: 'duration', label: 'Duração (dias)', type: 'number', required: true },
      { id: 'attractions', label: 'Atrativos Incluídos', type: 'textarea', required: true },
      { id: 'targetAudience', label: 'Público-Alvo', type: 'text', required: true },
    ]
  },
};

// Formulário genérico para serviços sem mapeamento específico
const GENERIC_FORM_SCHEMA = {
  fields: [
    { id: 'requesterName', label: 'Nome do Solicitante', type: 'text', required: true },
    { id: 'cpfCnpj', label: 'CPF/CNPJ', type: 'text', required: true },
    { id: 'phone', label: 'Telefone', type: 'text', required: true },
    { id: 'email', label: 'E-mail', type: 'text', required: false },
    { id: 'details', label: 'Detalhes da Solicitação', type: 'textarea', required: true },
  ]
};

async function addFormSchemaToServices() {
  console.log('🔍 Buscando serviços COM_DADOS sem formSchema...\n');

  // Buscar todos os serviços COM_DADOS
  const services = await prisma.serviceSimplified.findMany({
    where: {
      serviceType: 'COM_DADOS',
    },
    select: {
      id: true,
      name: true,
      moduleType: true,
      formSchema: true,
      department: {
        select: {
          name: true,
        }
      }
    },
  });

  console.log(`📊 Total de serviços COM_DADOS: ${services.length}\n`);

  const servicesWithoutForm = services.filter(s => !s.formSchema || (typeof s.formSchema === 'object' && Object.keys(s.formSchema).length === 0));

  console.log(`❌ Serviços SEM formSchema: ${servicesWithoutForm.length}`);
  console.log(`✅ Serviços COM formSchema: ${services.length - servicesWithoutForm.length}\n`);

  if (servicesWithoutForm.length === 0) {
    console.log('✅ Todos os serviços COM_DADOS já possuem formSchema!');
    return;
  }

  console.log('📝 Serviços que receberão formSchema:\n');

  let updated = 0;
  let skipped = 0;

  for (const service of servicesWithoutForm) {
    const formSchema = MODULE_FORM_SCHEMAS[service.moduleType || ''] || GENERIC_FORM_SCHEMA;

    console.log(`   [${service.department?.name || 'N/A'}] ${service.name}`);
    console.log(`      ModuleType: ${service.moduleType || 'N/A'}`);
    console.log(`      FormSchema: ${formSchema === GENERIC_FORM_SCHEMA ? 'GENÉRICO' : 'ESPECÍFICO'} (${formSchema.fields.length} campos)`);

    try {
      await prisma.serviceSimplified.update({
        where: { id: service.id },
        data: { formSchema: formSchema as any },
      });
      updated++;
    } catch (error) {
      console.log(`      ❌ ERRO ao atualizar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA ATUALIZAÇÃO:');
  console.log('='.repeat(80));
  console.log(`✅ Serviços atualizados: ${updated}`);
  console.log(`❌ Serviços ignorados (erro): ${skipped}`);
  console.log(`📈 Total de serviços COM_DADOS: ${services.length}`);
  console.log(`🎯 Cobertura atual: ${Math.round(((services.length - servicesWithoutForm.length + updated) / services.length) * 100)}%`);
  console.log('='.repeat(80));
}

// Executar script
addFormSchemaToServices()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
