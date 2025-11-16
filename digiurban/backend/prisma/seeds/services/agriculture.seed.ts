/**
 * SEED DE SERVIÇOS - SECRETARIA DE AGRICULTURA
 * Total: 6 serviços
 */

import { ServiceDefinition } from './types';

export const agricultureServices: ServiceDefinition[] = [
  {
    name: 'Cadastro de Produtor Rural',
    description: 'Cadastro de produtores rurais do município',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência', 'DAP (se aplicável)'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Tractor',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      citizenFields: [
        'nome',
        'cpf',
        'rg',
        'dataNascimento',
        'email',
        'telefone',
        'telefoneSecundario',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'nomeMae',
        'estadoCivil',
        'profissao',
        'rendaFamiliar'
      ],
      properties: {
        // Campos do Cidadão
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$', minLength: 8, maxLength: 8 },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // Campos Customizados do Serviço
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        areaPropriedade: { type: 'number', title: 'Área da Propriedade (hectares)', minimum: 0 },
        tipoProducao: { type: 'string', title: 'Tipo de Produção', maxLength: 300 },
        possuiDAP: { type: 'boolean', title: 'Possui DAP?', default: false },
        numeroDAP: { type: 'string', title: 'Número da DAP', maxLength: 50 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: [
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar',
        'areaPropriedade', 'tipoProducao'
      ]
    }
  },
  {
    name: 'Solicitação de Máquinas',
    description: 'Solicitação de uso de máquinas agrícolas',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_MAQUINAS',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Propriedade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Máquinas',
    icon: 'Wrench',
    color: '#15803d',
    formSchema: {
      type: 'object',
      citizenFields: [
        'nome',
        'cpf',
        'rg',
        'dataNascimento',
        'email',
        'telefone',
        'telefoneSecundario',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'nomeMae',
        'estadoCivil',
        'profissao',
        'rendaFamiliar'
      ],
      properties: {
        // Campos do Cidadão
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$', minLength: 8, maxLength: 8 },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // Campos Customizados do Serviço
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tipoMaquina: { type: 'string', title: 'Tipo de Máquina', enum: ['Trator', 'Arado', 'Grade', 'Plantadeira', 'Colheitadeira', 'Outro'] },
        dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
        areaTrabalho: { type: 'number', title: 'Área a Ser Trabalhada (hectares)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: [
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar',
        'tipoMaquina', 'dataPreferencial', 'areaTrabalho'
      ]
    }
  },
  {
    name: 'Feira do Produtor',
    description: 'Inscrição para participar da feira',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'FEIRA_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência'],
    estimatedDays: 5,
    priority: 3,
    category: 'Feira',
    icon: 'Store',
    color: '#166534',
    formSchema: {
      type: 'object',
      citizenFields: [
        'nome',
        'cpf',
        'rg',
        'dataNascimento',
        'email',
        'telefone',
        'telefoneSecundario',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'nomeMae',
        'estadoCivil',
        'profissao',
        'rendaFamiliar'
      ],
      properties: {
        // Campos do Cidadão
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$', minLength: 8, maxLength: 8 },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // Campos Customizados do Serviço
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        produtosVender: { type: 'string', title: 'Produtos a Vender', minLength: 10, maxLength: 500, widget: 'textarea' },
        dataFeira: { type: 'string', format: 'date', title: 'Data da Feira' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: [
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar',
        'produtosVender', 'dataFeira'
      ]
    }
  },
  {
    name: 'Programa de Sementes',
    description: 'Solicitação de sementes para plantio',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMA_SEMENTES',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'DAP'],
    estimatedDays: 10,
    priority: 4,
    category: 'Programas',
    icon: 'Sprout',
    color: '#15803d',
    formSchema: {
      type: 'object',
      citizenFields: [
        'nome',
        'cpf',
        'rg',
        'dataNascimento',
        'email',
        'telefone',
        'telefoneSecundario',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'nomeMae',
        'estadoCivil',
        'profissao',
        'rendaFamiliar'
      ],
      properties: {
        // Campos do Cidadão
        nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$', minLength: 10, maxLength: 11 },
        cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$', minLength: 8, maxLength: 8 },
        logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
        numero: { type: 'string', title: 'Número', maxLength: 10 },
        complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
        bairro: { type: 'string', title: 'Bairro/Comunidade', minLength: 2, maxLength: 100 },
        nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
        estadoCivil: { type: 'string', title: 'Estado Civil', enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
        profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
        rendaFamiliar: { type: 'string', title: 'Faixa de Renda Familiar', enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'] },

        // Campos Customizados do Serviço
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tipoSemente: { type: 'string', title: 'Tipo de Semente', enum: ['Milho', 'Feijão', 'Soja', 'Hortaliças', 'Outro'] },
        quantidade: { type: 'number', title: 'Quantidade (kg)', minimum: 1 },
        areaPlantio: { type: 'number', title: 'Área de Plantio (hectares)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: [
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar',
        'tipoSemente', 'quantidade', 'areaPlantio'
      ]
    }
  },
  {
    name: 'Certidão de Produtor Rural',
    description: 'Emissão de certidão de produtor rural',
    departmentCode: 'AGRICULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência'],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#16a34a',
  },
  {
    name: 'Declaração de Atividade Rural',
    description: 'Emissão de declaração de atividade rural',
    departmentCode: 'AGRICULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'DAP'],
    estimatedDays: 7,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#16a34a',
  },
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
        citizenFields: [
          'nome',
          'cpf',
          'rg',
          'dataNascimento',
          'email',
          'telefone',
          'telefoneSecundario',
          'cep',
          'logradouro',
          'numero',
          'complemento',
          'bairro',
          'pontoReferencia',
          'nomeMae',
          'estadoCivil',
          'profissao',
          'rendaFamiliar'
        ],
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
        citizenFields: [
          'nome',
          'cpf',
          'rg',
          'dataNascimento',
          'email',
          'telefone',
          'telefoneSecundario',
          'cep',
          'logradouro',
          'numero',
          'complemento',
          'bairro',
          'pontoReferencia',
          'nomeMae',
          'estadoCivil',
          'profissao',
          'rendaFamiliar'
        ],
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
        citizenFields: [
          'nome',
          'cpf',
          'rg',
          'dataNascimento',
          'email',
          'telefone',
          'telefoneSecundario',
          'cep',
          'logradouro',
          'numero',
          'complemento',
          'bairro',
          'pontoReferencia',
          'nomeMae',
          'estadoCivil',
          'profissao',
          'rendaFamiliar'
        ],
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
        citizenFields: [
          'nome',
          'cpf',
          'rg',
          'dataNascimento',
          'email',
          'telefone',
          'telefoneSecundario',
          'cep',
          'logradouro',
          'numero',
          'complemento',
          'bairro',
          'pontoReferencia',
          'nomeMae',
          'estadoCivil',
          'profissao',
          'rendaFamiliar'
        ],
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
  {
      name: 'Declaração de Atividade Agrícola',
      description: 'Declaração comprovando exercício de atividades agrícolas no município',
      departmentCode: 'AGRICULTURA',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Documento da Propriedade'],
      estimatedDays: 5,
      priority: 3,
      category: 'Certidões',
      icon: 'FileCheck',
      color: '#f59e0b'
    },
  {
      name: 'Guia de Transporte Vegetal',
      description: 'Emissão de guia para transporte de produtos vegetais e agrícolas',
      departmentCode: 'AGRICULTURA',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['Cadastro de Produtor', 'Nota Fiscal ou Documento de Origem'],
      estimatedDays: 2,
      priority: 4,
      category: 'Documentos',
      icon: 'Truck',
      color: '#10b981'
    },
  {
      name: 'Segunda Via de Cadastro de Produtor',
      description: 'Emissão de segunda via do cadastro de produtor rural',
      departmentCode: 'AGRICULTURA',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG'],
      estimatedDays: 3,
      priority: 2,
      category: 'Documentos',
      icon: 'Copy',
      color: '#6b7280'
    },
  {
      name: 'Consulta de Situação Cadastral',
      description: 'Consulta e verificação da situação cadastral do produtor rural',
      departmentCode: 'AGRICULTURA',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF'],
      estimatedDays: 1,
      priority: 2,
      category: 'Consultas',
      icon: 'Search',
      color: '#3b82f6'
    },
  {
      name: 'Atestado de Área Cultivada',
      description: 'Atestado comprovando área cultivada e tipo de cultura',
      departmentCode: 'AGRICULTURA',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['Cadastro de Produtor', 'Documento da Propriedade', 'Laudo Técnico'],
      estimatedDays: 7,
      priority: 3,
      category: 'Certidões',
      icon: 'MapPin',
      color: '#10b981'
    },
  {
      name: 'Declaração de Matrícula',
      description: 'Declaração oficial de matrícula do aluno na rede municipal',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF do Responsável', 'Certidão de Nascimento'],
      estimatedDays: 2,
      priority: 3,
      category: 'Certidões',
      icon: 'FileText',
      color: '#f59e0b'
    },
  {
      name: 'Histórico Escolar',
      description: 'Emissão de histórico escolar completo',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG'],
      estimatedDays: 7,
      priority: 4,
      category: 'Documentos',
      icon: 'FileText',
      color: '#3b82f6'
    },
  {
      name: 'Atestado de Frequência Escolar',
      description: 'Atestado de frequência escolar do aluno',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF do Responsável'],
      estimatedDays: 3,
      priority: 3,
      category: 'Certidões',
      icon: 'CalendarCheck',
      color: '#10b981'
    },
  {
      name: 'Declaração de Conclusão',
      description: 'Declaração de conclusão de ano letivo',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG'],
      estimatedDays: 5,
      priority: 3,
      category: 'Certidões',
      icon: 'Award',
      color: '#8b5cf6'
    },
  {
      name: 'Segunda Via de Documentos Escolares',
      description: 'Reemissão de documentos escolares extraviados',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Boletim de Ocorrência'],
      estimatedDays: 5,
      priority: 2,
      category: 'Documentos',
      icon: 'Copy',
      color: '#6b7280'
    },
  {
      name: 'Certidão de Escolaridade',
      description: 'Certidão comprovando nível de escolaridade',
      departmentCode: 'EDUCACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG'],
      estimatedDays: 3,
      priority: 3,
      category: 'Certidões',
      icon: 'GraduationCap',
      color: '#ec4899'
    }
];
