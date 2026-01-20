/**
 * SEED DE SERVIÇOS - SECRETARIA DE TRANSPORTES E TRÂNSITO
 * Total: 20 serviços (10 CAPTURA_COMPLETA + 6 SOLICITACAO_SIMPLES + 4 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const transportTransitServices: ServiceDefinition[] = [
  // ========== CAPTURA_COMPLETA (10) ==========

  {
    name: 'Defesa de Autuação de Trânsito',
    description: 'Apresente defesa contra auto de infração de trânsito',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'DEFESA_AUTUACAO',
    requiresDocuments: true,
    requiredDocuments: ['CNH', 'CRLV', 'Notificação de Autuação', 'Comprovantes (se houver)'],
    estimatedDays: 30,
    priority: 4,
    category: 'Infrações',
    icon: 'Shield',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        numeroAuto: { type: 'string', title: 'Número do Auto de Infração', maxLength: 20 },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        dataInfracao: { type: 'string', title: 'Data da Infração', format: 'date' },
        codigoInfracao: { type: 'string', title: 'Código da Infração', maxLength: 10 },
        tipoDefesa: { type: 'string', title: 'Tipo de Defesa', enum: ['Prévia', 'Recurso em 1ª Instância', 'Recurso em 2ª Instância'] },
        fundamentacao: { type: 'string', title: 'Fundamentação da Defesa', maxLength: 2000, widget: 'textarea' }
      },
      required: ['numeroAuto', 'placaVeiculo', 'dataInfracao', 'codigoInfracao', 'tipoDefesa', 'fundamentacao']
    }
  },

  {
    name: 'Credenciamento de Táxi',
    description: 'Solicite credenciamento para operar como taxista no município',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_TAXI',
    requiresDocuments: true,
    requiredDocuments: ['CNH Categoria B (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Taxista', 'Vistoria do Veículo'],
    estimatedDays: 45,
    priority: 3,
    category: 'Credenciamento',
    icon: 'Car',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        numeroCNH: { type: 'string', title: 'Número da CNH', maxLength: 11 },
        categoriaCNH: { type: 'string', title: 'Categoria da CNH', enum: ['B', 'C', 'D', 'E'] },
        validadeCNH: { type: 'string', title: 'Validade da CNH', format: 'date' },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        marcaModelo: { type: 'string', title: 'Marca/Modelo do Veículo', maxLength: 100 },
        anoFabricacao: { type: 'integer', title: 'Ano de Fabricação', minimum: 2010, maximum: 2030 },
        tipoProposta: { type: 'string', title: 'Tipo de Proposta', enum: ['Primeiro Credenciamento', 'Renovação', 'Substituição de Veículo'] }
      },
      required: ['numeroCNH', 'categoriaCNH', 'validadeCNH', 'placaVeiculo', 'marcaModelo', 'anoFabricacao', 'tipoProposta']
    }
  },

  {
    name: 'Credenciamento de Mototáxi',
    description: 'Solicite credenciamento para operar como mototaxista',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_MOTOTAXI',
    requiresDocuments: true,
    requiredDocuments: ['CNH Categoria A (mínimo)', 'Certidão de Antecedentes Criminais', 'Comprovante de Residência', 'Curso de Formação de Mototaxista', 'Vistoria da Motocicleta'],
    estimatedDays: 45,
    priority: 3,
    category: 'Credenciamento',
    icon: 'Bike',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        numeroCNH: { type: 'string', title: 'Número da CNH', maxLength: 11 },
        categoriaCNH: { type: 'string', title: 'Categoria da CNH', enum: ['A', 'AB'] },
        validadeCNH: { type: 'string', title: 'Validade da CNH', format: 'date' },
        placaMotocicleta: { type: 'string', title: 'Placa da Motocicleta', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        marcaModelo: { type: 'string', title: 'Marca/Modelo', maxLength: 100 },
        anoFabricacao: { type: 'integer', title: 'Ano de Fabricação', minimum: 2010, maximum: 2030 },
        cilindrada: { type: 'integer', title: 'Cilindrada (cc)', minimum: 125 }
      },
      required: ['numeroCNH', 'categoriaCNH', 'validadeCNH', 'placaMotocicleta', 'marcaModelo', 'anoFabricacao', 'cilindrada']
    }
  },

  {
    name: 'Credenciamento de Transporte Escolar',
    description: 'Solicite credenciamento para operar transporte escolar',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CREDENCIAMENTO_TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['CNH Categoria D', 'Certidão de Antecedentes Criminais', 'Curso de Transporte Escolar', 'Vistoria do Veículo', 'CRLV', 'Seguro Obrigatório'],
    estimatedDays: 60,
    priority: 4,
    category: 'Credenciamento',
    icon: 'Bus',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        numeroCNH: { type: 'string', title: 'Número da CNH', maxLength: 11 },
        categoriaCNH: { type: 'string', title: 'Categoria da CNH', enum: ['D', 'E'] },
        validadeCNH: { type: 'string', title: 'Validade da CNH', format: 'date' },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        marcaModelo: { type: 'string', title: 'Marca/Modelo do Veículo', maxLength: 100 },
        anoFabricacao: { type: 'integer', title: 'Ano de Fabricação', minimum: 2005, maximum: 2030 },
        capacidadePassageiros: { type: 'integer', title: 'Capacidade de Passageiros', minimum: 8, maximum: 50 },
        rotaPretendida: { type: 'string', title: 'Rota Pretendida', maxLength: 300, widget: 'textarea' }
      },
      required: ['numeroCNH', 'categoriaCNH', 'validadeCNH', 'placaVeiculo', 'marcaModelo', 'anoFabricacao', 'capacidadePassageiros', 'rotaPretendida']
    }
  },

  {
    name: 'Vistoria de Veículo de Transporte',
    description: 'Agende vistoria para veículos de transporte público ou escolar',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'VISTORIA_VEICULO',
    requiresDocuments: true,
    requiredDocuments: ['CRLV', 'Comprovante de Pagamento de Taxas'],
    estimatedDays: 15,
    priority: 4,
    category: 'Vistoria',
    icon: 'ClipboardCheck',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        tipoVeiculo: { type: 'string', title: 'Tipo de Veículo', enum: ['Táxi', 'Mototáxi', 'Transporte Escolar', 'Van', 'Micro-ônibus', 'Ônibus'] },
        marcaModelo: { type: 'string', title: 'Marca/Modelo', maxLength: 100 },
        anoFabricacao: { type: 'integer', title: 'Ano de Fabricação', minimum: 2000, maximum: 2030 },
        tipoVistoria: { type: 'string', title: 'Tipo de Vistoria', enum: ['Inicial', 'Renovação Anual', 'Substituição'] },
        dataPreferencial: { type: 'string', title: 'Data Preferencial para Vistoria', format: 'date' }
      },
      required: ['placaVeiculo', 'tipoVeiculo', 'marcaModelo', 'anoFabricacao', 'tipoVistoria']
    }
  },

  {
    name: 'Autorização para Evento em Via Pública',
    description: 'Solicite autorização para realização de evento em via pública (corrida, passeata, etc)',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_EVENTO_VIA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Seguro de Responsabilidade Civil', 'Alvará (se aplicável)'],
    estimatedDays: 30,
    priority: 3,
    category: 'Autorizações',
    icon: 'Flag',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Corrida de Rua', 'Caminhada', 'Passeata', 'Manifestação', 'Desfile', 'Bloco Carnavalesco', 'Outro'] },
        dataEvento: { type: 'string', title: 'Data do Evento', format: 'date' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioTermino: { type: 'string', title: 'Horário de Término', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        localPercurso: { type: 'string', title: 'Local/Percurso', maxLength: 500, widget: 'textarea' },
        numeroParticipantes: { type: 'integer', title: 'Número Estimado de Participantes', minimum: 1 },
        necessitaInterdicao: { type: 'boolean', title: 'Necessita Interdição Total de Vias' },
        responsavelEvento: { type: 'string', title: 'Nome do Responsável pelo Evento', maxLength: 200 },
        telefoneResponsavel: { type: 'string', title: 'Telefone do Responsável', pattern: '^\\d{10,11}$', maxLength: 11 }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'horarioInicio', 'horarioTermino', 'localPercurso', 'numeroParticipantes', 'responsavelEvento', 'telefoneResponsavel']
    }
  },

  {
    name: 'Solicitação de CNH Social',
    description: 'Inscreva-se no programa CNH Social para obtenção gratuita da carteira de motorista',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CNH_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Renda Familiar'],
    estimatedDays: 45,
    priority: 4,
    category: 'Programas Sociais',
    icon: 'IdCard',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_familyincome'],
      properties: {
        categoriaDesejada: { type: 'string', title: 'Categoria de CNH Desejada', enum: ['A (Motos)', 'B (Carros)', 'AB (Motos e Carros)'] },
        rendaFamiliarPerCapita: { type: 'number', title: 'Renda Familiar Per Capita (R$)', minimum: 0 },
        participaProgramaSocial: { type: 'boolean', title: 'Participa de Programa Social (Bolsa Família, etc)' },
        nomeProgramaSocial: { type: 'string', title: 'Nome do Programa Social', maxLength: 200 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['categoriaDesejada', 'rendaFamiliarPerCapita', 'participaProgramaSocial', 'motivoSolicitacao']
    }
  },

  {
    name: 'Renovação de Credenciamento de Táxi/Mototáxi',
    description: 'Renove seu credenciamento de táxi ou mototáxi',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'RENOVACAO_CREDENCIAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNH Atualizada', 'CRLV Atualizado', 'Vistoria em Dia', 'Certidão Negativa de Multas'],
    estimatedDays: 20,
    priority: 3,
    category: 'Credenciamento',
    icon: 'RotateCw',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        numeroCredencial: { type: 'string', title: 'Número da Credencial Atual', maxLength: 20 },
        tipoCredencial: { type: 'string', title: 'Tipo de Credencial', enum: ['Táxi', 'Mototáxi'] },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        validadeVistoria: { type: 'string', title: 'Validade da Última Vistoria', format: 'date' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['numeroCredencial', 'tipoCredencial', 'placaVeiculo', 'validadeVistoria']
    }
  },

  {
    name: 'Solicitação de Faixa Exclusiva para Carga/Descarga',
    description: 'Solicite autorização para faixa exclusiva de carga e descarga',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'FAIXA_CARGA_DESCARGA',
    requiresDocuments: true,
    requiredDocuments: ['Alvará de Funcionamento', 'Planta de Localização'],
    estimatedDays: 30,
    priority: 3,
    category: 'Autorizações',
    icon: 'Truck',
    color: '#737373',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{14}$', maxLength: 14 },
        endereco: { type: 'string', title: 'Endereço Completo', maxLength: 300 },
        metrosNecessarios: { type: 'integer', title: 'Metros Necessários', minimum: 5, maximum: 50 },
        horarioUtilizacao: { type: 'string', title: 'Horário de Utilização', maxLength: 100 },
        tipoAtividade: { type: 'string', title: 'Tipo de Atividade do Estabelecimento', maxLength: 200 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeEstabelecimento', 'cnpj', 'endereco', 'metrosNecessarios', 'horarioUtilizacao', 'tipoAtividade', 'justificativa']
    }
  },

  {
    name: 'Transferência de Ponto de Táxi',
    description: 'Solicite transferência de ponto de táxi',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TRANSFERENCIA_PONTO_TAXI',
    requiresDocuments: true,
    requiredDocuments: ['Credencial de Taxista', 'Certidão Negativa de Multas', 'Justificativa'],
    estimatedDays: 30,
    priority: 3,
    category: 'Transferências',
    icon: 'MapPin',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        numeroCredencial: { type: 'string', title: 'Número da Credencial', maxLength: 20 },
        pontoAtual: { type: 'string', title: 'Ponto Atual', maxLength: 300 },
        pontoDesejado: { type: 'string', title: 'Ponto Desejado', maxLength: 300 },
        motivoTransferencia: { type: 'string', title: 'Motivo da Transferência', maxLength: 500, widget: 'textarea' }
      },
      required: ['numeroCredencial', 'pontoAtual', 'pontoDesejado', 'motivoTransferencia']
    }
  },

  // ========== SOLICITACAO_SIMPLES (6) ==========

  {
    name: 'Solicitação de Sinalização de Trânsito',
    description: 'Solicite instalação ou reparo de placa de sinalização',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SINALIZACAO_TRANSITO',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 4,
    category: 'Sinalização',
    icon: 'Octagon',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Instalação de Placa Nova', 'Reparo de Placa Existente', 'Pintura de Faixa', 'Pintura de Solo'] },
        tipoSinalizacao: { type: 'string', title: 'Tipo de Sinalização', enum: ['Placa de Pare', 'Placa de Velocidade', 'Placa de Proibido Estacionar', 'Faixa de Pedestres', 'Lombada', 'Outra'] },
        endereco: { type: 'string', title: 'Endereço/Local', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoSolicitacao', 'tipoSinalizacao', 'endereco', 'descricao']
    }
  },

  {
    name: 'Solicitação de Semáforo',
    description: 'Solicite instalação ou manutenção de semáforo',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SOLICITACAO_SEMAFORO',
    requiresDocuments: false,
    estimatedDays: 60,
    priority: 4,
    category: 'Sinalização',
    icon: 'TrafficCone',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Instalação de Semáforo Novo', 'Manutenção de Semáforo', 'Ajuste de Tempo'] },
        endereco: { type: 'string', title: 'Cruzamento/Endereço', maxLength: 300 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoSolicitacao', 'endereco', 'justificativa']
    }
  },

  {
    name: 'Solicitação de Lombada/Redutor de Velocidade',
    description: 'Solicite instalação de lombada ou redutor de velocidade',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SOLICITACAO_LOMBADA',
    requiresDocuments: false,
    estimatedDays: 45,
    priority: 4,
    category: 'Sinalização',
    icon: 'TriangleAlert',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoReducao: { type: 'string', title: 'Tipo de Redutor', enum: ['Lombada Física', 'Sonorizador (Tachas)', 'Faixa Elevada'] },
        endereco: { type: 'string', title: 'Rua/Endereço', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        justificativa: { type: 'string', title: 'Justificativa (acidentes, escola, hospital, etc)', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoReducao', 'endereco', 'justificativa']
    }
  },

  {
    name: 'Denúncia de Veículo Abandonado',
    description: 'Denuncie veículo abandonado em via pública',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_VEICULO_ABANDONADO',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Denúncias',
    icon: 'AlertCircle',
    color: '#64748b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        placaVeiculo: { type: 'string', title: 'Placa do Veículo (se visível)', maxLength: 7 },
        tipoVeiculo: { type: 'string', title: 'Tipo de Veículo', enum: ['Carro', 'Moto', 'Caminhão', 'Van', 'Ônibus', 'Outro'] },
        endereco: { type: 'string', title: 'Endereço Exato', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tempoAproximado: { type: 'string', title: 'Tempo Aproximado Abandonado', enum: ['Menos de 1 semana', '1-2 semanas', '2-4 semanas', 'Mais de 1 mês', 'Não sei'] },
        descricao: { type: 'string', title: 'Descrição/Estado do Veículo', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoVeiculo', 'endereco', 'descricao']
    }
  },

  {
    name: 'Solicitação de Vaga Especial (Idoso/PcD)',
    description: 'Solicite vaga de estacionamento especial para idoso ou pessoa com deficiência',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'VAGA_ESPECIAL',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico (PcD) ou Documento de Identidade (Idoso +60)', 'CRLV', 'Comprovante de Residência'],
    estimatedDays: 30,
    priority: 4,
    category: 'Acessibilidade',
    icon: 'Accessibility',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoVaga: { type: 'string', title: 'Tipo de Vaga', enum: ['Pessoa com Deficiência', 'Idoso (60+ anos)'] },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        endereco: { type: 'string', title: 'Endereço Residencial', maxLength: 300 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoVaga', 'placaVeiculo', 'endereco', 'justificativa']
    }
  },

  {
    name: 'Reclamação sobre Trânsito',
    description: 'Registre reclamação sobre problemas de trânsito',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'RECLAMACAO_TRANSITO',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Reclamações',
    icon: 'MessageSquare',
    color: '#6366f1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoReclamacao: { type: 'string', title: 'Tipo de Reclamação', enum: ['Congestionamento', 'Sinalização Inadequada', 'Falta de Semáforo', 'Buraco na Via', 'Estacionamento Irregular', 'Outra'] },
        endereco: { type: 'string', title: 'Local', maxLength: 300 },
        descricao: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoReclamacao', 'endereco', 'descricao']
    }
  },

  // ========== CONSULTIVO (4) ==========

  {
    name: 'Consulta de Multas de Trânsito',
    description: 'Consulte suas multas de trânsito municipais',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Search',
    color: '#ef4444'
  },

  {
    name: 'Consulta de Pontos na CNH',
    description: 'Consulte a pontuação da sua CNH',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Info',
    color: '#f59e0b'
  },

  {
    name: 'Certidão Negativa de Multas Municipais',
    description: 'Emita certidão negativa de multas de trânsito municipais',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#10b981'
  },

  {
    name: 'Lista de Táxis/Mototáxis Credenciados',
    description: 'Consulte a lista de táxis e mototáxis credenciados no município',
    departmentCode: 'TRANSPORTES_TRANSITO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'List',
    color: '#06b6d4'
  }
];
