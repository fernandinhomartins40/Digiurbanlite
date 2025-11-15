'use client';

import { Bell, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

export function MobileTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { citizen } = useCitizenAuth();
  const tenant = (citizen as any)?.tenant;

  // Páginas principais que não devem mostrar botão voltar
  const mainPages = [
    '/cidadao',
    '/cidadao/servicos',
    '/cidadao/protocolos',
    '/cidadao/documentos',
    '/cidadao/perfil',
    '/cidadao/mais'
  ];

  const isMainPage = mainPages.includes(pathname);
  const showBackButton = !isMainPage;

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo e Tenant OU Botão Voltar */}
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar</span>
          </button>
        ) : (
          <Link href="/cidadao" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Portal Cidadão</p>
              {tenant && (
                <div className="flex items-center gap-1 text-[10px] text-blue-600">
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {tenant.nomeMunicipio || tenant.name}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Notificações */}
        <button className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
