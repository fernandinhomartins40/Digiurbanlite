import type { LucideIcon } from 'lucide-react';
import {
  Store,
  LayoutGrid,
  AlertCircle,
  Award,
  BarChart3,
  Bot,
  Building2,
  Bus,
  Calendar,
  Camera,
  Car,
  Cpu,
  DollarSign,
  FileSignature,
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
  MapPin,
  MessageCircle,
  Network,
  Palette,
  ScrollText,
  ScanFace,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sprout,
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
          title: 'Composição Familiar',
          href: '/admin/composicao-familiar',
          icon: Users,
          permissions: ['citizens:read'],
        },
        {
          title: 'Biometria Presencial',
          href: '/admin/atendimento-presencial/biometria-facial',
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
          title: 'Catálogo de Serviços',
          href: '/admin/servicos',
          icon: Settings,
          permissions: ['services:create', 'services:update'],
        },
        {
          title: 'Gestão de Serviços',
          href: '/admin/gerenciamento-servicos',
          icon: TrendingUp,
          permissions: ['services:read'],
        },
        // WORKFLOWS: disabled via FEATURE_FLAGS.WORKFLOWS
        // { title: 'Workflows', href: '/admin/workflows', icon: GitBranch, minRole: 'ADMIN' },
        // PROCESSOS_INTERNOS: disabled via FEATURE_FLAGS.PROCESSOS_INTERNOS
        // { title: 'Processos Internos', href: '/admin/processos-internos', icon: Workflow, minRole: 'COORDINATOR', badge: 'NOVO' },
        {
          title: 'Fluxos do Bot',
          href: '/admin/bot-flows',
          icon: Bot,
          minRole: 'ADMIN',
          badge: 'NOVO',
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
        { title: 'Email', href: '/admin/email', icon: Mail, minRole: 'COORDINATOR' },
        { title: 'Contas de Email', href: '/admin/email-accounts', icon: UserCircle, minRole: 'ADMIN' },
      ],
    },

    // ── Documentos ─────────────────────────────────────────────────────────
    {
      title: 'Documentos',
      color: 'amber',
      collapsible: true,
      defaultCollapsed: true,
      items: [
        { title: 'Meus Documentos', href: '/admin/meus-documentos', icon: FileText, minRole: 'USER' },
        {
          title: 'Templates',
          href: '/admin/templates-documentos',
          icon: ScrollText,
          minRole: 'ADMIN',
        },
        {
          title: 'Assinaturas Digitais',
          href: '/admin/assinaturas-digitais',
          icon: FileSignature,
          minRole: 'COORDINATOR',
          badge: 'NOVO',
        },
        {
          title: 'Certificados Digitais',
          href: '/admin/certificados-digitais',
          icon: Award,
          minRole: 'ADMIN',
        },
      ],
    },

    // ── Análises ───────────────────────────────────────────────────────────
    {
      title: 'Análises',
      color: 'violet',
      collapsible: true,
      defaultCollapsed: true,
      items: [
        { title: 'Analytics', href: '/admin/analytics', icon: BarChart3, minRole: 'COORDINATOR' },
        {
          title: 'IA Centralizada',
          href: '/admin/ia',
          icon: Cpu,
          minRole: 'ADMIN',
          badge: 'NOVO',
        },
        {
          title: 'Relatórios',
          href: '/admin/relatorios',
          icon: FileText,
          permissions: ['reports:department', 'reports:full'],
        },
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
        { title: 'Equipe', href: '/admin/servidores/equipe', icon: Users, minRole: 'COORDINATOR' },
        { title: 'Organograma', href: '/admin/organograma', icon: Network, minRole: 'COORDINATOR' },
        { title: 'Perfil', href: '/admin/perfil', icon: UserCircle, minRole: 'USER' },
        { title: 'Configurações', href: '/admin/configuracoes', icon: Settings, minRole: 'ADMIN' },
        { title: 'Integrações', href: '/admin/integracoes', icon: Zap, minRole: 'ADMIN' },
      ],
    },
  ];
}

export const mayorPortalNavigation: AdminNavSection = {
  title: 'Portal do Prefeito',
  color: 'indigo',
  items: [
    {
      title: 'Painel do Prefeito',
      href: '/admin/gabinete/painel-prefeito',
      icon: Building2,
      minRole: 'ADMIN',
    },
    { title: 'Mapa de Demandas', href: '/admin/gabinete/mapa-demandas', icon: Map, minRole: 'ADMIN' },
    { title: 'Agenda', href: '/admin/agenda', icon: Calendar, minRole: 'ADMIN' },
    { title: 'Criar Chamado', href: '/admin/chamados', icon: AlertCircle, minRole: 'ADMIN' },
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
  hasMinRole: RoleChecker
) {
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

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}
