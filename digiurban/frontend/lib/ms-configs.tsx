import { MSConfig } from '@/components/ms/MSTemplate';
import {
  GraduationCap,
  Stethoscope,
  Ambulance,
  Bus,
  Apple,
  ShoppingBag,
  Shirt,
  Trophy,
  Heart,
  Package,
  Users,
  Home,
  Leaf,
  Construction,
  Sprout,
  Music,
  Palette,
  Building,
  Dumbbell,
  Warehouse,
  FileText,
  Shield,
  Camera,
  MapPin,
  Trees,
  Recycle,
  Hammer,
  Lightbulb,
  Droplets,
  Route,
  MapPinned,
  TractorIcon as Tractor,
  CreditCard,
  ClipboardList,
  Landmark,
  Dog,
  Cross,
  Bug,
  AlertTriangle,
  Calendar,
  Store,
  Building2,
  CheckSquare,
  Hotel,
  Info,
  Trash,
  LayoutGrid,
  Megaphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper para renderizar badges de status
const renderStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    AGUARDANDO_ANALISE: { label: 'Aguardando', variant: 'secondary' },
    AGUARDANDO_VALIDACAO: { label: 'Em Validação', variant: 'secondary' },
    EM_ANALISE: { label: 'Em Análise', variant: 'default' },
    APROVADO: { label: 'Aprovado', variant: 'default' },
    CONCLUIDO: { label: 'Concluído', variant: 'default' },
    MATRICULADO: { label: 'Matriculado', variant: 'default' },
    REJEITADO: { label: 'Rejeitado', variant: 'destructive' },
    CANCELADO: { label: 'Cancelado', variant: 'destructive' },
    AGENDADO: { label: 'Agendado', variant: 'default' },
    REALIZADO: { label: 'Realizado', variant: 'default' },
    FILA_ESPERA: { label: 'Fila de Espera', variant: 'secondary' },
    ATIVO: { label: 'Ativo', variant: 'default' },
    INATIVO: { label: 'Inativo', variant: 'outline' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// MS-01: Consultas Especializadas
export const msConsultasEspecializadas: MSConfig = {
  id: 'consultas-especializadas',
  title: 'Consultas Especializadas',
  description: 'Gerenciamento de encaminhamentos para consultas médicas especializadas',
  icon: <Stethoscope className="h-6 w-6" />,
  endpoint: '/ms/consultas-especializadas',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'especialidade', label: 'Especialidade', sortable: true },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
    { key: 'createdAt', label: 'Data Solicitação', sortable: true, render: (value) => new Date(value).toLocaleDateString('pt-BR') },
  ],
  statuses: [
    { value: 'FILA_ESPERA', label: 'Fila de Espera', color: '#f59e0b' },
    { value: 'AGENDADO', label: 'Agendado', color: '#3b82f6' },
    { value: 'REALIZADO', label: 'Realizado', color: '#10b981' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#ef4444' },
  ],
  metrics: {
    total: { label: 'Total de Solicitações' },
    pending: { label: 'Em Fila' },
    approved: { label: 'Agendados' },
    rejected: { label: 'Cancelados' },
  },
  hasWorkflow: true,
  hasReports: true,
};

// MS-02: Agenda Médica
export const msAgendaMedica: MSConfig = {
  id: 'agenda-medica',
  title: 'Agenda Médica',
  description: 'Sistema completo de agendamento de consultas médicas',
  icon: <Calendar className="h-6 w-6" />,
  endpoint: '/ms/agenda-medica',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'profissionalNome', label: 'Profissional', sortable: true },
    { key: 'dataConsulta', label: 'Data/Hora', sortable: true, render: (value) => new Date(value).toLocaleString('pt-BR') },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
  ],
  statuses: [
    { value: 'AGENDADO', label: 'Agendado', color: '#3b82f6' },
    { value: 'CONFIRMADO', label: 'Confirmado', color: '#10b981' },
    { value: 'REALIZADO', label: 'Realizado', color: '#10b981' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#ef4444' },
    { value: 'FALTOU', label: 'Faltou', color: '#f59e0b' },
  ],
  metrics: {
    total: { label: 'Total de Agendamentos' },
    pending: { label: 'Agendados' },
    approved: { label: 'Realizados' },
    rejected: { label: 'Cancelados' },
  },
  hasWorkflow: true,
  hasReports: true,
  hasSettings: true,
};

// MS-03: Exames
export const msExames: MSConfig = {
  id: 'exames',
  title: 'Solicitação de Exames',
  description: 'Gerenciamento de solicitações e agendamento de exames médicos',
  icon: <ClipboardList className="h-6 w-6" />,
  endpoint: '/ms/exames',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'tipoExame', label: 'Tipo de Exame', sortable: true },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
    { key: 'createdAt', label: 'Data Solicitação', sortable: true },
  ],
  statuses: [
    { value: 'AGUARDANDO_AGENDAMENTO', label: 'Aguardando Agendamento', color: '#f59e0b' },
    { value: 'AGENDADO', label: 'Agendado', color: '#3b82f6' },
    { value: 'REALIZADO', label: 'Realizado', color: '#10b981' },
    { value: 'RESULTADO_DISPONIVEL', label: 'Resultado Disponível', color: '#10b981' },
  ],
  metrics: {
    total: { label: 'Total de Solicitações' },
    pending: { label: 'Aguardando' },
    approved: { label: 'Realizados' },
    rejected: { label: 'Cancelados' },
  },
  hasWorkflow: true,
  hasReports: true,
};

// MS-04: Medicamentos
export const msMedicamentos: MSConfig = {
  id: 'medicamentos',
  title: 'Distribuição de Medicamentos',
  description: 'Controle de estoque e distribuição de medicamentos da farmácia municipal',
  icon: <Package className="h-6 w-6" />,
  endpoint: '/ms/medicamentos',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'medicamento', label: 'Medicamento', sortable: true },
    { key: 'quantidade', label: 'Quantidade', sortable: true },
    { key: 'dataRetirada', label: 'Data Retirada', render: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '-' },
  ],
  metrics: {
    total: { label: 'Total de Dispensações' },
    pending: { label: 'Pendentes' },
    approved: { label: 'Entregues' },
    rejected: { label: 'Canceladas' },
  },
  hasReports: true,
  hasSettings: true,
};

// MS-05: Vacinas
export const msVacinas: MSConfig = {
  id: 'vacinas',
  title: 'Campanha de Vacinação',
  description: 'Gerenciamento de campanhas de vacinação e carteira de vacinação',
  icon: <ShoppingBag className="h-6 w-6" />,
  endpoint: '/ms/vacinas',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'vacina', label: 'Vacina', sortable: true },
    { key: 'dose', label: 'Dose', sortable: true },
    { key: 'dataAplicacao', label: 'Data Aplicação', render: (value) => new Date(value).toLocaleDateString('pt-BR') },
  ],
  metrics: {
    total: { label: 'Total de Doses Aplicadas' },
    pending: { label: 'Agendadas' },
    approved: { label: 'Aplicadas' },
    rejected: { label: 'Canceladas' },
  },
  hasReports: true,
};

// MS-06: TFD (Tratamento Fora de Domicílio)
export const msTFD: MSConfig = {
  id: 'tfd',
  title: 'TFD - Tratamento Fora de Domicílio',
  description: 'Gerenciamento de viagens para tratamento médico em outras cidades',
  icon: <Ambulance className="h-6 w-6" />,
  endpoint: '/ms/tfd',
  departmentSlug: 'saude',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'pacienteNome', label: 'Paciente', sortable: true },
    { key: 'destinoCidade', label: 'Destino', sortable: true },
    { key: 'especialidade', label: 'Especialidade', sortable: true },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
    { key: 'dataViagem', label: 'Data Viagem', sortable: true },
  ],
  statuses: [
    { value: 'AGUARDANDO_ANALISE', label: 'Aguardando Análise', color: '#f59e0b' },
    { value: 'APROVADO', label: 'Aprovado', color: '#10b981' },
    { value: 'AGENDADO', label: 'Agendado', color: '#3b82f6' },
    { value: 'REALIZADO', label: 'Realizado', color: '#10b981' },
    { value: 'REJEITADO', label: 'Rejeitado', color: '#ef4444' },
  ],
  metrics: {
    total: { label: 'Total de Solicitações' },
    pending: { label: 'Aguardando' },
    approved: { label: 'Aprovados' },
    rejected: { label: 'Rejeitados' },
  },
  hasWorkflow: true,
  hasReports: true,
};

// MS-07: Transporte Escolar
export const msTransporteEscolar: MSConfig = {
  id: 'transporte-escolar',
  title: 'Transporte Escolar',
  description: 'Gerenciamento de rotas e solicitações de transporte escolar',
  icon: <Bus className="h-6 w-6" />,
  endpoint: '/ms/transporte-escolar',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'alunoNome', label: 'Aluno', sortable: true },
    { key: 'escolaNome', label: 'Escola', sortable: true },
    { key: 'enderecoEmbarque', label: 'Endereço Embarque' },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
  ],
  statuses: [
    { value: 'AGUARDANDO_ANALISE', label: 'Aguardando', color: '#f59e0b' },
    { value: 'APROVADO', label: 'Aprovado', color: '#10b981' },
    { value: 'ATIVO', label: 'Ativo', color: '#3b82f6' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#ef4444' },
  ],
  metrics: {
    total: { label: 'Total de Solicitações' },
    pending: { label: 'Aguardando' },
    approved: { label: 'Ativos' },
    rejected: { label: 'Cancelados' },
  },
  hasWorkflow: true,
  hasReports: true,
  hasSettings: true,
};

// MS-08: Matrículas
export const msMatriculas: MSConfig = {
  id: 'matriculas',
  title: 'Matrículas Escolares',
  description: 'Sistema completo de inscrição e matrícula de alunos na rede municipal',
  icon: <GraduationCap className="h-6 w-6" />,
  endpoint: '/ms/matriculas',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'alunoNome', label: 'Aluno', sortable: true },
    { key: 'serie', label: 'Série', sortable: true },
    { key: 'escolaNome', label: 'Escola Preferencial' },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
    { key: 'createdAt', label: 'Data Inscrição', sortable: true },
  ],
  statuses: [
    { value: 'AGUARDANDO_VALIDACAO', label: 'Aguardando Validação', color: '#f59e0b' },
    { value: 'VALIDADO', label: 'Validado', color: '#3b82f6' },
    { value: 'APROVADO', label: 'Aprovado', color: '#10b981' },
    { value: 'MATRICULADO', label: 'Matriculado', color: '#10b981' },
    { value: 'REJEITADO', label: 'Rejeitado', color: '#ef4444' },
  ],
  metrics: {
    total: { label: 'Total de Inscrições' },
    pending: { label: 'Aguardando' },
    approved: { label: 'Matriculados' },
    rejected: { label: 'Rejeitados' },
  },
  hasWorkflow: true,
  hasReports: true,
  hasSettings: true,
};

// MS-09: Merenda Escolar
export const msMerenda: MSConfig = {
  id: 'merenda',
  title: 'Merenda Escolar',
  description: 'Gerenciamento de cardápios e distribuição de merenda escolar',
  icon: <Apple className="h-6 w-6" />,
  endpoint: '/ms/merenda',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'escolaNome', label: 'Escola', sortable: true },
    { key: 'data', label: 'Data', sortable: true },
    { key: 'refeicao', label: 'Refeição', sortable: true },
    { key: 'qtdAlunos', label: 'Qtd Alunos', sortable: true },
  ],
  metrics: {
    total: { label: 'Total de Refeições' },
    pending: { label: 'Planejadas' },
    approved: { label: 'Servidas' },
    rejected: { label: 'Canceladas' },
  },
  hasReports: true,
  hasSettings: true,
};

// MS-10: Material Escolar
export const msMaterialEscolar: MSConfig = {
  id: 'material-escolar',
  title: 'Material Escolar',
  description: 'Distribuição de kits de material escolar para alunos',
  icon: <Package className="h-6 w-6" />,
  endpoint: '/ms/material-escolar',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'alunoNome', label: 'Aluno', sortable: true },
    { key: 'serie', label: 'Série', sortable: true },
    { key: 'tipoKit', label: 'Tipo de Kit' },
    { key: 'dataEntrega', label: 'Data Entrega' },
  ],
  metrics: {
    total: { label: 'Total de Kits' },
    pending: { label: 'Pendentes' },
    approved: { label: 'Entregues' },
    rejected: { label: 'Cancelados' },
  },
  hasReports: true,
};

// MS-11: Uniforme Escolar
export const msUniforme: MSConfig = {
  id: 'uniforme',
  title: 'Uniforme Escolar',
  description: 'Distribuição de uniformes escolares',
  icon: <Shirt className="h-6 w-6" />,
  endpoint: '/ms/uniforme',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'alunoNome', label: 'Aluno', sortable: true },
    { key: 'tamanho', label: 'Tamanho', sortable: true },
    { key: 'qtdPecas', label: 'Qtd Peças', sortable: true },
    { key: 'dataEntrega', label: 'Data Entrega' },
  ],
  metrics: {
    total: { label: 'Total de Kits' },
    pending: { label: 'Pendentes' },
    approved: { label: 'Entregues' },
    rejected: { label: 'Cancelados' },
  },
  hasReports: true,
};

// MS-12: Atividades Extracurriculares
export const msAtividadesExtras: MSConfig = {
  id: 'atividades-extras',
  title: 'Atividades Extracurriculares',
  description: 'Gerenciamento de atividades complementares e oficinas',
  icon: <Trophy className="h-6 w-6" />,
  endpoint: '/ms/atividades-extras',
  departmentSlug: 'educacao',
  columns: [
    { key: 'id', label: 'ID', width: '100px' },
    { key: 'alunoNome', label: 'Aluno', sortable: true },
    { key: 'atividade', label: 'Atividade', sortable: true },
    { key: 'turno', label: 'Turno', sortable: true },
    { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
  ],
  metrics: {
    total: { label: 'Total de Inscrições' },
    pending: { label: 'Pendentes' },
    approved: { label: 'Ativos' },
    rejected: { label: 'Inativos' },
  },
  hasReports: true,
};

// Continuar com os outros MS... (Por brevidade, vou criar uma função factory)
function createBasicMSConfig(
  id: string,
  title: string,
  description: string,
  icon: any,
  departmentSlug: string
): MSConfig {
  return {
    id,
    title,
    description,
    icon,
    endpoint: `/ms/${id}`,
    departmentSlug,
    columns: [
      { key: 'id', label: 'ID', width: '100px' },
      { key: 'descricao', label: 'Descrição', sortable: true },
      { key: 'status', label: 'Status', render: (value) => renderStatusBadge(value) },
      { key: 'createdAt', label: 'Data Criação', sortable: true, render: (value) => new Date(value).toLocaleDateString('pt-BR') },
    ],
    metrics: {
      total: { label: 'Total de Registros' },
      pending: { label: 'Pendentes' },
      approved: { label: 'Aprovados' },
      rejected: { label: 'Cancelados' },
    },
    hasReports: true,
  };
}

// MS Assistência Social
export const msAuxilioEmergencial = createBasicMSConfig('auxilio-emergencial', 'Auxílio Emergencial', 'Auxílio financeiro emergencial para famílias', <Heart className="h-6 w-6" />, 'assistencia-social');
export const msCestaBasica = createBasicMSConfig('cesta-basica', 'Cesta Básica', 'Distribuição de cestas básicas', <Package className="h-6 w-6" />, 'assistencia-social');
export const msCRAS = createBasicMSConfig('cras', 'CRAS - Centro de Referência', 'Gerenciamento de atendimentos CRAS', <Users className="h-6 w-6" />, 'assistencia-social');
export const msCREAS = createBasicMSConfig('creas', 'CREAS - Centro Especializado', 'Atendimentos especializados CREAS', <Shield className="h-6 w-6" />, 'assistencia-social');
export const msBolsaFamilia = createBasicMSConfig('bolsa-familia', 'Bolsa Família', 'Gerenciamento de beneficiários Bolsa Família', <CreditCard className="h-6 w-6" />, 'assistencia-social');
export const msCadastroUnico = createBasicMSConfig('cadastro-unico', 'Cadastro Único', 'CadÚnico - Cadastro único para programas sociais', <FileText className="h-6 w-6" />, 'assistencia-social');

// MS Agricultura
export const msInsumosAgricolas = createBasicMSConfig('insumos-agricolas', 'Insumos Agrícolas', 'Distribuição de sementes e insumos', <Sprout className="h-6 w-6" />, 'agricultura');
export const msComercializacao = createBasicMSConfig('comercializacao', 'Comercialização', 'Apoio à comercialização de produtos', <Store className="h-6 w-6" />, 'agricultura');
export const msCadastroProdutor = createBasicMSConfig('cadastro-produtor', 'Cadastro de Produtores', 'Cadastro de produtores rurais', <Users className="h-6 w-6" />, 'agricultura');
export const msAssistenciaTecnica = createBasicMSConfig('assistencia-tecnica', 'Assistência Técnica', 'Assistência técnica rural', <Tractor className="h-6 w-6" />, 'agricultura');
export const msCreditoAgricola = createBasicMSConfig('credito-agricola', 'Crédito Agrícola', 'Crédito para produtores rurais', <CreditCard className="h-6 w-6" />, 'agricultura');
export const msDistribuicaoSementes = createBasicMSConfig('distribuicao-sementes', 'Distribuição de Sementes', 'Distribuição de sementes certificadas', <Sprout className="h-6 w-6" />, 'agricultura');

// MS Cultura
export const msProjetosCulturais = createBasicMSConfig('projetos-culturais', 'Projetos Culturais', 'Gerenciamento de projetos culturais', <Palette className="h-6 w-6" />, 'cultura');
export const msLeiIncentivo = createBasicMSConfig('lei-incentivo', 'Lei de Incentivo', 'Lei de incentivo à cultura', <Landmark className="h-6 w-6" />, 'cultura');
export const msEspacosCulturais = createBasicMSConfig('espacos-culturais', 'Espaços Culturais', 'Gerenciamento de espaços culturais', <Building className="h-6 w-6" />, 'cultura');
export const msEventosCulturais = createBasicMSConfig('eventos-culturais', 'Eventos Culturais', 'Calendário de eventos culturais', <Calendar className="h-6 w-6" />, 'cultura');
export const msArtistasCadastro = createBasicMSConfig('artistas-cadastro', 'Cadastro de Artistas', 'Cadastro de artistas locais', <Music className="h-6 w-6" />, 'cultura');
export const msPatrimonio = createBasicMSConfig('patrimonio', 'Patrimônio Cultural', 'Preservação do patrimônio', <Landmark className="h-6 w-6" />, 'cultura');

// MS Esportes
export const msEscolinhas = createBasicMSConfig('escolinhas', 'Escolinhas Esportivas', 'Gerenciamento de escolinhas', <Dumbbell className="h-6 w-6" />, 'esportes');
export const msProjetosEsportivos = createBasicMSConfig('projetos-esportivos', 'Projetos Esportivos', 'Projetos e programas esportivos', <Trophy className="h-6 w-6" />, 'esportes');
export const msEventosEsportivos = createBasicMSConfig('eventos-esportivos', 'Eventos Esportivos', 'Competições e eventos', <Calendar className="h-6 w-6" />, 'esportes');
export const msQuadras = createBasicMSConfig('quadras', 'Quadras e Ginásios', 'Gerenciamento de espaços esportivos', <Building2 className="h-6 w-6" />, 'esportes');
export const msAtletasCadastro = createBasicMSConfig('atletas-cadastro', 'Cadastro de Atletas', 'Cadastro de atletas', <Users className="h-6 w-6" />, 'esportes');
export const msCompeticoes = createBasicMSConfig('competicoes', 'Competições', 'Gerenciamento de competições', <Trophy className="h-6 w-6" />, 'esportes');

// MS Habitação
export const msCasaPopular = createBasicMSConfig('casa-popular', 'Casa Popular', 'Programa de habitação popular', <Home className="h-6 w-6" />, 'habitacao');
export const msRegularizacaoFundiaria = createBasicMSConfig('regularizacao-fundiaria', 'Regularização Fundiária', 'Regularização de imóveis', <FileText className="h-6 w-6" />, 'habitacao');
export const msMelhoriasHabitacionais = createBasicMSConfig('melhorias-habitacionais', 'Melhorias Habitacionais', 'Reforma e melhorias', <Construction className="h-6 w-6" />, 'habitacao');
export const msAluguelSocial = createBasicMSConfig('aluguel-social', 'Aluguel Social', 'Auxílio aluguel', <CreditCard className="h-6 w-6" />, 'habitacao');
export const msLotesUrbanizados = createBasicMSConfig('lotes-urbanizados', 'Lotes Urbanizados', 'Distribuição de lotes', <MapPin className="h-6 w-6" />, 'habitacao');
export const msCadastroHabitacional = createBasicMSConfig('cadastro-habitacional', 'Cadastro Habitacional', 'Cadastro de interessados', <FileText className="h-6 w-6" />, 'habitacao');

// MS Meio Ambiente
export const msLicenciamento = createBasicMSConfig('licenciamento', 'Licenciamento Ambiental', 'Licenças ambientais', <CheckSquare className="h-6 w-6" />, 'meio-ambiente');
export const msPodaArvores = createBasicMSConfig('poda-arvores', 'Poda de Árvores', 'Solicitações de poda', <Trees className="h-6 w-6" />, 'meio-ambiente');
export const msColetaSeletiva = createBasicMSConfig('coleta-seletiva', 'Coleta Seletiva', 'Gestão de coleta seletiva', <Recycle className="h-6 w-6" />, 'meio-ambiente');
export const msDenunciaAmbiental = createBasicMSConfig('denuncia-ambiental', 'Denúncia Ambiental', 'Denúncias ambientais', <AlertTriangle className="h-6 w-6" />, 'meio-ambiente');
export const msEducacaoAmbiental = createBasicMSConfig('educacao-ambiental', 'Educação Ambiental', 'Programas educacionais', <GraduationCap className="h-6 w-6" />, 'meio-ambiente');
export const msAreasVerdes = createBasicMSConfig('areas-verdes', 'Áreas Verdes', 'Gerenciamento de áreas verdes', <Trees className="h-6 w-6" />, 'meio-ambiente');

// MS Obras
export const msTapaBuracos = createBasicMSConfig('tapa-buracos', 'Tapa Buracos', 'Solicitações de tapa-buracos', <Hammer className="h-6 w-6" />, 'obras');
export const msIluminacaoPublica = createBasicMSConfig('iluminacao-publica', 'Iluminação Pública', 'Manutenção de iluminação', <Lightbulb className="h-6 w-6" />, 'obras');
export const msDrenagem = createBasicMSConfig('drenagem', 'Drenagem', 'Obras de drenagem', <Droplets className="h-6 w-6" />, 'obras');
export const msCalcamento = createBasicMSConfig('calcamento', 'Calçamento', 'Pavimentação de vias', <Route className="h-6 w-6" />, 'obras');
export const msSinalizacao = createBasicMSConfig('sinalizacao', 'Sinalização', 'Sinalização viária', <MapPinned className="h-6 w-6" />, 'obras');
export const msPavimentacao = createBasicMSConfig('pavimentacao', 'Pavimentação', 'Obras de pavimentação', <Route className="h-6 w-6" />, 'obras');

// MS Planejamento
export const msAlvaraConstrucao = createBasicMSConfig('alvara-construcao', 'Alvará de Construção', 'Emissão de alvarás', <Building2 className="h-6 w-6" />, 'planejamento');
export const msFiscalizacaoObras = createBasicMSConfig('fiscalizacao-obras', 'Fiscalização de Obras', 'Fiscalização e vistoria', <Camera className="h-6 w-6" />, 'planejamento');
export const msHabiteSe = createBasicMSConfig('habite-se', 'Habite-se', 'Certificado de conclusão', <CheckSquare className="h-6 w-6" />, 'planejamento');
export const msParcelamentoSolo = createBasicMSConfig('parcelamento-solo', 'Parcelamento de Solo', 'Aprovação de loteamentos', <LayoutGrid className="h-6 w-6" />, 'planejamento');
export const msZoneamento = createBasicMSConfig('zoneamento', 'Zoneamento', 'Consulta de zoneamento', <MapPin className="h-6 w-6" />, 'planejamento');
export const msCertidoes = createBasicMSConfig('certidoes', 'Certidões', 'Emissão de certidões', <FileText className="h-6 w-6" />, 'planejamento');

// MS Turismo
export const msCadastroTuristico = createBasicMSConfig('cadastro-turistico', 'Cadastro Turístico', 'Cadastro de estabelecimentos', <Store className="h-6 w-6" />, 'turismo');
export const msEventosTuristicos = createBasicMSConfig('eventos-turisticos', 'Eventos Turísticos', 'Calendário turístico', <Calendar className="h-6 w-6" />, 'turismo');
export const msGuiasTurismo = createBasicMSConfig('guias-turismo', 'Guias de Turismo', 'Cadastro de guias', <Users className="h-6 w-6" />, 'turismo');
export const msHospedagem = createBasicMSConfig('hospedagem', 'Hospedagem', 'Gerenciamento de hospedagem', <Hotel className="h-6 w-6" />, 'turismo');
export const msInformacoesTuristicas = createBasicMSConfig('informacoes-turisticas', 'Informações Turísticas', 'Central de informações', <Info className="h-6 w-6" />, 'turismo');
export const msRoteirosTuristicos = createBasicMSConfig('roteiros-turisticos', 'Roteiros Turísticos', 'Roteiros e atrativos', <MapPin className="h-6 w-6" />, 'turismo');

// MS Serviços Gerais
export const msCanilMunicipal = createBasicMSConfig('canil-municipal', 'Canil Municipal', 'Gerenciamento do canil', <Dog className="h-6 w-6" />, 'servicos-gerais');
export const msCemiterio = createBasicMSConfig('cemiterio', 'Cemitério', 'Gerenciamento de cemitérios', <Cross className="h-6 w-6" />, 'servicos-gerais');
export const msControleZoonoses = createBasicMSConfig('controle-zoonoses', 'Controle de Zoonoses', 'Controle de zoonoses', <Bug className="h-6 w-6" />, 'servicos-gerais');
export const msDefesaCivil = createBasicMSConfig('defesa-civil', 'Defesa Civil', 'Ocorrências e emergências', <AlertTriangle className="h-6 w-6" />, 'servicos-gerais');
export const msFeiraLivre = createBasicMSConfig('feira-livre', 'Feira Livre', 'Gerenciamento de feiras', <Store className="h-6 w-6" />, 'servicos-gerais');
export const msLimpezaPublica = createBasicMSConfig('limpeza-publica', 'Limpeza Pública', 'Serviços de limpeza', <Trash className="h-6 w-6" />, 'servicos-gerais');

// MS Segurança
export const msRondaEscolar = createBasicMSConfig('ronda-escolar', 'Ronda Escolar', 'Segurança em escolas', <Shield className="h-6 w-6" />, 'seguranca');
export const msTransportePublico = createBasicMSConfig('transporte-publico', 'Transporte Público', 'Gerenciamento de transporte', <Bus className="h-6 w-6" />, 'seguranca');
export const msVideomonitoramento = createBasicMSConfig('videomonitoramento', 'Videomonitoramento', 'Sistema de câmeras', <Camera className="h-6 w-6" />, 'seguranca');
export const msGuardaMunicipal = createBasicMSConfig('guarda-municipal', 'Guarda Municipal', 'Gerenciamento da guarda', <Shield className="h-6 w-6" />, 'seguranca');
export const msIluminacaoSeguranca = createBasicMSConfig('iluminacao-seguranca', 'Iluminação Segurança', 'Iluminação para segurança', <Lightbulb className="h-6 w-6" />, 'seguranca');
export const msProtecaoComunitaria = createBasicMSConfig('protecao-comunitaria', 'Proteção Comunitária', 'Programas comunitários', <Users className="h-6 w-6" />, 'seguranca');

// Mapa de todos os MS configs
export const allMSConfigs: Record<string, MSConfig> = {
  'consultas-especializadas': msConsultasEspecializadas,
  'agenda-medica': msAgendaMedica,
  'exames': msExames,
  'medicamentos': msMedicamentos,
  'vacinas': msVacinas,
  'tfd': msTFD,
  'transporte-escolar': msTransporteEscolar,
  'matriculas': msMatriculas,
  'merenda': msMerenda,
  'material-escolar': msMaterialEscolar,
  'uniforme': msUniforme,
  'atividades-extras': msAtividadesExtras,
  'auxilio-emergencial': msAuxilioEmergencial,
  'cesta-basica': msCestaBasica,
  'cras': msCRAS,
  'creas': msCREAS,
  'bolsa-familia': msBolsaFamilia,
  'cadastro-unico': msCadastroUnico,
  'insumos-agricolas': msInsumosAgricolas,
  'comercializacao': msComercializacao,
  'cadastro-produtor': msCadastroProdutor,
  'assistencia-tecnica': msAssistenciaTecnica,
  'credito-agricola': msCreditoAgricola,
  'distribuicao-sementes': msDistribuicaoSementes,
  'projetos-culturais': msProjetosCulturais,
  'lei-incentivo': msLeiIncentivo,
  'espacos-culturais': msEspacosCulturais,
  'eventos-culturais': msEventosCulturais,
  'artistas-cadastro': msArtistasCadastro,
  'patrimonio': msPatrimonio,
  'escolinhas': msEscolinhas,
  'projetos-esportivos': msProjetosEsportivos,
  'eventos-esportivos': msEventosEsportivos,
  'quadras': msQuadras,
  'atletas-cadastro': msAtletasCadastro,
  'competicoes': msCompeticoes,
  'casa-popular': msCasaPopular,
  'regularizacao-fundiaria': msRegularizacaoFundiaria,
  'melhorias-habitacionais': msMelhoriasHabitacionais,
  'aluguel-social': msAluguelSocial,
  'lotes-urbanizados': msLotesUrbanizados,
  'cadastro-habitacional': msCadastroHabitacional,
  'licenciamento': msLicenciamento,
  'poda-arvores': msPodaArvores,
  'coleta-seletiva': msColetaSeletiva,
  'denuncia-ambiental': msDenunciaAmbiental,
  'educacao-ambiental': msEducacaoAmbiental,
  'areas-verdes': msAreasVerdes,
  'tapa-buracos': msTapaBuracos,
  'iluminacao-publica': msIluminacaoPublica,
  'drenagem': msDrenagem,
  'calcamento': msCalcamento,
  'sinalizacao': msSinalizacao,
  'pavimentacao': msPavimentacao,
  'alvara-construcao': msAlvaraConstrucao,
  'fiscalizacao-obras': msFiscalizacaoObras,
  'habite-se': msHabiteSe,
  'parcelamento-solo': msParcelamentoSolo,
  'zoneamento': msZoneamento,
  'certidoes': msCertidoes,
  'cadastro-turistico': msCadastroTuristico,
  'eventos-turisticos': msEventosTuristicos,
  'guias-turismo': msGuiasTurismo,
  'hospedagem': msHospedagem,
  'informacoes-turisticas': msInformacoesTuristicas,
  'roteiros-turisticos': msRoteirosTuristicos,
  'canil-municipal': msCanilMunicipal,
  'cemiterio': msCemiterio,
  'controle-zoonoses': msControleZoonoses,
  'defesa-civil': msDefesaCivil,
  'feira-livre': msFeiraLivre,
  'limpeza-publica': msLimpezaPublica,
  'ronda-escolar': msRondaEscolar,
  'transporte-publico': msTransportePublico,
  'videomonitoramento': msVideomonitoramento,
  'guarda-municipal': msGuardaMunicipal,
  'iluminacao-seguranca': msIluminacaoSeguranca,
  'protecao-comunitaria': msProtecaoComunitaria,
};
