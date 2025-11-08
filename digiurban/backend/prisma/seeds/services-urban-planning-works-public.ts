/**
 * ============================================================================
 * FORMSCHEMAS - PLANEJAMENTO, OBRAS E SERVIÇOS PÚBLICOS
 * ============================================================================
 * 19 serviços com FormSchemas completos
 */

export const urbanPlanningWorksPublicServices = [
  // ========================================
  // PLANEJAMENTO URBANO (7 serviços)
  // ========================================
  {
    name: 'Atendimento de Planejamento Urbano',
    description: 'Atendimento geral sobre questões de planejamento urbano',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:ATENDIMENTOS_PLANEJAMENTO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Atendimento',
    icon: 'building',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        citizenName: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        citizenCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        citizenPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        citizenEmail: { type: 'string', format: 'email', title: 'E-mail' },
        subject: { type: 'string', title: 'Assunto', minLength: 5, maxLength: 200 },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4, minLength: 20, maxLength: 1000 },
        attendanceType: {
          type: 'string',
          title: 'Tipo de Atendimento',
          enum: ['INFORMACAO', 'CONSULTA', 'SOLICITACAO', 'RECLAMACAO'],
          enumNames: ['Informação', 'Consulta', 'Solicitação', 'Reclamação'],
          default: 'CONSULTA'
        },
        category: {
          type: 'string',
          title: 'Categoria',
          enum: ['ALVARA', 'CERTIDAO', 'PROJETO', 'FISCALIZACAO', 'OUTROS'],
          enumNames: ['Alvará', 'Certidão', 'Projeto', 'Fiscalização', 'Outros']
        }
      },
      required: ['citizenName', 'citizenCpf', 'citizenPhone', 'subject', 'description']
    }
  },
  {
    name: 'Aprovação de Projeto Arquitetônico',
    description: 'Aprovação de projetos arquitetônicos para construção ou reforma',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:APROVACAO_PROJETO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'RRT/ART do Responsável Técnico', 'Matrícula do Imóvel'],
    estimatedDays: 30,
    priority: 5,
    category: 'Aprovação',
    icon: 'file-check',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        ownerName: { type: 'string', title: 'Nome do Proprietário', minLength: 3, maxLength: 200 },
        ownerCpf: { type: 'string', title: 'CPF do Proprietário', pattern: '^\\d{11}$' },
        ownerPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        ownerEmail: { type: 'string', format: 'email', title: 'E-mail' },
        propertyAddress: { type: 'string', title: 'Endereço do Imóvel', minLength: 10 },
        propertyNumber: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        lotNumber: { type: 'string', title: 'Número do Lote' },
        block: { type: 'string', title: 'Quadra' },
        subdivision: { type: 'string', title: 'Loteamento' },
        registryNumber: { type: 'string', title: 'Matrícula do Imóvel' },
        projectType: {
          type: 'string',
          title: 'Tipo de Projeto',
          enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED'],
          enumNames: ['Residencial', 'Comercial', 'Industrial', 'Misto']
        },
        projectCategory: {
          type: 'string',
          title: 'Categoria',
          enum: ['NEW', 'MODIFICATION', 'REGULARIZATION'],
          enumNames: ['Novo', 'Modificação', 'Regularização'],
          default: 'NEW'
        },
        constructionArea: { type: 'number', title: 'Área a Construir (m²)', minimum: 1, maximum: 100000 },
        totalArea: { type: 'number', title: 'Área Total do Terreno (m²)', minimum: 1, maximum: 1000000 },
        floors: { type: 'integer', title: 'Número de Pavimentos', minimum: 1, maximum: 50 },
        units: { type: 'integer', title: 'Número de Unidades', minimum: 1 },
        architectName: { type: 'string', title: 'Nome do Arquiteto/Engenheiro', minLength: 3 },
        architectCau: { type: 'string', title: 'CAU/CREA', description: 'Número do registro profissional' },
        architectPhone: { type: 'string', title: 'Telefone do Responsável Técnico', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        rrtNumber: { type: 'string', title: 'Número da RRT/ART' },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['ownerName', 'ownerCpf', 'ownerPhone', 'propertyAddress', 'neighborhood', 'projectType', 'constructionArea', 'totalArea', 'floors', 'architectName', 'architectCau', 'architectPhone']
    }
  },
  {
    name: 'Alvará de Construção',
    description: 'Solicitação de alvará para construção, reforma ou ampliação',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:ALVARA_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['RG e CPF do Proprietário', 'Matrícula do Imóvel', 'Projeto Aprovado', 'ART/RRT', 'Comprovante de Pagamento'],
    estimatedDays: 20,
    priority: 5,
    category: 'Alvará',
    icon: 'file-certificate',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        ownerName: { type: 'string', title: 'Nome do Proprietário', minLength: 3, maxLength: 200 },
        ownerCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        ownerPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        ownerEmail: { type: 'string', format: 'email', title: 'E-mail' },
        propertyAddress: { type: 'string', title: 'Endereço', minLength: 10 },
        propertyNumber: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        lotNumber: { type: 'string', title: 'Lote' },
        block: { type: 'string', title: 'Quadra' },
        subdivision: { type: 'string', title: 'Loteamento' },
        registryNumber: { type: 'string', title: 'Matrícula do Imóvel' },
        projectType: {
          type: 'string',
          title: 'Tipo de Obra',
          enum: ['NEW_CONSTRUCTION', 'RENOVATION', 'EXPANSION', 'DEMOLITION'],
          enumNames: ['Construção Nova', 'Reforma', 'Ampliação', 'Demolição']
        },
        constructionArea: { type: 'number', title: 'Área a Construir (m²)', minimum: 1, maximum: 100000 },
        totalArea: { type: 'number', title: 'Área Total do Terreno (m²)', minimum: 1, maximum: 1000000 },
        floors: { type: 'integer', title: 'Número de Pavimentos', minimum: 1, maximum: 50 },
        rooms: { type: 'integer', title: 'Número de Cômodos', minimum: 1 },
        parking: { type: 'integer', title: 'Vagas de Garagem', minimum: 0 },
        engineerName: { type: 'string', title: 'Engenheiro/Arquiteto Responsável', minLength: 3 },
        engineerCrea: { type: 'string', title: 'CREA/CAU' },
        engineerPhone: { type: 'string', title: 'Telefone do Responsável Técnico', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        artNumber: { type: 'string', title: 'Número da ART/RRT' },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['ownerName', 'ownerCpf', 'ownerPhone', 'propertyAddress', 'neighborhood', 'projectType', 'constructionArea', 'totalArea', 'floors', 'engineerName', 'engineerCrea', 'engineerPhone']
    }
  },
  {
    name: 'Alvará de Funcionamento',
    description: 'Solicitação de alvará para funcionamento de estabelecimento comercial',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:ALVARA_FUNCIONAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['Contrato Social', 'CNPJ', 'Comprovante de Endereço', 'Laudo dos Bombeiros', 'Licença Sanitária'],
    estimatedDays: 15,
    priority: 5,
    category: 'Alvará',
    icon: 'store',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        companyName: { type: 'string', title: 'Razão Social', minLength: 3 },
        tradeName: { type: 'string', title: 'Nome Fantasia' },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$' },
        ownerName: { type: 'string', title: 'Nome do Proprietário', minLength: 3 },
        ownerCpf: { type: 'string', title: 'CPF do Proprietário', pattern: '^\\d{11}$' },
        phone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        number: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        complement: { type: 'string', title: 'Complemento' },
        zipCode: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
        activityType: { type: 'string', title: 'Tipo de Atividade', minLength: 3 },
        cnae: { type: 'string', title: 'CNAE' },
        businessArea: { type: 'number', title: 'Área do Estabelecimento (m²)', minimum: 1 },
        employees: { type: 'integer', title: 'Número de Funcionários', minimum: 0 },
        operatingHours: { type: 'string', title: 'Horário de Funcionamento' },
        hasFireSafety: { type: 'boolean', title: 'Possui Laudo dos Bombeiros?', default: false },
        hasSanitaryLicense: { type: 'boolean', title: 'Possui Licença Sanitária?', default: false },
        hasEnvironmentalLic: { type: 'boolean', title: 'Possui Licença Ambiental?', default: false },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['companyName', 'cnpj', 'ownerName', 'ownerCpf', 'phone', 'address', 'neighborhood', 'activityType']
    }
  },
  {
    name: 'Solicitação de Certidão',
    description: 'Solicitação de certidões urbanas diversas',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:SOLICITACAO_CERTIDAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Certidão',
    icon: 'file-text',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        certificateType: {
          type: 'string',
          title: 'Tipo de Certidão',
          enum: ['USO_SOLO', 'LOCALIZACAO', 'NUMERACAO', 'REGULARIDADE', 'OUTROS'],
          enumNames: ['Uso do Solo', 'Localização', 'Numeração', 'Regularidade', 'Outros']
        },
        purpose: { type: 'string', title: 'Finalidade' },
        propertyAddress: { type: 'string', title: 'Endereço do Imóvel' },
        propertyRegistration: { type: 'string', title: 'Matrícula do Imóvel' },
        lotNumber: { type: 'string', title: 'Lote' },
        block: { type: 'string', title: 'Quadra' },
        urgency: { type: 'boolean', title: 'Solicitação Urgente?', default: false },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['requesterName', 'requesterCpf', 'requesterPhone', 'certificateType']
    }
  },
  {
    name: 'Denúncia de Construção Irregular',
    description: 'Denúncia de construções sem alvará ou em desacordo com o projeto aprovado',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:DENUNCIA_CONSTRUCAO_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Fiscalização',
    icon: 'alert-triangle',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        reporterName: { type: 'string', title: 'Nome do Denunciante (opcional)' },
        reporterCpf: { type: 'string', title: 'CPF (opcional)', pattern: '^\\d{11}$' },
        reporterPhone: { type: 'string', title: 'Telefone (opcional)', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        isAnonymous: { type: 'boolean', title: 'Denúncia Anônima?', default: false },
        address: { type: 'string', title: 'Endereço da Construção Irregular', minLength: 10 },
        number: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        violationType: {
          type: 'string',
          title: 'Tipo de Irregularidade',
          enum: ['SEM_ALVARA', 'AREA_EXCEDIDA', 'RECUO_IRREGULAR', 'ALTURA_IRREGULAR'],
          enumNames: ['Sem Alvará', 'Área Excedida', 'Recuo Irregular', 'Altura Irregular']
        },
        description: { type: 'string', title: 'Descrição Detalhada', widget: 'textarea', rows: 5, minLength: 20, maxLength: 1000 },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['address', 'neighborhood', 'violationType', 'description']
    }
  },
  {
    name: 'Cadastro de Loteamento',
    description: 'Cadastro e regularização de loteamentos',
    departmentCode: 'PLANEJAMENTO',
    serviceType: 'COM_DADOS',
    moduleType: 'PLANEJAMENTO:CADASTRO_LOTEAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Loteamento', 'Matrícula do Terreno', 'ART/RRT', 'Licença Ambiental'],
    estimatedDays: 60,
    priority: 5,
    category: 'Loteamento',
    icon: 'grid',
    color: '#795548',
    formSchema: {
      type: 'object',
      properties: {
        subdivisionName: { type: 'string', title: 'Nome do Loteamento', minLength: 3 },
        ownerName: { type: 'string', title: 'Nome do Proprietário', minLength: 3 },
        ownerCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        ownerCnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$' },
        phone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        location: { type: 'string', title: 'Localização', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        totalArea: { type: 'number', title: 'Área Total (m²)', minimum: 1 },
        totalLots: { type: 'integer', title: 'Número Total de Lotes', minimum: 1 },
        publicAreaPercent: { type: 'number', title: 'Percentual de Área Pública (%)', minimum: 0, maximum: 100 },
        greenAreaPercent: { type: 'number', title: 'Percentual de Área Verde (%)', minimum: 0, maximum: 100 },
        hasInfrastructure: { type: 'boolean', title: 'Possui Infraestrutura Completa?', default: false },
        hasPavement: { type: 'boolean', title: 'Possui Pavimentação?', default: false },
        hasWater: { type: 'boolean', title: 'Possui Rede de Água?', default: false },
        hasSewage: { type: 'boolean', title: 'Possui Rede de Esgoto?', default: false },
        hasElectricity: { type: 'boolean', title: 'Possui Rede Elétrica?', default: false },
        engineerName: { type: 'string', title: 'Engenheiro Responsável', minLength: 3 },
        engineerCrea: { type: 'string', title: 'CREA' },
        artNumber: { type: 'string', title: 'Número da ART' },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['subdivisionName', 'ownerName', 'phone', 'location', 'neighborhood', 'totalArea', 'totalLots', 'engineerName', 'engineerCrea']
    }
  },

  // ========================================
  // OBRAS PÚBLICAS (5 serviços)
  // ========================================
  {
    name: 'Atendimento de Obras Públicas',
    description: 'Atendimento geral sobre obras públicas e infraestrutura',
    departmentCode: 'OBRAS',
    serviceType: 'COM_DADOS',
    moduleType: 'OBRAS:ATENDIMENTOS_OBRAS',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Atendimento',
    icon: 'hard-hat',
    color: '#FF9800',
    formSchema: {
      type: 'object',
      properties: {
        citizenName: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        citizenCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        citizenPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        citizenEmail: { type: 'string', format: 'email', title: 'E-mail' },
        subject: { type: 'string', title: 'Assunto', minLength: 5, maxLength: 200 },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4, minLength: 20, maxLength: 1000 },
        attendanceType: {
          type: 'string',
          title: 'Tipo',
          enum: ['SOLICITACAO', 'RECLAMACAO', 'SUGESTAO', 'INFORMACAO'],
          enumNames: ['Solicitação', 'Reclamação', 'Sugestão', 'Informação']
        },
        category: {
          type: 'string',
          title: 'Categoria',
          enum: ['PAVIMENTACAO', 'DRENAGEM', 'PONTE', 'CALCADA'],
          enumNames: ['Pavimentação', 'Drenagem', 'Ponte/Viaduto', 'Calçada']
        },
        location: { type: 'string', title: 'Localização' },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' }
      },
      required: ['citizenName', 'citizenCpf', 'citizenPhone', 'subject', 'description']
    }
  },
  {
    name: 'Solicitação de Reparo de Via',
    description: 'Solicitação de reparos em vias, calçadas e pavimentação',
    departmentCode: 'OBRAS',
    serviceType: 'COM_DADOS',
    moduleType: 'OBRAS:SOLICITACAO_REPARO_VIA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Reparo',
    icon: 'wrench',
    color: '#FF9800',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        number: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        problemType: {
          type: 'string',
          title: 'Tipo de Problema',
          enum: ['BURACO', 'RACHADURA', 'AFUNDAMENTO', 'QUEBRA_CALÇADA'],
          enumNames: ['Buraco na Via', 'Rachadura', 'Afundamento', 'Calçada Quebrada']
        },
        severity: {
          type: 'string',
          title: 'Gravidade',
          enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'],
          enumNames: ['Baixa', 'Média', 'Alta', 'Crítica'],
          default: 'MEDIA'
        },
        description: { type: 'string', title: 'Descrição Detalhada', widget: 'textarea', rows: 4, minLength: 20, maxLength: 1000 },
        affectedArea: { type: 'number', title: 'Área Afetada (m² aproximado)', minimum: 0 },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'address', 'neighborhood', 'problemType', 'severity', 'description']
    }
  },
  {
    name: 'Vistoria Técnica de Obras',
    description: 'Solicitação de vistoria técnica em obras públicas ou particulares',
    departmentCode: 'OBRAS',
    serviceType: 'COM_DADOS',
    moduleType: 'OBRAS:VISTORIA_TECNICA_OBRAS',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Vistoria',
    icon: 'search',
    color: '#FF9800',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterCnpj: { type: 'string', title: 'CNPJ (se empresa)', pattern: '^\\d{14}$' },
        phone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        inspectionType: {
          type: 'string',
          title: 'Tipo de Vistoria',
          enum: ['OBRA_PUBLICA', 'OBRA_PARTICULAR', 'SINISTRO', 'LAUDO'],
          enumNames: ['Obra Pública', 'Obra Particular', 'Sinistro', 'Laudo Técnico']
        },
        purpose: { type: 'string', title: 'Finalidade da Vistoria', minLength: 10 },
        address: { type: 'string', title: 'Endereço da Vistoria', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        preferredDate: { type: 'string', format: 'date', title: 'Data Preferencial' },
        urgency: { type: 'boolean', title: 'Urgente?', default: false },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['requesterName', 'phone', 'inspectionType', 'purpose', 'address', 'neighborhood']
    }
  },
  {
    name: 'Cadastro de Obra Pública',
    description: 'Cadastro e acompanhamento de obras públicas',
    departmentCode: 'OBRAS',
    serviceType: 'COM_DADOS',
    moduleType: 'OBRAS:CADASTRO_OBRA_PUBLICA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto da Obra', 'Orçamento', 'Contrato'],
    estimatedDays: 5,
    priority: 5,
    category: 'Cadastro',
    icon: 'folder-plus',
    color: '#FF9800',
    formSchema: {
      type: 'object',
      properties: {
        workName: { type: 'string', title: 'Nome da Obra', minLength: 5 },
        workType: {
          type: 'string',
          title: 'Tipo de Obra',
          enum: ['PAVIMENTACAO', 'DRENAGEM', 'PONTE', 'ESCOLA', 'POSTO_SAUDE'],
          enumNames: ['Pavimentação', 'Drenagem', 'Ponte/Viaduto', 'Escola', 'Posto de Saúde']
        },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4, minLength: 20 },
        location: { type: 'string', title: 'Localização', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        address: { type: 'string', title: 'Endereço Específico' },
        budget: { type: 'number', title: 'Orçamento (R$)', minimum: 0 },
        contractedCompany: { type: 'string', title: 'Empresa Contratada' },
        cnpj: { type: 'string', title: 'CNPJ da Empresa', pattern: '^\\d{14}$' },
        contractNumber: { type: 'string', title: 'Número do Contrato' },
        startDate: { type: 'string', format: 'date', title: 'Data de Início' },
        expectedEndDate: { type: 'string', format: 'date', title: 'Data Prevista de Término' },
        engineerName: { type: 'string', title: 'Engenheiro Responsável' },
        engineerCrea: { type: 'string', title: 'CREA' },
        observations: { type: 'string', title: 'Observações', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['workName', 'workType', 'description', 'location', 'neighborhood']
    }
  },
  {
    name: 'Inspeção de Obra',
    description: 'Registro de inspeções em obras públicas',
    departmentCode: 'OBRAS',
    serviceType: 'COM_DADOS',
    moduleType: 'OBRAS:INSPECAO_OBRA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 4,
    category: 'Inspeção',
    icon: 'clipboard-check',
    color: '#FF9800',
    formSchema: {
      type: 'object',
      properties: {
        workName: { type: 'string', title: 'Nome da Obra', minLength: 5 },
        workLocation: { type: 'string', title: 'Localização da Obra', minLength: 10 },
        contractNumber: { type: 'string', title: 'Número do Contrato' },
        inspectionDate: { type: 'string', format: 'date', title: 'Data da Inspeção' },
        inspectorName: { type: 'string', title: 'Nome do Inspetor', minLength: 3 },
        inspectorRole: { type: 'string', title: 'Cargo do Inspetor' },
        progressPercent: { type: 'number', title: 'Percentual de Conclusão (%)', minimum: 0, maximum: 100 },
        qualityRating: {
          type: 'string',
          title: 'Avaliação da Qualidade',
          enum: ['EXCELENTE', 'BOM', 'REGULAR', 'RUIM'],
          enumNames: ['Excelente', 'Bom', 'Regular', 'Ruim']
        },
        findings: { type: 'string', title: 'Constatações', widget: 'textarea', rows: 5, minLength: 20 },
        recommendations: { type: 'string', title: 'Recomendações', widget: 'textarea', rows: 3 },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false },
        requiresAction: { type: 'boolean', title: 'Requer Ação Corretiva?', default: false },
        actionDeadline: { type: 'string', format: 'date', title: 'Prazo para Correção' },
        nextInspection: { type: 'string', format: 'date', title: 'Data da Próxima Inspeção' },
        observations: { type: 'string', title: 'Observações Gerais', widget: 'textarea', rows: 3, maxLength: 500 }
      },
      required: ['workName', 'workLocation', 'inspectionDate', 'inspectorName', 'progressPercent', 'qualityRating', 'findings']
    }
  },

  // ========================================
  // SERVIÇOS PÚBLICOS (7 serviços)
  // ========================================
  {
    name: 'Atendimento de Serviços Públicos',
    description: 'Atendimento geral sobre serviços públicos de manutenção urbana',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:ATENDIMENTOS_SERVICOS_PUBLICOS',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 3,
    category: 'Atendimento',
    icon: 'users',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        citizenName: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
        citizenCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        citizenPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        citizenEmail: { type: 'string', format: 'email', title: 'E-mail' },
        subject: { type: 'string', title: 'Assunto', minLength: 5, maxLength: 200 },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4, minLength: 20, maxLength: 1000 },
        attendanceType: {
          type: 'string',
          title: 'Tipo',
          enum: ['SOLICITACAO', 'RECLAMACAO', 'SUGESTAO'],
          enumNames: ['Solicitação', 'Reclamação', 'Sugestão']
        },
        category: {
          type: 'string',
          title: 'Categoria',
          enum: ['ILUMINACAO', 'LIMPEZA', 'CAPINA', 'PODA'],
          enumNames: ['Iluminação Pública', 'Limpeza Urbana', 'Capina', 'Poda de Árvores']
        },
        location: { type: 'string', title: 'Localização' },
        neighborhood: { type: 'string', title: 'Bairro' }
      },
      required: ['citizenName', 'citizenCpf', 'citizenPhone', 'subject', 'description']
    }
  },
  {
    name: 'Iluminação Pública',
    description: 'Solicitação de manutenção ou instalação de iluminação pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:ILUMINACAO_PUBLICA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Iluminação',
    icon: 'lightbulb',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        requestType: {
          type: 'string',
          title: 'Tipo de Solicitação',
          enum: ['MANUTENCAO', 'INSTALACAO', 'AMPLIACAO'],
          enumNames: ['Manutenção', 'Instalação Nova', 'Ampliação']
        },
        problemType: {
          type: 'string',
          title: 'Problema (se manutenção)',
          enum: ['LAMPADA_APAGADA', 'LAMPADA_PISCANDO', 'POSTE_DANIFICADO', 'FIACAO_EXPOSTA'],
          enumNames: ['Lâmpada Apagada', 'Lâmpada Piscando', 'Poste Danificado', 'Fiação Exposta']
        },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        number: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        description: { type: 'string', title: 'Descrição Detalhada', widget: 'textarea', rows: 4 },
        urgency: { type: 'boolean', title: 'Urgente?', default: false },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'requestType', 'address', 'neighborhood', 'description']
    }
  },
  {
    name: 'Limpeza Urbana',
    description: 'Solicitação de serviços de limpeza e varrição',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:LIMPEZA_URBANA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Limpeza',
    icon: 'trash-2',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        cleaningType: {
          type: 'string',
          title: 'Tipo de Limpeza',
          enum: ['VARRICAO', 'LIMPEZA_TERRENO', 'COLETA_LIXO'],
          enumNames: ['Varrição de Rua', 'Limpeza de Terreno', 'Coleta de Lixo Irregular']
        },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4 },
        estimatedArea: { type: 'number', title: 'Área Estimada (m²)', minimum: 0 },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'cleaningType', 'address', 'neighborhood', 'description']
    }
  },
  {
    name: 'Coleta Especial',
    description: 'Solicitação de coleta especial de entulho, móveis e eletrônicos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:COLETA_ESPECIAL',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Coleta',
    icon: 'truck',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        collectionType: {
          type: 'string',
          title: 'Tipo de Material',
          enum: ['ENTULHO', 'MOVEIS', 'ELETRONICOS', 'PODAS'],
          enumNames: ['Entulho de Construção', 'Móveis Velhos', 'Eletrônicos', 'Galhos e Podas']
        },
        address: { type: 'string', title: 'Endereço para Coleta', minLength: 10 },
        number: { type: 'string', title: 'Número' },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        itemDescription: { type: 'string', title: 'Descrição dos Itens', widget: 'textarea', rows: 3 },
        estimatedVolume: {
          type: 'string',
          title: 'Volume Estimado',
          enum: ['PEQUENO', 'MEDIO', 'GRANDE'],
          enumNames: ['Pequeno (até 1m³)', 'Médio (1-3m³)', 'Grande (mais de 3m³)']
        },
        itemQuantity: { type: 'integer', title: 'Quantidade de Itens', minimum: 1 },
        preferredDate: { type: 'string', format: 'date', title: 'Data Preferencial' }
      },
      required: ['requesterName', 'requesterPhone', 'collectionType', 'address', 'neighborhood', 'itemDescription']
    }
  },
  {
    name: 'Solicitação de Capina',
    description: 'Solicitação de serviço de capina em terrenos e vias',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:SOLICITACAO_CAPINA',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Capina',
    icon: 'scissors',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        areaType: {
          type: 'string',
          title: 'Tipo de Área',
          enum: ['CALCADA', 'TERRENO', 'PRACA', 'RUA'],
          enumNames: ['Calçada', 'Terreno Baldio', 'Praça', 'Rua/Via']
        },
        estimatedArea: { type: 'number', title: 'Área Estimada (m²)', minimum: 0 },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4 },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'address', 'neighborhood', 'areaType', 'description']
    }
  },
  {
    name: 'Solicitação de Desobstrução',
    description: 'Solicitação de desobstrução de bueiros e galerias',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:SOLICITACAO_DESOBSTRUCAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Drenagem',
    icon: 'droplet',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        obstructionType: {
          type: 'string',
          title: 'Tipo de Obstrução',
          enum: ['BUEIRO', 'GALERIA', 'SARJETA', 'CORREGO'],
          enumNames: ['Bueiro', 'Galeria Pluvial', 'Sarjeta', 'Córrego']
        },
        severity: {
          type: 'string',
          title: 'Nível de Obstrução',
          enum: ['PARCIAL', 'TOTAL'],
          enumNames: ['Parcial', 'Total']
        },
        description: { type: 'string', title: 'Descrição', widget: 'textarea', rows: 4 },
        causingFlooding: { type: 'boolean', title: 'Está causando alagamento?', default: false },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'address', 'neighborhood', 'obstructionType', 'severity', 'description']
    }
  },
  {
    name: 'Solicitação de Poda',
    description: 'Solicitação de poda de árvores',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SERVICOS_PUBLICOS:SOLICITACAO_PODA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Poda',
    icon: 'tree-deciduous',
    color: '#607D8B',
    formSchema: {
      type: 'object',
      properties: {
        requesterName: { type: 'string', title: 'Nome do Solicitante', minLength: 3 },
        requesterCpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$' },
        requesterPhone: { type: 'string', title: 'Telefone', pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
        requesterEmail: { type: 'string', format: 'email', title: 'E-mail' },
        address: { type: 'string', title: 'Endereço', minLength: 10 },
        neighborhood: { type: 'string', title: 'Bairro' },
        reference: { type: 'string', title: 'Ponto de Referência' },
        coordinates: { type: 'string', title: 'Coordenadas GPS (opcional)' },
        treeType: { type: 'string', title: 'Tipo/Espécie da Árvore (se souber)' },
        treeHeight: {
          type: 'string',
          title: 'Porte da Árvore',
          enum: ['PEQUENA', 'MEDIA', 'GRANDE'],
          enumNames: ['Pequena (até 3m)', 'Média (3-8m)', 'Grande (acima de 8m)']
        },
        pruningReason: {
          type: 'string',
          title: 'Motivo da Poda',
          enum: ['RISCO_QUEDA', 'BLOQUEIO_FIO', 'BLOQUEIO_VIA', 'MANUTENCAO'],
          enumNames: ['Risco de Queda', 'Bloqueio de Fiação', 'Bloqueio de Via/Calçada', 'Manutenção Preventiva']
        },
        urgency: { type: 'boolean', title: 'Situação de Risco Urgente?', default: false },
        nearPowerLines: { type: 'boolean', title: 'Próximo a Fiação Elétrica?', default: false },
        hasPhotos: { type: 'boolean', title: 'Possui Fotos?', default: false }
      },
      required: ['requesterName', 'requesterPhone', 'address', 'neighborhood', 'pruningReason']
    }
  }
];
