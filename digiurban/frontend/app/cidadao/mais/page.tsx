'use client';

/**
 * Mais — atalhos da conta numa lista só. Antes: perfil aparecia duas vezes
 * (cartão do nome + item), biometria em dois itens (cadastrar e testar, que já
 * fica dentro da própria tela de biometria) e um quadro de "versão do app".
 */

import Link from 'next/link';
import { ChevronRight, FileCheck, LogOut, ScanFace, Users } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { MunicipioSwitcher } from '@/components/citizen/MunicipioSwitcher';
import { AppearanceSetting } from '@/components/liquid-glass/AppearanceSetting';

const ITEMS = [
  { href: '/cidadao/familia', label: 'Minha família', description: 'Pessoas da sua casa', icon: Users },
  { href: '/cidadao/documentos', label: 'Meus documentos', description: 'RG, comprovantes e assinaturas', icon: FileCheck },
  { href: '/cidadao/biometria-facial', label: 'Biometria facial', description: 'Confirmar sua identidade pelo rosto', icon: ScanFace },
];

export default function MaisPage() {
  const { logout, citizen } = useCitizenAuth();
  const initials = (citizen?.name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) await logout();
  };

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Mais</h1>

        <Link href="/cidadao/perfil" className="flex items-center gap-4 rounded-2xl border bg-white p-4 hover:bg-gray-50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{citizen?.name}</p>
            <p className="text-sm text-gray-500">Meu perfil, endereço e senha</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </Link>

        <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
          {ITEMS.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="truncate text-sm text-gray-500">{description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Trocar de município (só aparece com cadastro em 2+ prefeituras) */}
        <MunicipioSwitcher />

        {/* Aparência: automático (segue o aparelho), claro ou escuro */}
        <AppearanceSetting />

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>
    </CitizenLayout>
  );
}
