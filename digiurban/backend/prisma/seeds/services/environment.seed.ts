/**
 * SEED DE SERVIÇOS - SECRETARIA DE MEIO AMBIENTE
 * Total: 7 serviços
 */

import { ServiceDefinition } from './types';

export const environmentServices: ServiceDefinition[] = [
  {
    name: 'Licenciamento Ambiental',
    description: 'Solicitação de licença ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'LICENCIAMENTO_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Estudo de Impacto', 'ART'],
    estimatedDays: 60,
    priority: 5,
    category: 'Licenças',
    icon: 'Leaf',
    color: '#16a34a',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'tipoAtividade',
          label: 'Tipo de Atividade',
          type: 'text',
          maxLength: 200,
          required: true
        },
        {
          id: 'areaImpacto',
          label: 'Área de Impacto (hectares)',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'medidasMitigacao',
          label: 'Medidas de Mitigação',
          type: 'textarea',
          minLength: 50,
          maxLength: 2000,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Coleta Seletiva',
    description: 'Cadastro para coleta seletiva',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'COLETA_SELETIVA',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 2,
    category: 'Coleta',
    icon: 'Recycle',
    color: '#15803d',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'diaColeta',
          label: 'Dia da Coleta',
          type: 'select',
          options: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Gestão de Resíduos',
    description: 'Controle interno de resíduos',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_RESIDUOS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 3,
    category: 'Gestão Interna',
    icon: 'Trash2',
    color: '#166534',
    formSchema: {
      citizenFields: [],
      fields: [
        {
          id: 'tipoResiduo',
          label: 'Tipo de Resíduo',
          type: 'text',
          maxLength: 200,
          required: true
        },
        {
          id: 'quantidade',
          label: 'Quantidade (toneladas)',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'destino',
          label: 'Destino Final',
          type: 'text',
          maxLength: 200,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
        name: 'Certidão Ambiental',
    description: 'Emissão de certidão ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#16a34a',
  },
  {
    name: 'Declaração de Conformidade Ambiental',
    description: 'Emissão de declaração de conformidade',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Licença Ambiental'],
    estimatedDays: 7,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#16a34a',
  },
  {
    name: 'Laudo Técnico Ambiental',
    description: 'Emissão de laudo técnico ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Endereço do Imóvel'],
    estimatedDays: 30,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#16a34a',
  },
  {
    name: 'Autorização para Poda/Supressão de Árvores',
    description: 'Autorização para poda ou corte de árvores',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_PODA',
    requiresDocuments: true,
    requiredDocuments: ['Foto da Árvore', 'Laudo Técnico', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorizações',
    icon: 'TreePine',
    color: '#15803d',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'especieArvore',
          label: 'Espécie da Árvore',
          type: 'select',
          options: ['Ipê Amarelo', 'Ipê Roxo', 'Ipê Branco', 'Pau-brasil', 'Jacarandá', 'Cedro', 'Jatobá', 'Aroeira', 'Quaresmeira', 'Sibipiruna', 'Mangueira', 'Jaqueira', 'Abacateiro', 'Goiabeira', 'Pitangueira', 'Eucalipto', 'Pinus', 'Palmeira Imperial', 'Palmeira Real', 'Outra (especificar nos comentários)'],
          required: true
        },
        {
          id: 'quantidade',
          label: 'Quantidade de Árvores',
          type: 'number',
          minimum: 1,
          required: true
        },
        {
          id: 'motivo',
          label: 'Motivo da Poda/Supressão',
          type: 'select',
          options: ['Risco de Queda', 'Doença', 'Obstrução', 'Construção', 'Outro'],
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
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
      formSchema: {
        type: 'object',
          citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', enum: ['Licença Ambiental', 'Denúncia Ambiental', 'Autorização de Poda/Corte', 'Programa Ambiental', 'Vistoria', 'Informações', 'Outro'] },
          descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento', minLength: 10, maxLength: 1000 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoAtendimento', 'descricaoAtendimento']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoLicenca: { type: 'string', title: 'Tipo de Licença', enum: ['Licença Prévia (LP)', 'Licença de Instalação (LI)', 'Licença de Operação (LO)', 'Licença Única'] },
          tipoAtividade: { type: 'string', title: 'Tipo de Atividade', enum: ['Industrial', 'Comercial', 'Agrícola', 'Mineração', 'Construção Civil', 'Serviços', 'Outro'] },
          descricaoAtividade: { type: 'string', title: 'Descrição da Atividade', minLength: 30, maxLength: 1000 },
          enderecoEmpreendimento: { type: 'string', title: 'Endereço do Empreendimento', minLength: 10, maxLength: 300 },
          areaEmpreendimento: { type: 'number', title: 'Área do Empreendimento (m²)', minimum: 0 },
          nomeResponsavelTecnico: { type: 'string', title: 'Nome do Responsável Técnico', minLength: 3, maxLength: 200 },
          registroResponsavelTecnico: { type: 'string', title: 'Registro Profissional (CREA/CAU)', maxLength: 50 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoLicenca', 'tipoAtividade', 'descricaoAtividade', 'enderecoEmpreendimento', 'nomeResponsavelTecnico']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoDenuncia: { type: 'string', title: 'Tipo de Denúncia', enum: ['Desmatamento', 'Poluição da Água', 'Poluição do Ar', 'Poluição Sonora', 'Maus-tratos a Animais', 'Queimada Irregular', 'Descarte Irregular de Lixo', 'Outro'] },
          descricaoDenuncia: { type: 'string', title: 'Descrição da Denúncia', minLength: 30, maxLength: 1000 },
          enderecoOcorrencia: { type: 'string', title: 'Endereço da Ocorrência', minLength: 10, maxLength: 300 },
          dataOcorrencia: { type: 'string', format: 'date', title: 'Data da Ocorrência' },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoDenuncia', 'descricaoDenuncia', 'enderecoOcorrencia']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          nomePrograma: { type: 'string', title: 'Nome do Programa', maxLength: 200 },
          tipoPrograma: { type: 'string', title: 'Tipo de Programa', enum: ['Educação Ambiental', 'Coleta Seletiva', 'Reciclagem', 'Horta Comunitária', 'Reflorestamento', 'Outro'] },
          motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'nomePrograma', 'tipoPrograma']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Poda', 'Corte', 'Remoção'] },
          enderecoArvore: { type: 'string', title: 'Endereço da Árvore', minLength: 10, maxLength: 300 },
          especieArvore: { type: 'string', title: 'Espécie da Árvore (se souber)', maxLength: 100 },
          alturaEstimada: { type: 'number', title: 'Altura Estimada (metros)', minimum: 0 },
          motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Risco de Queda', 'Raízes Danificando Estruturas', 'Galhos sobre Fiação', 'Doença', 'Praga', 'Outro'] },
          descricaoMotivo: { type: 'string', title: 'Descrição Detalhada do Motivo', minLength: 30, maxLength: 1000 },
          possuiLaudoTecnico: { type: 'boolean', title: 'Possui Laudo Técnico?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoSolicitacao', 'enderecoArvore', 'motivoSolicitacao', 'descricaoMotivo']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoVistoria: { type: 'string', title: 'Tipo de Vistoria', enum: ['Área de Preservação', 'Licenciamento', 'Denúncia', 'Regularização', 'Outro'] },
          enderecoVistoria: { type: 'string', title: 'Endereço para Vistoria', minLength: 10, maxLength: 300 },
          motivoVistoria: { type: 'string', title: 'Motivo da Vistoria', minLength: 30, maxLength: 1000 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoVistoria', 'enderecoVistoria', 'motivoVistoria']
      }
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
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          tipoArea: { type: 'string', title: 'Tipo de Área Protegida', enum: ['APP - Área de Preservação Permanente', 'Reserva Legal', 'Unidade de Conservação', 'Parque Ecológico', 'Área de Proteção Ambiental', 'Outra'] },
          nomeArea: { type: 'string', title: 'Nome da Área Protegida', minLength: 3, maxLength: 200 },
          localizacao: { type: 'string', title: 'Localização da Área', maxLength: 300 },
          areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)', minimum: 0 },
          situacaoConservacao: { type: 'string', title: 'Situação de Conservação', enum: ['Ótima', 'Boa', 'Regular', 'Ruim', 'Crítica'] },
          atividadesGestao: { type: 'string', title: 'Atividades de Gestão Previstas', minLength: 20, maxLength: 1000 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 1000 },
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'tipoArea', 'nomeArea', 'localizacao', 'areaTotalHectares', 'situacaoConservacao', 'atividadesGestao'],
      },
    },
  {name: 'Certidão de Conformidade Ambiental', description: 'Certidão de conformidade com normas ambientais', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CNPJ/CPF', 'Documentos do Imóvel'], estimatedDays: 10, priority: 4, category: 'Certidões', icon: 'FileText', color: '#f59e0b'},
  {name: 'Declaração de Área Verde', description: 'Declaração de área verde preservada', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'Planta do Imóvel'], estimatedDays: 7, priority: 3, category: 'Certidões', icon: 'Trees', color: '#10b981'},
  {name: 'Guia de Poda de Árvore', description: 'Autorização para poda de árvores', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'Comprovante de Endereço', 'Fotos'], estimatedDays: 5, priority: 4, category: 'Documentos', icon: 'Scissors', color: '#22c55e'},
  {name: 'Atestado de Coleta Seletiva', description: 'Atestado de participação em programa de coleta seletiva', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF'], estimatedDays: 3, priority: 2, category: 'Certidões', icon: 'Recycle', color: '#3b82f6'},
  {name: 'Consulta de Licença Ambiental', description: 'Consulta de situação de licenças ambientais', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CNPJ/CPF'], estimatedDays: 2, priority: 3, category: 'Consultas', icon: 'Search', color: '#8b5cf6'},
  {name: 'Segunda Via de Autorização Ambiental', description: 'Reemissão de autorizações ambientais', departmentCode: 'MEIO_AMBIENTE', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'Protocolo Original'], estimatedDays: 5, priority: 2, category: 'Documentos', icon: 'Copy', color: '#6b7280'}
];
