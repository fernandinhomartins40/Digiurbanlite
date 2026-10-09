/**
 * Contrato de campos de cada porta de app (2026-10-09).
 *
 * O app lê o formulário do pedido pelo NOME INTERNO do campo (`tipoMaquina`,
 * `nomeAluno`...). Serviço criado à mão tem campos `campo_1728...` e serviço
 * criado por sugestão tem `tipo_maquina` — nenhum bate, e o caso chegava ao
 * app vazio. Aqui cada porta diz QUE dado precisa (papel), com o nome que o
 * app lê (`key`) e as palavras pelas quais a pessoa costuma escrever o título
 * do campo (`synonyms`). O leitor (`services/apps/app-intelligence.service.ts`)
 * acha o campo pelo título e entrega ao app no nome que ele entende.
 *
 * `keywords` = palavras do NOME do serviço que indicam esta porta (sugestão de
 * destino ao criar serviço, sem IA).
 *
 * Sinônimos e palavras-chave em minúsculas e sem acento. Um sinônimo casa com o
 * começo de uma palavra do título ("observ" casa com "observações").
 */

export type FieldKind = 'text' | 'textarea' | 'date' | 'number' | 'boolean';

export interface AppFieldRole {
  /** Nome que o app lê */
  key: string;
  /** Como o campo aparece para quem monta o formulário */
  label: string;
  kind: FieldKind;
  synonyms: string[];
}

/**
 * De onde mais o dado pode vir quando o formulário não tem o campo:
 * - serviceName: o próprio nome do serviço ("Oficina de Música" já diz a oficina);
 * - citizenName: o nome de quem pediu (guia de turismo = a própria pessoa);
 * - profile: o perfil do cidadão (endereço/bairro da casa) — só onde o caso é
 *   na casa da pessoa (abrigo, habitação...), nunca onde o local é outro.
 * Telefone e data de nascimento vêm sempre do perfil, se faltarem.
 */
export type RoleFallback = 'serviceName' | 'citizenName' | 'profile';

export interface AppActionContract {
  keywords: string[];
  /** Palavras no nome que mostram que NÃO é esta porta ("trancamento de matrícula") */
  notKeywords?: string[];
  /** Papéis do formulário; `required` = sem ele o caso entra incompleto no app */
  roles: Array<{ role: AppFieldRole; required?: boolean; fallback?: RoleFallback }>;
}

const r = (key: string, label: string, kind: FieldKind, synonyms: string[]): AppFieldRole => ({ key, label, kind, synonyms });

// ------------------------------------------------------------- papéis comuns
const DESCRICAO = r('descricao', 'Descrição', 'textarea', ['descricao', 'descreva', 'descrever', 'relato', 'detalhe', 'observac', 'problema', 'necessidade', 'situacao', 'o que aconteceu', 'o que precisa', 'ocorrido']);
const MOTIVO = r('motivo', 'Motivo', 'textarea', ['motivo', 'justificativa', 'por que', 'porque', 'finalidade', 'razao']);
const ENDERECO = r('endereco', 'Endereço', 'text', ['endereco', 'logradouro', 'rua', 'localizacao', 'local', 'onde fica']);
const BAIRRO = r('bairro', 'Bairro', 'text', ['bairro', 'comunidade', 'localidade', 'distrito', 'vila']);
const TELEFONE = r('telefone', 'Telefone para contato', 'text', ['telefone', 'celular', 'whatsapp', 'fone', 'contato']);
const OBSERVACOES = r('observacoes', 'Observações', 'textarea', ['observac', 'informac', 'comentario']);
const URGENTE = r('urgente', 'É urgente?', 'boolean', ['urgente', 'urgencia', 'emergencia']);
const PLACA = r('placaVeiculo', 'Placa do veículo', 'text', ['placa']);
const DATA = r('data', 'Data', 'date', ['data', 'dia']);
const HORA_INICIO = r('horaInicio', 'Horário de início', 'text', ['hora inicio', 'horario inicio', 'horario de inicio', 'hora de inicio', 'horario', 'hora']);
const HORA_FIM = r('horaFim', 'Horário de término', 'text', ['hora fim', 'horario fim', 'hora final', 'horario final', 'termino', 'ate que horas']);
const FINALIDADE = r('finalidade', 'Finalidade', 'textarea', ['finalidade', 'evento', 'atividade', 'motivo', 'para que']);
const RESPONSAVEL = r('responsavel', 'Nome do responsável', 'text', ['responsavel', 'pai', 'mae']);
const NASCIMENTO = r('dataNascimento', 'Data de nascimento', 'date', ['nascimento', 'data de nascimento']);
const CATEGORIA = r('categoria', 'Categoria / modalidade', 'text', ['categoria', 'modalidade', 'linguagem']);

// --------------------------------------------------------------- portas por app
const TFD: AppActionContract = {
  keywords: ['tfd', 'tratamento fora', 'fora do domicilio', 'transporte de paciente', 'transporte de pacientes', 'viagem para tratamento'],
  roles: [
    { role: r('especialidade', 'Especialidade do tratamento', 'text', ['especialidade', 'tipo de tratamento', 'area medica']), required: true },
    { role: r('procedimento', 'Consulta, exame ou procedimento', 'text', ['procedimento', 'exame', 'cirurgia', 'tratamento']), required: true },
    { role: r('justificativa', 'Por que precisa ser fora do município', 'textarea', ['justificativa', 'motivo', 'laudo', 'finalidade', 'por que']), required: true },
    { role: r('cidadeDestino', 'Cidade de destino', 'text', ['cidade de destino', 'cidade destino', 'destino', 'cidade']), required: true },
    { role: r('estadoDestino', 'Estado (UF) de destino', 'text', ['uf', 'estado']) },
    { role: r('hospitalDestino', 'Hospital ou clínica de destino', 'text', ['hospital', 'clinica', 'unidade de destino']) },
    { role: r('medicoSolicitante', 'Médico que encaminhou', 'text', ['medico', 'crm']) },
    { role: r('cid10', 'CID', 'text', ['cid']) },
    { role: r('dataConsulta', 'Data marcada da consulta', 'date', ['data da consulta', 'data consulta', 'data marcada', 'data do tratamento', 'data de ida', 'data ida', 'data']) },
    { role: r('acompanhante', 'Precisa de acompanhante', 'boolean', ['acompanhante']) },
  ],
};

const CONSULTA: AppActionContract = {
  keywords: ['agendamento de consulta', 'agendar consulta', 'marcar consulta', 'consulta medica', 'consulta odontologica', 'consulta com', 'atendimento medico', 'dentista'],
  roles: [
    { role: r('especialidade', 'Especialidade', 'text', ['especialidade', 'tipo de consulta', 'tipo de atendimento', 'area medica']), required: true, fallback: 'serviceName' },
    { role: r('unidadeSaude', 'Unidade de saúde preferida', 'text', ['unidade de saude', 'ubs', 'posto', 'unidade']) },
    { role: OBSERVACOES },
  ],
};

const MEDICAMENTO = (altoCusto: boolean): AppActionContract => ({
  keywords: altoCusto ? ['alto custo', 'medicamento especial', 'componente especializado'] : ['medicamento', 'remedio', 'farmacia'],
  roles: [
    { role: r('medicamento', 'Nome do remédio', 'text', ['medicamento', 'remedio']), required: true },
    { role: r('dosagem', 'Dosagem', 'text', ['dosagem', 'dose', 'mg']) },
    { role: r('principioAtivo', 'Princípio ativo', 'text', ['principio ativo']) },
    { role: r('unidadeSaude', 'Unidade para retirada', 'text', ['unidade de saude', 'ubs', 'posto', 'retirada', 'unidade']) },
    { role: r('usoContinuo', 'Uso contínuo', 'boolean', ['uso continuo', 'continuo']) },
  ],
});

const NOME_ALUNO = r('nomeAluno', 'Nome do aluno', 'text', ['nome do aluno', 'nome da crianca', 'nome do estudante', 'aluno', 'crianca', 'estudante']);
const MATRICULA: AppActionContract = {
  notKeywords: ['trancamento', 'cancelamento', 'transferencia', 'desistencia'],
  keywords: ['matricula', 'rematricula', 'vaga escolar', 'vaga em escola', 'vaga na escola', 'vaga em creche', 'vaga na creche', 'creche', 'cmei'],
  roles: [
    { role: NOME_ALUNO, required: true },
    { role: r('dataNascimentoAluno', 'Data de nascimento do aluno', 'date', ['nascimento']), required: true },
    { role: r('serie', 'Série/Ano pretendido', 'text', ['serie', 'ano escolar', 'etapa', 'nivel de ensino', 'ano pretendido', 'turma']), required: true },
    { role: r('turnoDesejado', 'Turno desejado', 'text', ['turno', 'periodo']) },
    { role: r('escolaPreferencial', 'Escola preferida', 'text', ['escola', 'unidade escolar', 'creche', 'cmei']) },
    { role: r('cpfAluno', 'CPF do aluno (se tiver)', 'text', ['cpf do aluno', 'cpf da crianca', 'cpf do estudante']) },
    { role: r('grauParentesco', 'Você é o quê do aluno?', 'text', ['parentesco', 'grau de parentesco']) },
    { role: r('descricaoNecessidades', 'Necessidade especial', 'textarea', ['necessidade especial', 'necessidades especiais', 'deficiencia', 'laudo']) },
  ],
};

const TRANSPORTE_ESCOLAR: AppActionContract = {
  keywords: ['transporte escolar', 'onibus escolar', 'van escolar'],
  roles: [
    { role: NOME_ALUNO, required: true },
    { role: r('unidadeEscolar', 'Escola', 'text', ['escola', 'unidade escolar', 'creche']), required: true },
    { role: r('enderecoEmbarque', 'Endereço de embarque', 'text', ['embarque', 'ponto de embarque', 'endereco', 'onde pegar']), required: true },
    { role: r('serie', 'Série/Ano', 'text', ['serie', 'ano escolar', 'turma']) },
    { role: r('turno', 'Turno', 'text', ['turno', 'periodo']) },
    { role: r('distanciaEscola', 'Distância até a escola (km)', 'number', ['distancia', 'km']) },
    { role: r('necessitaVeiculoAdaptado', 'Precisa de veículo adaptado', 'boolean', ['adaptado', 'cadeira de rodas', 'acessivel']) },
  ],
};

const BENEFICIO = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: r('tipoBeneficio', 'Tipo de benefício', 'text', ['tipo de beneficio', 'tipo de auxilio', 'beneficio', 'auxilio']), fallback: 'serviceName' },
    { role: r('motivoSolicitacao', 'Por que precisa', 'textarea', ['motivo', 'justificativa', 'por que precisa', 'descricao', 'situacao atual']) },
    { role: r('quantidadePessoasFamilia', 'Quantas pessoas na família', 'number', ['pessoas na familia', 'membros', 'moradores', 'quantas pessoas', 'numero de pessoas', 'tamanho da familia', 'composicao familiar', 'dependentes']) },
    { role: r('rendaFamiliarMensal', 'Renda familiar mensal', 'number', ['renda']) },
    { role: r('situacaoVulnerabilidade', 'Situação', 'text', ['vulnerabilidade', 'situacao']) },
    { role: r('nisCadUnico', 'NIS do CadÚnico', 'text', ['nis', 'cadunico', 'cad unico']) },
    { role: URGENTE },
  ],
});

const OS = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: ENDERECO, required: true },
    { role: BAIRRO },
    { role: r('pontoReferencia', 'Ponto de referência', 'text', ['ponto de referencia', 'referencia', 'proximo a']) },
    { role: DESCRICAO },
  ],
});

const LICENCIAMENTO = (keywords: string[]): AppActionContract => ({
  keywords,
  // obra em bem público é ordem de serviço, não licença de particular
  notKeywords: ['praca', 'publica', 'publico', 'escola municipal'],
  roles: [
    { role: r('endereco', 'Endereço da obra / do imóvel', 'text', ['endereco', 'local da obra', 'logradouro', 'imovel', 'localizacao', 'local']), required: true },
    { role: BAIRRO },
    { role: r('descricao', 'O que vai ser feito', 'textarea', ['descricao', 'finalidade', 'atividade', 'objeto', 'tipo de obra', 'uso']) },
    { role: r('areaConstruida', 'Área (m²)', 'number', ['area construida', 'area', 'metragem', 'm2']) },
  ],
});

const ATIVIDADE_AMBIENTAL = r('atividade', 'Atividade / espécie', 'text', ['tipo de atividade', 'atividade', 'empreendimento', 'especie', 'arvore', 'vegetacao']);
const AMBIENTAL = (keywords: string[], fiscalizacao = false): AppActionContract => ({
  keywords,
  // pedido de autorização/licença não é denúncia
  ...(fiscalizacao ? { notKeywords: ['autorizacao', 'licenca'] } : {}),
  roles: [
    { role: r('endereco', 'Endereço do local', 'text', ['endereco do local', 'endereco', 'logradouro', 'localizacao', 'local do empreendimento', 'local da arvore', 'local']), required: true },
    { role: BAIRRO },
    fiscalizacao
      ? { role: r('descricao', 'O que está acontecendo', 'textarea', ['descricao', 'relato', 'denuncia', 'o que aconteceu', 'detalhe', 'situacao', 'finalidade']), required: true }
      : { role: ATIVIDADE_AMBIENTAL, required: true, fallback: 'serviceName' },
    { role: fiscalizacao ? ATIVIDADE_AMBIENTAL : DESCRICAO },
  ],
});

const HABITACAO = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: ENDERECO, fallback: 'profile' },
    { role: r('rendaFamiliar', 'Renda familiar', 'number', ['renda']), required: true },
    { role: r('numeroMembros', 'Pessoas na família', 'number', ['membros', 'moradores', 'pessoas', 'dependentes', 'composicao familiar']), required: true },
    { role: r('tempoMoradia', 'Tempo de moradia no município', 'text', ['tempo de moradia', 'mora ha', 'reside']) },
    { role: MOTIVO },
  ],
});

const DEFESA_CIVIL = (keywords: string[], naCasa = false, notKeywords?: string[]): AppActionContract => ({
  keywords,
  notKeywords,
  roles: [
    // abrigo/remoção: o lugar é a casa da pessoa
    { role: ENDERECO, required: true, ...(naCasa ? { fallback: 'profile' as const } : {}) },
    { role: r('descricao', 'O que está acontecendo', 'textarea', ['descricao', 'relato', 'situacao', 'risco', 'motivo', 'o que aconteceu', 'detalhe']), required: true },
    { role: BAIRRO, ...(naCasa ? { fallback: 'profile' as const } : {}) },
    { role: URGENTE },
  ],
});

const MULHER = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: r('telefoneSeguro', 'Telefone seguro para contato', 'text', ['telefone seguro', 'telefone', 'celular', 'contato']) },
    { role: r('relato', 'Relato', 'textarea', ['relato', 'descricao', 'o que aconteceu', 'situacao', 'detalhe']) },
  ],
});

const ESCOLINHA = (modalidade: string): AppActionContract => ({
  keywords: [`escolinha de ${modalidade}`, `escolinha ${modalidade}`, `aula de ${modalidade}`, `aulas de ${modalidade}`, `treino de ${modalidade}`],
  roles: [
    // sem o campo, o aluno é quem fez o pedido
    { role: r('nomeAluno', 'Nome do aluno', 'text', ['nome do aluno', 'nome da crianca', 'nome do atleta', 'aluno', 'crianca', 'atleta']), fallback: 'citizenName' },
    { role: NASCIMENTO },
    { role: RESPONSAVEL },
    { role: TELEFONE },
  ],
});

const RESERVA = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: DATA, required: true },
    { role: HORA_INICIO, required: true },
    { role: HORA_FIM },
    { role: FINALIDADE },
    { role: TELEFONE },
  ],
});

const PROJETO_CULTURAL = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: r('titulo', 'Nome do projeto', 'text', ['titulo', 'nome do projeto', 'projeto', 'nome do evento']), required: true },
    { role: r('proponente', 'Proponente (grupo, artista, entidade)', 'text', ['proponente', 'grupo', 'artista', 'entidade', 'coletivo']) },
    { role: CATEGORIA },
    { role: r('descricao', 'Resumo do projeto', 'textarea', ['resumo', 'descricao', 'objeto', 'justificativa']) },
    { role: r('valorSolicitado', 'Valor pedido (R$)', 'number', ['valor', 'orcamento', 'custo']) },
  ],
});

const CREDENCIAL = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: PLACA, required: true },
    { role: r('modeloVeiculo', 'Modelo do veículo', 'text', ['modelo', 'veiculo', 'marca', 'carro', 'moto']) },
    { role: r('pontoPretendido', 'Ponto pretendido', 'text', ['ponto']) },
    { role: TELEFONE },
  ],
});

const CARTEIRA = (keywords: string[], comInstituicao = false): AppActionContract => ({
  keywords,
  roles: [
    { role: NASCIMENTO, required: !comInstituicao, fallback: 'profile' },
    ...(comInstituicao ? [{ role: r('instituicao', 'Escola / faculdade', 'text', ['instituicao', 'escola', 'faculdade', 'curso', 'universidade']), required: true }] : []),
    { role: TELEFONE },
  ],
});

const PRESTADOR = (keywords: string[], pessoa = false): AppActionContract => ({
  keywords,
  roles: [
    // guia de turismo é a própria pessoa: o nome vem de quem pediu
    { role: r('nomeEstabelecimento', 'Nome do negócio', 'text', ['nome do estabelecimento', 'nome fantasia', 'razao social', 'nome da empresa', 'nome da agencia', 'nome da atracao', 'nome do negocio']), required: true, ...(pessoa ? { fallback: 'citizenName' as const } : {}) },
    { role: r('tipoEstabelecimento', 'Tipo / categoria', 'text', ['tipo', 'categoria', 'especialidade', 'idiomas']) },
    { role: r('cnpj', 'CNPJ ou CPF', 'text', ['cnpj', 'cpf']) },
    { role: ENDERECO },
    { role: r('descricaoServicos', 'O que oferece', 'textarea', ['servicos', 'descricao', 'oferece', 'experiencia']) },
    { role: r('cadastur', 'Nº do Cadastur', 'text', ['cadastur']) },
  ],
});

const EVENTO_TURISTICO = (keywords: string[]): AppActionContract => ({
  keywords,
  roles: [
    { role: r('nomeEvento', 'Nome do evento', 'text', ['nome do evento', 'nome da feira', 'evento', 'nome']), required: true },
    { role: r('dataInicio', 'Data de início', 'date', ['data de inicio', 'data inicio', 'data do evento', 'inicio', 'data']), required: true },
    { role: r('dataFim', 'Data de término', 'date', ['data final', 'data de termino', 'data fim', 'termino']) },
    { role: r('localEvento', 'Local do evento', 'text', ['local', 'endereco']) },
    { role: r('tipoEvento', 'Tipo de evento', 'text', ['tipo']) },
    { role: r('publicoEstimado', 'Público esperado', 'number', ['publico', 'participantes']) },
    { role: r('descricaoEvento', 'Descrição', 'textarea', ['descricao', 'programacao']) },
    { role: r('apoioSolicitado', 'Apoio pedido à prefeitura', 'textarea', ['apoio', 'necessidade', 'precisa da prefeitura']) },
  ],
});

const SEGURANCA = (keywords: string[], comTipo = true): AppActionContract => ({
  keywords,
  roles: [
    { role: r('relatoDetalhado', 'O que aconteceu', 'textarea', ['relato', 'descricao', 'o que aconteceu', 'detalhe', 'situacao', 'motivo']), required: true },
    { role: r('localOcorrencia', 'Local', 'text', ['local', 'endereco', 'onde', 'logradouro']), required: true },
    { role: BAIRRO },
    ...(comTipo ? [{ role: r('tipoOcorrencia', 'Tipo', 'text', ['tipo de ocorrencia', 'tipo de denuncia', 'tipo', 'natureza']) }] : []),
    { role: r('dataHoraOcorrencia', 'Quando aconteceu', 'date', ['data', 'quando', 'horario']) },
  ],
});

/**
 * Pedidos que NÃO são caso de app, mesmo citando o assunto do app: documentos
 * (certidão, declaração, 2ª via), consultas de informação e reclamações. Ex.:
 * "Declaração de Matrícula" é da fila do protocolo, não do app de matrícula.
 */
export const NOT_AN_APP_CASE = [
  'certidao', 'declaracao', 'segunda via', '2 via', '2a via', 'consulta de', 'consulta da', 'consulta do', 'reclamacao',
  'atestado', 'comprovante', 'historico', 'informacoes sobre', 'informacao sobre', 'copia de', 'boleto', 'extrato',
];

export const APP_FIELD_CONTRACTS: Record<string, AppActionContract> = {
  // Saúde
  ENCAMINHAMENTOS_TFD: TFD,
  AGENDAMENTO_CONSULTA: CONSULTA,
  CONTROLE_MEDICAMENTOS: MEDICAMENTO(false),
  MEDICAMENTOS_ALTO_CUSTO: MEDICAMENTO(true),
  // Educação
  MATRICULA_ESCOLAR: MATRICULA,
  TRANSPORTE_ESCOLAR,
  // Assistência Social
  SOLICITACAO_BENEFICIO: BENEFICIO(['beneficio social', 'solicitacao de beneficio', 'bolsa', 'auxilio financeiro', 'programa social', 'tarifa social']),
  CESTA_BASICA: BENEFICIO(['cesta basica', 'cesta de alimentos', 'alimentos', 'auxilio emergencial']),
  BENEFICIO_EVENTUAL: BENEFICIO(['beneficio eventual', 'auxilio natalidade', 'auxilio funeral', 'auxilio calamidade', 'kit enxoval', 'kit natalidade']),
  // Serviços públicos
  ILUMINACAO_PUBLICA: OS(['iluminacao', 'poste', 'lampada', 'luminaria']),
  LIMPEZA_URBANA: OS(['limpeza', 'varricao', 'lixo', 'coleta de lixo', 'terreno baldio', 'terreno abandonado']),
  COLETA_ESPECIAL: OS(['entulho', 'coleta especial', 'cata treco', 'cata-treco', 'moveis velhos', 'eletronico', 'volumoso']),
  SOLICITACAO_CAPINA: OS(['capina', 'rocagem', 'rocada', 'mato alto', 'mato']),
  SOLICITACAO_DESOBSTRUCAO: OS(['bueiro', 'boca de lobo', 'desobstrucao', 'galeria pluvial', 'drenagem', 'esgoto entupido']),
  SOLICITACAO_PODA: OS(['poda', 'galho', 'arvore caida']),
  ATENDIMENTOS_SERVICOS_PUBLICOS: OS(['registro de problema', 'problema com foto', 'buraco', 'tapa buraco', 'calcamento', 'meio fio', 'praca', 'jardim', 'dedetizacao', 'animal morto', 'reparo', 'manutencao']),
  // Licenciamento urbano
  APROVACAO_PROJETO: LICENCIAMENTO(['aprovacao de projeto', 'projeto arquitetonico', 'projeto de construcao', 'regularizacao de obra']),
  ALVARA_CONSTRUCAO: LICENCIAMENTO(['alvara de construcao', 'licenca de construcao', 'reforma', 'demolicao', 'habite-se', 'habitese']),
  ALVARA_FUNCIONAMENTO: LICENCIAMENTO(['alvara de funcionamento', 'licenca de funcionamento', 'abertura de empresa']),
  // Meio ambiente
  LICENCA_AMBIENTAL: AMBIENTAL(['licenca ambiental', 'licenciamento ambiental', 'atividade poluidora', 'poluidora', 'licenca previa', 'licenca de operacao']),
  AUTORIZACAO_PODA_CORTE: AMBIENTAL(['corte de arvore', 'supressao', 'autorizacao de poda', 'remocao de arvore']),
  DENUNCIA_AMBIENTAL: AMBIENTAL(['denuncia ambiental', 'queimada', 'desmatamento', 'poluicao', 'descarte irregular', 'maus tratos', 'barulho', 'poluicao sonora'], true),
  VISTORIA_AMBIENTAL: AMBIENTAL(['vistoria ambiental', 'fiscalizacao ambiental'], true),
  // Habitação
  INSCRICAO_PROGRAMA_HABITACIONAL: { ...HABITACAO(['programa habitacional', 'casa propria', 'moradia popular', 'minha casa', 'conjunto habitacional', 'lote urbanizado']), notKeywords: ['horta'] },
  INSCRICAO_FILA_HABITACAO: HABITACAO(['fila da habitacao', 'fila de moradia', 'cadastro habitacional']),
  SOLICITACAO_AUXILIO_ALUGUEL: HABITACAO(['aluguel social', 'auxilio aluguel', 'auxilio moradia']),
  // Defesa civil
  VISTORIA_AREA_RISCO: DEFESA_CIVIL(['area de risco', 'vistoria de risco', 'deslizamento', 'rachadura', 'desabamento'], false, ['evento', 'cadastro de familia']),
  DENUNCIA_AREA_RISCO: DEFESA_CIVIL(['denuncia de risco', 'encosta', 'barranco']),
  DENUNCIA_CONSTRUCAO: DEFESA_CIVIL(['construcao irregular', 'construcao em encosta', 'construcao em area de risco']),
  REMOCAO_PREVENTIVA: DEFESA_CIVIL(['remocao preventiva', 'desocupacao', 'remocao de familia'], true),
  SOLICITACAO_ABRIGO: DEFESA_CIVIL(['abrigo', 'desabrigado', 'desalojado'], true, ['doacao']),
  ALERTA_EMERGENCIA: DEFESA_CIVIL(['alerta', 'enchente', 'alagamento', 'inundacao', 'emergencia', 'vendaval'], false, ['sms', 'cadastro para alerta', 'cadastro de alerta', 'sirene']),
  // Rede da mulher
  DENUNCIA_VIOLENCIA: MULHER(['violencia contra a mulher', 'violencia domestica', 'agressao', 'maria da penha']),
  DENUNCIA_ASSEDIO: MULHER(['assedio']),
  ACOLHIMENTO_CASA_ABRIGO: MULHER(['casa abrigo', 'acolhimento da mulher', 'casa da mulher']),
  MEDIDA_PROTETIVA: MULHER(['medida protetiva']),
  ACOMPANHAMENTO_SOCIAL: MULHER(['acompanhamento psicossocial', 'acompanhamento social', 'atendimento a mulher', 'apoio a mulher']),
  // Esportes
  INSCRICAO_ESCOLINHA_FUTEBOL: ESCOLINHA('futebol'),
  INSCRICAO_ESCOLINHA_BASQUETE: ESCOLINHA('basquete'),
  INSCRICAO_ESCOLINHA_VOLEI: ESCOLINHA('volei'),
  INSCRICAO_ESCOLINHA_NATACAO: ESCOLINHA('natacao'),
  INSCRICAO_ESCOLINHA_JUDO: ESCOLINHA('judo'),
  INSCRICAO_ESCOLINHA_CAPOEIRA: ESCOLINHA('capoeira'),
  INSCRICAO_ESCOLINHA_GINASTICA: ESCOLINHA('ginastica'),
  RESERVA_ESPACO_ESPORTIVO: RESERVA(['reserva de quadra', 'reserva de espaco esportivo', 'reservar quadra', 'uso de quadra', 'campo de futebol', 'estadio']),
  USO_GINASIO: RESERVA(['ginasio']),
  INSCRICAO_COMPETICAO: {
    keywords: ['campeonato', 'competicao', 'torneio', 'jogos', 'copa'],
    roles: [{ role: r('participante', 'Equipe ou atleta', 'text', ['equipe', 'time', 'atleta', 'participante']), required: true }, { role: CATEGORIA }, { role: TELEFONE }],
  },
  INSCRICAO_CORRIDA_RUA: {
    keywords: ['corrida', 'maratona', 'caminhada', 'ciclismo', 'passeio ciclistico'],
    roles: [{ role: r('participante', 'Nome do atleta', 'text', ['atleta', 'participante', 'corredor']) }, { role: CATEGORIA }, { role: NASCIMENTO }],
  },
  EMPRESTIMO_MATERIAL_ESPORTIVO: {
    keywords: ['emprestimo de material esportivo', 'material esportivo', 'emprestimo de bola', 'kit esportivo'],
    roles: [{ role: r('item', 'Material pedido', 'text', ['material', 'item', 'equipamento']), required: true }, { role: DATA }, { role: FINALIDADE }],
  },
  // Cultura
  INSCRICAO_OFICINA: {
    keywords: ['oficina', 'curso de musica', 'aula de danca', 'aula de teatro', 'aula de violao', 'curso de artesanato', 'aula de pintura'],
    roles: [
      { role: r('oficina', 'Oficina desejada', 'text', ['oficina', 'curso', 'atividade', 'aula']), required: true, fallback: 'serviceName' },
      { role: r('participante', 'Nome do participante', 'text', ['participante', 'aluno', 'nome do aluno']) },
      { role: RESPONSAVEL },
      { role: TELEFONE },
    ],
  },
  INSCRICAO_OFICINA_CULTURAL: {
    keywords: ['oficina cultural'],
    roles: [{ role: r('oficina', 'Oficina desejada', 'text', ['oficina', 'curso', 'atividade', 'aula']), required: true, fallback: 'serviceName' }, { role: r('participante', 'Nome do participante', 'text', ['participante', 'aluno']) }, { role: TELEFONE }],
  },
  RESERVA_ESPACO_CULTURAL: RESERVA(['reserva de espaco cultural', 'teatro municipal', 'auditorio', 'casa da cultura', 'centro cultural', 'anfiteatro']),
  INSCRICAO_EDITAL: PROJETO_CULTURAL(['edital', 'chamamento', 'lei paulo gustavo', 'aldir blanc', 'premio cultural']),
  PROJETO_CULTURAL: PROJETO_CULTURAL(['projeto cultural', 'submissao de projeto']),
  SUBMISSAO_PROJETO_CULTURAL: PROJETO_CULTURAL(['submissao de projeto cultural']),
  APOIO_CULTURAL: PROJETO_CULTURAL(['apoio cultural', 'patrocinio cultural', 'apoio a evento cultural']),
  // Transportes e trânsito
  CREDENCIAMENTO_TAXI: CREDENCIAL(['taxi', 'taxista']),
  CREDENCIAMENTO_MOTOTAXI: CREDENCIAL(['mototaxi', 'mototaxista', 'motofrete']),
  CREDENCIAMENTO_TRANSPORTE_ESCOLAR: CREDENCIAL(['credenciamento de transporte escolar', 'condutor escolar', 'perueiro']),
  VISTORIA_VEICULO: CREDENCIAL(['vistoria de veiculo', 'vistoria veicular', 'inspecao de veiculo']),
  DEFESA_AUTUACAO: {
    keywords: ['defesa de autuacao', 'recurso de multa', 'defesa previa', 'jari', 'multa de transito', 'indicacao de condutor'],
    roles: [
      { role: r('numeroAutuacao', 'Número do auto de infração', 'text', ['auto de infracao', 'numero do auto', 'autuacao', 'ait', 'notificacao']), required: true },
      { role: r('motivoDefesa', 'Por que discorda da multa', 'textarea', ['motivo', 'defesa', 'justificativa', 'alegacao', 'argumento']), required: true },
      { role: PLACA },
    ],
  },
  RENOVACAO_CREDENCIAMENTO: {
    keywords: ['renovacao de credencial', 'renovacao de credenciamento', 'renovar credencial', 'renovacao de alvara de taxi'],
    roles: [{ role: r('numeroCredencial', 'Número da credencial', 'text', ['numero da credencial', 'credencial', 'numero do alvara', 'registro']), required: true }, { role: PLACA }],
  },
  TRANSFERENCIA_PONTO_TAXI: {
    keywords: ['transferencia de ponto', 'troca de ponto', 'mudanca de ponto'],
    roles: [
      { role: r('numeroCredencial', 'Número da credencial', 'text', ['numero da credencial', 'credencial', 'registro']), required: true },
      { role: r('pontoDesejado', 'Ponto desejado', 'text', ['ponto desejado', 'novo ponto', 'para qual ponto']), required: true },
      { role: r('pontoAtual', 'Ponto atual', 'text', ['ponto atual']) },
      { role: r('motivoTransferencia', 'Motivo', 'textarea', ['motivo', 'justificativa']) },
    ],
  },
  // Mobilidade urbana
  CARTAO_ESTUDANTE: CARTEIRA(['carteira de estudante', 'cartao estudante', 'meia passagem', 'passe escolar', 'passe estudantil'], true),
  CARTAO_TRANSPORTE: CARTEIRA(['cartao transporte', 'bilhete unico', 'cartao de onibus']),
  ISENCAO_IDOSO: CARTEIRA(['idoso', 'gratuidade idoso', 'carteira do idoso', 'isencao de tarifa']),
  PASSE_LIVRE_INTERESTADUAL: CARTEIRA(['passe livre', 'pessoa com deficiencia no transporte']),
  VAGA_ESPECIAL_PCD: CARTEIRA(['vaga especial', 'cartao de estacionamento', 'credencial de estacionamento', 'vaga para pcd', 'vaga de idoso']),
  // Agricultura
  ASSISTENCIA_TECNICA: {
    keywords: ['assistencia tecnica', 'visita tecnica', 'ater', 'analise de solo', 'orientacao tecnica', 'extensao rural'],
    roles: [{ role: r('tipoAssistencia', 'Tipo de assistência', 'text', ['tipo de assistencia', 'assistencia', 'cultura', 'atividade', 'tipo']), required: true, fallback: 'serviceName' }, { role: DESCRICAO }],
  },
  SOLICITACAO_MAQUINAS: {
    keywords: ['maquina', 'maquinas', 'trator', 'patrulha agricola', 'patrulha mecanizada', 'mecanizacao', 'hora maquina', 'implemento', 'retroescavadeira'],
    roles: [
      { role: r('tipoMaquina', 'Máquina pedida', 'text', ['maquina', 'implemento', 'equipamento', 'trator', 'tipo de servico']), required: true, fallback: 'serviceName' },
      { role: r('dataDesejada', 'Para quando', 'date', ['data preferencial', 'data desejada', 'data de uso', 'quando', 'data']) },
      { role: r('areaTrabalho', 'Área a trabalhar (hectares)', 'number', ['area', 'hectare', 'alqueire']) },
      { role: r('localPropriedade', 'Local da propriedade', 'text', ['local', 'propriedade', 'sitio', 'endereco', 'localizacao']) },
      { role: r('descricaoNecessidade', 'O que precisa ser feito', 'textarea', ['finalidade', 'servico', 'necessidade', 'descricao']) },
    ],
  },
  CADASTRO_PRODUTOR: {
    keywords: ['cadastro de produtor', 'produtor rural', 'agricultor familiar', 'carteira de produtor'],
    roles: [
      { role: r('producoes', 'O que produz', 'text', ['producao', 'producoes', 'cultura', 'criacao', 'atividade']) },
      { role: r('tipoProdutor', 'Tipo de produtor', 'text', ['tipo de produtor', 'categoria']) },
      { role: r('dap', 'DAP / CAF', 'text', ['dap', 'caf']) },
      { role: r('car', 'CAR', 'text', ['car', 'cadastro ambiental rural']) },
      { role: TELEFONE },
    ],
  },
  CADASTRO_PROPRIEDADE_RURAL: {
    keywords: ['cadastro de propriedade', 'propriedade rural', 'imovel rural'],
    roles: [
      { role: r('nomePropriedade', 'Nome da propriedade', 'text', ['nome da propriedade', 'propriedade', 'sitio', 'fazenda', 'chacara']), required: true },
      { role: r('endereco', 'Localização', 'text', ['endereco', 'localizacao', 'acesso', 'estrada']) },
      { role: BAIRRO },
      { role: r('areaHectares', 'Área (hectares)', 'number', ['area', 'hectare', 'alqueire']) },
      { role: r('car', 'CAR', 'text', ['car', 'cadastro ambiental rural']) },
    ],
  },
  // Desenvolvimento econômico
  CADASTRO_BALCAO_EMPREGOS: {
    notKeywords: ['agendamento'],
    keywords: ['balcao de empregos', 'banco de empregos', 'cadastro de curriculo', 'curriculo', 'procura de emprego', 'vaga de emprego', 'sine'],
    roles: [
      { role: r('areaInteresse', 'Em que quer trabalhar', 'text', ['area de interesse', 'area de atuacao', 'funcao', 'cargo', 'profissao', 'interesse', 'ocupacao']), required: true },
      { role: r('escolaridade', 'Escolaridade', 'text', ['escolaridade', 'formacao', 'grau de instrucao']) },
      { role: r('experiencia', 'Experiência', 'textarea', ['experiencia', 'trabalhou', 'empregos anteriores']) },
      { role: r('habilidades', 'Cursos e habilidades', 'text', ['curso', 'habilidade', 'qualificacao', 'cnh']) },
      { role: r('disponibilidadeImediata', 'Pode começar já', 'boolean', ['disponibilidade', 'pode comecar']) },
      { role: r('pcd', 'Pessoa com deficiência', 'boolean', ['deficiencia', 'pcd']) },
    ],
  },
  // Segurança pública
  REGISTRO_OCORRENCIA: SEGURANCA(['ocorrencia', 'boletim', 'furto', 'roubo', 'vandalismo', 'perturbacao do sossego', 'som alto']),
  SOLICITACAO_PATRULHAMENTO: SEGURANCA(['patrulhamento', 'ronda', 'policiamento'], false),
  DENUNCIA_ANONIMA: SEGURANCA(['denuncia anonima', 'disque denuncia', 'trafico']),
  CADASTRO_PONTO_CRITICO: SEGURANCA(['ponto critico', 'local perigoso', 'ponto de risco'], false),
  ALERTA_SEGURANCA: SEGURANCA(['alerta de seguranca', 'pessoa desaparecida', 'veiculo suspeito'], false),
  PATRULHA_ESCOLAR: SEGURANCA(['patrulha escolar', 'ronda escolar', 'seguranca na escola'], false),
  GUARDA_PATRIMONIAL: SEGURANCA(['guarda patrimonial', 'guarda municipal no evento', 'seguranca de evento', 'protecao de patrimonio'], false),
  SOS_MULHER: { ...SEGURANCA(['sos mulher', 'pedido de ajuda urgente', 'botao do panico', 'violencia domestica'], false), notKeywords: ['idoso', 'idosa'] },
  // Turismo
  CADASTRO_ESTABELECIMENTO_TURISTICO: PRESTADOR(['estabelecimento turistico', 'meio de hospedagem', 'pousada', 'hotel', 'restaurante turistico']),
  CADASTRO_GUIA_TURISTICO: PRESTADOR(['guia turistico', 'guia de turismo', 'condutor de turismo'], true),
  CREDENCIAMENTO_AGENCIA_TURISMO: PRESTADOR(['agencia de turismo', 'agencia de viagem', 'operadora de turismo']),
  AUTORIZACAO_TRANSPORTE_TURISTICO: PRESTADOR(['transporte turistico', 'van de turismo', 'onibus de turismo']),
  CADASTRO_ATRACAO_TURISTICA: PRESTADOR(['atracao turistica', 'atrativo turistico', 'ponto turistico']),
  REGISTRO_EVENTO_TURISTICO: { ...EVENTO_TURISTICO(['evento turistico', 'calendario de eventos', 'festa tradicional', 'festival']), notKeywords: ['inscricao para', 'participacao'] },
  APOIO_FEIRA_EXPOSICAO: { ...EVENTO_TURISTICO(['feira', 'exposicao', 'apoio a evento']), notKeywords: ['participacao', 'inscricao para', 'barraca'] },
};
