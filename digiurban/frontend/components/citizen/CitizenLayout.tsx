'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Folder,
  User,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { useCitizenAuth, useCitizenProtectedRoute } from '@/contexts/CitizenAuthContext';
import { RegistrationLevelBadge } from './RegistrationLevelBadge';
import { LevelUpgradeModal } from './LevelUpgradeModal';
import { mapVerificationStatusToLevel } from '@/lib/citizen-utils';

interface CitizenLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CitizenLayout({ children, title }: CitizenLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLevelUpgradeModal, setShowLevelUpgradeModal] = useState(false);
  const pathname = usePathname();

  // ✅ CORRIGIDO: Usar contexto centralizado de autenticação
  const { citizen, isLoading } = useCitizenProtectedRoute();
  const { logout } = useCitizenAuth();
  const tenant = (citizen as any)?.tenant; // TODO: Adicionar tenant no tipo Citizen

  const handleLogout = async () => {
    await logout();
  };

  const navigationItems: Array<{ name: string; href: string; icon: any; badge?: string | number }> = [
    {
      name: 'Início',
      href: '/cidadao',
      icon: LayoutDashboard
    },
    {
      name: 'Serviços',
      href: '/cidadao/servicos',
      icon: FileText
    },
    {
      name: 'Protocolos',
      href: '/cidadao/protocolos',
      icon: Folder
    },
    {
      name: 'Perfil',
      href: '/cidadao/perfil',
      icon: User
    }
  ];

  // ✅ CORRIGIDO: Mostrar loading enquanto verifica autenticação
  if (isLoading || !citizen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar Desktop - Fixa */}
      <aside className="hidden lg:block fixed left-0 top-0 z-30 w-64 h-screen bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo no topo da sidebar */}
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <Link href="/cidadao" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Portal</p>
                <p className="text-xs text-gray-500">Cidadão</p>
              </div>
            </Link>
          </div>

          {/* Navegação */}
          <div className="flex-1 px-3 pt-5 pb-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Logout na parte inferior */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white lg:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Menu</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Área de Conteúdo - À direita da sidebar */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo e Botão Menu - Mobile */}
              <div className="flex items-center gap-4 lg:hidden">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {isSidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>

                <Link href="/cidadao" className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">Portal do Cidadão</p>
                    {tenant && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">
                          {tenant.nomeMunicipio || tenant.name} - {tenant.ufMunicipio || 'BR'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>

              {/* Tenant info - Desktop only */}
              <div className="hidden lg:flex items-center gap-2">
                {tenant && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">
                      {tenant.nomeMunicipio || tenant.name} - {tenant.ufMunicipio || 'BR'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Desktop Menu - Compacto */}
                <div className="hidden lg:flex items-center gap-3 xl:gap-4 pl-3 xl:pl-4 border-l border-gray-200">
                  {/* Informações do Usuário - Compacto */}
                  <div className="text-right min-w-[100px] max-w-[150px]">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {citizen.name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      CPF: {citizen.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**')}
                    </p>
                  </div>

                  {/* Badge de Nível */}
                  <RegistrationLevelBadge
                    level={mapVerificationStatusToLevel(citizen.verificationStatus)}
                    onUpgradeClick={() => setShowLevelUpgradeModal(true)}
                  />

                  {/* Botão de Logout */}
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Logout */}
                <button
                  onClick={handleLogout}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de Upgrade de Nível */}
      <LevelUpgradeModal
        isOpen={showLevelUpgradeModal}
        onClose={() => setShowLevelUpgradeModal(false)}
      />
    </div>
  );
}
