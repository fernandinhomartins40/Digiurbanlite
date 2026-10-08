import type { LucideIcon } from 'lucide-react';
import {
  Store,
  LayoutGrid,
  AlertCircle,
  BarChart3,
  Bot,
  Building2,
  Bus,
  Calendar,
  Camera,
  Car,
  Cpu,
  DollarSign,
  FileText,
  GitBranch,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  House,
  LogOut,
  Mail,
  Map,
  Monitor,
  MapPin,
  MessageCircle,
  Network,
  Palette,
  ScanFace,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Sprout,
  Tag,
  TreePine,
  TrendingUp,
  Trophy,
  Truck,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

export type AdminRole = 'GUEST' | 'USER' | 'COORDINATOR' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[];
  minRole?: AdminRole;
  badge?: string;
  /** só para quem tem o perfil Gabinete do Prefeito (marcado no cadastro do servidor) */
  gabinete?: boolean;
}

export interface AdminNavSection {
  title: string;
  icon?: LucideIcon;
  color?: 'slate' | 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'indigo' | 'orange';
  items: AdminNavItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface AdminNavStats {
  pendingProtocols?: number;
  pendingCitizens?: number;
  unreadMessages?: number;
  internalProcessInbox?: number;
}

export type PermissionChecker = (permission: string) => boolean;
export type RoleChecker = (role: AdminRole) => boolean;

function numberBadge(value?: number): string | undefined {
  if (!value || value <= 0) return undefined;
  return value > 99 ? '99+' : String(value);
}

export function getAdminMainNavigation(stats?: AdminNavStats): AdminNavSection[] {
  return [
    // ── Início (sem label, sempre visível) ─────────────────────────────────
    {
      title: '',
      color: 'slate',
      items: [
        { title: 'Início', href: '/admin', icon: House },
      ],
    },

    // ── Atendimento ────────────────────────────────────────────────────────
    {
      title: 'Atendimento',
      color: 'blue',
      collapsible: true,
      defaultCollapsed: false,
      items: [
        {
          title: 'Protocolos',
          href: '/admin/protocolos',
          icon: FileText,
          permissions: ['protocols:read'],
          badge: numberBadge(stats?.pendingProtocols),
        },
        {
          // Atendimento presencial em 3 passos (sempre gera protocolo)
          title: 'Balcão',
          href: '/admin/balcao',
          icon: Store,
          permissions: ['protocols:create'],
          badge: 'NOVO',
        },
        {
          // Atalho para as mesas de trabalho (apps) a que o servidor tem acesso
          title: 'Apps',
          href: '/admin/apps',
          icon: LayoutGrid,
          minRole: 'USER',
        },
        {
          // agenda pessoal, da unidade e da secretaria (+ o que o sistema agenda sozinho)
          title: 'Agenda',
          href: '/admin/agenda',
          icon: Calendar,
          minRole: 'USER',
        },
        {
          // pedidos no mapa, no escopo de cada servidor
          title: 'Mapa dos pedidos',
          href: '/admin/mapa',
          icon: Map,
          permissions: ['protocols:read'],
        },
        {
          title: 'Cidadãos',
          href: '/admin/cidadaos',
          icon: UserPlus,
          permissions: ['citizens:read'],
        },
        {
          title: 'Cidadãos Pendentes',
          href: '/admin/cidadaos/pendentes',
          icon: UserCheck,
          permissions: ['citizens:verify'],
          badge: numberBadge(stats?.pendingCitizens),
        },
        {
          title: 'Etiquetas',
          href: '/admin/cidadaos/etiquetas',
          icon: Tag,
          permissions: ['citizens:read'],
        },
        {
          title: 'Composição Familiar',
          href: '/admin/composicao-familiar',
          icon: Users,
          permissions: ['citizens:read'],
        },
        {
          title: 'Biometria Presencial',
          href: '/admin/cidadaos/biometria-facial',
          icon: ScanFace,
          badge: 'NOVO',
        },
      ],
    },

    // ── Serviços ───────────────────────────────────────────────────────────
    {
      title: 'Serviços',
      color: 'emerald',
      collapsible: true,
      defaultCollapsed: false,
      items: [
        {
          // Catálogo + Desempenho (abas dentro da página)
          title: 'Serviços',
          href: '/admin/servicos',
          icon: Settings,
          permissions: ['services:create', 'services:update', 'services:read'],
        },
        // WORKFLOWS: disabled via FEATURE_FLAGS.WORKFLOWS
        // { title: 'Workflows', href: '/admin/workflows', icon: GitBranch, minRole: 'ADMIN' },
        {
          // memorandos, ofícios, pareceres entre unidades (caixa de entrada da unidade)
          title: 'Processos internos',
          href: '/admin/processos-internos',
          icon: Workflow,
          minRole: 'USER',
          badge: numberBadge(stats?.internalProcessInbox),
        },
        {
          title: 'DigiBot',
          href: '/admin/digibot',
          icon: Bot,
          minRole: 'ADMIN',
        },
      ],
    },

    // ── Comunicação ────────────────────────────────────────────────────────
    {
      title: 'Comunicação',
      color: 'cyan',
      collapsible: true,
      defaultCollapsed: false,
      items: [
        {
          title: 'Mensagens',
          href: '/admin/mensagens',
          icon: MessageCircle,
          permissions: ['messages:read'],
          badge: numberBadge(stats?.unreadMessages),
        },
        { title: 'E-mails do sistema', href: '/admin/email', icon: Mail, minRole: 'MANAGER' },
      ],
    },

    // ── Documentos e análises ──────────────────────────────────────────────
    {
      title: 'Documentos e análises',
      color: 'amber',
      collapsible: true,
      defaultCollapsed: true,
      items: [
        // Meus documentos · Assinaturas · Modelos · Certificados (abas dentro da página)
        { title: 'Documentos', href: '/admin/meus-documentos', icon: FileText, minRole: 'USER' },
        // Painel · Relatórios · Assistente de IA (abas dentro da página)
        { title: 'Análises e relatórios', href: '/admin/analytics', icon: BarChart3, minRole: 'COORDINATOR' },
        // PESQUISA_PRECOS: disabled via FEATURE_FLAGS.PESQUISA_PRECOS
        // { title: 'Pesquisa de Preços', href: '/admin/pesquisa-precos', icon: Search, minRole: 'COORDINATOR' },
        // SEGURANCA_ESCOLAR: disabled via FEATURE_FLAGS.SEGURANCA_ESCOLAR
        // { title: 'Seg. Escolar', href: '/admin/apps/seguranca-escolar', icon: Shield, badge: 'NOVO' },
      ],
    },

    // ── Equipe e Sistema ───────────────────────────────────────────────────
    {
      title: 'Equipe e Sistema',
      color: 'slate',
      collapsible: true,
      defaultCollapsed: true,
      items: [
        { title: 'Servidores', href: '/admin/servidores', icon: Users, minRole: 'COORDINATOR' },
        { title: 'Organograma', href: '/admin/organograma', icon: Network, minRole: 'COORDINATOR' },
        { title: 'Perfil', href: '/admin/perfil', icon: UserCircle, minRole: 'USER' },
        { title: 'Configurações', href: '/admin/configuracoes', icon: Settings, minRole: 'ADMIN' },
        { title: 'Integrações', href: '/admin/integracoes', icon: Zap, minRole: 'ADMIN' },
        { title: 'IA e créditos', href: '/admin/ia-creditos', icon: Sparkles, minRole: 'ADMIN' },
      ],
    },
  ];
}

export const mayorPortalNavigation: AdminNavSection = {
  title: 'Gabinete do Prefeito',
  color: 'indigo',
  items: [
    // painel com abas: Hoje, Secretarias, Território, Demandas do Gabinete, Gestão interna
    { title: 'Painel do Prefeito', href: '/admin/gabinete/painel-prefeito', icon: Building2, gabinete: true },
    // tela cheia para TV: mapa ao vivo + pedidos chegando + números do dia
    { title: 'Painel na TV', href: '/admin/gabinete/painel-prefeito/tv', icon: Monitor, gabinete: true },
  ],
};

export const secretariaNavigation: AdminNavSection = {
  title: 'Secretarias',
  color: 'orange',
  collapsible: true,
  defaultCollapsed: true,
  items: [
    { title: 'Administração', href: '/admin/secretarias/administracao', icon: Building2, minRole: 'USER' },
    { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout, minRole: 'USER' },
    { title: 'Assistência Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart, minRole: 'USER' },
    { title: 'Cultura', href: '/admin/secretarias/cultura', icon: Palette, minRole: 'USER' },
    { title: 'Defesa Civil', href: '/admin/secretarias/defesa-civil', icon: ShieldAlert, minRole: 'USER' },
    { title: 'Desenv. Econômico', href: '/admin/secretarias/desenvolvimento-economico', icon: TrendingUp, minRole: 'USER' },
    { title: 'Educação', href: '/admin/secretarias/educacao', icon: GraduationCap, minRole: 'USER' },
    { title: 'Esportes', href: '/admin/secretarias/esportes', icon: Trophy, minRole: 'USER' },
    { title: 'Finanças', href: '/admin/secretarias/financas', icon: DollarSign, minRole: 'USER' },
    { title: 'Habitação', href: '/admin/secretarias/habitacao', icon: Home, minRole: 'USER' },
    { title: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente', icon: TreePine, minRole: 'USER' },
    { title: 'Mobilidade Urbana', href: '/admin/secretarias/mobilidade-urbana', icon: Bus, minRole: 'USER' },
    { title: 'Obras Públicas', href: '/admin/secretarias/obras-publicas', icon: Truck, minRole: 'USER' },
    { title: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano', icon: MapPin, minRole: 'USER' },
    { title: 'Políticas p/ Mulheres', href: '/admin/secretarias/politicas-mulheres', icon: Users, minRole: 'USER' },
    { title: 'Saúde', href: '/admin/secretarias/saude', icon: Heart, minRole: 'USER' },
    { title: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica', icon: Shield, minRole: 'USER' },
    { title: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos', icon: Settings, minRole: 'USER' },
    { title: 'Tecnologia e Inovação', href: '/admin/secretarias/tecnologia-inovacao', icon: Cpu, minRole: 'USER' },
    { title: 'Transportes e Trânsito', href: '/admin/secretarias/transportes-transito', icon: Car, minRole: 'USER' },
    { title: 'Turismo', href: '/admin/secretarias/turismo', icon: Camera, minRole: 'USER' },
  ],
};

export const superAdminNavigation: AdminNavSection = {
  title: 'Super Admin',
  color: 'indigo',
  items: [
    { title: 'Tenants', href: '/super-admin/tenants', icon: Building2, minRole: 'SUPER_ADMIN' },
    { title: 'Analytics Global', href: '/super-admin/analytics', icon: BarChart3, minRole: 'SUPER_ADMIN' },
    { title: 'Config. Sistema', href: '/super-admin/settings', icon: Settings, minRole: 'SUPER_ADMIN' },
  ],
};

export function shouldShowNavItem(
  item: AdminNavItem,
  hasPermission: PermissionChecker,
  hasMinRole: RoleChecker,
  hasGabinete = false
) {
  if (item.gabinete) return hasGabinete;
  if (item.permissions && !item.permissions.some(hasPermission)) return false;
  if (item.minRole && !hasMinRole(item.minRole)) return false;
  return true;
}

/** Code canônico da secretaria a partir do link /admin/secretarias/<slug> */
export function secretariaCodeFromHref(href: string): string | null {
  const m = href.match(/^\/admin\/secretarias\/([a-z0-9-]+)/);
  return m ? m[1].toUpperCase().replace(/-/g, '_') : null;
}

/**
 * Secretarias visíveis: ADMIN/SUPER_ADMIN veem todas; a equipe (USER,
 * COORDINATOR, MANAGER) vê só as suas — mesma regra do backend
 * (middleware/department-access.ts).
 */
export function canSeeSecretaria(
  href: string,
  role: string | undefined,
  userDepartmentCodes: string[]
): boolean {
  const code = secretariaCodeFromHref(href);
  if (!code) return true;
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;
  return userDepartmentCodes.includes(code);
}

// Itens de menu que viraram abas: o item fica ativo em qualquer aba da seção
const SECTION_TAB_PATHS: Record<string, string[]> = {
  '/admin/servicos': ['/admin/gerenciamento-servicos'],
  '/admin/meus-documentos': ['/admin/assinaturas-digitais', '/admin/templates-documentos', '/admin/certificados-digitais'],
  '/admin/analytics': ['/admin/relatorios', '/admin/ia'],
};

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return [href, ...(SECTION_TAB_PATHS[href] || [])].some((base) => pathname === base || pathname.startsWith(`${base}/`));
}
