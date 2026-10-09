/**
 * Catálogo de Apps do ecossistema Digiurban (ARQUITETURA-DE-PRODUTO.md, 6.2).
 *
 * Fonte ÚNICA sobre os apps: quem são, de quais secretarias, onde ficam e que
 * "ações de entrada" aceitam — isto é, que tipo de pedido (protocolo) vira um
 * caso no app. O Serviço declara o destino apontando para uma dessas ações
 * (`ServiceSimplified.destination = 'APP'` + `appAction = <código da ação>`).
 *
 * Antes: o destino era deduzido do `moduleType` gerado a partir do NOME do
 * serviço e comparado com códigos fixos no conversor — quem criava o serviço
 * não via para onde o pedido ia, e um nome diferente fazia o pedido não chegar
 * ao app, sem aviso. Os códigos das ações são os mesmos usados pelo conversor
 * (`services/apps/protocol-to-app.service.ts`), então nada muda de comportamento.
 */

export type AppActionStage = 'CRIACAO' | 'APROVACAO';

export interface AppAction {
  /** Código da ação (= chave de roteamento do conversor) */
  code: string;
  /** Como aparece para quem configura o serviço */
  label: string;
  /** Quando o caso é criado no app: ao abrir o pedido ou ao aprová-lo */
  stage: AppActionStage;
}

export interface AppDefinition {
  code: string;
  name: string;
  description: string;
  /** Códigos canônicos das secretarias donas (Department.code) */
  departments: string[];
  /** Tela do app no painel */
  route: string;
  /** Ações de entrada (vazia = app sem entrada por protocolo) */
  actions: AppAction[];
}

const criacao = (code: string, label: string): AppAction => ({ code, label, stage: 'CRIACAO' });
const aprovacao = (code: string, label: string): AppAction => ({ code, label, stage: 'APROVACAO' });

export const APP_CATALOG: AppDefinition[] = [
  {
    code: 'tfd',
    name: 'TFD — Tratamento Fora do Domicílio',
    description: 'Análise documental, regulação médica, aprovação, agendamento e viagens',
    departments: ['SAUDE'],
    route: '/admin/apps/saude/tfd',
    actions: [criacao('ENCAMINHAMENTOS_TFD', 'Solicitação de tratamento fora do domicílio')],
  },
  {
    code: 'saude-atendimento',
    name: 'Atendimento de Saúde',
    description: 'Fila, triagem, consulta e prontuário',
    departments: ['SAUDE'],
    route: '/admin/apps/saude/atendimento',
    actions: [
      criacao('AGENDAMENTO_CONSULTA', 'Pedido de consulta ou exame (a equipe marca na agenda)'),
      criacao('CADASTRO_GESTANTE', 'Cadastro de gestante (abre o pré-natal)'),
    ],
  },
  {
    code: 'farmacia',
    name: 'Farmácia',
    description: 'Estoque, lotes e dispensação de medicamentos',
    departments: ['SAUDE'],
    route: '/admin/apps/saude/farmacia',
    actions: [
      criacao('CONTROLE_MEDICAMENTOS', 'Pedido de remédio'),
      criacao('MEDICAMENTOS_ALTO_CUSTO', 'Pedido de remédio de alto custo'),
    ],
  },
  {
    code: 'educacao',
    name: 'Educação',
    description: 'Unidades, turmas e matrículas',
    departments: ['EDUCACAO'],
    route: '/admin/apps/educacao',
    actions: [
      criacao('MATRICULA_ESCOLAR', 'Inscrição de matrícula escolar'),
      criacao('TRANSPORTE_ESCOLAR', 'Pedido de vaga no transporte escolar'),
    ],
  },
  {
    code: 'assistencia-social',
    name: 'Assistência Social',
    description: 'Unidades CRAS/CREAS, famílias e programas sociais',
    departments: ['ASSISTENCIA_SOCIAL'],
    route: '/admin/apps/assistencia-social',
    actions: [
      criacao('SOLICITACAO_BENEFICIO', 'Pedido de benefício social'),
      criacao('CESTA_BASICA', 'Pedido de cesta básica'),
      criacao('BENEFICIO_EVENTUAL', 'Pedido de benefício eventual'),
    ],
  },
  {
    code: 'servicos-publicos',
    name: 'Ordens de Serviço',
    description: 'Despacho de equipes de campo, execução e mapa (cada secretaria com as suas equipes)',
    departments: ['SERVICOS_PUBLICOS', 'OBRAS_PUBLICAS', 'TRANSPORTES_TRANSITO', 'MOBILIDADE_URBANA', 'MEIO_AMBIENTE'],
    route: '/admin/apps/servicos-publicos',
    actions: [
      criacao('ILUMINACAO_PUBLICA', 'Ordem de serviço — iluminação pública'),
      criacao('LIMPEZA_URBANA', 'Ordem de serviço — limpeza urbana'),
      criacao('COLETA_ESPECIAL', 'Ordem de serviço — coleta de entulho'),
      criacao('SOLICITACAO_CAPINA', 'Ordem de serviço — capina'),
      criacao('SOLICITACAO_DESOBSTRUCAO', 'Ordem de serviço — drenagem/boca de lobo'),
      criacao('SOLICITACAO_PODA', 'Ordem de serviço — poda de árvore'),
      criacao('ATENDIMENTOS_SERVICOS_PUBLICOS', 'Ordem de serviço — outros'),
      criacao('MANUTENCAO_VIARIA', 'Ordem de serviço — buraco, pavimentação, calçada'),
      criacao('SINALIZACAO_VIARIA', 'Ordem de serviço — sinalização, semáforo, faixa, lombada'),
      criacao('MOBILIARIO_URBANO', 'Ordem de serviço — ponto de ônibus, bancos, lixeiras, acessibilidade'),
    ],
  },
  {
    code: 'licenciamento',
    name: 'Licenciamento Urbano',
    description: 'Análise de projetos, vistorias e emissão de alvarás',
    // Desenvolvimento Econômico: o alvará de funcionamento é dela no catálogo
    departments: ['OBRAS_PUBLICAS', 'PLANEJAMENTO_URBANO', 'DESENVOLVIMENTO_ECONOMICO'],
    route: '/admin/apps/licenciamento',
    actions: [
      criacao('APROVACAO_PROJETO', 'Processo — aprovação de projeto'),
      criacao('ALVARA_CONSTRUCAO', 'Processo — alvará de construção'),
      criacao('ALVARA_FUNCIONAMENTO', 'Processo — alvará de funcionamento'),
    ],
  },
  {
    code: 'meio-ambiente',
    name: 'Licenciamento & Fiscalização Ambiental',
    description: 'Licenças ambientais, vistorias, denúncias e autos de infração',
    departments: ['MEIO_AMBIENTE'],
    route: '/admin/apps/meio-ambiente',
    actions: [
      criacao('LICENCA_AMBIENTAL', 'Processo — licença ambiental'),
      criacao('AUTORIZACAO_PODA_CORTE', 'Processo — autorização de poda/corte'),
      criacao('DENUNCIA_AMBIENTAL', 'Fiscalização — denúncia ambiental'),
      criacao('VISTORIA_AMBIENTAL', 'Fiscalização — vistoria ambiental'),
    ],
  },
  {
    code: 'habitacao',
    name: 'Programas Habitacionais',
    description: 'Inscrições, fila por pontuação, sorteio e contemplação',
    departments: ['HABITACAO'],
    route: '/admin/apps/habitacao',
    actions: [
      criacao('INSCRICAO_PROGRAMA_HABITACIONAL', 'Inscrição em programa habitacional'),
      criacao('INSCRICAO_FILA_HABITACAO', 'Inscrição na fila de habitação'),
      criacao('SOLICITACAO_AUXILIO_ALUGUEL', 'Inscrição — auxílio aluguel'),
    ],
  },
  {
    code: 'defesa-civil',
    name: 'Ocorrências & Áreas de Risco',
    description: 'Ocorrências, vistorias, abrigos e famílias atingidas',
    departments: ['DEFESA_CIVIL'],
    route: '/admin/apps/defesa-civil',
    actions: [
      criacao('VISTORIA_AREA_RISCO', 'Ocorrência — vistoria em área de risco'),
      criacao('DENUNCIA_AREA_RISCO', 'Ocorrência — denúncia de área de risco'),
      criacao('DENUNCIA_CONSTRUCAO', 'Ocorrência — construção irregular em risco'),
      criacao('REMOCAO_PREVENTIVA', 'Ocorrência — remoção preventiva'),
      criacao('SOLICITACAO_ABRIGO', 'Ocorrência — solicitação de abrigo'),
      criacao('ALERTA_EMERGENCIA', 'Ocorrência — alerta de emergência'),
    ],
  },
  {
    code: 'politicas-mulheres',
    name: 'Rede de Atendimento à Mulher',
    description: 'Casos sigilosos, acompanhamento e encaminhamentos',
    departments: ['POLITICAS_MULHERES'],
    route: '/admin/apps/politicas-mulheres',
    actions: [
      criacao('DENUNCIA_VIOLENCIA', 'Caso — denúncia de violência'),
      criacao('DENUNCIA_ASSEDIO', 'Caso — denúncia de assédio'),
      criacao('ACOLHIMENTO_CASA_ABRIGO', 'Caso — acolhimento em casa-abrigo'),
      criacao('MEDIDA_PROTETIVA', 'Caso — medida protetiva'),
      criacao('ACOMPANHAMENTO_SOCIAL', 'Caso — acompanhamento social'),
    ],
  },
  {
    code: 'esportes',
    name: 'Escolinhas & Espaços Esportivos',
    description: 'Matrículas, reservas, competições e empréstimo de material',
    departments: ['ESPORTES'],
    route: '/admin/apps/esportes',
    actions: [
      criacao('INSCRICAO_ESCOLINHA_FUTEBOL', 'Matrícula — escolinha de futebol'),
      criacao('INSCRICAO_ESCOLINHA_BASQUETE', 'Matrícula — escolinha de basquete'),
      criacao('INSCRICAO_ESCOLINHA_VOLEI', 'Matrícula — escolinha de vôlei'),
      criacao('INSCRICAO_ESCOLINHA_NATACAO', 'Matrícula — escolinha de natação'),
      criacao('INSCRICAO_ESCOLINHA_JUDO', 'Matrícula — escolinha de judô'),
      criacao('INSCRICAO_ESCOLINHA_CAPOEIRA', 'Matrícula — escolinha de capoeira'),
      criacao('INSCRICAO_ESCOLINHA_GINASTICA', 'Matrícula — escolinha de ginástica'),
      criacao('INSCRICAO_ESCOLINHA_OUTRA', 'Matrícula — outra modalidade ou aula'),
      criacao('RESERVA_ESPACO_ESPORTIVO', 'Reserva de espaço esportivo'),
      criacao('USO_GINASIO', 'Reserva — uso do ginásio'),
      criacao('INSCRICAO_COMPETICAO', 'Inscrição em competição'),
      criacao('INSCRICAO_CORRIDA_RUA', 'Inscrição em corrida de rua'),
      criacao('EMPRESTIMO_MATERIAL_ESPORTIVO', 'Empréstimo de material esportivo'),
    ],
  },
  {
    code: 'cultura',
    name: 'Espaços & Oficinas Culturais',
    description: 'Oficinas, reservas de espaço, editais e empréstimo de equipamento',
    departments: ['CULTURA'],
    route: '/admin/apps/cultura',
    actions: [
      criacao('INSCRICAO_OFICINA', 'Matrícula em oficina'),
      criacao('INSCRICAO_OFICINA_CULTURAL', 'Matrícula em oficina cultural'),
      criacao('RESERVA_ESPACO_CULTURAL', 'Reserva de espaço cultural'),
      criacao('INSCRICAO_EDITAL', 'Projeto — inscrição em edital'),
      criacao('PROJETO_CULTURAL', 'Projeto cultural'),
      criacao('SUBMISSAO_PROJETO_CULTURAL', 'Projeto — submissão'),
      criacao('APOIO_CULTURAL', 'Projeto — pedido de apoio cultural'),
    ],
  },
  {
    code: 'transportes-transito',
    name: 'Credenciamentos & Vistorias',
    description: 'Credenciais de táxi/mototáxi/escolar, vistorias e defesas de autuação',
    departments: ['TRANSPORTES_TRANSITO'],
    route: '/admin/apps/transportes-transito',
    actions: [
      criacao('CREDENCIAMENTO_TAXI', 'Credencial — táxi'),
      criacao('CREDENCIAMENTO_MOTOTAXI', 'Credencial — mototáxi'),
      criacao('CREDENCIAMENTO_TRANSPORTE_ESCOLAR', 'Credencial — transporte escolar'),
      criacao('VISTORIA_VEICULO', 'Vistoria de veículo'),
      criacao('DEFESA_AUTUACAO', 'Defesa de autuação'),
      criacao('RENOVACAO_CREDENCIAMENTO', 'Renovação de credencial'),
      criacao('TRANSFERENCIA_PONTO_TAXI', 'Troca de ponto de táxi'),
    ],
  },
  {
    code: 'mobilidade-urbana',
    name: 'Carteiras & Gratuidades',
    description: 'Carteiras de estudante, idoso, PcD e passe livre com QR de validação',
    departments: ['MOBILIDADE_URBANA'],
    route: '/admin/apps/mobilidade-urbana',
    actions: [
      criacao('CARTAO_ESTUDANTE', 'Carteira — estudante'),
      criacao('CARTAO_TRANSPORTE', 'Carteira — transporte'),
      criacao('ISENCAO_IDOSO', 'Carteira — isenção idoso'),
      criacao('PASSE_LIVRE_INTERESTADUAL', 'Carteira — passe livre interestadual'),
      criacao('VAGA_ESPECIAL_PCD', 'Carteira — vaga especial PcD'),
    ],
  },
  {
    code: 'agricultura',
    name: 'Agricultura',
    description: 'Produtores, propriedades, assistência técnica, sementes e máquinas',
    departments: ['AGRICULTURA'],
    route: '/admin/apps/agricultura',
    actions: [
      criacao('ASSISTENCIA_TECNICA', 'Solicitação de assistência técnica'),
      criacao('SOLICITACAO_MAQUINAS', 'Pedido de máquina agrícola (mecanização)'),
      criacao('DISTRIBUICAO_INSUMOS', 'Pedido de sementes, mudas, adubo ou calcário (entregue pelo estoque)'),
      aprovacao('CADASTRO_PRODUTOR', 'Cadastro do produtor (ao aprovar o pedido)'),
      aprovacao('CADASTRO_PROPRIEDADE_RURAL', 'Cadastro da propriedade (ao aprovar o pedido)'),
    ],
  },
  {
    code: 'balcao-empregos',
    name: 'Balcão de Empregos',
    description: 'Currículos, vagas das empresas e encaminhamentos',
    departments: ['DESENVOLVIMENTO_ECONOMICO'],
    route: '/admin/apps/desenvolvimento-economico',
    actions: [criacao('CADASTRO_BALCAO_EMPREGOS', 'Currículo no Balcão de Empregos')],
  },
  {
    code: 'seguranca-publica',
    name: 'Ocorrências de Segurança',
    description: 'Ocorrências, denúncias, patrulhamento e pontos críticos, com mapa',
    departments: ['SEGURANCA_PUBLICA'],
    route: '/admin/apps/seguranca-publica',
    actions: [
      criacao('REGISTRO_OCORRENCIA', 'Ocorrência'),
      criacao('SOLICITACAO_PATRULHAMENTO', 'Pedido de patrulhamento'),
      criacao('DENUNCIA_ANONIMA', 'Denúncia anônima'),
      criacao('CADASTRO_PONTO_CRITICO', 'Ponto crítico'),
      criacao('ALERTA_SEGURANCA', 'Alerta de segurança'),
      criacao('PATRULHA_ESCOLAR', 'Patrulha escolar'),
      criacao('GUARDA_PATRIMONIAL', 'Guarda patrimonial'),
      criacao('SOS_MULHER', 'Pedido de ajuda urgente'),
    ],
  },
  {
    code: 'turismo',
    name: 'Cadastro do Turismo',
    description: 'Prestadores turísticos (hospedagem, guias, agências, atrativos) e eventos',
    departments: ['TURISMO'],
    route: '/admin/apps/turismo',
    actions: [
      criacao('CADASTRO_ESTABELECIMENTO_TURISTICO', 'Cadastro — estabelecimento turístico'),
      criacao('CADASTRO_GUIA_TURISTICO', 'Cadastro — guia turístico'),
      criacao('CREDENCIAMENTO_AGENCIA_TURISMO', 'Cadastro — agência de turismo'),
      criacao('AUTORIZACAO_TRANSPORTE_TURISTICO', 'Cadastro — transporte turístico'),
      criacao('CADASTRO_ATRACAO_TURISTICA', 'Cadastro — atração turística'),
      criacao('REGISTRO_EVENTO_TURISTICO', 'Evento turístico'),
      criacao('APOIO_FEIRA_EXPOSICAO', 'Evento — pedido de apoio a feira/exposição'),
    ],
  },
  // ---------------------------------------------- apps gerais (2026-10-09)
  {
    code: 'agenda-atendimentos',
    name: 'Agenda de Atendimentos',
    description: 'Marca dia, hora e local de orientações, consultorias, atendimentos e visitas em casa',
    departments: [
      'ADMINISTRACAO', 'AGRICULTURA', 'ASSISTENCIA_SOCIAL', 'CULTURA', 'DEFESA_CIVIL', 'DESENVOLVIMENTO_ECONOMICO', 'EDUCACAO', 'ESPORTES',
      'FINANCAS', 'HABITACAO', 'MEIO_AMBIENTE', 'MOBILIDADE_URBANA', 'OBRAS_PUBLICAS', 'PLANEJAMENTO_URBANO', 'POLITICAS_MULHERES',
      'SEGURANCA_PUBLICA', 'SERVICOS_PUBLICOS', 'TECNOLOGIA_INOVACAO', 'TRANSPORTES_TRANSITO', 'TURISMO',
    ],
    route: '/admin/apps/agenda-atendimentos',
    actions: [
      criacao('AGENDAMENTO_ATENDIMENTO', 'Agendamento de atendimento ou orientação (a equipe marca o horário)'),
      criacao('AGENDA_VISITA_DOMICILIAR', 'Visita ou atendimento na casa da pessoa'),
    ],
  },
  {
    code: 'cursos',
    name: 'Cursos e Capacitações',
    description: 'Cursos e turmas com vagas, lista de espera, frequência e conclusão',
    departments: [
      'ADMINISTRACAO', 'AGRICULTURA', 'ASSISTENCIA_SOCIAL', 'DEFESA_CIVIL', 'DESENVOLVIMENTO_ECONOMICO', 'EDUCACAO', 'HABITACAO',
      'MEIO_AMBIENTE', 'MOBILIDADE_URBANA', 'POLITICAS_MULHERES', 'SEGURANCA_PUBLICA', 'TECNOLOGIA_INOVACAO', 'TRANSPORTES_TRANSITO', 'TURISMO',
    ],
    route: '/admin/apps/cursos',
    actions: [criacao('INSCRICAO_CURSO', 'Inscrição em curso ou capacitação')],
  },
  {
    code: 'feiras-mercados',
    name: 'Feiras e Mercados',
    description: 'Boxes, bancas e pontos de feira e mercado municipal, com permissão e validade',
    departments: ['SERVICOS_PUBLICOS', 'DESENVOLVIMENTO_ECONOMICO', 'AGRICULTURA'],
    route: '/admin/apps/feiras-mercados',
    actions: [
      criacao('PERMISSAO_ESPACO_FEIRA', 'Permissão de box, banca ou ponto'),
      criacao('INSCRICAO_FEIRA', 'Inscrição em feira (produtor, artesanato, empreendedores)'),
      criacao('RELOCACAO_PONTO_FEIRA', 'Troca de box, banca ou ponto'),
    ],
  },
  {
    code: 'cemiterios',
    name: 'Cemitérios',
    description: 'Sepulturas e jazigos, concessões, sepultamentos e exumações',
    departments: ['SERVICOS_PUBLICOS'],
    route: '/admin/apps/cemiterios',
    actions: [
      criacao('CONCESSAO_SEPULTURA', 'Concessão de sepultura/jazigo'),
      criacao('RENOVACAO_CONCESSAO_SEPULTURA', 'Renovação da concessão'),
      criacao('TRANSFERENCIA_JAZIGO', 'Transferência de titularidade'),
      criacao('EXUMACAO', 'Exumação'),
      criacao('SEPULTAMENTO', 'Sepultamento'),
    ],
  },
];

const ACTION_INDEX = new Map<string, { app: AppDefinition; action: AppAction }>();
for (const app of APP_CATALOG) {
  for (const action of app.actions) ACTION_INDEX.set(action.code, { app, action });
}

/** App e ação de um código de ação (ou undefined se não existir) */
export function findAppAction(code: string | null | undefined) {
  return code ? ACTION_INDEX.get(code) : undefined;
}

/** Todos os códigos de ação conhecidos (para migrar serviços antigos) */
export function allAppActionCodes(): string[] {
  return [...ACTION_INDEX.keys()];
}

/** Apps de uma secretaria (todas, se não informada) */
export function appsForDepartment(departmentCode?: string | null): AppDefinition[] {
  if (!departmentCode) return APP_CATALOG;
  const code = departmentCode.toUpperCase().replace(/-/g, '_');
  return APP_CATALOG.filter((app) => app.departments.includes(code));
}

export type ServiceDestination = 'FILA' | 'APP';

/**
 * Chave de roteamento protocolo→app de um serviço.
 * - destino FILA: nunca vai para app (nem que o nome "pareça" um código);
 * - destino APP: a ação declarada;
 * - sem destino (serviço anterior à migração): comportamento legado pelo moduleType.
 */
export function resolveAppRoutingKey(service: {
  destination?: string | null;
  appAction?: string | null;
  moduleType?: string | null;
}): string | null {
  if (service.destination === 'FILA') return null;
  if (service.destination === 'APP') return service.appAction || null;
  return service.moduleType || null;
}

/**
 * Valida o destino de um serviço. Devolve mensagem de erro amigável ou null.
 * A ação precisa existir e pertencer a um app da secretaria do serviço.
 */
export function validateServiceDestination(
  destination: unknown,
  appAction: unknown,
  departmentCode: string | null | undefined
): string | null {
  if (destination === undefined || destination === null) return null;
  if (destination !== 'FILA' && destination !== 'APP') {
    return 'Destino inválido: use "FILA" (analisado no protocolo) ou "APP".';
  }
  if (destination === 'FILA') return null;
  const found = findAppAction(typeof appAction === 'string' ? appAction : null);
  if (!found) return 'Escolha para qual app e ação o pedido deve ir.';
  const dept = (departmentCode || '').toUpperCase().replace(/-/g, '_');
  if (dept && !found.app.departments.includes(dept)) {
    return `O app "${found.app.name}" não pertence à secretaria deste serviço.`;
  }
  return null;
}

/**
 * Destino EFETIVO de um serviço, para exibir e editar. Serviços sem destino
 * gravado (criados por seed/provisionamento depois da migration) são roteados
 * pelo moduleType legado — sem isto, a tela mostraria "analisado no protocolo"
 * e, ao salvar, o serviço deixaria de ir para o app.
 */
export function effectiveDestination(service: {
  destination?: string | null;
  appAction?: string | null;
  moduleType?: string | null;
}): { destination: ServiceDestination; appAction: string | null } {
  if (service.destination === 'APP' || service.destination === 'FILA') {
    return { destination: service.destination, appAction: service.destination === 'APP' ? service.appAction || null : null };
  }
  if (service.moduleType && findAppAction(service.moduleType)) {
    return { destination: 'APP', appAction: service.moduleType };
  }
  if (service.moduleType && /TFD/i.test(service.moduleType)) {
    return { destination: 'APP', appAction: 'ENCAMINHAMENTOS_TFD' };
  }
  return { destination: 'FILA', appAction: null };
}
