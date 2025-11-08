/**
 * ============================================================================
 * SEED DE SERVIÇOS - ARQUITETURA SIMPLIFICADA (COMPLETO)
 * ============================================================================
 *
 * Baseado em: docs/PLANO_IMPLEMENTACAO_SIMPLIFICACAO.md
 *
 * TOTAL: 114 SERVIÇOS MAPEADOS
 * - 102 Serviços COM_DADOS (capturam dados para módulos)
 * - 12 Serviços INFORMATIVOS (consultas, sem dados estruturados)
 *
 * DISTRIBUIÇÃO POR SECRETARIA:
 * 1. Saúde                    - 11 serviços (10 COM_DADOS + 1 GESTÃO)
 * 2. Educação                 - 11 serviços (8 COM_DADOS + 2 GESTÃO + 1 INFO)
 * 3. Assistência Social       - 9 serviços  (8 COM_DADOS + 1 GESTÃO)
 * 4. Agricultura              - 6 serviços  (6 COM_DADOS)
 * 5. Cultura                  - 9 serviços  (8 COM_DADOS + 1 INFO)
 * 6. Esportes                 - 9 serviços  (8 COM_DADOS + 1 INFO)
 * 7. Habitação                - 7 serviços  (6 COM_DADOS + 1 INFO)
 * 8. Meio Ambiente            - 7 serviços  (6 COM_DADOS + 1 GESTÃO)
 * 9. Obras Públicas           - 7 serviços  (5 COM_DADOS + 2 INFO)
 * 10. Planejamento Urbano     - 9 serviços  (7 COM_DADOS + 2 INFO)
 * 11. Segurança Pública       - 11 serviços (8 COM_DADOS + 2 GESTÃO + 1 INFO)
 * 12. Serviços Públicos       - 9 serviços  (7 COM_DADOS + 1 GESTÃO + 1 INFO)
 * 13. Turismo                 - 9 serviços  (7 COM_DADOS + 2 INFO)
 *
 * Estrutura:
 * - serviceType: 'COM_DADOS' | 'INFORMATIVO'
 * - moduleType: string (ex: 'CADASTRO_PRODUTOR') - para roteamento
 * - formSchema: JSON Schema do formulário (quando aplicável)
 */

import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

interface ServiceDefinition {
  name: string;
  description: string;
  departmentCode: string;
  serviceType: ServiceType;
  moduleType: string | null; // null = serviço informativo
  requiresDocuments: boolean;
  requiredDocuments?: string[];
  estimatedDays: number | null;
  priority: number;
  category?: string;
  icon?: string;
  color?: string;
  formSchema?: any;
}

// ============================================================================
// SECRETARIA DE SAÚDE (11 serviços)
// ============================================================================
const HEALTH_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Saúde',
    description: 'Registro geral de atendimentos na área da saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SAUDE',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Activity',
    color: '#10b981',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO PACIENTE ==========
        nome: { type: 'string', title: 'Nome Completo do Paciente', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        tipoSanguineo: { type: 'string', title: 'Tipo Sanguíneo', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei'] },

        // ========== BLOCO 6: DADOS DO ATENDIMENTO ==========
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Consulta', 'Emergência', 'Retorno', 'Preventivo', 'Vacinação', 'Exame']
        },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde', minLength: 3, maxLength: 200 },
        dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
        horaAtendimento: { type: 'string', title: 'Hora do Atendimento', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        profissionalResponsavel: { type: 'string', title: 'Profissional Responsável', minLength: 3, maxLength: 200 },
        cnsProfissional: { type: 'string', title: 'CNS do Profissional', maxLength: 20 },
        especialidade: { type: 'string', title: 'Especialidade', maxLength: 100 },
        descricao: { type: 'string', title: 'Descrição/Queixa Principal', minLength: 10, maxLength: 2000 },
        diagnostico: { type: 'string', title: 'Diagnóstico/CID', maxLength: 500 },
        procedimentosRealizados: { type: 'string', title: 'Procedimentos Realizados', maxLength: 1000 },
        prescricoes: { type: 'string', title: 'Prescrições/Orientações Médicas', maxLength: 1000 },
        prioridade: {
          type: 'string',
          title: 'Prioridade',
          enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'],
          default: 'NORMAL'
        },
        encaminhamento: { type: 'boolean', title: 'Houve Encaminhamento?', default: false },
        especialidadeEncaminhamento: { type: 'string', title: 'Especialidade do Encaminhamento', maxLength: 200 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'tipoAtendimento', 'unidadeSaude', 'dataAtendimento', 'descricao'
      ]
    }
  },
  {
    name: 'Agendamento de Consulta Médica',
    description: 'Agende consultas médicas nas unidades de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTOS_MEDICOS',
    requiresDocuments: true,
    requiredDocuments: ['Cartão SUS', 'Documento de Identidade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Agendamento',
    icon: 'Calendar',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      properties: {
        // BLOCO 1: IDENTIFICAÇÃO
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        // BLOCO 2: CONTATO
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },
        // BLOCO 3: ENDEREÇO
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },
        // BLOCO 4: COMPLEMENTARES
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        // DADOS DE SAÚDE
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },
        possuiConvenio: { type: 'boolean', title: 'Possui Convênio Particular?', default: false },
        nomeConvenio: { type: 'string', title: 'Nome do Convênio', maxLength: 100 },
        // DADOS DO AGENDAMENTO
        especialidade: { type: 'string', title: 'Especialidade', enum: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia', 'Odontologia', 'Psicologia', 'Nutrição'] },
        unidadePreferencial: { type: 'string', title: 'Unidade de Saúde Preferencial', minLength: 3, maxLength: 200 },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        motivoConsulta: { type: 'string', title: 'Motivo da Consulta', minLength: 10, maxLength: 500 },
        primeiraConsulta: { type: 'boolean', title: 'Primeira Consulta na Especialidade?', default: false },
        urgencia: { type: 'boolean', title: 'Caso Urgente?', default: false },
        justificativaUrgencia: { type: 'string', title: 'Justificativa da Urgência', minLength: 20, maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'cartaoSUS', 'especialidade', 'unidadePreferencial', 'motivoConsulta']
    }
  },
  {
    name: 'Controle de Medicamentos',
    description: 'Solicitação e controle de medicamentos da farmácia básica',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CONTROLE_MEDICAMENTOS',
    requiresDocuments: true,
    requiredDocuments: ['Receita Médica', 'Cartão SUS'],
    estimatedDays: 2,
    priority: 5,
    category: 'Medicamentos',
    icon: 'Pill',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },
        dificuldadeLocomocao: { type: 'boolean', title: 'Possui Dificuldade de Locomoção?', default: false },

        // ========== BLOCO 6: DADOS DA RECEITA ==========
        numeroReceita: { type: 'string', title: 'Número da Receita', minLength: 5, maxLength: 50 },
        dataReceita: { type: 'string', format: 'date', title: 'Data da Receita' },
        nomeMedico: { type: 'string', title: 'Nome do Médico', minLength: 3, maxLength: 200 },
        crmMedico: { type: 'string', title: 'CRM do Médico', pattern: '^\\d{4,8}$' },
        especialidadeMedico: { type: 'string', title: 'Especialidade do Médico', maxLength: 100 },

        // ========== BLOCO 7: MEDICAMENTOS ==========
        medicamentos: {
          type: 'array',
          title: 'Medicamentos Solicitados',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string', title: 'Nome do Medicamento', minLength: 3, maxLength: 200 },
              dosagem: { type: 'string', title: 'Dosagem', maxLength: 50 },
              quantidade: { type: 'integer', title: 'Quantidade', minimum: 1 },
              posologia: { type: 'string', title: 'Posologia', maxLength: 200 },
              duracao: { type: 'string', title: 'Duração do Tratamento', maxLength: 100 },
              viaAdministracao: { type: 'string', title: 'Via de Administração', enum: ['Oral', 'Injetável', 'Tópica', 'Inalatória', 'Outra'] }
            },
            required: ['nome', 'dosagem', 'quantidade']
          },
          minItems: 1
        },
        usoContínuo: { type: 'boolean', title: 'Uso Contínuo (mais de 3 meses)', default: false },

        // ========== BLOCO 8: RETIRADA E LOGÍSTICA ==========
        unidadeRetirada: { type: 'string', title: 'Unidade de Retirada Preferencial', minLength: 3, maxLength: 200 },
        horarioPreferencialRetirada: { type: 'string', title: 'Horário Preferencial', enum: ['Manhã (08:00-12:00)', 'Tarde (13:00-17:00)', 'Qualquer'] },
        solicitaEntregaDomiciliar: { type: 'boolean', title: 'Solicita Entrega Domiciliar?', default: false },
        justificativaEntregaDomiciliar: { type: 'string', title: 'Justificativa para Entrega Domiciliar', maxLength: 500 },
        autorizaFamiliarRetirar: { type: 'boolean', title: 'Autoriza Familiar a Retirar?', default: false },
        nomeFamiliarAutorizado: { type: 'string', title: 'Nome do Familiar Autorizado', minLength: 3, maxLength: 200 },
        cpfFamiliarAutorizado: { type: 'string', title: 'CPF do Familiar Autorizado', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        parentescoFamiliar: { type: 'string', title: 'Grau de Parentesco', enum: ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão(ã)', 'Neto(a)', 'Outro'] },

        // ========== BLOCO 9: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'numeroReceita', 'dataReceita', 'nomeMedico', 'crmMedico',
        'medicamentos', 'unidadeRetirada'
      ]
    }
  },
  {
    name: 'Campanhas de Vacinação',
    description: 'Registro de participação em campanhas de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CAMPANHAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
    estimatedDays: 1,
    priority: 5,
    category: 'Prevenção',
    icon: 'Syringe',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        possuiCartaoVacina: { type: 'boolean', title: 'Possui Cartão de Vacina?', default: false },
        numeroCartaoVacina: { type: 'string', title: 'Número do Cartão de Vacina', maxLength: 50 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos/Vacinas (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },

        // ========== BLOCO 6: DADOS DA CAMPANHA ==========
        tipoCampanha: {
          type: 'string',
          title: 'Tipo de Campanha/Vacina',
          enum: ['Gripe', 'COVID-19', 'Sarampo', 'Pólio', 'Multivacinação', 'HPV', 'Meningite', 'Febre Amarela', 'Hepatite', 'Tétano', 'Pneumonia', 'Outras']
        },
        grupoRisco: {
          type: 'string',
          title: 'Grupo de Risco',
          enum: ['Criança (0-11 anos)', 'Adolescente (12-18 anos)', 'Adulto (19-59 anos)', 'Idoso (60+ anos)', 'Gestante', 'Puérpera', 'Profissional de Saúde', 'Professor', 'Portador de Comorbidade', 'Não se aplica']
        },
        gestante: { type: 'boolean', title: 'É Gestante?', default: false },
        semanasGestacao: { type: 'integer', title: 'Semanas de Gestação', minimum: 1, maximum: 42 },
        possuiComorbidade: { type: 'boolean', title: 'Possui Comorbidade?', default: false },
        descricaoComorbidade: { type: 'string', title: 'Descrição da Comorbidade', maxLength: 500 },

        // ========== BLOCO 7: AGENDAMENTO/LOCAL ==========
        unidadePreferencial: { type: 'string', title: 'Unidade de Saúde Preferencial', minLength: 3, maxLength: 200 },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        temDificuldadeLocomocao: { type: 'boolean', title: 'Possui Dificuldade de Locomoção?', default: false },
        solicitaVacinacaoDomiciliar: { type: 'boolean', title: 'Solicita Vacinação Domiciliar?', default: false },
        justificativaVacinacaoDomiciliar: { type: 'string', title: 'Justificativa para Vacinação Domiciliar', maxLength: 500 },

        // ========== BLOCO 8: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'tipoCampanha', 'grupoRisco', 'unidadePreferencial'
      ]
    }
  },
  {
    name: 'Programas de Saúde',
    description: 'Inscrição em programas de saúde (hipertensão, diabetes, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico', 'Cartão SUS'],
    estimatedDays: 5,
    priority: 4,
    category: 'Programas',
    icon: 'Heart',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },
        peso: { type: 'number', title: 'Peso (kg)', minimum: 1, maximum: 300 },
        altura: { type: 'number', title: 'Altura (cm)', minimum: 40, maximum: 250 },

        // ========== BLOCO 6: DADOS DO PROGRAMA ==========
        tipoPrograma: {
          type: 'string',
          title: 'Tipo de Programa',
          enum: ['Hipertensão', 'Diabetes', 'Gestante', 'Saúde Mental', 'Idoso', 'Pré-Natal', 'Criança Saudável', 'Obesidade', 'Tabagismo', 'Alcoolismo', 'Hanseníase', 'Tuberculose', 'Outro']
        },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição no Programa', minLength: 10, maxLength: 500 },
        diagnostico: { type: 'string', title: 'Diagnóstico Principal (CID-10)', minLength: 3, maxLength: 500 },
        possuiDiagnosticoMedico: { type: 'boolean', title: 'Possui Diagnóstico Médico Formal?', default: false },
        comorbidades: { type: 'string', title: 'Comorbidades (outras doenças)', maxLength: 500 },

        // ========== BLOCO 7: MÉDICO RESPONSÁVEL ==========
        nomeMedico: { type: 'string', title: 'Nome do Médico Responsável', minLength: 3, maxLength: 200 },
        crmMedico: { type: 'string', title: 'CRM do Médico', pattern: '^\\d{4,8}$' },
        especialidadeMedico: { type: 'string', title: 'Especialidade do Médico', maxLength: 100 },
        dataUltimaConsulta: { type: 'string', format: 'date', title: 'Data da Última Consulta' },

        // ========== BLOCO 8: ACOMPANHAMENTO ==========
        dataInicio: { type: 'string', format: 'date', title: 'Data de Início no Programa' },
        unidadeAcompanhamento: { type: 'string', title: 'Unidade de Saúde para Acompanhamento', minLength: 3, maxLength: 200 },
        frequenciaConsultas: {
          type: 'string',
          title: 'Frequência de Consultas',
          enum: ['Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral']
        },
        horarioPreferencial: { type: 'string', title: 'Horário Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante?', default: false },

        // ========== BLOCO 9: MEDICAMENTOS E TRATAMENTO ==========
        fazUsoMedicamentoContinuo: { type: 'boolean', title: 'Faz Uso de Medicamento Contínuo?', default: false },
        medicamentosUso: { type: 'string', title: 'Medicamentos em Uso Contínuo', maxLength: 1000 },
        possuiDificuldadeObterMedicamento: { type: 'boolean', title: 'Possui Dificuldade em Obter Medicamento?', default: false },
        retiraraMedicamentoFarmaciaBasica: { type: 'boolean', title: 'Retirará Medicamentos na Farmácia Básica?', default: false },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'tipoPrograma', 'motivoInscricao', 'diagnostico',
        'nomeMedico', 'crmMedico', 'dataInicio', 'unidadeAcompanhamento', 'frequenciaConsultas'
      ]
    }
  },
  {
    name: 'Encaminhamento TFD (Tratamento Fora do Domicílio)',
    description: 'Solicitação de transporte e tratamento fora do município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ENCAMINHAMENTOS_TFD',
    requiresDocuments: true,
    requiredDocuments: ['Encaminhamento Médico', 'Exames', 'Cartão SUS'],
    estimatedDays: 15,
    priority: 5,
    category: 'TFD',
    icon: 'Ambulance',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Acamado', 'Outra'] },

        // ========== BLOCO 6: ENCAMINHAMENTO MÉDICO ==========
        nomeMedicoSolicitante: { type: 'string', title: 'Médico Solicitante', minLength: 3, maxLength: 200 },
        crmMedico: { type: 'string', title: 'CRM do Médico', pattern: '^\\d{4,8}$' },
        especialidadeMedicoSolicitante: { type: 'string', title: 'Especialidade do Médico', maxLength: 100 },
        dataEncaminhamento: { type: 'string', format: 'date', title: 'Data do Encaminhamento Médico' },
        numeroEncaminhamento: { type: 'string', title: 'Número do Encaminhamento', maxLength: 50 },

        // ========== BLOCO 7: DADOS DO TRATAMENTO ==========
        especialidadeDestino: { type: 'string', title: 'Especialidade de Destino', minLength: 3, maxLength: 200 },
        tipoTratamento: {
          type: 'string',
          title: 'Tipo de Tratamento',
          enum: ['Consulta Especializada', 'Cirurgia', 'Exames Especializados', 'Radioterapia', 'Quimioterapia', 'Hemodiálise', 'Fisioterapia', 'Outro']
        },
        motivoEncaminhamento: { type: 'string', title: 'Motivo do Encaminhamento', minLength: 20, maxLength: 1000 },
        diagnostico: { type: 'string', title: 'Diagnóstico Principal (CID-10)', maxLength: 500 },
        historicoDoenca: { type: 'string', title: 'Histórico da Doença', maxLength: 1000 },
        urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },

        // ========== BLOCO 8: DESTINO ==========
        cidadeDestino: { type: 'string', title: 'Cidade de Destino', minLength: 3, maxLength: 200 },
        estadoDestino: { type: 'string', title: 'Estado de Destino (UF)', pattern: '^[A-Z]{2}$', minLength: 2, maxLength: 2 },
        hospitalDestino: { type: 'string', title: 'Hospital/Clínica de Destino (se conhecido)', maxLength: 200 },
        dataPreferencialAtendimento: { type: 'string', format: 'date', title: 'Data Preferencial de Atendimento' },

        // ========== BLOCO 9: ACOMPANHANTE ==========
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante?', default: false },
        nomeAcompanhante: { type: 'string', title: 'Nome Completo do Acompanhante', maxLength: 200 },
        cpfAcompanhante: { type: 'string', title: 'CPF do Acompanhante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rgAcompanhante: { type: 'string', title: 'RG do Acompanhante', maxLength: 20 },
        telefoneAcompanhante: { type: 'string', title: 'Telefone do Acompanhante', pattern: '^\\d{10,11}$' },
        parentescoAcompanhante: { type: 'string', title: 'Grau de Parentesco', enum: ['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão(ã)', 'Neto(a)', 'Outro'] },

        // ========== BLOCO 10: LOGÍSTICA ==========
        necessitaTransporte: { type: 'boolean', title: 'Necessita Transporte?', default: true },
        tipoTransporte: { type: 'string', title: 'Tipo de Transporte Necessário', enum: ['Veículo Comum', 'Ambulância Simples', 'Ambulância UTI', 'Outro'] },
        necessitaHospedagem: { type: 'boolean', title: 'Necessita Hospedagem?', default: false },
        diasEstimadosHospedagem: { type: 'integer', title: 'Dias Estimados de Hospedagem', minimum: 1, maximum: 90 },
        necessitaAjudaCusto: { type: 'boolean', title: 'Necessita Ajuda de Custo?', default: false },

        // ========== BLOCO 11: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'nomeMedicoSolicitante', 'crmMedico', 'dataEncaminhamento',
        'especialidadeDestino', 'tipoTratamento', 'motivoEncaminhamento', 'diagnostico',
        'cidadeDestino', 'estadoDestino'
      ]
    }
  },
  {
    name: 'Solicitação de Exames',
    description: 'Agendamento de exames laboratoriais e de imagem',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'EXAMES',
    requiresDocuments: true,
    requiredDocuments: ['Pedido Médico', 'Cartão SUS'],
    estimatedDays: 10,
    priority: 4,
    category: 'Exames',
    icon: 'FileText',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos/Contrastes (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },
        peso: { type: 'number', title: 'Peso (kg)', minimum: 1, maximum: 300 },
        altura: { type: 'number', title: 'Altura (cm)', minimum: 40, maximum: 250 },

        // ========== BLOCO 6: MÉDICO SOLICITANTE ==========
        nomeMedicoSolicitante: { type: 'string', title: 'Médico Solicitante', minLength: 3, maxLength: 200 },
        crmMedico: { type: 'string', title: 'CRM do Médico', pattern: '^\\d{4,8}$' },
        especialidadeMedico: { type: 'string', title: 'Especialidade do Médico', maxLength: 100 },
        dataPedido: { type: 'string', format: 'date', title: 'Data do Pedido Médico' },
        numeroPedido: { type: 'string', title: 'Número do Pedido', maxLength: 50 },

        // ========== BLOCO 7: EXAMES SOLICITADOS ==========
        tipoExame: {
          type: 'string',
          title: 'Tipo de Exame',
          enum: ['Laboratorial', 'Imagem (Raio-X, Ultrassom, Tomografia)', 'Cardiológico', 'Oftalmológico', 'Auditivo', 'Endoscópico', 'Outro']
        },
        examesSolicitados: {
          type: 'array',
          title: 'Exames Solicitados',
          items: {
            type: 'object',
            properties: {
              nomeExame: { type: 'string', title: 'Nome do Exame', minLength: 3, maxLength: 200 },
              codigoExame: { type: 'string', title: 'Código do Exame (se conhecido)', maxLength: 50 },
              urgencia: { type: 'boolean', title: 'Urgente', default: false }
            },
            required: ['nomeExame']
          },
          minItems: 1
        },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação/Hipótese Diagnóstica', minLength: 10, maxLength: 500 },
        hipoteseDiagnostica: { type: 'string', title: 'Hipótese Diagnóstica (CID-10)', maxLength: 200 },

        // ========== BLOCO 8: AGENDAMENTO ==========
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        turnoPreferencial: {
          type: 'string',
          title: 'Turno Preferencial',
          enum: ['Manhã', 'Tarde', 'Qualquer']
        },
        unidadePreferencial: { type: 'string', title: 'Unidade de Saúde Preferencial', minLength: 3, maxLength: 200 },

        // ========== BLOCO 9: PREPARO ==========
        jejumNecessario: { type: 'boolean', title: 'Jejum Necessário?', default: false },
        horasJejum: { type: 'integer', title: 'Horas de Jejum', minimum: 1, maximum: 24 },
        preparoEspecial: { type: 'string', title: 'Preparo Especial (orientações do médico)', maxLength: 500 },
        usaMedicamentoContinuo: { type: 'boolean', title: 'Usa Medicamento Contínuo?', default: false },
        medicamentosEmUso: { type: 'string', title: 'Medicamentos em Uso', maxLength: 500 },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'nomeMedicoSolicitante', 'crmMedico', 'dataPedido',
        'tipoExame', 'examesSolicitados', 'motivoSolicitacao'
      ]
    }
  },
  {
    name: 'Transporte de Pacientes',
    description: 'Solicitação de ambulância para transporte de pacientes',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_PACIENTES',
    requiresDocuments: true,
    requiredDocuments: ['Atestado Médico', 'Comprovante de Endereço'],
    estimatedDays: 3,
    priority: 5,
    category: 'Transporte',
    icon: 'Truck',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Acamado', 'Outra'] },
        peso: { type: 'number', title: 'Peso (kg)', minimum: 1, maximum: 300 },
        estadoSaude: { type: 'string', title: 'Estado Geral de Saúde', enum: ['Estável', 'Delicado', 'Grave', 'Urgente'] },

        // ========== BLOCO 6: DADOS DO TRANSPORTE ==========
        tipoTransporte: {
          type: 'string',
          title: 'Tipo de Transporte Necessário',
          enum: ['Ambulância Básica', 'Ambulância UTI', 'Transporte Eletivo (Van/Carro)', 'Urgência/Emergência']
        },
        motivoTransporte: { type: 'string', title: 'Motivo do Transporte', minLength: 10, maxLength: 500 },
        finalidadeTransporte: {
          type: 'string',
          title: 'Finalidade',
          enum: ['Consulta', 'Exame', 'Cirurgia', 'Sessão de Tratamento (Hemodiálise, Quimio)', 'Internação', 'Alta Hospitalar', 'Transferência entre Hospitais', 'Outro']
        },
        diagnosticoMotivo: { type: 'string', title: 'Diagnóstico/CID-10', maxLength: 300 },

        // ========== BLOCO 7: ORIGEM E DESTINO ==========
        enderecoOrigemCompleto: { type: 'string', title: 'Endereço Completo de Origem', minLength: 10, maxLength: 300 },
        pontoReferenciaOrigem: { type: 'string', title: 'Ponto de Referência na Origem', maxLength: 200 },
        enderecoDestinoCompleto: { type: 'string', title: 'Endereço Completo de Destino', minLength: 10, maxLength: 300 },
        nomeHospitalClinica: { type: 'string', title: 'Nome do Hospital/Clínica de Destino', minLength: 3, maxLength: 200 },
        cidadeDestino: { type: 'string', title: 'Cidade de Destino', minLength: 3, maxLength: 100 },

        // ========== BLOCO 8: AGENDAMENTO ==========
        dataTransporte: { type: 'string', format: 'date', title: 'Data do Transporte' },
        horarioTransporte: { type: 'string', title: 'Horário do Transporte', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioRetorno: { type: 'string', title: 'Horário Previsto de Retorno (se houver)', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        transporteIda: { type: 'boolean', title: 'Necessita Transporte de Ida?', default: true },
        transporteVolta: { type: 'boolean', title: 'Necessita Transporte de Volta?', default: true },

        // ========== BLOCO 9: NECESSIDADES ESPECIAIS ==========
        necessitaMaca: { type: 'boolean', title: 'Necessita Maca?', default: false },
        necessitaCadeiradeRodas: { type: 'boolean', title: 'Necessita Cadeira de Rodas?', default: false },
        necessitaOxigenio: { type: 'boolean', title: 'Necessita Oxigênio?', default: false },
        necessitaMonitorizacao: { type: 'boolean', title: 'Necessita Monitorização Cardíaca?', default: false },
        necessitaEnfermeiro: { type: 'boolean', title: 'Necessita Acompanhamento de Enfermeiro?', default: false },
        pacienteAcamado: { type: 'boolean', title: 'Paciente Acamado?', default: false },

        // ========== BLOCO 10: ACOMPANHANTE ==========
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante?', default: false },
        nomeAcompanhante: { type: 'string', title: 'Nome do Acompanhante', maxLength: 200 },
        cpfAcompanhante: { type: 'string', title: 'CPF do Acompanhante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        telefoneAcompanhante: { type: 'string', title: 'Telefone do Acompanhante', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 11: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoTransporte', 'motivoTransporte', 'finalidadeTransporte',
        'enderecoOrigemCompleto', 'enderecoDestinoCompleto', 'dataTransporte', 'horarioTransporte'
      ]
    }
  },
  {
    name: 'Cartão Nacional de Saúde (Cartão SUS)',
    description: 'Cadastro e emissão do Cartão SUS',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PACIENTE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'CreditCard',
    color: '#10b981',
    formSchema: {
      type: 'object',
      properties: {
        nomeCompleto: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        nomeSocial: { type: 'string', title: 'Nome Social', maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        nomePai: { type: 'string', title: 'Nome do Pai', maxLength: 200 },
        sexo: {
          type: 'string',
          title: 'Sexo',
          enum: ['MASCULINO', 'FEMININO'],
          enumNames: ['Masculino', 'Feminino']
        },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$', minLength: 8, maxLength: 8 },
        logradouro: { type: 'string', title: 'Logradouro', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        cidade: { type: 'string', title: 'Cidade', minLength: 2, maxLength: 100 },
        uf: { type: 'string', title: 'UF', pattern: '^[A-Z]{2}$', minLength: 2, maxLength: 2 }
      },
      required: ['nomeCompleto', 'cpf', 'dataNascimento', 'nomeMae', 'sexo', 'telefone', 'cep', 'logradouro', 'bairro', 'cidade', 'uf']
    }
  },
  {
    name: 'Registro de Vacinação',
    description: 'Registro e acompanhamento de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'VACINACAO',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
    estimatedDays: 1,
    priority: 5,
    category: 'Vacinação',
    icon: 'Shield',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DE SAÚDE ==========
        cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        possuiCartaoVacina: { type: 'boolean', title: 'Possui Cartão de Vacina?', default: false },
        numeroCartaoVacina: { type: 'string', title: 'Número do Cartão de Vacina', maxLength: 50 },
        alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos/Vacinas (se houver)', maxLength: 500 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (LIBRAS)', 'Mobilidade Reduzida', 'Outra'] },

        // ========== BLOCO 6: DADOS DA VACINA ==========
        nomeVacina: { type: 'string', title: 'Nome da Vacina', minLength: 3, maxLength: 200 },
        tipoVacina: {
          type: 'string',
          title: 'Tipo de Vacina',
          enum: ['COVID-19', 'Gripe', 'Hepatite A', 'Hepatite B', 'Tríplice Viral (Sarampo/Rubéola/Caxumba)', 'Febre Amarela', 'BCG', 'Poliomielite', 'Tetáno', 'HPV', 'Meningite', 'Pneumonia', 'Outra']
        },
        loteVacina: { type: 'string', title: 'Lote da Vacina', minLength: 3, maxLength: 50 },
        fabricante: { type: 'string', title: 'Fabricante', minLength: 3, maxLength: 200 },
        dose: {
          type: 'string',
          title: 'Dose',
          enum: ['Dose Única', '1ª Dose', '2ª Dose', '3ª Dose', '4ª Dose', 'Reforço', '1º Reforço', '2º Reforço']
        },
        viaAdministracao: { type: 'string', title: 'Via de Administração', enum: ['Intramuscular', 'Subcutânea', 'Oral', 'Intradérmica'] },

        // ========== BLOCO 7: APLICAÇÃO ==========
        dataAplicacao: { type: 'string', format: 'date', title: 'Data de Aplicação' },
        horarioAplicacao: { type: 'string', title: 'Horário da Aplicação', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        unidadeVacinacao: { type: 'string', title: 'Unidade de Saúde (Vacinação)', minLength: 3, maxLength: 200 },
        profissionalAplicador: { type: 'string', title: 'Nome do Profissional Aplicador', minLength: 3, maxLength: 200 },
        cnsProfissional: { type: 'string', title: 'CNS do Profissional', pattern: '^\\d{15}$' },

        // ========== BLOCO 8: AGENDAMENTO PRÓXIMA DOSE ==========
        existeProximaDose: { type: 'boolean', title: 'Existe Próxima Dose?', default: false },
        dataProximaDose: { type: 'string', format: 'date', title: 'Data Prevista da Próxima Dose' },
        observacoesProximaDose: { type: 'string', title: 'Observações sobre Próxima Dose', maxLength: 300 },

        // ========== BLOCO 9: OBSERVAÇÕES ==========
        reacoesAdversas: { type: 'string', title: 'Reações Adversas Observadas', maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'cartaoSUS', 'nomeVacina', 'loteVacina', 'fabricante', 'dose',
        'dataAplicacao', 'unidadeVacinacao', 'profissionalAplicador'
      ]
    }
  },
  {
    name: 'Gestão de Agentes Comunitários de Saúde (ACS)',
    description: 'Administração e acompanhamento de ACS',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_ACS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b',
    formSchema: {
      type: 'object',
      properties: {
        nomeACS: { type: 'string', title: 'Nome do ACS', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        cns: { type: 'string', title: 'CNS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde', minLength: 3, maxLength: 200 },
        microarea: { type: 'string', title: 'Microárea', maxLength: 50 },
        dataAdmissao: { type: 'string', format: 'date', title: 'Data de Admissão' },
        situacao: {
          type: 'string',
          title: 'Situação',
          enum: ['ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO'],
          enumNames: ['Ativo', 'Inativo', 'Férias', 'Afastado'],
          default: 'ATIVO'
        },
        numeroFamiliasAtendidas: { type: 'integer', title: 'Número de Famílias Atendidas', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nomeACS', 'cpf', 'cns', 'telefone', 'unidadeSaude', 'dataAdmissao']
    }
  },
];

// ============================================================================
// SECRETARIA DE AGRICULTURA (6 serviços)
// ============================================================================
const AGRICULTURE_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Agricultura',
    description: 'Registro geral de atendimentos na área agrícola',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Sprout',
    color: '#10b981',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Assistência Técnica', 'Orientação', 'Vistoria', 'Inscrição em Programa', 'Solicitação de Documentos', 'Reclamação', 'Outro']
        },
        assunto: { type: 'string', title: 'Assunto', minLength: 5, maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição Detalhada do Atendimento', minLength: 10, maxLength: 2000 },
        dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
        horarioPreferencial: { type: 'string', title: 'Horário Preferencial', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        tecnicoResponsavel: { type: 'string', title: 'Técnico Responsável', minLength: 3, maxLength: 200 },
        propriedadeRural: { type: 'string', title: 'Nome da Propriedade Rural (se aplicável)', maxLength: 200 },
        atendimentoPresencial: { type: 'boolean', title: 'Atendimento Presencial?', default: true },
        localAtendimento: { type: 'string', title: 'Local do Atendimento (se presencial)', maxLength: 200 },
        urgente: { type: 'boolean', title: 'Atendimento Urgente?', default: false },
        resolvido: { type: 'boolean', title: 'Resolvido?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoAtendimento', 'assunto', 'descricao', 'dataAtendimento', 'tecnicoResponsavel'
      ]
    }
  },
  {
    name: 'Cadastro de Produtor Rural',
    description: 'Cadastro de produtores rurais e agricultores familiares no sistema',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço', 'Documento da Propriedade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Cadastro',
    icon: 'UserPlus',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      properties: {
        // BLOCO 1: IDENTIFICAÇÃO
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        // BLOCO 2: CONTATO
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },
        // BLOCO 3: ENDEREÇO
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },
        // BLOCO 4: COMPLEMENTARES
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', 'De 1 a 2 salários mínimos', 'De 2 a 3 salários mínimos', 'De 3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        // DADOS DO PRODUTOR
        tipoProdutor: { type: 'string', title: 'Tipo de Produtor', enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena'] },
        dap: { type: 'string', title: 'DAP (PRONAF)', maxLength: 50 },
        areaTotalHectares: { type: 'number', title: 'Área Total (ha)', minimum: 0 },
        tipoPropriedade: { type: 'string', title: 'Tipo de Propriedade', enum: ['Própria', 'Arrendada', 'Parceria/Meação', 'Comodato', 'Assentamento', 'Posse', 'Outra'] },
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade', maxLength: 200 },
        enderecoPropriedade: { type: 'string', title: 'Localização da Propriedade', maxLength: 500 },
        coordenadasGPS: { type: 'string', title: 'Coordenadas GPS', maxLength: 100 },
        principaisCulturas: { type: 'string', title: 'Principais Culturas', maxLength: 500 },
        principaisCriacoes: { type: 'string', title: 'Criações Animais', maxLength: 500 },
        possuiIrrigacao: { type: 'boolean', title: 'Possui irrigação?', default: false },
        tipoIrrigacao: { type: 'string', title: 'Tipo de irrigação', maxLength: 200 },
        usaAgrotoxicos: { type: 'boolean', title: 'Usa agrotóxicos?', default: false },
        possuiCertificacaoOrganica: { type: 'boolean', title: 'Certificação orgânica?', default: false },
        orgaoCertificador: { type: 'string', title: 'Órgão Certificador', maxLength: 200 },
        participaCooperativa: { type: 'boolean', title: 'Participa de cooperativa?', default: false },
        nomeCooperativa: { type: 'string', title: 'Nome da Cooperativa', maxLength: 200 },
        participaSindicato: { type: 'boolean', title: 'É sindicalizado?', default: false },
        nomeSindicato: { type: 'string', title: 'Nome do Sindicato', maxLength: 200 },
        comercializaPAA: { type: 'boolean', title: 'Comercializa para PAA?', default: false },
        comercializaPNAE: { type: 'boolean', title: 'Fornece para Merenda?', default: false },
        possuiMaquinario: { type: 'boolean', title: 'Possui maquinário?', default: false },
        tiposMaquinario: { type: 'string', title: 'Tipos de maquinário', maxLength: 500 },
        recebeATER: { type: 'boolean', title: 'Recebe ATER?', default: false },
        orgaoATER: { type: 'string', title: 'Órgão ATER', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoProdutor']
    }
  },
  {
    name: 'Assistência Técnica Rural',
    description: 'Solicitação de assistência técnica para produtores rurais (ATER)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ASSISTENCIA_TECNICA',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'Documento da Propriedade'],
    estimatedDays: 15,
    priority: 4,
    category: 'Assistência',
    icon: 'Headphones',
    color: '#059669',
    formSchema: {
      type: 'object',
      properties: {
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade', minLength: 3, maxLength: 200 },
        tipoAssistencia: {
          type: 'string',
          title: 'Tipo de Assistência',
          enum: ['Solo e Adubação', 'Controle de Pragas', 'Irrigação', 'Manejo de Culturas', 'Pecuária', 'Fruticultura', 'Horticultura', 'Mecanização', 'Gestão Rural', 'Outro'],
          enumNames: ['Solo e Adubação', 'Controle de Pragas', 'Irrigação', 'Manejo de Culturas', 'Pecuária', 'Fruticultura', 'Horticultura', 'Mecanização', 'Gestão Rural', 'Outro']
        },
        culturaAtividade: { type: 'string', title: 'Cultura/Atividade', minLength: 3, maxLength: 200 },
        problemaDescricao: { type: 'string', title: 'Descrição do Problema/Necessidade', minLength: 20, maxLength: 1000 },
        areaHectares: { type: 'number', title: 'Área (Hectares)', minimum: 0 },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial para Visita' },
        urgente: { type: 'boolean', title: 'Urgente', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nomePropriedade', 'tipoAssistencia', 'culturaAtividade', 'problemaDescricao']
    }
  },
  {
    name: 'Inscrição em Curso Rural',
    description: 'Inscrição em cursos e capacitações para produtores rurais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_CURSO_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'RG', 'CPF'],
    estimatedDays: 5,
    priority: 3,
    category: 'Capacitação',
    icon: 'GraduationCap',
    color: '#10b981',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO PARTICIPANTE ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: FORMAÇÃO ==========
        escolaridade: {
          type: 'string',
          title: 'Escolaridade',
          enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo']
        },
        cursoSuperior: { type: 'string', title: 'Curso Superior (se possuir)', maxLength: 200 },

        // ========== BLOCO 6: DADOS DO CURSO ==========
        nomeCurso: { type: 'string', title: 'Nome do Curso', minLength: 3, maxLength: 200 },
        temaCurso: {
          type: 'string',
          title: 'Tema do Curso',
          enum: ['Agricultura Orgânica', 'Apicultura', 'Avicultura', 'Bovinocultura', 'Fruticultura', 'Horticultura', 'Irrigação', 'Mecanização Agrícola', 'Gestão Rural', 'Associativismo', 'Agroecologia', 'Outro']
        },
        outroTema: { type: 'string', title: 'Especifique o Tema (se Outro)', maxLength: 200 },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500 },

        // ========== BLOCO 7: EXPERIÊNCIA RURAL ==========
        produtorRural: { type: 'boolean', title: 'É Produtor Rural?', default: false },
        temPropriedade: { type: 'boolean', title: 'Possui Propriedade Rural?', default: false },
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade (se possuir)', maxLength: 200 },
        experienciaTema: { type: 'boolean', title: 'Possui Experiência no Tema?', default: false },
        tempoExperiencia: { type: 'string', title: 'Tempo de Experiência (se possuir)', maxLength: 100 },

        // ========== BLOCO 8: OBSERVAÇÕES ==========
        necessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?', default: false },
        descricaoNecessidades: { type: 'string', title: 'Descrição das Necessidades Especiais', maxLength: 300 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'escolaridade', 'nomeCurso', 'temaCurso', 'motivoInscricao'
      ]
    }
  },
  {
    name: 'Inscrição em Programa Rural',
    description: 'Inscrição em programas agrícolas (PRONAF, PAA, PNAE, etc)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'DAP', 'Documentação da Propriedade'],
    estimatedDays: 20,
    priority: 5,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO PRODUTOR ==========
        nome: { type: 'string', title: 'Nome Completo do Produtor', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO PROGRAMA ==========
        tipoPrograma: {
          type: 'string',
          title: 'Tipo de Programa',
          enum: ['PRONAF', 'PAA', 'PNAE', 'Garantia-Safra', 'Seguro da Agricultura Familiar', 'Assistência Técnica', 'Programa de Sementes', 'Outro']
        },
        outroPrograma: { type: 'string', title: 'Especifique o Programa (se Outro)', maxLength: 200 },
        finalidadeInscricao: { type: 'string', title: 'Finalidade/Objetivo da Inscrição', minLength: 20, maxLength: 500 },

        // ========== BLOCO 6: DADOS DA PROPRIEDADE ==========
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade', minLength: 3, maxLength: 200 },
        localizacaoPropriedade: { type: 'string', title: 'Localização/Comunidade da Propriedade', maxLength: 200 },
        areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)', minimum: 0 },
        areaProdutivaHectares: { type: 'number', title: 'Área Produtiva (Hectares)', minimum: 0 },
        tipoPropriedade: { type: 'string', title: 'Tipo de Propriedade', enum: ['Própria', 'Arrendada', 'Posse', 'Comodato', 'Assentamento'] },

        // ========== BLOCO 7: PRODUÇÃO ==========
        principaisProducoes: { type: 'string', title: 'Principais Produções', minLength: 5, maxLength: 500 },
        producaoEstimada: { type: 'string', title: 'Produção Estimada (kg/ano ou unidades)', maxLength: 200 },
        destinoProducao: { type: 'string', title: 'Destino da Produção', enum: ['Consumo próprio', 'Venda local', 'Programas governamentais', 'Cooperativa', 'Misto'] },

        // ========== BLOCO 8: DOCUMENTAÇÃO RURAL ==========
        possuiDAP: { type: 'boolean', title: 'Possui DAP Ativa?', default: false },
        dap: { type: 'string', title: 'Número da DAP (se possuir)', minLength: 5, maxLength: 50 },
        possuiCAR: { type: 'boolean', title: 'Possui CAR (Cadastro Ambiental Rural)?', default: false },
        car: { type: 'string', title: 'Número do CAR (se possuir)', maxLength: 50 },

        // ========== BLOCO 9: FAMÍLIA ==========
        numeroFamiliares: { type: 'integer', title: 'Número de Familiares', minimum: 1 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        familiaresTrabalhadores: { type: 'integer', title: 'Quantos Familiares Trabalham na Propriedade?', minimum: 0 },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoPrograma', 'finalidadeInscricao', 'nomePropriedade',
        'areaTotalHectares', 'principaisProducoes', 'numeroFamiliares'
      ]
    }
  },
  {
    name: 'Cadastro de Propriedade Rural',
    description: 'Cadastro e regularização de propriedades rurais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato', 'CAR (Cadastro Ambiental Rural)', 'ITR'],
    estimatedDays: 30,
    priority: 4,
    category: 'Cadastro',
    icon: 'Map',
    color: '#059669',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO PROPRIETÁRIO ==========
        nome: { type: 'string', title: 'Nome Completo do Proprietário', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Proprietário', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Proprietário', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO DO PROPRIETÁRIO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO PROPRIETÁRIO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DA PROPRIEDADE ==========
        nomePropriedade: { type: 'string', title: 'Nome da Propriedade', minLength: 3, maxLength: 200 },
        localizacao: { type: 'string', title: 'Localização/Comunidade', minLength: 3, maxLength: 200 },
        coordenadasGPS: { type: 'string', title: 'Coordenadas GPS (latitude, longitude)', maxLength: 100 },
        inscricaoMunicipal: { type: 'string', title: 'Inscrição Municipal', maxLength: 50 },
        matricula: { type: 'string', title: 'Matrícula do Imóvel (Cartório)', maxLength: 50 },

        // ========== BLOCO 6: ÁREAS ==========
        areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)', minimum: 0 },
        areaProdutivaHectares: { type: 'number', title: 'Área Produtiva (Hectares)', minimum: 0 },
        areaReservaLegal: { type: 'number', title: 'Área de Reserva Legal (Hectares)', minimum: 0 },
        areaAPP: { type: 'number', title: 'Área de APP - Preservação Permanente (Hectares)', minimum: 0 },

        // ========== BLOCO 7: DOCUMENTAÇÃO AMBIENTAL E FISCAL ==========
        possuiCAR: { type: 'boolean', title: 'Possui CAR (Cadastro Ambiental Rural)?', default: false },
        car: { type: 'string', title: 'Número do CAR', maxLength: 50 },
        possuiITR: { type: 'boolean', title: 'Possui ITR (Imposto Territorial Rural)?', default: false },
        itr: { type: 'string', title: 'Número/Inscrição do ITR (INCRA)', maxLength: 50 },

        // ========== BLOCO 8: TIPO E EXPLORAÇÃO ==========
        tipoPropriedade: {
          type: 'string',
          title: 'Tipo de Propriedade',
          enum: ['Própria', 'Arrendada', 'Posse', 'Comodato', 'Assentamento']
        },
        tipoExploracao: {
          type: 'string',
          title: 'Tipo de Exploração',
          enum: ['Agricultura', 'Pecuária', 'Mista', 'Extrativismo', 'Aquicultura']
        },
        principaisAtividades: { type: 'string', title: 'Principais Atividades Desenvolvidas', minLength: 5, maxLength: 500 },
        producaoPrincipal: { type: 'string', title: 'Produção Principal', maxLength: 200 },

        // ========== BLOCO 9: INFRAESTRUTURA ==========
        possuiAguaEncanada: { type: 'boolean', title: 'Possui Água Encanada?', default: false },
        possuiEnergiaEletrica: { type: 'boolean', title: 'Possui Energia Elétrica?', default: false },
        possuiPocoArtesiano: { type: 'boolean', title: 'Possui Poço Artesiano?', default: false },
        possuiIrrigacao: { type: 'boolean', title: 'Possui Sistema de Irrigação?', default: false },
        tipoIrrigacao: { type: 'string', title: 'Tipo de Irrigação (se possuir)', maxLength: 100 },
        possuiBenfeitorias: { type: 'boolean', title: 'Possui Benfeitorias (galpões, estufas, etc)?', default: false },
        descricaoBenfeitorias: { type: 'string', title: 'Descrição das Benfeitorias', maxLength: 500 },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'nomePropriedade', 'localizacao', 'areaTotalHectares',
        'tipoPropriedade', 'tipoExploracao', 'principaisAtividades'
      ]
    }
  },
];

// ============================================================================
// SECRETARIA DE EDUCAÇÃO (11 serviços)
// ============================================================================
const EDUCATION_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Educação',
    description: 'Registro geral de atendimentos na área educacional',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_EDUCACAO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'GraduationCap',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Matrícula', 'Transferência', 'Documentação', 'Transporte Escolar', 'Reunião Pedagógica', 'Reclamação', 'Solicitação', 'Outro']
        },
        assunto: { type: 'string', title: 'Assunto do Atendimento', minLength: 5, maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição Detalhada', minLength: 10, maxLength: 2000 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
        horarioAtendimento: { type: 'string', title: 'Horário do Atendimento', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        servidorResponsavel: { type: 'string', title: 'Servidor Responsável', minLength: 3, maxLength: 200 },
        setor: { type: 'string', title: 'Setor', enum: ['Secretaria Escolar', 'Direção', 'Coordenação Pedagógica', 'Transporte', 'Merenda', 'Outro'] },
        prioridade: { type: 'string', title: 'Prioridade', enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'], default: 'NORMAL' },
        resolvido: { type: 'boolean', title: 'Atendimento Resolvido?', default: false },
        dataResolucao: { type: 'string', format: 'date', title: 'Data da Resolução (se resolvido)' },
        observacoes: { type: 'string', title: 'Observações e Encaminhamentos', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoAtendimento', 'assunto', 'descricao', 'unidadeEscolar', 'dataAtendimento', 'servidorResponsavel'
      ]
    }
  },
  {
    name: 'Matrícula de Aluno',
    description: 'Matrícula e rematrícula de alunos na rede municipal',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'MATRICULA_ALUNO',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Endereço', 'Cartão de Vacina'],
    estimatedDays: 7,
    priority: 5,
    category: 'Matrícula',
    icon: 'UserPlus',
    color: '#2563eb',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL (CIDADÃO) ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Responsável' },

        // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
        telefone: { type: 'string', title: 'Telefone Principal do Responsável', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Responsável', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
        rgAluno: { type: 'string', title: 'RG do Aluno (se possuir)', maxLength: 20 },
        certidaoNascimento: { type: 'string', title: 'Número da Certidão de Nascimento', maxLength: 50 },
        nomeMaeAluno: { type: 'string', title: 'Nome da Mãe do Aluno', minLength: 3, maxLength: 200 },
        nomePaiAluno: { type: 'string', title: 'Nome do Pai do Aluno', maxLength: 200 },
        sexoAluno: { type: 'string', title: 'Sexo do Aluno', enum: ['Masculino', 'Feminino'] },
        racaCorAluno: { type: 'string', title: 'Raça/Cor', enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada'] },

        // ========== BLOCO 6: VÍNCULO FAMILIAR ==========
        grauParentesco: { type: 'string', title: 'Grau de Parentesco com o Aluno', enum: ['Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã) maior', 'Tutor Legal', 'Outro'] },
        possuiGuardaJudicial: { type: 'boolean', title: 'Possui Guarda Judicial?', default: false },

        // ========== BLOCO 7: MATRÍCULA ==========
        unidadeEscolarDesejada: { type: 'string', title: 'Unidade Escolar Desejada', minLength: 3, maxLength: 200 },
        nivelEnsino: {
          type: 'string',
          title: 'Nível de Ensino',
          enum: ['Creche (0-3 anos)', 'Pré-escola (4-5 anos)', 'Fundamental I (1º ao 5º ano)', 'Fundamental II (6º ao 9º ano)', 'EJA (Educação de Jovens e Adultos)']
        },
        anoSerieDesejado: { type: 'string', title: 'Ano/Série Desejado', maxLength: 50 },
        turnoDesejado: {
          type: 'string',
          title: 'Turno Desejado',
          enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno']
        },
        tipoMatricula: { type: 'string', title: 'Tipo de Matrícula', enum: ['Matrícula Nova', 'Rematrícula', 'Transferência de outra escola'] },
        escolaOrigem: { type: 'string', title: 'Escola de Origem (se transferência)', maxLength: 200 },

        // ========== BLOCO 8: NECESSIDADES ESPECIAIS E SAÚDE ==========
        possuiNecessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?', default: false },
        tipoNecessidade: { type: 'string', title: 'Tipo de Necessidade', enum: ['Deficiência Física', 'Deficiência Visual', 'Deficiência Auditiva', 'Deficiência Intelectual', 'TEA (Autismo)', 'TDAH', 'Altas Habilidades', 'Outra'] },
        descricaoNecessidades: { type: 'string', title: 'Descrição Detalhada das Necessidades', maxLength: 500 },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante em Sala?', default: false },
        possuiLaudoMedico: { type: 'boolean', title: 'Possui Laudo Médico?', default: false },
        alergias: { type: 'string', title: 'Alergias (alimentares, medicamentos)', maxLength: 300 },
        medicamentosUso: { type: 'string', title: 'Medicamentos de Uso Contínuo', maxLength: 300 },

        // ========== BLOCO 9: PROGRAMAS SOCIAIS ==========
        bolsaFamilia: { type: 'boolean', title: 'Família participa do Bolsa Família?', default: false },
        nisBolsaFamilia: { type: 'string', title: 'NIS do Bolsa Família', maxLength: 20 },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'nomeAluno', 'dataNascimentoAluno', 'certidaoNascimento', 'nomeMaeAluno', 'sexoAluno',
        'grauParentesco', 'unidadeEscolarDesejada', 'nivelEnsino', 'turnoDesejado', 'tipoMatricula'
      ]
    }
  },
  {
    name: 'Transporte Escolar',
    description: 'Solicitação de vaga em transporte escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Comprovante de Endereço'],
    estimatedDays: 10,
    priority: 4,
    category: 'Transporte',
    icon: 'Bus',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Responsável' },

        // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Responsável', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
        numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },

        // ========== BLOCO 6: ENDEREÇO DE EMBARQUE ==========
        enderecoEmbarqueCompleto: { type: 'string', title: 'Endereço Completo de Embarque', minLength: 10, maxLength: 300 },
        pontoReferenciaEmbarque: { type: 'string', title: 'Ponto de Referência para Embarque', minLength: 5, maxLength: 200 },
        distanciaEscolaKm: { type: 'number', title: 'Distância até a Escola (km)', minimum: 0, maximum: 100 },
        zonaResidencia: { type: 'string', title: 'Zona de Residência', enum: ['Urbana', 'Rural'] },

        // ========== BLOCO 7: NECESSIDADES ESPECIAIS ==========
        possuiNecessidadesEspeciais: { type: 'boolean', title: 'Aluno Possui Necessidades Especiais?', default: false },
        tipoNecessidade: { type: 'string', title: 'Tipo de Necessidade', enum: ['Cadeirante', 'Deficiência Visual', 'Deficiência Auditiva', 'Mobilidade Reduzida', 'TEA (Autismo)', 'Outra'] },
        necessitaMonitor: { type: 'boolean', title: 'Necessita Monitor no Transporte?', default: false },
        motivoNecessidadeMonitor: { type: 'string', title: 'Motivo/Descrição da Necessidade de Monitor', maxLength: 500 },
        necessitaCadeiraRodas: { type: 'boolean', title: 'Necessita Transporte Adaptado (Cadeira de Rodas)?', default: false },

        // ========== BLOCO 8: HORÁRIOS ==========
        horarioEntradaEscola: { type: 'string', title: 'Horário de Entrada na Escola', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioSaidaEscola: { type: 'string', title: 'Horário de Saída da Escola', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        necessitaTransporteIda: { type: 'boolean', title: 'Necessita Transporte Ida?', default: true },
        necessitaTransporteVolta: { type: 'boolean', title: 'Necessita Transporte Volta?', default: true },

        // ========== BLOCO 9: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar', 'serie', 'turno',
        'enderecoEmbarqueCompleto', 'pontoReferenciaEmbarque', 'distanciaEscolaKm', 'horarioEntradaEscola'
      ]
    }
  },
  {
    name: 'Registro de Ocorrência Escolar',
    description: 'Registro de ocorrências disciplinares e comportamentais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Disciplina',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Responsável' },

        // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO RESPONSÁVEL ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Responsável', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
        numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        turma: { type: 'string', title: 'Turma', maxLength: 50 },
        turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },

        // ========== BLOCO 6: DADOS DA OCORRÊNCIA ==========
        tipoOcorrencia: {
          type: 'string',
          title: 'Tipo de Ocorrência',
          enum: ['Disciplinar', 'Comportamental', 'Falta', 'Violência', 'Bullying', 'Danos ao Patrimônio', 'Outro']
        },
        dataOcorrencia: { type: 'string', format: 'date', title: 'Data da Ocorrência' },
        horaOcorrencia: { type: 'string', title: 'Hora da Ocorrência', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        localOcorrencia: { type: 'string', title: 'Local da Ocorrência', minLength: 3, maxLength: 200 },
        descricaoOcorrencia: { type: 'string', title: 'Descrição Detalhada da Ocorrência', minLength: 20, maxLength: 2000 },
        gravidadeOcorrencia: {
          type: 'string',
          title: 'Gravidade da Ocorrência',
          enum: ['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']
        },

        // ========== BLOCO 7: PROFISSIONAL E MEDIDAS ==========
        professorRelator: { type: 'string', title: 'Professor/Servidor Relator', minLength: 3, maxLength: 200 },
        testemunhas: { type: 'string', title: 'Testemunhas (nomes)', maxLength: 500 },
        medidaTomada: { type: 'string', title: 'Medida Disciplinar Tomada', maxLength: 500 },
        responsavelNotificado: { type: 'boolean', title: 'Responsável Foi Notificado?', default: false },
        dataNotificacao: { type: 'string', format: 'date', title: 'Data da Notificação ao Responsável' },
        meioNotificacao: { type: 'string', title: 'Meio de Notificação', enum: ['Telefone', 'E-mail', 'Presencial', 'Carta', 'Outro'] },

        // ========== BLOCO 8: ENCAMINHAMENTOS ==========
        encaminhamentoPsicologico: { type: 'boolean', title: 'Encaminhado para Psicólogo Escolar?', default: false },
        encaminhamentoConselhoTutelar: { type: 'boolean', title: 'Encaminhado ao Conselho Tutelar?', default: false },
        acionamentoPolicia: { type: 'boolean', title: 'Houve Acionamento Policial?', default: false },
        boletimOcorrencia: { type: 'string', title: 'Número do Boletim de Ocorrência (se houver)', maxLength: 50 },

        // ========== BLOCO 9: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'nomeAluno', 'dataNascimentoAluno', 'numeroMatricula', 'unidadeEscolar', 'serie', 'turma', 'turno',
        'tipoOcorrencia', 'dataOcorrencia', 'horaOcorrencia', 'localOcorrencia', 'descricaoOcorrencia',
        'gravidadeOcorrencia', 'professorRelator'
      ]
    }
  },
  {
    name: 'Solicitação de Documento Escolar',
    description: 'Solicitação de histórico, declaração ou certificado',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'Comprovante de Matrícula'],
    estimatedDays: 5,
    priority: 3,
    category: 'Documentos',
    icon: 'FileText',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE (RESPONSÁVEL) ==========
        nome: { type: 'string', title: 'Nome Completo do Solicitante', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Solicitante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Solicitante', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Solicitante' },

        // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Solicitante' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Solicitante', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
        vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior de idade)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã) maior', 'Tutor Legal', 'Procurador', 'Outro'] },
        possuiProcuracao: { type: 'boolean', title: 'Possui Procuração? (se não for responsável direto)', default: false },

        // ========== BLOCO 6: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar onde estudou/estuda', minLength: 3, maxLength: 200 },

        // ========== BLOCO 7: DADOS DO DOCUMENTO SOLICITADO ==========
        tipoDocumento: {
          type: 'string',
          title: 'Tipo de Documento',
          enum: ['Histórico Escolar', 'Declaração de Matrícula', 'Declaração de Conclusão', 'Certificado de Conclusão', 'Boletim Escolar', 'Declaração de Frequência', 'Transferência', 'Outro']
        },
        outroTipoDocumento: { type: 'string', title: 'Especifique o Tipo de Documento (se Outro)', maxLength: 200 },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
        serieAnoReferencia: { type: 'string', title: 'Série/Ano de Referência', maxLength: 50 },
        periodoReferencia: { type: 'string', title: 'Período de Referência (se aplicável)', maxLength: 100 },

        // ========== BLOCO 8: FINALIDADE E ENTREGA ==========
        finalidade: { type: 'string', title: 'Finalidade do Documento', minLength: 10, maxLength: 300 },
        instituicaoDestino: { type: 'string', title: 'Instituição de Destino (se aplicável)', maxLength: 200 },
        urgente: { type: 'boolean', title: 'Solicitação Urgente?', default: false },
        motivoUrgencia: { type: 'string', title: 'Motivo da Urgência (se urgente)', maxLength: 300 },
        formaEntrega: { type: 'string', title: 'Forma de Entrega Desejada', enum: ['Retirada Presencial', 'Correios (sedex)', 'E-mail (se permitido)', 'Outra'] },
        enderecoEntrega: { type: 'string', title: 'Endereço para Entrega (se diferente do cadastro)', maxLength: 300 },

        // ========== BLOCO 9: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'vinculoComAluno', 'nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar',
        'tipoDocumento', 'anoLetivo', 'finalidade', 'formaEntrega'
      ]
    }
  },
  {
    name: 'Transferência Escolar',
    description: 'Solicitação de transferência entre unidades escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Histórico Escolar', 'Comprovante de Endereço'],
    estimatedDays: 15,
    priority: 4,
    category: 'Transferência',
    icon: 'ArrowRightLeft',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Responsável' },

        // ========== BLOCO 2: CONTATO DO RESPONSÁVEL ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ATUAL DO RESPONSÁVEL ==========
        cep: { type: 'string', title: 'CEP Atual', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida Atual', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número Atual', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro Atual', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO RESPONSÁVEL ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Responsável', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
        numeroMatricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        grauParentesco: { type: 'string', title: 'Grau de Parentesco', enum: ['Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã) maior', 'Tutor Legal', 'Outro'] },

        // ========== BLOCO 6: ESCOLA ATUAL ==========
        unidadeEscolarAtual: { type: 'string', title: 'Unidade Escolar Atual', minLength: 3, maxLength: 200 },
        serieAtual: { type: 'string', title: 'Série/Ano Atual', maxLength: 50 },
        turmaAtual: { type: 'string', title: 'Turma Atual', maxLength: 50 },
        turnoAtual: { type: 'string', title: 'Turno Atual', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
        anoLetivoAtual: { type: 'string', title: 'Ano Letivo Atual', pattern: '^\\d{4}$' },

        // ========== BLOCO 7: ESCOLA DE DESTINO ==========
        unidadeEscolarDestino: { type: 'string', title: 'Unidade Escolar de Destino', minLength: 3, maxLength: 200 },
        turnoDesejado: { type: 'string', title: 'Turno Desejado', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
        dataDesejadaTransferencia: { type: 'string', format: 'date', title: 'Data Desejada para Transferência' },

        // ========== BLOCO 8: MOTIVO DA TRANSFERÊNCIA ==========
        motivoTransferencia: {
          type: 'string',
          title: 'Motivo da Transferência',
          enum: ['Mudança de Endereço', 'Problemas de Adaptação', 'Proximidade da Residência', 'Problemas de Transporte', 'Mudança de Turno', 'Outro']
        },
        descricaoMotivo: { type: 'string', title: 'Descrição Detalhada do Motivo', minLength: 20, maxLength: 500 },

        // ========== BLOCO 9: NOVO ENDEREÇO (SE MUDANÇA) ==========
        mudouEndereco: { type: 'boolean', title: 'Houve Mudança de Endereço?', default: false },
        novoCep: { type: 'string', title: 'Novo CEP (se mudança)', pattern: '^\\d{8}$' },
        novoLogradouro: { type: 'string', title: 'Nova Rua/Avenida (se mudança)', maxLength: 200 },
        novoNumero: { type: 'string', title: 'Novo Número (se mudança)', maxLength: 10 },
        novoComplemento: { type: 'string', title: 'Novo Complemento (se mudança)', maxLength: 100 },
        novoBairro: { type: 'string', title: 'Novo Bairro (se mudança)', maxLength: 100 },
        novoPontoReferencia: { type: 'string', title: 'Novo Ponto de Referência (se mudança)', maxLength: 200 },

        // ========== BLOCO 10: NECESSIDADES ESPECIAIS ==========
        possuiNecessidadesEspeciais: { type: 'boolean', title: 'Aluno Possui Necessidades Especiais?', default: false },
        descricaoNecessidades: { type: 'string', title: 'Descrição das Necessidades Especiais', maxLength: 500 },

        // ========== BLOCO 11: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'nomeAluno', 'dataNascimentoAluno', 'numeroMatricula', 'grauParentesco',
        'unidadeEscolarAtual', 'serieAtual', 'turnoAtual', 'anoLetivoAtual',
        'unidadeEscolarDestino', 'turnoDesejado', 'dataDesejadaTransferencia',
        'motivoTransferencia', 'descricaoMotivo'
      ]
    }
  },
  {
    name: 'Consulta de Frequência',
    description: 'Consulta ao registro de frequência do aluno',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CONSULTA_FREQUENCIA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Consulta',
    icon: 'Calendar',
    color: '#10b981',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE ==========
        nome: { type: 'string', title: 'Nome Completo do Solicitante', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Solicitante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Solicitante', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Solicitante' },

        // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Solicitante' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Solicitante', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
        vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã)', 'Tutor Legal', 'Outro'] },

        // ========== BLOCO 6: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', minLength: 5, maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        turma: { type: 'string', title: 'Turma', maxLength: 50 },

        // ========== BLOCO 7: CONSULTA ==========
        periodoConsulta: {
          type: 'string',
          title: 'Período da Consulta',
          enum: ['BIMESTRE_1', 'BIMESTRE_2', 'BIMESTRE_3', 'BIMESTRE_4', 'ANO_COMPLETO']
        },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'vinculoComAluno', 'nomeAluno', 'matricula', 'unidadeEscolar', 'serie',
        'periodoConsulta', 'anoLetivo'
      ]
    }
  },
  {
    name: 'Consulta de Notas e Boletim',
    description: 'Consulta de notas e desempenho escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CONSULTA_NOTAS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Consulta',
    icon: 'ClipboardList',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO SOLICITANTE ==========
        nome: { type: 'string', title: 'Nome Completo do Solicitante', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Solicitante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Solicitante', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Solicitante' },

        // ========== BLOCO 2: CONTATO DO SOLICITANTE ==========
        email: { type: 'string', format: 'email', title: 'E-mail do Solicitante' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO DO SOLICITANTE ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES DO SOLICITANTE ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe do Solicitante', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: VÍNCULO COM O ALUNO ==========
        vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno (maior)', 'Pai', 'Mãe', 'Avô/Avó', 'Tio/Tia', 'Irmão(ã)', 'Tutor Legal', 'Outro'] },

        // ========== BLOCO 6: DADOS DO ALUNO ==========
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', minLength: 5, maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        turma: { type: 'string', title: 'Turma', maxLength: 50 },

        // ========== BLOCO 7: CONSULTA ==========
        periodoConsulta: {
          type: 'string',
          title: 'Período da Consulta',
          enum: ['BIMESTRE_1', 'BIMESTRE_2', 'BIMESTRE_3', 'BIMESTRE_4', 'ANO_COMPLETO']
        },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
        disciplinaEspecifica: { type: 'string', title: 'Disciplina Específica (opcional)', maxLength: 100 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'vinculoComAluno', 'nomeAluno', 'matricula', 'unidadeEscolar', 'serie',
        'periodoConsulta', 'anoLetivo'
      ]
    }
  },
  {
    name: 'Gestão Escolar',
    description: 'Administração de unidades escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Building',
    color: '#64748b',
  },
  {
    name: 'Gestão de Merenda Escolar',
    description: 'Planejamento de cardápios e controle de estoque',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_MERENDA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'UtensilsCrossed',
    color: '#64748b',
  },
  {
    name: 'Calendário Escolar',
    description: 'Consulta ao calendário letivo e eventos escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE ASSISTÊNCIA SOCIAL (10 serviços)
// ============================================================================
const SOCIAL_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Assistência Social',
    description: 'Registro geral de atendimentos na área social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Heart',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Cadastro/Orientação', 'Benefício Eventual', 'Programa Social', 'Encaminhamento', 'Acompanhamento Familiar', 'Visita Domiciliar', 'Grupo/Oficina', 'Atendimento Psicossocial', 'Emergência Social', 'Outro']
        },
        unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
        dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
        assistenteSocial: { type: 'string', title: 'Assistente Social Responsável', minLength: 3, maxLength: 200 },
        motivoAtendimento: { type: 'string', title: 'Motivo/Demanda do Atendimento', minLength: 10, maxLength: 1000 },
        descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento Realizado', minLength: 10, maxLength: 2000 },

        // ========== BLOCO 6: VULNERABILIDADE E ENCAMINHAMENTOS ==========
        situacaoVulnerabilidade: {
          type: 'string',
          title: 'Situação de Vulnerabilidade',
          enum: ['Pobreza extrema', 'Desemprego', 'Violência doméstica', 'Negligência/Abandono', 'Situação de rua', 'Dependência química', 'Idoso em risco', 'Criança/Adolescente em risco', 'Deficiência', 'Outra']
        },
        encaminhado: { type: 'boolean', title: 'Houve Encaminhamento?', default: false },
        encaminhamentoPara: { type: 'string', title: 'Encaminhamento Para', maxLength: 300 },
        prioridade: {
          type: 'string',
          title: 'Prioridade do Caso',
          enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'],
          default: 'NORMAL'
        },
        acompanhamentoContinuo: { type: 'boolean', title: 'Necessita Acompanhamento Contínuo?', default: false },

        // ========== BLOCO 7: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 1000 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoAtendimento', 'unidadeCRAS', 'dataAtendimento', 'assistenteSocial', 'motivoAtendimento', 'descricaoAtendimento'
      ]
    }
  },
  {
    name: 'Cadastro Único (CadÚnico)',
    description: 'Cadastro de famílias vulneráveis no CadÚnico',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço', 'Comprovante de Renda'],
    estimatedDays: 7,
    priority: 5,
    category: 'Cadastro',
    icon: 'UserCheck',
    color: '#db2777',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO DO RESPONSÁVEL FAMILIAR ==========
        nome: { type: 'string', title: 'Nome Completo do Responsável Familiar', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        orgaoEmissorRG: { type: 'string', title: 'Órgão Emissor do RG', maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        sexo: { type: 'string', title: 'Sexo', enum: ['Masculino', 'Feminino'] },
        racaCor: { type: 'string', title: 'Raça/Cor', enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'] },

        // ========== BLOCO 2: FILIAÇÃO ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        nomePai: { type: 'string', title: 'Nome do Pai (se houver)', maxLength: 200 },

        // ========== BLOCO 3: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail (se possuir)' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },
        possuiCelular: { type: 'boolean', title: 'Possui Celular?', default: false },

        // ========== BLOCO 4: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tipoImovel: { type: 'string', title: 'Tipo de Imóvel', enum: ['Casa', 'Apartamento', 'Cômodo', 'Barraco', 'Outros'] },
        situacaoImovel: { type: 'string', title: 'Situação do Imóvel', enum: ['Próprio (quitado)', 'Próprio (pagando)', 'Alugado', 'Cedido', 'Ocupado', 'Outro'] },
        valorAluguel: { type: 'number', title: 'Valor do Aluguel (se alugado)', minimum: 0 },

        // ========== BLOCO 5: COMPOSIÇÃO FAMILIAR ==========
        quantidadePessoasDomicilio: { type: 'integer', title: 'Quantidade de Pessoas no Domicílio', minimum: 1, maximum: 30 },
        quantidadeFamilias: { type: 'integer', title: 'Quantidade de Famílias no Domicílio', minimum: 1, maximum: 10 },

        // ========== BLOCO 6: SITUAÇÃO SOCIOECONÔMICA ==========
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Separado(a)'] },
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Analfabeto', 'Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        situacaoTrabalho: { type: 'string', title: 'Situação de Trabalho', enum: ['Empregado CLT', 'Autônomo', 'Desempregado', 'Aposentado/Pensionista', 'Trabalho Informal', 'Não trabalha', 'Outro'] },
        rendaMensal: { type: 'number', title: 'Renda Mensal Individual (R$)', minimum: 0 },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },

        // ========== BLOCO 7: PROGRAMAS SOCIAIS ==========
        possuiBolsaFamilia: { type: 'boolean', title: 'Já recebe Bolsa Família?', default: false },
        nisBolsaFamilia: { type: 'string', title: 'NIS do Bolsa Família', maxLength: 20 },
        possuiBPC: { type: 'boolean', title: 'Recebe BPC (Benefício de Prestação Continuada)?', default: false },
        outroBeneficio: { type: 'string', title: 'Outro Benefício que Recebe', maxLength: 200 },

        // ========== BLOCO 8: CONDIÇÕES DE MORADIA ==========
        possuiAguaEncanada: { type: 'boolean', title: 'Possui Água Encanada?', default: false },
        possuiEnergiaEletrica: { type: 'boolean', title: 'Possui Energia Elétrica?', default: false },
        possuiEsgoto: { type: 'boolean', title: 'Possui Esgotamento Sanitário?', default: false },
        coletaLixo: { type: 'boolean', title: 'Possui Coleta de Lixo?', default: false },
        materialParedes: { type: 'string', title: 'Material Predominante nas Paredes', enum: ['Alvenaria', 'Madeira', 'Taipa', 'Material Aproveitado', 'Outro'] },
        materialTelhado: { type: 'string', title: 'Material Predominante no Telhado', enum: ['Telha', 'Laje', 'Zinco', 'Material Aproveitado', 'Outro'] },
        numeroComodos: { type: 'integer', title: 'Número de Cômodos', minimum: 1, maximum: 30 },

        // ========== BLOCO 9: SAÚDE ==========
        possuiDeficiencia: { type: 'boolean', title: 'Possui Deficiência?', default: false },
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência', enum: ['Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla', 'Outra'] },
        possuiDoencaCronica: { type: 'boolean', title: 'Possui Doença Crônica?', default: false },
        descricaoDoenca: { type: 'string', title: 'Descrição da Doença', maxLength: 300 },

        // ========== BLOCO 10: SITUAÇÃO DE VULNERABILIDADE ==========
        situacaoVulnerabilidade: { type: 'string', title: 'Principal Situação de Vulnerabilidade', enum: ['Extrema Pobreza', 'Desemprego', 'Violência Doméstica', 'Dependência Química', 'Situação de Rua', 'Idoso Vulnerável', 'Criança/Adolescente em Risco', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição Detalhada da Situação', minLength: 20, maxLength: 1000 },
        necessidadeUrgente: { type: 'boolean', title: 'Caso de Necessidade Urgente?', default: false },

        // ========== BLOCO 11: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'rg', 'dataNascimento', 'sexo', 'racaCor',
        'nomeMae', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro',
        'tipoImovel', 'situacaoImovel', 'quantidadePessoasDomicilio', 'quantidadeFamilias',
        'estadoCivil', 'escolaridade', 'situacaoTrabalho', 'rendaFamiliarTotal',
        'situacaoVulnerabilidade', 'descricaoSituacao'
      ]
    }
  },
  {
    name: 'Solicitação de Benefício Social',
    description: 'Solicitação de benefícios sociais (BPC, Bolsa Família, etc)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_BENEFICIO',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
    estimatedDays: 15,
    priority: 5,
    category: 'Benefícios',
    icon: 'DollarSign',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Sem renda', 'Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', 'Acima de 3 salários mínimos'] },

        // ========== BLOCO 5: CADASTRO ÚNICO ==========
        possuiCadUnico: { type: 'boolean', title: 'Possui Cadastro Único (CadÚnico)?', default: false },
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },

        // ========== BLOCO 6: TIPO DE BENEFÍCIO ==========
        tipoBeneficio: { type: 'string', title: 'Tipo de Benefício Solicitado', enum: ['BPC (Idoso)', 'BPC (Pessoa com Deficiência)', 'Bolsa Família', 'Auxílio Emergencial', 'Cesta Básica', 'Tarifa Social de Energia', 'Outro'] },
        outroBeneficio: { type: 'string', title: 'Outro Benefício (especificar)', maxLength: 200 },

        // ========== BLOCO 7: JUSTIFICATIVA ==========
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', minLength: 20, maxLength: 1000 },
        situacaoVulnerabilidade: { type: 'string', title: 'Situação de Vulnerabilidade', enum: ['Extrema Pobreza', 'Desemprego', 'Doença/Deficiência', 'Idoso sem Renda', 'Situação de Rua', 'Violência Doméstica', 'Outro'] },
        urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },

        // ========== BLOCO 8: COMPOSIÇÃO FAMILIAR ==========
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        quantidadeCriancas: { type: 'integer', title: 'Quantidade de Crianças (0-12 anos)', minimum: 0, maximum: 20 },
        quantidadeAdolescentes: { type: 'integer', title: 'Quantidade de Adolescentes (13-17 anos)', minimum: 0, maximum: 20 },
        quantidadeIdosos: { type: 'integer', title: 'Quantidade de Idosos (60+ anos)', minimum: 0, maximum: 10 },
        quantidadePCD: { type: 'integer', title: 'Quantidade de Pessoas com Deficiência', minimum: 0, maximum: 10 },

        // ========== BLOCO 9: RENDA ==========
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        possuiRendaFixa: { type: 'boolean', title: 'Possui Renda Fixa?', default: false },
        fonteRenda: { type: 'string', title: 'Principal Fonte de Renda', maxLength: 200 },

        // ========== BLOCO 10: OBSERVAÇÕES ==========
        observacoes: { type: 'string', title: 'Observações Gerais', maxLength: 500 }
      },
      required: [
        'nome', 'cpf', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae',
        'tipoBeneficio', 'motivoSolicitacao', 'situacaoVulnerabilidade',
        'quantidadePessoasFamilia', 'rendaFamiliarMensal'
      ]
    }
  },
  {
    name: 'Entrega Emergencial (Cesta Básica)',
    description: 'Solicitação de auxílio emergencial e cestas básicas',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ENTREGA_EMERGENCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Endereço', 'Declaração de Vulnerabilidade'],
    estimatedDays: 3,
    priority: 5,
    category: 'Emergencial',
    icon: 'Package',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Sem renda', 'Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', 'Acima de 3 salários mínimos'] },
        tipoAjuda: { type: 'string', title: 'Tipo de Ajuda Necessária', enum: ['Cesta Básica', 'Auxílio Alimentação', 'Kit Higiene', 'Auxílio Emergencial (dinheiro)', 'Medicamentos', 'Outro'] },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantas pessoas moram na casa?', minimum: 1, maximum: 30 },
        quantidadeCriancas: { type: 'integer', title: 'Quantas crianças (0-12 anos)?', minimum: 0, maximum: 20 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação Emergencial', minLength: 20, maxLength: 1000 },
        situacaoEmergencial: { type: 'string', title: 'Situação Emergencial', enum: ['Desemprego recente', 'Doença na família', 'Perda de moradia', 'Calamidade (incêndio, enchente)', 'Fome/Extrema necessidade', 'Outro'] },
        possuiCadUnico: { type: 'boolean', title: 'Possui CadÚnico?', default: false },
        nisCadUnico: { type: 'string', title: 'NIS (se possuir)', maxLength: 20 },
        urgente: { type: 'boolean', title: 'Caso URGENTE (risco de fome)?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoAjuda', 'quantidadePessoasFamilia', 'motivoSolicitacao', 'situacaoEmergencial']
    }
  },
  {
    name: 'Inscrição em Grupo ou Oficina Social',
    description: 'Inscrição em grupos e oficinas do CRAS/CREAS',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 3,
    category: 'Programas',
    icon: 'Users',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Logradouro', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        tipoAtividade: { type: 'string', title: 'Tipo de Atividade', enum: ['Oficina de Artesanato', 'Oficina de Informática', 'Grupo de Idosos', 'Grupo de Mulheres', 'Grupo de Jovens', 'Reforço Escolar', 'Oficina Cultural', 'Esporte e Lazer', 'Outro'] },
        nomeGrupoOficina: { type: 'string', title: 'Nome do Grupo/Oficina', minLength: 3, maxLength: 200 },
        unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
        turnoPreferido: { type: 'string', title: 'Turno Preferido', enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer'] },
        motivoInteresse: { type: 'string', title: 'Motivo do Interesse', minLength: 10, maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'bairro', 'nomeMae', 'tipoAtividade', 'nomeGrupoOficina', 'unidadeCRAS', 'motivoInteresse']
    }
  },
  {
    name: 'Visitas Domiciliares',
    description: 'Agendamento de visitas técnicas domiciliares',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'VISITAS_DOMICILIARES',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Endereço'],
    estimatedDays: 7,
    priority: 4,
    category: 'Atendimento',
    icon: 'Home',
    color: '#f97316',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        motivoVisita: { type: 'string', title: 'Motivo da Visita', minLength: 20, maxLength: 1000 },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoVisita']
    }
  },
  {
    name: 'Inscrição em Programa Social',
    description: 'Inscrição em programas sociais municipais',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais'],
    estimatedDays: 10,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Logradouro', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },
        nomePrograma: { type: 'string', title: 'Nome do Programa', minLength: 3, maxLength: 200 },
        tipoPrograma: { type: 'string', title: 'Tipo de Programa', enum: ['Programa de Transferência de Renda', 'Programa para Idosos', 'Programa para Crianças', 'Programa para Mulheres', 'Programa de Capacitação', 'Outro'] },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal', minimum: 0 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Pessoas na Família', minimum: 1, maximum: 30 },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'cep', 'bairro', 'nomeMae', 'nomePrograma', 'tipoPrograma', 'motivoInscricao']
    }
  },
  {
    name: 'Agendamento de Atendimento Social',
    description: 'Agendamento de atendimento com assistente social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 3,
    category: 'Agendamento',
    icon: 'Calendar',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', minLength: 10, maxLength: 500 },
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Primeira vez', 'Retorno', 'Orientação', 'Acompanhamento', 'Outro'] },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        urgente: { type: 'boolean', title: 'Caso Urgente?', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'telefone', 'bairro', 'nomeMae', 'unidadeCRAS', 'motivoAtendimento', 'tipoAtendimento']
    }
  },
  {
    name: 'Gestão CRAS/CREAS',
    description: 'Administração de equipamentos sociais (CRAS e CREAS)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_CRAS_CREAS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Building2',
    color: '#64748b',
  },
];

// ============================================================================
// SECRETARIA DE CULTURA (9 serviços)
// ============================================================================
const CULTURE_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Cultura',
    description: 'Registro geral de atendimentos na área cultural',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_CULTURA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Palette',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      properties: {
        // ========== BLOCO 1: IDENTIFICAÇÃO ==========
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

        // ========== BLOCO 2: CONTATO ==========
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

        // ========== BLOCO 3: ENDEREÇO ==========
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

        // ========== BLOCO 4: COMPLEMENTARES ==========
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // ========== BLOCO 5: DADOS DO ATENDIMENTO ==========
        tipoAtendimento: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['Inscrição em Oficina', 'Reserva de Espaço', 'Informações sobre Evento', 'Projeto Cultural', 'Cadastro de Grupo', 'Reclamação', 'Outro']
        },
        assunto: { type: 'string', title: 'Assunto', minLength: 5, maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição do Atendimento', minLength: 10, maxLength: 2000 },
        dataAtendimento: { type: 'string', format: 'date', title: 'Data do Atendimento' },
        servidorResponsavel: { type: 'string', title: 'Servidor Responsável', minLength: 3, maxLength: 200 },
        areaCultural: { type: 'string', title: 'Área Cultural', enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Artesanato', 'Cultura Popular', 'Audiovisual', 'Outra'] },
        resolvido: { type: 'boolean', title: 'Resolvido', default: false },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoAtendimento', 'assunto', 'descricao', 'dataAtendimento', 'servidorResponsavel']
    }
  },
  {
    name: 'Reserva de Espaço Cultural',
    description: 'Agendamento de teatros, centros culturais e auditórios',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Projeto do Evento'],
    estimatedDays: 10,
    priority: 3,
    category: 'Reserva',
    icon: 'Building',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        espacoDesejado: { type: 'string', title: 'Espaço Desejado', minLength: 3, maxLength: 200 },
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Teatro', 'Show Musical', 'Dança', 'Exposição', 'Palestra', 'Workshop', 'Reunião', 'Outro'] },
        nomeEvento: { type: 'string', title: 'Nome do Evento', minLength: 3, maxLength: 200 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', minLength: 20, maxLength: 1000 },
        dataDesejada: { type: 'string', format: 'date', title: 'Data Desejada' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioTermino: { type: 'string', title: 'Horário de Término', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        cobrancaIngresso: { type: 'boolean', title: 'Haverá Cobrança de Ingresso?', default: false },
        valorIngresso: { type: 'number', title: 'Valor do Ingresso (se houver)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'espacoDesejado', 'tipoEvento', 'nomeEvento', 'descricaoEvento', 'dataDesejada', 'horarioInicio', 'publicoEstimado']
    }
  },
  {
    name: 'Inscrição em Oficina Cultural',
    description: 'Inscrição em oficinas de arte, música, teatro, dança',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_OFICINA_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 3,
    category: 'Oficinas',
    icon: 'Music',
    color: '#d946ef',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeOficina: { type: 'string', title: 'Nome da Oficina', minLength: 3, maxLength: 200 },
        tipoOficina: { type: 'string', title: 'Tipo de Oficina', enum: ['Música', 'Teatro', 'Dança', 'Artes Visuais', 'Artesanato', 'Literatura', 'Fotografia', 'Audiovisual', 'Outra'] },
        nivelExperiencia: { type: 'string', title: 'Nível de Experiência', enum: ['Nenhum', 'Iniciante', 'Intermediário', 'Avançado'] },
        turnoPreferido: { type: 'string', title: 'Turno Preferido', enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer'] },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeOficina', 'tipoOficina', 'motivoInscricao']
    }
  },
  {
    name: 'Cadastro de Grupo Artístico',
    description: 'Cadastro de grupos culturais e artísticos',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Documentos dos Integrantes', 'Portfólio', 'Estatuto (se houver)'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Representante', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Representante', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Representante', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeGrupo: { type: 'string', title: 'Nome do Grupo Artístico', minLength: 3, maxLength: 200 },
        tipoManifestacao: { type: 'string', title: 'Tipo de Manifestação', enum: ['Teatro', 'Música', 'Dança', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Outra'] },
        anoFundacao: { type: 'integer', title: 'Ano de Fundação', minimum: 1900, maximum: 2100 },
        numeroIntegrantes: { type: 'integer', title: 'Número de Integrantes', minimum: 1 },
        descricaoGrupo: { type: 'string', title: 'Descrição do Grupo', minLength: 50, maxLength: 1000 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeGrupo', 'tipoManifestacao', 'numeroIntegrantes', 'descricaoGrupo']
    }
  },
  {
    name: 'Projeto Cultural',
    description: 'Submissão de projetos culturais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'PROJETO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Detalhado', 'Orçamento', 'Currículo do Proponente'],
    estimatedDays: 30,
    priority: 4,
    category: 'Projetos',
    icon: 'FileText',
    color: '#9333ea',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Proponente', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeProjeto: { type: 'string', title: 'Nome do Projeto', minLength: 3, maxLength: 200 },
        areaCultural: { type: 'string', title: 'Área Cultural', enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Audiovisual', 'Cultura Popular', 'Patrimônio', 'Outra'] },
        resumoProjeto: { type: 'string', title: 'Resumo do Projeto', minLength: 50, maxLength: 1000 },
        objetivos: { type: 'string', title: 'Objetivos', minLength: 50, maxLength: 1000 },
        publicoAlvo: { type: 'string', title: 'Público-Alvo', maxLength: 500 },
        valorTotal: { type: 'number', title: 'Valor Total (R$)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeProjeto', 'areaCultural', 'resumoProjeto', 'objetivos', 'publicoAlvo']
    }
  },
  {
    name: 'Submissão de Projeto Cultural (Lei de Incentivo)',
    description: 'Submissão de projetos para Lei de Incentivo à Cultura',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'SUBMISSAO_PROJETO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Detalhado', 'Orçamento', 'Documentação Legal', 'Plano de Divulgação'],
    estimatedDays: 45,
    priority: 5,
    category: 'Incentivo',
    icon: 'DollarSign',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Proponente', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeProjeto: { type: 'string', title: 'Nome do Projeto', minLength: 3, maxLength: 200 },
        areaCultural: { type: 'string', title: 'Área Cultural', enum: ['Artes Visuais', 'Música', 'Teatro', 'Dança', 'Literatura', 'Audiovisual', 'Cultura Popular', 'Patrimônio', 'Outra'] },
        resumoProjeto: { type: 'string', title: 'Resumo do Projeto', minLength: 50, maxLength: 1000 },
        objetivos: { type: 'string', title: 'Objetivos', minLength: 50, maxLength: 1000 },
        justificativa: { type: 'string', title: 'Justificativa', minLength: 50, maxLength: 1000 },
        publicoAlvo: { type: 'string', title: 'Público-Alvo', maxLength: 500 },
        valorTotal: { type: 'number', title: 'Valor Total Solicitado (R$)', minimum: 0 },
        contrapartida: { type: 'string', title: 'Contrapartida Social', maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeProjeto', 'areaCultural', 'resumoProjeto', 'objetivos', 'justificativa', 'valorTotal']
    }
  },
  {
    name: 'Cadastro de Evento Cultural',
    description: 'Registro de eventos culturais no município',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações Necessárias'],
    estimatedDays: 15,
    priority: 3,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#c026d3',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Organizador', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeEvento: { type: 'string', title: 'Nome do Evento', minLength: 3, maxLength: 200 },
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Show', 'Teatro', 'Exposição', 'Festival', 'Oficina', 'Palestra', 'Outro'] },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        localEvento: { type: 'string', title: 'Local do Evento', minLength: 3, maxLength: 200 },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', minLength: 50, maxLength: 1000 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'descricaoEvento']
    }
  },
  {
    name: 'Registro de Manifestação Cultural',
    description: 'Registro de patrimônio cultural imaterial',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Documentação Histórica', 'Fotos', 'Depoimentos'],
    estimatedDays: 60,
    priority: 4,
    category: 'Patrimônio',
    icon: 'Landmark',
    color: '#86198f',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Solicitante', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeManifestacao: { type: 'string', title: 'Nome da Manifestação Cultural', minLength: 3, maxLength: 200 },
        tipoManifestacao: { type: 'string', title: 'Tipo de Manifestação', enum: ['Festa Popular', 'Dança Tradicional', 'Música Folclórica', 'Artesanato', 'Culinária', 'Celebração Religiosa', 'Outra'] },
        descricaoHistorica: { type: 'string', title: 'Descrição Histórica', minLength: 100, maxLength: 2000 },
        origemManifestacao: { type: 'string', title: 'Origem da Manifestação', maxLength: 500 },
        periodicidade: { type: 'string', title: 'Periodicidade', enum: ['Anual', 'Semestral', 'Mensal', 'Esporádica', 'Contínua'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeManifestacao', 'tipoManifestacao', 'descricaoHistorica', 'periodicidade']
    }
  },
  {
    name: 'Agenda de Eventos Culturais',
    description: 'Consulta ao calendário de eventos culturais da cidade',
    departmentCode: 'CULTURA',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE ESPORTES (9 serviços)
// ============================================================================
const SPORTS_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Esportes',
    description: 'Registro geral de atendimentos na área esportiva',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_ESPORTES',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Trophy',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', enum: ['Informações Gerais', 'Inscrição em Escolinha', 'Reserva de Espaço', 'Inscrição em Competição', 'Cadastro de Atleta', 'Cadastro de Equipe', 'Reclamação', 'Sugestão', 'Outro'] },
        descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento', minLength: 10, maxLength: 1000 },
        modalidadeInteresse: { type: 'string', title: 'Modalidade de Interesse', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Atletismo', 'Judô', 'Karatê', 'Capoeira', 'Tênis', 'Tênis de Mesa', 'Ginástica', 'Outro'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoAtendimento', 'descricaoAtendimento']
    }
  },
  {
    name: 'Inscrição em Escolinha Esportiva',
    description: 'Inscrição em escolinhas de futebol, vôlei, basquete, etc',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_ESCOLINHA',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'Atestado Médico', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 4,
    category: 'Escolinhas',
    icon: 'Users',
    color: '#ea580c',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento do Responsável' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe do Responsável', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        cpfAluno: { type: 'string', title: 'CPF do Aluno', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
        idadeAluno: { type: 'integer', title: 'Idade do Aluno', minimum: 4, maximum: 17 },
        sexoAluno: { type: 'string', title: 'Sexo do Aluno', enum: ['Masculino', 'Feminino'] },
        modalidadeEscolinha: { type: 'string', title: 'Modalidade da Escolinha', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Atletismo', 'Judô', 'Karatê', 'Capoeira', 'Tênis', 'Ginástica'] },
        unidadeEscolinha: { type: 'string', title: 'Unidade/Local da Escolinha', maxLength: 200 },
        turnoPreferencia: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais', maxLength: 500 },
        experienciaAnterior: { type: 'string', title: 'Experiência Anterior', enum: ['Sim', 'Não'] },
        objetivoInscricao: { type: 'string', title: 'Objetivo da Inscrição', enum: ['Recreação', 'Competição', 'Saúde/Condicionamento', 'Socialização'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeAluno', 'cpfAluno', 'dataNascimentoAluno', 'idadeAluno', 'sexoAluno', 'modalidadeEscolinha', 'turnoPreferencia']
    }
  },
  {
    name: 'Cadastro de Atleta',
    description: 'Cadastro de atletas federados no município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ATLETA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Atestado Médico', 'Comprovante de Federação'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'User',
    color: '#f97316',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        modalidade: { type: 'string', title: 'Modalidade Principal', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Atletismo', 'Judô', 'Karatê', 'Capoeira', 'Tênis', 'Tênis de Mesa', 'Ginástica', 'Outro'] },
        posicao: { type: 'string', title: 'Posição/Categoria', maxLength: 100 },
        altura: { type: 'number', title: 'Altura (cm)', minimum: 100, maximum: 250 },
        peso: { type: 'number', title: 'Peso (kg)', minimum: 30, maximum: 200 },
        categoriaIdade: { type: 'string', title: 'Categoria de Idade', enum: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto', 'Master'] },
        numeroFederacao: { type: 'string', title: 'Número da Federação', maxLength: 50 },
        federacaoVinculada: { type: 'string', title: 'Federação Vinculada', maxLength: 200 },
        equipeAtual: { type: 'string', title: 'Equipe Atual', maxLength: 200 },
        tempoExperiencia: { type: 'string', title: 'Tempo de Experiência', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
        objetivoAtleta: { type: 'string', title: 'Objetivo como Atleta', enum: ['Competição Municipal', 'Competição Estadual', 'Competição Nacional', 'Profissionalização', 'Recreação'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'modalidade', 'categoriaIdade', 'numeroFederacao', 'federacaoVinculada']
    }
  },
  {
    name: 'Reserva de Espaço Esportivo',
    description: 'Agendamento de quadras, ginásios e campos',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Termo de Responsabilidade'],
    estimatedDays: 3,
    priority: 3,
    category: 'Reserva',
    icon: 'Building',
    color: '#fb923c',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        tipoEspaco: { type: 'string', title: 'Tipo de Espaço', enum: ['Quadra Poliesportiva', 'Campo de Futebol', 'Ginásio', 'Piscina', 'Quadra de Tênis', 'Pista de Atletismo', 'Outro'] },
        nomeEspaco: { type: 'string', title: 'Nome do Espaço', maxLength: 200 },
        dataReserva: { type: 'string', format: 'date', title: 'Data da Reserva' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        horarioFim: { type: 'string', title: 'Horário de Término', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        finalidadeUso: { type: 'string', title: 'Finalidade do Uso', enum: ['Treino Esportivo', 'Competição', 'Evento', 'Recreação', 'Aula', 'Outro'] },
        modalidadePraticada: { type: 'string', title: 'Modalidade a ser Praticada', maxLength: 100 },
        numeroParticipantes: { type: 'integer', title: 'Número de Participantes', minimum: 1 },
        nomeGrupoEquipe: { type: 'string', title: 'Nome do Grupo/Equipe', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoEspaco', 'nomeEspaco', 'dataReserva', 'horarioInicio', 'horarioFim', 'finalidadeUso', 'numeroParticipantes']
    }
  },
  {
    name: 'Inscrição em Competição',
    description: 'Inscrição em campeonatos e competições municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_COMPETICAO',
    requiresDocuments: true,
    requiredDocuments: ['Fichas dos Atletas', 'Atestados Médicos', 'Comprovante de Pagamento'],
    estimatedDays: 10,
    priority: 4,
    category: 'Competições',
    icon: 'Medal',
    color: '#facc15',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeCompeticao: { type: 'string', title: 'Nome da Competição', maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Atletismo', 'Judô', 'Karatê', 'Tênis', 'Tênis de Mesa', 'Outro'] },
        categoria: { type: 'string', title: 'Categoria', enum: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto', 'Master', 'Livre'] },
        tipoInscricao: { type: 'string', title: 'Tipo de Inscrição', enum: ['Individual', 'Equipe'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe (se aplicável)', maxLength: 200 },
        numeroAtletas: { type: 'integer', title: 'Número de Atletas', minimum: 1 },
        nomeTecnico: { type: 'string', title: 'Nome do Técnico', maxLength: 200 },
        cpfTecnico: { type: 'string', title: 'CPF do Técnico', pattern: '^\\d{11}$' },
        telefoneTecnico: { type: 'string', title: 'Telefone do Técnico', pattern: '^\\d{10,11}$' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeCompeticao', 'modalidade', 'categoria', 'tipoInscricao', 'numeroAtletas']
    }
  },
  {
    name: 'Cadastro de Equipe Esportiva',
    description: 'Cadastro de equipes municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EQUIPE_ESPORTIVA',
    requiresDocuments: true,
    requiredDocuments: ['Fichas dos Atletas', 'Documentação do Técnico', 'Regimento'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#eab308',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe', minLength: 3, maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Atletismo', 'Outro'] },
        categoria: { type: 'string', title: 'Categoria', enum: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto', 'Master', 'Livre'] },
        anoFundacao: { type: 'integer', title: 'Ano de Fundação', minimum: 1900, maximum: 2100 },
        numeroAtletas: { type: 'integer', title: 'Número de Atletas', minimum: 5 },
        nomeTecnico: { type: 'string', title: 'Nome do Técnico Principal', minLength: 3, maxLength: 200 },
        cpfTecnico: { type: 'string', title: 'CPF do Técnico', pattern: '^\\d{11}$' },
        telefoneTecnico: { type: 'string', title: 'Telefone do Técnico', pattern: '^\\d{10,11}$' },
        crefTecnico: { type: 'string', title: 'CREF do Técnico', maxLength: 20 },
        localTreino: { type: 'string', title: 'Local de Treino', maxLength: 200 },
        diasTreino: { type: 'string', title: 'Dias de Treino', maxLength: 200 },
        horarioTreino: { type: 'string', title: 'Horário de Treino', maxLength: 100 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeEquipe', 'modalidade', 'categoria', 'numeroAtletas', 'nomeTecnico', 'cpfTecnico', 'telefoneTecnico']
    }
  },
  {
    name: 'Inscrição em Torneio',
    description: 'Inscrição de equipes em torneios esportivos',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_TORNEIO',
    requiresDocuments: true,
    requiredDocuments: ['Súmula da Equipe', 'Comprovante de Pagamento'],
    estimatedDays: 5,
    priority: 3,
    category: 'Torneios',
    icon: 'Trophy',
    color: '#ca8a04',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeTorneio: { type: 'string', title: 'Nome do Torneio', maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', enum: ['Futebol', 'Futsal', 'Vôlei', 'Basquete', 'Handebol', 'Outro'] },
        categoria: { type: 'string', title: 'Categoria', enum: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto', 'Master', 'Livre'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe', minLength: 3, maxLength: 200 },
        numeroAtletas: { type: 'integer', title: 'Número de Atletas Inscritos', minimum: 5 },
        nomeTecnico: { type: 'string', title: 'Nome do Técnico', minLength: 3, maxLength: 200 },
        telefoneTecnico: { type: 'string', title: 'Telefone do Técnico', pattern: '^\\d{10,11}$' },
        uniformePrincipal: { type: 'string', title: 'Cor do Uniforme Principal', maxLength: 100 },
        uniformeReserva: { type: 'string', title: 'Cor do Uniforme Reserva', maxLength: 100 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeTorneio', 'modalidade', 'categoria', 'nomeEquipe', 'numeroAtletas', 'nomeTecnico', 'telefoneTecnico']
    }
  },
  {
    name: 'Cadastro de Modalidade Esportiva',
    description: 'Cadastro de novas modalidades esportivas no município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_MODALIDADE',
    requiresDocuments: true,
    requiredDocuments: ['Regras da Modalidade', 'Documentação do Instrutor'],
    estimatedDays: 15,
    priority: 2,
    category: 'Cadastro',
    icon: 'Plus',
    color: '#a16207',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Proponente', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Proponente', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Proponente', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        nomeModalidade: { type: 'string', title: 'Nome da Modalidade', minLength: 3, maxLength: 200 },
        tipoModalidade: { type: 'string', title: 'Tipo de Modalidade', enum: ['Coletiva', 'Individual', 'Combate', 'Aquática', 'Radical', 'Adaptada', 'Outro'] },
        descricaoModalidade: { type: 'string', title: 'Descrição da Modalidade', minLength: 50, maxLength: 1000 },
        objetivosModalidade: { type: 'string', title: 'Objetivos da Modalidade', minLength: 30, maxLength: 500 },
        publicoAlvo: { type: 'string', title: 'Público-Alvo', enum: ['Infantil', 'Juvenil', 'Adulto', 'Idoso', 'Todos'] },
        numeroMinimoParticipantes: { type: 'integer', title: 'Número Mínimo de Participantes', minimum: 1 },
        nomeInstrutor: { type: 'string', title: 'Nome do Instrutor/Professor', minLength: 3, maxLength: 200 },
        cpfInstrutor: { type: 'string', title: 'CPF do Instrutor', pattern: '^\\d{11}$' },
        crefInstrutor: { type: 'string', title: 'CREF do Instrutor', maxLength: 20 },
        telefoneInstrutor: { type: 'string', title: 'Telefone do Instrutor', pattern: '^\\d{10,11}$' },
        materialNecessario: { type: 'string', title: 'Material Necessário', maxLength: 500 },
        espacoNecessario: { type: 'string', title: 'Espaço Necessário', maxLength: 300 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomeModalidade', 'tipoModalidade', 'descricaoModalidade', 'objetivosModalidade', 'publicoAlvo', 'nomeInstrutor', 'cpfInstrutor']
    }
  },
  {
    name: 'Agenda de Eventos Esportivos',
    description: 'Consulta ao calendário esportivo municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE HABITAÇÃO (7 serviços)
// ============================================================================
const HOUSING_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Habitação',
    description: 'Registro geral de atendimentos na área habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_HABITACAO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Home',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', enum: ['Informações sobre Programas', 'Inscrição em Programa', 'Regularização Fundiária', 'Auxílio Aluguel', 'Situação de Moradia', 'Reclamação', 'Outro'] },
        descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento', minLength: 10, maxLength: 1000 },
        situacaoMoradia: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Própria', 'Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Outro'] },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoAtendimento', 'descricaoAtendimento', 'situacaoMoradia']
    }
  },
  {
    name: 'Inscrição em Programa Habitacional',
    description: 'Inscrição em programas habitacionais (Minha Casa Minha Vida)',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
    estimatedDays: 30,
    priority: 5,
    category: 'Programas',
    icon: 'Building',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        programaInteresse: { type: 'string', title: 'Programa de Interesse', enum: ['Minha Casa Minha Vida', 'Casa Verde e Amarela', 'Regularização Fundiária', 'Lotes Urbanizados', 'Outro'] },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Própria', 'Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua'] },
        tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
        possuiImovel: { type: 'string', title: 'Possui Imóvel?', enum: ['Sim', 'Não'] },
        inscritoCadUnico: { type: 'string', title: 'Inscrito no CadÚnico?', enum: ['Sim', 'Não'] },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'string', title: 'Há pessoa com deficiência na família?', enum: ['Sim', 'Não'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'possuiImovel', 'inscritoCadUnico']
    }
  },
  {
    name: 'Regularização Fundiária',
    description: 'Solicitação de regularização e título de propriedade',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    requiresDocuments: true,
    requiredDocuments: ['Documentos Pessoais', 'Comprovante de Posse', 'Planta do Imóvel'],
    estimatedDays: 90,
    priority: 5,
    category: 'Regularização',
    icon: 'FileCheck',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        enderecoImovel: { type: 'string', title: 'Endereço Completo do Imóvel', minLength: 10, maxLength: 300 },
        tipoOcupacao: { type: 'string', title: 'Tipo de Ocupação', enum: ['Posse', 'Ocupação Irregular', 'Herança sem Documentação', 'Compra sem Registro', 'Outro'] },
        tempoOcupacao: { type: 'string', title: 'Tempo de Ocupação', enum: ['Menos de 1 ano', '1-5 anos', '5-10 anos', '10-20 anos', 'Mais de 20 anos'] },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 0 },
        areaConstruida: { type: 'number', title: 'Área Construída (m²)', minimum: 0 },
        possuiPlanta: { type: 'string', title: 'Possui Planta do Imóvel?', enum: ['Sim', 'Não'] },
        possuiComprovantePosse: { type: 'string', title: 'Possui Comprovante de Posse?', enum: ['Sim', 'Não'] },
        tipoComprovante: { type: 'string', title: 'Tipo de Comprovante', enum: ['Contrato de Compra e Venda', 'Recibo', 'Declaração de Posse', 'Contas de Consumo', 'Outro'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'enderecoImovel', 'tipoOcupacao', 'tempoOcupacao', 'possuiComprovantePosse']
    }
  },
  {
    name: 'Solicitação de Auxílio Aluguel',
    description: 'Solicitação de auxílio moradia temporário',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
    estimatedDays: 15,
    priority: 5,
    category: 'Auxílio',
    icon: 'DollarSign',
    color: '#155e75',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Desabrigado por Calamidade', 'Despejo', 'Remoção por Obra Pública', 'Vulnerabilidade Social', 'Violência Doméstica', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', minLength: 30, maxLength: 1000 },
        valorAluguel: { type: 'number', title: 'Valor do Aluguel Atual/Pretendido (R$)', minimum: 0 },
        inscritoCadUnico: { type: 'string', title: 'Inscrito no CadÚnico?', enum: ['Sim', 'Não'] },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'string', title: 'Há pessoa com deficiência na família?', enum: ['Sim', 'Não'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'rendaFamiliarTotal', 'numeroMoradores', 'motivoSolicitacao', 'descricaoSituacao', 'inscritoCadUnico']
    }
  },
  {
    name: 'Cadastro de Unidade Habitacional',
    description: 'Cadastro de imóveis no programa habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNIDADE_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['Matrícula do Imóvel', 'Planta', 'Documentação do Proprietário'],
    estimatedDays: 20,
    priority: 3,
    category: 'Cadastro',
    icon: 'MapPin',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo do Proprietário', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF do Proprietário', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG do Proprietário', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP do Proprietário', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida do Proprietário', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número do Proprietário', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro do Proprietário', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        enderecoImovel: { type: 'string', title: 'Endereço Completo do Imóvel', minLength: 10, maxLength: 300 },
        cepImovel: { type: 'string', title: 'CEP do Imóvel', pattern: '^\\d{8}$' },
        tipoImovel: { type: 'string', title: 'Tipo de Imóvel', enum: ['Casa', 'Apartamento', 'Sobrado', 'Kitnet', 'Lote', 'Outro'] },
        numeroQuartos: { type: 'integer', title: 'Número de Quartos', minimum: 0 },
        numeroBanheiros: { type: 'integer', title: 'Número de Banheiros', minimum: 0 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 0 },
        areaConstruida: { type: 'number', title: 'Área Construída (m²)', minimum: 0 },
        matriculaImovel: { type: 'string', title: 'Matrícula do Imóvel', maxLength: 50 },
        inscricaoIPTU: { type: 'string', title: 'Inscrição IPTU', maxLength: 50 },
        situacaoImovel: { type: 'string', title: 'Situação do Imóvel', enum: ['Ocupado', 'Desocupado', 'Em Construção', 'Reforma'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'enderecoImovel', 'cepImovel', 'tipoImovel', 'areaTerreno', 'situacaoImovel']
    }
  },
  {
    name: 'Inscrição na Fila de Habitação',
    description: 'Inscrição em lista de espera para moradia popular',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_FILA_HABITACAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrição',
    icon: 'List',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário', pattern: '^\\d{10,11}$' },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Outro'] },
        tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
        inscritoCadUnico: { type: 'string', title: 'Inscrito no CadÚnico?', enum: ['Sim', 'Não'] },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'string', title: 'Há pessoa com deficiência na família?', enum: ['Sim', 'Não'] },
        idosoFamilia: { type: 'string', title: 'Há idoso na família?', enum: ['Sim', 'Não'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
      },
      required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'tempoResidencia', 'inscritoCadUnico']
    }
  },
  {
    name: 'Consulta de Programas Habitacionais',
    description: 'Informações sobre programas habitacionais disponíveis',
    departmentCode: 'HABITACAO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Info',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE MEIO AMBIENTE (7 serviços)
// ============================================================================
const ENVIRONMENT_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Meio Ambiente',
    description: 'Registro geral de atendimentos na área ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Leaf',
    color: '#10b981',
  },
  {
    name: 'Licença Ambiental',
    description: 'Solicitação de licenciamento ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'LICENCA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Estudos Ambientais', 'ART do Responsável Técnico'],
    estimatedDays: 60,
    priority: 5,
    category: 'Licenciamento',
    icon: 'FileCheck',
    color: '#059669',
  },
  {
    name: 'Denúncia Ambiental',
    description: 'Registro de denúncias e reclamações ambientais',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_AMBIENTAL',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Denúncia',
    icon: 'AlertTriangle',
    color: '#dc2626',
  },
  {
    name: 'Programa Ambiental',
    description: 'Inscrição em programas de educação ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 10,
    priority: 3,
    category: 'Programas',
    icon: 'GraduationCap',
    color: '#16a34a',
  },
  {
    name: 'Autorização de Poda ou Corte de Árvore',
    description: 'Solicitação de autorização para poda ou corte',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_PODA_CORTE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Técnico', 'Fotos', 'Comprovante de Propriedade'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorização',
    icon: 'TreeDeciduous',
    color: '#15803d',
  },
  {
    name: 'Vistoria Ambiental',
    description: 'Solicitação de inspeção ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Solicitação Formal', 'Documentação do Imóvel'],
    estimatedDays: 20,
    priority: 3,
    category: 'Vistoria',
    icon: 'Search',
    color: '#14532d',
  },
  {
    name: 'Gestão de Áreas Protegidas',
    description: 'Administração de APPs e reservas ambientais',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_AREAS_PROTEGIDAS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'ShieldCheck',
    color: '#64748b',
  },
];

// ============================================================================
// SECRETARIA DE OBRAS PÚBLICAS (7 serviços)
// ============================================================================
const PUBLIC_WORKS_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Obras Públicas',
    description: 'Registro geral de atendimentos na área de obras',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_OBRAS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'HardHat',
    color: '#f59e0b',
  },
  {
    name: 'Solicitação de Reparo de Via',
    description: 'Solicitação de tapa-buraco e pavimentação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_REPARO_VIA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Manutenção',
    icon: 'Construction',
    color: '#ea580c',
  },
  {
    name: 'Vistoria Técnica de Obras',
    description: 'Solicitação de inspeção técnica em obras',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_TECNICA_OBRAS',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Documentação do Imóvel'],
    estimatedDays: 10,
    priority: 3,
    category: 'Vistoria',
    icon: 'ClipboardCheck',
    color: '#f97316',
  },
  {
    name: 'Cadastro de Obra Pública',
    description: 'Registro de obras públicas no município',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_OBRA_PUBLICA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Orçamento', 'Cronograma'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Building2',
    color: '#fb923c',
  },
  {
    name: 'Inspeção de Obra',
    description: 'Inspeção de andamento de obras públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'INSPECAO_OBRA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Inspeção',
    icon: 'Eye',
    color: '#fdba74',
  },
  {
    name: 'Acompanhamento de Obras',
    description: 'Consulta ao progresso de obras públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Info',
    color: '#94a3b8',
  },
  {
    name: 'Mapa de Obras',
    description: 'Visualização geoespacial de obras no município',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE PLANEJAMENTO URBANO (9 serviços)
// ============================================================================
const URBAN_PLANNING_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Planejamento Urbano',
    description: 'Registro geral de atendimentos em planejamento',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_PLANEJAMENTO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Map',
    color: '#6366f1',
  },
  {
    name: 'Aprovação de Projeto Arquitetônico',
    description: 'Aprovação de projetos de construção e reforma',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'APROVACAO_PROJETO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART', 'Documentação do Imóvel'],
    estimatedDays: 30,
    priority: 5,
    category: 'Aprovação',
    icon: 'FileCheck',
    color: '#4f46e5',
  },
  {
    name: 'Alvará de Construção',
    description: 'Solicitação de licença para construção',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Aprovado', 'Matrícula do Imóvel', 'ART'],
    estimatedDays: 20,
    priority: 5,
    category: 'Alvará',
    icon: 'Building',
    color: '#4338ca',
  },
  {
    name: 'Alvará de Funcionamento',
    description: 'Licença comercial para estabelecimentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_FUNCIONAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Laudo Técnico', 'Comprovante de Endereço'],
    estimatedDays: 15,
    priority: 5,
    category: 'Alvará',
    icon: 'Store',
    color: '#3730a3',
  },
  {
    name: 'Solicitação de Certidão Municipal',
    description: 'Emissão de certidões municipais',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CERTIDAO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Documentação do Imóvel'],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidão',
    icon: 'FileText',
    color: '#312e81',
  },
  {
    name: 'Denúncia de Construção Irregular',
    description: 'Registro de denúncias de obras irregulares',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Denúncia',
    icon: 'AlertTriangle',
    color: '#dc2626',
  },
  {
    name: 'Cadastro de Loteamento',
    description: 'Registro e aprovação de loteamentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_LOTEAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Loteamento', 'Matrícula', 'Estudos Técnicos', 'ART'],
    estimatedDays: 90,
    priority: 5,
    category: 'Loteamento',
    icon: 'Grid3x3',
    color: '#6366f1',
  },
  {
    name: 'Consultas Públicas (Plano Diretor)',
    description: 'Participação em audiências e consultas públicas',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Users',
    color: '#94a3b8',
  },
  {
    name: 'Mapa Urbano (Zoneamento)',
    description: 'Consulta ao mapa de zoneamento e uso do solo',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE SEGURANÇA PÚBLICA (11 serviços)
// ============================================================================
const SECURITY_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Segurança Pública',
    description: 'Registro geral de atendimentos em segurança',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Shield',
    color: '#dc2626',
  },
  {
    name: 'Registro de Ocorrência (BO)',
    description: 'Registro de boletim de ocorrência',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_OCORRENCIA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF'],
    estimatedDays: 1,
    priority: 5,
    category: 'Ocorrência',
    icon: 'FileWarning',
    color: '#b91c1c',
  },
  {
    name: 'Solicitação de Ronda Policial',
    description: 'Solicitação de patrulhamento em área específica',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_RONDA',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 4,
    category: 'Ronda',
    icon: 'Car',
    color: '#991b1b',
  },
  {
    name: 'Solicitação de Câmera de Segurança',
    description: 'Solicitação de instalação de câmera de monitoramento',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
    requiresDocuments: true,
    requiredDocuments: ['Justificativa', 'Abaixo-assinado', 'Fotos do Local'],
    estimatedDays: 30,
    priority: 4,
    category: 'Câmeras',
    icon: 'Camera',
    color: '#7f1d1d',
  },
  {
    name: 'Denúncia Anônima (Disque Denúncia)',
    description: 'Registro de denúncias anônimas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_ANONIMA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Denúncia',
    icon: 'AlertCircle',
    color: '#ef4444',
  },
  {
    name: 'Cadastro de Ponto Crítico',
    description: 'Registro de áreas de risco e vulnerabilidade',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PONTO_CRITICO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Mapeamento',
    icon: 'MapPin',
    color: '#f87171',
  },
  {
    name: 'Alerta de Segurança',
    description: 'Registro de avisos e alertas de segurança',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'ALERTA_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Alerta',
    icon: 'Bell',
    color: '#fca5a5',
  },
  {
    name: 'Registro de Patrulha',
    description: 'Registro de patrulhamento realizado',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_PATRULHA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Patrulha',
    icon: 'Route',
    color: '#dc2626',
  },
  {
    name: 'Gestão da Guarda Municipal',
    description: 'Administração de escala de serviço e viaturas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_GUARDA_MUNICIPAL',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b',
  },
  {
    name: 'Gestão de Vigilância (Central de Operações)',
    description: 'Administração de câmeras e central de monitoramento',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_VIGILANCIA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Monitor',
    color: '#64748b',
  },
  {
    name: 'Estatísticas de Segurança',
    description: 'Consulta a análises e estatísticas regionais',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'BarChart',
    color: '#94a3b8',
  },
];

// ============================================================================
// SECRETARIA DE SERVIÇOS PÚBLICOS (9 serviços)
// ============================================================================
const PUBLIC_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Serviços Públicos',
    description: 'Registro geral de atendimentos em serviços públicos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Settings',
    color: '#64748b',
  },
  {
    name: 'Iluminação Pública (Poste Queimado)',
    description: 'Solicitação de reparo em iluminação pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'ILUMINACAO_PUBLICA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Iluminação',
    icon: 'Lightbulb',
    color: '#facc15',
  },
  {
    name: 'Limpeza Urbana (Coleta de Lixo)',
    description: 'Agendamento de coleta e limpeza urbana',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'LIMPEZA_URBANA',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Limpeza',
    icon: 'Trash2',
    color: '#22c55e',
  },
  {
    name: 'Coleta Especial (Entulho e Móveis)',
    description: 'Agendamento de coleta de entulho e móveis velhos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'COLETA_ESPECIAL',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Coleta',
    icon: 'Truck',
    color: '#f97316',
  },
  {
    name: 'Solicitação de Capina',
    description: 'Solicitação de capina de terreno ou via pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CAPINA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Manutenção',
    icon: 'Scissors',
    color: '#84cc16',
  },
  {
    name: 'Solicitação de Desobstrução (Bueiro Entupido)',
    description: 'Solicitação de limpeza de boca de lobo e bueiro',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_DESOBSTRUCAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Drenagem',
    icon: 'Droplets',
    color: '#06b6d4',
  },
  {
    name: 'Solicitação de Poda de Árvore',
    description: 'Solicitação de poda de árvore em via pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_PODA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Poda',
    icon: 'TreeDeciduous',
    color: '#16a34a',
  },
  {
    name: 'Registro de Problema com Foto (Funcionalidade Transversal)',
    description: 'Registro geolocalizado de problemas com foto',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Transversal',
    icon: 'Camera',
    color: '#94a3b8',
  },
  {
    name: 'Gestão de Equipes de Serviços',
    description: 'Programação de equipes e rotas de trabalho',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_EQUIPES_SERVICOS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b',
  },
];

// ============================================================================
// SECRETARIA DE TURISMO (9 serviços)
// ============================================================================
const TOURISM_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Turismo',
    description: 'Registro geral de atendimentos na área turística',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_TURISMO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Plane',
    color: '#3b82f6',
  },
  {
    name: 'Cadastro de Estabelecimento Turístico',
    description: 'Cadastro de hotéis, pousadas, restaurantes',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Documentação do Responsável'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Building',
    color: '#2563eb',
  },
  {
    name: 'Cadastro de Guia Turístico',
    description: 'Cadastro de guias de turismo credenciados',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Cadastur', 'Certificado de Capacitação'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'User',
    color: '#1d4ed8',
  },
  {
    name: 'Inscrição em Programa Turístico',
    description: 'Inscrição em programas de desenvolvimento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ ou CPF', 'Projeto', 'Documentação do Estabelecimento'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#1e40af',
  },
  {
    name: 'Registro de Atrativo Turístico',
    description: 'Cadastro de pontos turísticos e atrativos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_ATRATIVO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Fotos', 'Descrição', 'Localização GPS'],
    estimatedDays: 5,
    priority: 3,
    category: 'Atrativos',
    icon: 'MapPin',
    color: '#1e3a8a',
  },
  {
    name: 'Cadastro de Roteiro Turístico',
    description: 'Cadastro de roteiros e passeios turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ROTEIRO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Roteiro Detalhado', 'Fotos', 'Valores', 'Contatos'],
    estimatedDays: 10,
    priority: 3,
    category: 'Roteiros',
    icon: 'Route',
    color: '#3b82f6',
  },
  {
    name: 'Cadastro de Evento Turístico',
    description: 'Registro de eventos e festivais turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações', 'Cronograma'],
    estimatedDays: 20,
    priority: 4,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#2563eb',
  },
  {
    name: 'Mapa Turístico',
    description: 'Visualização de atrativos turísticos no mapa',
    departmentCode: 'TURISMO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8',
  },
  {
    name: 'Guia Turístico da Cidade',
    description: 'Informações gerais sobre a cidade',
    departmentCode: 'TURISMO',
    serviceType: 'INFORMATIVO',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Book',
    color: '#94a3b8',
  },
];

// ============================================================================
// EXPORTAR FUNÇÃO DE SEED
// ============================================================================

export async function seedServices() {
  console.log('\n📦 Iniciando seed de serviços simplificados...');

  // Buscar departamentos
  const departments = await prisma.department.findMany();

  const departmentMap = new Map(
    departments.map(dept => [dept.code, dept.id])
  );

  let totalCreated = 0;
  const allServices = [
    ...HEALTH_SERVICES,
    ...EDUCATION_SERVICES,
    ...SOCIAL_SERVICES,
    ...AGRICULTURE_SERVICES,
    ...CULTURE_SERVICES,
    ...SPORTS_SERVICES,
    ...HOUSING_SERVICES,
    ...ENVIRONMENT_SERVICES,
    ...PUBLIC_WORKS_SERVICES,
    ...URBAN_PLANNING_SERVICES,
    ...SECURITY_SERVICES,
    ...PUBLIC_SERVICES,
    ...TOURISM_SERVICES,
  ];

  for (const serviceDef of allServices) {
    const departmentId = departmentMap.get(serviceDef.departmentCode);

    if (!departmentId) {
      console.warn(`   ⚠️  Departamento ${serviceDef.departmentCode} não encontrado, pulando serviço: ${serviceDef.name}`);
      continue;
    }

    try {
      await prisma.serviceSimplified.create({
        data: {
          name: serviceDef.name,
          description: serviceDef.description,
          departmentId,
          serviceType: serviceDef.serviceType,
          moduleType: serviceDef.moduleType,
          formSchema: serviceDef.formSchema || undefined,
          requiresDocuments: serviceDef.requiresDocuments,
          requiredDocuments: serviceDef.requiredDocuments
            ? JSON.stringify(serviceDef.requiredDocuments)
            : undefined,
          estimatedDays: serviceDef.estimatedDays,
          priority: serviceDef.priority,
          category: serviceDef.category,
          icon: serviceDef.icon,
          color: serviceDef.color,
          isActive: true,
        }
      });

      totalCreated++;
      console.log(`   ✅ ${serviceDef.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`   ℹ️  Serviço já existe: ${serviceDef.name}`);
      } else {
        console.error(`   ❌ Erro ao criar serviço ${serviceDef.name}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Seed de serviços concluído: ${totalCreated} serviços criados`);
  return totalCreated;
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedServices()
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
