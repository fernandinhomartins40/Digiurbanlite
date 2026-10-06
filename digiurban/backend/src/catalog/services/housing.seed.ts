/**
 * SEED DE SERVIÇOS - SECRETARIA DE HABITAÇÃO
 * Total: 20 serviços (15 COM_DADOS + 5 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const housingServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (10) ==========

  {
    name: 'Regularização Fundiária',
    description: 'Solicitação de regularização de imóvel',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    requiresDocuments: true,
    requiredDocuments: ['Escritura (se possuir)', 'IPTU', 'Comprovante de Residência'],
    estimatedDays: 60,
    priority: 5,
    category: 'Regularização',
    icon: 'Home',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        matriculaImovel: { type: 'string', title: 'Matrícula do Imóvel (se possuir)', maxLength: 50 },
        areaConstruida: { type: 'number', title: 'Área Construída (m²)', minimum: 1 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tempoResidencia: { type: 'number', title: 'Tempo de Residência (anos)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000, widget: 'textarea' }
      },
      required: ['areaConstruida', 'areaTerreno', 'tempoResidencia']
    }
  },

  {
    name: 'Inscrição em Programa Habitacional',
    description: 'Inscrição em programas habitacionais (Minha Casa Minha Vida, Casa Verde e Amarela)',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
    estimatedDays: 30,
    priority: 5,
    category: 'Programas',
    icon: 'Building',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        programaInteresse: { type: 'string', title: 'Programa de Interesse', enum: ['Minha Casa Minha Vida', 'Casa Verde e Amarela', 'Regularização Fundiária', 'Lotes Urbanizados', 'Outro'] },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Própria (precária)', 'Outro'] },
        tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
        possuiImovel: { type: 'boolean', title: 'Possui Imóvel?' },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'boolean', title: 'Há Pessoa com Deficiência na Família?' },
        idosoFamilia: { type: 'boolean', title: 'Há Idoso na Família?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'possuiImovel', 'inscritoCadUnico']
    }
  },

  {
    name: 'Solicitação de Auxílio Aluguel',
    description: 'Solicitação de auxílio moradia temporário',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Desabrigado por Calamidade', 'Despejo', 'Remoção por Obra Pública', 'Vulnerabilidade Social', 'Violência Doméstica', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', minLength: 30, maxLength: 1000, widget: 'textarea' },
        valorAluguel: { type: 'number', title: 'Valor do Aluguel Atual/Pretendido (R$)', minimum: 0 },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'boolean', title: 'Há Pessoa com Deficiência na Família?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['rendaFamiliarTotal', 'numeroMoradores', 'motivoSolicitacao', 'descricaoSituacao', 'inscritoCadUnico']
    }
  },

  {
    name: 'Autorização para Construção',
    description: 'Autorização para construção em lote regularizado',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART (Anotação de Responsabilidade Técnica)', 'Matrícula do Imóvel'],
    estimatedDays: 30,
    priority: 4,
    category: 'Construção',
    icon: 'Hammer',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        numeroLote: { type: 'string', title: 'Número do Lote', maxLength: 50 },
        areaConstruir: { type: 'number', title: 'Área a Construir (m²)', minimum: 1 },
        tipoConstrucao: { type: 'string', title: 'Tipo de Construção', enum: ['Residencial', 'Comercial', 'Misto'] },
        numeroAndares: { type: 'integer', title: 'Número de Andares', minimum: 1, maximum: 10 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['numeroLote', 'areaConstruir', 'tipoConstrucao']
    }
  },

  {
    name: 'Vistoria Habitacional',
    description: 'Solicitação de vistoria técnica para laudo habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'VISTORIA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
    estimatedDays: 20,
    priority: 4,
    category: 'Vistoria',
    icon: 'ClipboardCheck',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel (se diferente do cadastro)', maxLength: 300 },
        motivoVistoria: { type: 'string', title: 'Motivo da Vistoria', enum: ['Regularização', 'Programa Habitacional', 'Laudo Técnico', 'Condições de Habitabilidade', 'Outro'] },
        descricaoSolicitacao: { type: 'string', title: 'Descrição da Solicitação', minLength: 20, maxLength: 1000, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoVistoria', 'descricaoSolicitacao']
    }
  },

  {
    name: 'Inscrição Minha Casa Minha Vida Municipal',
    description: 'Inscrição específica no programa municipal Minha Casa Minha Vida',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_MCMV_MUNICIPAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço', 'Certidão de Casamento (se aplicável)'],
    estimatedDays: 30,
    priority: 5,
    category: 'Programas',
    icon: 'HomeIcon',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        faixaRenda: { type: 'string', title: 'Faixa de Renda', enum: ['Faixa 1 (até R$ 2.640)', 'Faixa 2 (R$ 2.640 a R$ 4.400)', 'Faixa 3 (R$ 4.400 a R$ 8.000)'] },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        possuiImovel: { type: 'boolean', title: 'Possui Imóvel Próprio?' },
        tempoResidenciaMunicipio: { type: 'integer', title: 'Tempo de Residência no Município (anos)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['rendaFamiliarTotal', 'numeroMoradores', 'faixaRenda', 'inscritoCadUnico', 'possuiImovel', 'tempoResidenciaMunicipio']
    }
  },

  {
    name: 'Regularização de Posse',
    description: 'Solicitação de regularização de posse de terreno ou imóvel',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGULARIZACAO_POSSE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Ocupação', 'Declaração de Posse', 'Croqui do Terreno'],
    estimatedDays: 90,
    priority: 5,
    category: 'Regularização',
    icon: 'FileText',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tempoPosse: { type: 'integer', title: 'Tempo de Posse (anos)', minimum: 1 },
        tipoOcupacao: { type: 'string', title: 'Tipo de Ocupação', enum: ['Residencial', 'Comercial', 'Mista'] },
        possuiConstrucao: { type: 'boolean', title: 'Possui Construção no Terreno?' },
        descricaoPosse: { type: 'string', title: 'Descrição da Posse', maxLength: 1000, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'areaTerreno', 'tempoPosse', 'tipoOcupacao', 'descricaoPosse']
    }
  },

  {
    name: 'Usucapião Urbano',
    description: 'Solicitação de usucapião de imóvel urbano',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'USUCAPIAO_URBANO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Declaração de Posse Mansa e Pacífica', 'Comprovantes de Residência', 'Declaração de Testemunhas'],
    estimatedDays: 180,
    priority: 5,
    category: 'Regularização',
    icon: 'Scale',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        areaTotal: { type: 'number', title: 'Área Total (m²)', minimum: 1 },
        tempoPosse: { type: 'integer', title: 'Tempo de Posse Ininterrupta (anos)', minimum: 5 },
        tipoUsucapiao: { type: 'string', title: 'Tipo de Usucapião', enum: ['Ordinário', 'Extraordinário', 'Especial Urbano', 'Especial Rural'] },
        possuiOutroImovel: { type: 'boolean', title: 'Possui Outro Imóvel?' },
        descricaoPosse: { type: 'string', title: 'Descrição Detalhada da Posse', maxLength: 1000, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'areaTotal', 'tempoPosse', 'tipoUsucapiao', 'possuiOutroImovel', 'descricaoPosse']
    }
  },

  {
    name: 'REURB - Regularização Fundiária Urbana',
    description: 'Solicitação de regularização fundiária urbana (REURB)',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REURB',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Declaração de Posse', 'Levantamento Topográfico (se houver)'],
    estimatedDays: 120,
    priority: 5,
    category: 'Regularização',
    icon: 'MapPin',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoREURB: { type: 'string', title: 'Tipo de REURB', enum: ['REURB-S (Social)', 'REURB-E (Especial)'] },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tempoOcupacao: { type: 'integer', title: 'Tempo de Ocupação (anos)', minimum: 1 },
        rendaFamiliar: { type: 'number', title: 'Renda Familiar (R$)', minimum: 0 },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'tipoREURB', 'areaTerreno', 'tempoOcupacao', 'rendaFamiliar', 'inscritoCadUnico']
    }
  },

  {
    name: 'Concessão de Uso Especial para Fins de Moradia',
    description: 'Solicitação de concessão de uso especial de imóvel público para moradia',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CONCESSAO_USO_ESPECIAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Declaração de Posse', 'Comprovantes de Residência', 'Declaração de Não Proprietário'],
    estimatedDays: 90,
    priority: 5,
    category: 'Regularização',
    icon: 'Key',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        areaOcupada: { type: 'number', title: 'Área Ocupada (m²)', minimum: 1 },
        tempoOcupacao: { type: 'integer', title: 'Tempo de Ocupação (anos)', minimum: 5 },
        possuiOutroImovel: { type: 'boolean', title: 'Possui Outro Imóvel?' },
        finalidadeUso: { type: 'string', title: 'Finalidade do Uso', enum: ['Moradia', 'Atividade Produtiva'] },
        descricaoOcupacao: { type: 'string', title: 'Descrição da Ocupação', maxLength: 1000, widget: 'textarea' }
      },
      required: ['enderecoImovel', 'areaOcupada', 'tempoOcupacao', 'possuiOutroImovel', 'finalidadeUso', 'descricaoOcupacao']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (5) ==========

  {
    name: 'Auxílio Construção',
    description: 'Solicitação de auxílio financeiro para construção de moradia popular',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'AUXILIO_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Matrícula do Terreno'],
    estimatedDays: 30,
    priority: 4,
    category: 'Auxílio',
    icon: 'Wallet',
    color: '#155e75',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoTerreno: { type: 'string', title: 'Endereço do Terreno', maxLength: 300 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        rendaFamiliar: { type: 'number', title: 'Renda Familiar (R$)', minimum: 0 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoTerreno', 'areaTerreno', 'rendaFamiliar', 'justificativa']
    }
  },

  {
    name: 'Solicitação de Material de Construção',
    description: 'Solicitação de material de construção subsidiado para moradia popular',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'MATERIAL_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Comprovante de Propriedade'],
    estimatedDays: 20,
    priority: 4,
    category: 'Auxílio',
    icon: 'Package',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoMaterial: { type: 'string', title: 'Tipo de Material', enum: ['Cimento', 'Tijolos', 'Telhas', 'Areia', 'Brita', 'Kit Completo', 'Outro'] },
        finalidade: { type: 'string', title: 'Finalidade', enum: ['Construção Nova', 'Reforma', 'Ampliação'] },
        quantidadeEstimada: { type: 'string', title: 'Quantidade Estimada', maxLength: 200 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoMaterial', 'finalidade', 'justificativa']
    }
  },

  {
    name: 'Projeto Arquitetônico Social',
    description: 'Solicitação de projeto arquitetônico gratuito para habitação de interesse social',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PROJETO_ARQUITETONICO_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Escritura ou Matrícula do Terreno'],
    estimatedDays: 30,
    priority: 4,
    category: 'Assistência',
    icon: 'PenTool',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoTerreno: { type: 'string', title: 'Endereço do Terreno', maxLength: 300 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tipoProjeto: { type: 'string', title: 'Tipo de Projeto', enum: ['Casa Térrea', 'Sobrado', 'Casa Geminada'] },
        numeroComodos: { type: 'integer', title: 'Número de Cômodos Desejados', minimum: 1 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['enderecoTerreno', 'areaTerreno', 'tipoProjeto', 'numeroComodos']
    }
  },

  {
    name: 'Cadastro em Déficit Habitacional',
    description: 'Cadastro para inclusão no déficit habitacional municipal',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CADASTRO_DEFICIT_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Comprovante de Endereço'],
    estimatedDays: 10,
    priority: 3,
    category: 'Cadastro',
    icon: 'Clipboard',
    color: '#06b6d4',
    // Validação de unicidade: um cidadão só pode ter um cadastro ativo no déficit habitacional
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_DEFICIT_HABITACIONAL',
      validationFunction: 'validateCadastroDeficitHabitacional'
    },
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Coabitação', 'Outro'] },
        rendaFamiliar: { type: 'number', title: 'Renda Familiar (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        possuiImovel: { type: 'boolean', title: 'Possui Imóvel Próprio?' }
      },
      required: ['situacaoAtual', 'rendaFamiliar', 'numeroMoradores', 'possuiImovel']
    }
  },

  {
    name: 'Melhoria Habitacional',
    description: 'Solicitação de apoio para melhoria de condições habitacionais',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'MELHORIA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Propriedade ou Posse', 'Fotos da Moradia'],
    estimatedDays: 30,
    priority: 4,
    category: 'Assistência',
    icon: 'Tool',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel', maxLength: 300 },
        tipoMelhoria: { type: 'string', title: 'Tipo de Melhoria', enum: ['Instalação Elétrica', 'Instalação Hidráulica', 'Reboco', 'Pintura', 'Cobertura', 'Piso', 'Banheiro', 'Outro'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' },
        urgencia: { type: 'string', title: 'Nível de Urgência', enum: ['Baixa', 'Média', 'Alta'] }
      },
      required: ['enderecoImovel', 'tipoMelhoria', 'descricaoProblema', 'urgencia']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (5) ==========

  {
    name: 'Certidão de Regularidade Fundiária',
    description: 'Emissão de certidão de regularidade fundiária (usa dados do perfil do cidadão)',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#0891b2'
  },

  {
    name: 'Declaração de Residência',
    description: 'Emissão de declaração de residência (usa dados do perfil do cidadão)',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#0891b2'
  },

  {
    name: 'Laudo de Vistoria Habitacional',
    description: 'Emissão de laudo técnico de vistoria (usa dados do perfil do cidadão)',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 20,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#0891b2'
  },

  {
    name: 'Aluguel Social - Consulta de Elegibilidade',
    description: 'Consulta de elegibilidade para aluguel social (usa dados do perfil do cidadão)',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 2,
    category: 'Consultas',
    icon: 'Search',
    color: '#155e75'
  },

  {
    name: 'Certidão de Participação em Programa Habitacional',
    description: 'Emissão de certidão de participação em programa habitacional (usa dados do perfil do cidadão)',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 2,
    category: 'Certidões',
    icon: 'Award',
    color: '#0e7490'
  }
];
