'use client';

/**
 * ============================================================================
 * LANDING WHITE-LABEL DO MUNICÍPIO (subdomínios [prefeitura].digiurban.com.br)
 * ============================================================================
 * Renderizada quando o host identifica um município específico (TenantProvider
 * resolve slug != 'default'). Usa a identidade visual da prefeitura (branding),
 * com o LOGIN DO CIDADÃO em destaque e o acesso de servidores no rodapé.
 */

import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantProvider';
import {
  ArrowRight, FileText, MessageSquare, Bell, UserCog, ShieldCheck, Building2,
} from 'lucide-react';

const CIDADAO_FEATURES = [
  { icon: FileText, title: 'Solicitar serviços', desc: 'Abra protocolos e acompanhe o andamento online.' },
  { icon: MessageSquare, title: 'Atendimento digital', desc: 'Fale com a prefeitura pelo assistente e pelo chat.' },
  { icon: Bell, title: 'Notificações', desc: 'Receba avisos sobre seus pedidos e serviços.' },
];

export function MunicipioLanding() {
  const { config } = useTenant();
  const primary = config.branding?.corPrimaria || '#2563eb';
  const secondary = config.branding?.corSecundaria || '#f59e0b';
  const logo = config.branding?.logoUrl || null;
  const municipio = config.nomeMunicipio || config.nome;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Barra superior com identidade da prefeitura */}
      <header className="border-b" style={{ borderColor: `${primary}22` }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={config.nome} className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: primary }}>
                {municipio.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-bold leading-tight" style={{ color: primary }}>{config.nome}</div>
              <div className="text-xs text-gray-500">{config.nomeMunicipio}{config.ufMunicipio ? `/${config.ufMunicipio}` : ''}</div>
            </div>
          </div>
          <Link
            href="/cidadao/login"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: primary }}
          >
            Entrar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero — login do cidadão em destaque */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: `${secondary}22`, color: primary }}>
              Portal do Cidadão
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Os serviços de <span style={{ color: primary }}>{municipio}</span> na palma da sua mão
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Solicite serviços, acompanhe protocolos e fale com a prefeitura sem sair de casa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cidadao/login"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: primary }}
              >
                Acessar como cidadão <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/cidadao/register"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold border transition-colors"
                style={{ borderColor: primary, color: primary }}
              >
                Criar conta
              </Link>
            </div>
          </div>

          {/* Card de features */}
          <div className="rounded-2xl border p-6 md:p-8 shadow-sm" style={{ borderColor: `${primary}22` }}>
            <h2 className="font-semibold text-gray-900 mb-4">O que você pode fazer</h2>
            <div className="space-y-4">
              {CIDADAO_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}14`, color: primary }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{f.title}</div>
                      <div className="text-sm text-gray-500">{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4" /> Ambiente seguro · dados protegidos (LGPD)
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé — acesso de servidores ao painel administrativo */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" /> {config.nome} — Governo Digital
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <UserCog className="h-4 w-4" /> Acesso de servidores
            </Link>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 pb-4">
          Powered by DigiUrban
        </div>
      </footer>
    </main>
  );
}

export default MunicipioLanding;
