'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Building2, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Importar os mesmos ícones que AdminSidebar usa
import {
  House,
  LayoutDashboard,
  FileText,
  Crown,
  AlertCircle,
  Calendar,
  Map,
  Users,
  FolderKanban,
  Settings,
  Mail,
  MessageSquare,
  ClipboardList,
  Sprout,
  HandHeart,
  Palette,
  GraduationCap,
  Trophy,
  Home,
  TreePine,
  Truck,
  Hammer,
  Shield,
  HeartPulse,
  Landmark,
  Building2 as Building,
  BarChart3
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permissions?: string[]
  minRole?: 'USER' | 'COORDINATOR' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, stats } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()

  if (!user) return null

  const mainNavigation: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { title: 'Início', href: '/admin', icon: House },
        { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Protocolos', href: '/admin/protocolos', icon: FileText, permissions: ['protocols:read'], badge: stats?.pendingProtocols?.toString() }
      ]
    },
    {
      title: 'Gabinete do Prefeito',
      items: [
        { title: 'Painel do Prefeito', href: '/admin/gabinete/painel-prefeito', icon: Crown, minRole: 'ADMIN', badge: 'NOVO' },
        { title: 'Criar Chamado', href: '/admin/chamados', icon: AlertCircle, minRole: 'ADMIN' },
        { title: 'Agenda Executiva', href: '/admin/gabinete/agenda', icon: Calendar, minRole: 'ADMIN' },
        { title: 'Mapa de Demandas', href: '/admin/gabinete/mapa-demandas', icon: Map, minRole: 'ADMIN' }
      ]
    },
    {
      title: 'Gestão',
      items: [
        { title: 'Cidadãos', href: '/admin/cidadaos', icon: Users, permissions: ['citizens:read'] },
        { title: 'Serviços', href: '/admin/servicos', icon: FolderKanban, permissions: ['services:read'] },
        { title: 'Departamentos', href: '/admin/departamentos', icon: Building, permissions: ['departments:read'], minRole: 'ADMIN' },
        { title: 'Funcionários', href: '/admin/funcionarios', icon: Users, permissions: ['users:read'], minRole: 'COORDINATOR' },
        { title: 'Configurações', href: '/admin/configuracoes', icon: Settings, minRole: 'COORDINATOR' }
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { title: 'Email', href: '/admin/email', icon: Mail, permissions: ['email:read'], minRole: 'COORDINATOR' },
        { title: 'Mensagens', href: '/admin/mensagens', icon: MessageSquare, permissions: ['messages:read'] },
        { title: 'Ouvidoria', href: '/admin/ouvidoria', icon: ClipboardList, permissions: ['complaints:read'], minRole: 'COORDINATOR' }
      ]
    }
  ]

  const secretariaNavigation: NavSection = {
    title: 'Secretarias',
    items: [
      { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout, minRole: 'COORDINATOR' },
      { title: 'Assistência Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart, minRole: 'COORDINATOR' },
      { title: 'Cultura', href: '/admin/secretarias/cultura', icon: Palette, minRole: 'COORDINATOR' },
      { title: 'Educação', href: '/admin/secretarias/educacao', icon: GraduationCap, minRole: 'COORDINATOR' },
      { title: 'Esportes', href: '/admin/secretarias/esportes', icon: Trophy, minRole: 'COORDINATOR' },
      { title: 'Habitação', href: '/admin/secretarias/habitacao', icon: Home, minRole: 'COORDINATOR' },
      { title: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente', icon: TreePine, minRole: 'COORDINATOR' },
      { title: 'Obras Públicas', href: '/admin/secretarias/obras-publicas', icon: Truck, minRole: 'COORDINATOR' },
      { title: 'Planejamento', href: '/admin/secretarias/planejamento', icon: Hammer, minRole: 'COORDINATOR' },
      { title: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica', icon: Shield, minRole: 'COORDINATOR' },
      { title: 'Saúde', href: '/admin/secretarias/saude', icon: HeartPulse, minRole: 'COORDINATOR' },
      { title: 'Finanças', href: '/admin/secretarias/financas', icon: Landmark, minRole: 'COORDINATOR' }
    ]
  }

  const superAdminNavigation: NavSection = {
    title: 'Super Admin',
    items: [
      { title: 'Tenants', href: '/super-admin/tenants', icon: Building, minRole: 'SUPER_ADMIN' },
      { title: 'Analytics Global', href: '/super-admin/analytics', icon: BarChart3, minRole: 'SUPER_ADMIN' },
      { title: 'Configurações Sistema', href: '/super-admin/settings', icon: Settings, minRole: 'SUPER_ADMIN' }
    ]
  }

  const shouldShowItem = (item: NavItem) => {
    if (item.permissions && !item.permissions.some(hasPermission)) return false
    if (item.minRole && !hasMinRole(item.minRole)) return false
    return true
  }

  const renderNavSection = (section: NavSection) => {
    const visibleItems = section.items.filter(shouldShowItem)
    if (visibleItems.length === 0) return null

    return (
      <div key={section.title} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          {section.title}
        </h3>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <SheetTitle className="text-lg font-semibold text-gray-900">DigiUrban</SheetTitle>
                <p className="text-xs text-gray-500">Portal Admin</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation - área com scroll */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          {mainNavigation.map(renderNavSection)}
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && renderNavSection(superAdminNavigation)}
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">{user.name || user.email || 'Usuário'}</div>
            {user.departments && user.departments.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {user.departments.map((dept) => {
                  const isPrimary = user.primaryDepartment?.id === dept.id
                  return (
                    <div key={dept.id} className={`truncate ${isPrimary ? 'font-semibold' : ''}`}>
                      {isPrimary && '★ '}{dept.name}
                    </div>
                  )
                })}
              </div>
            ) : user.department ? (
              <div className="truncate">{user.department.name}</div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
