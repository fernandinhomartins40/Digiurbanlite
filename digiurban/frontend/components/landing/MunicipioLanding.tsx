'use client';

/**
 * ============================================================================
 * PORTAL DO CIDADÃO — landing do município ({prefeitura}.digiurban.com.br)
 * ============================================================================
 * Renderizada quando o host identifica um município (TenantProvider → slug !=
 * 'default'). É o PORTAL DO CIDADÃO da prefeitura — foco total no que o cidadão
 * pode fazer (serviços, protocolos, atendimento), com a identidade visual do
 * município. NÃO é a página comercial do DigiUrban: nenhum pitch de venda.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { readableTextOn } from '@/lib/tenant';
import {
  ArrowRight, FileText, MessageSquare, Bell, UserCog, ShieldCheck, Building2,
  Search, ClipboardList, Clock, Smartphone, Heart, GraduationCap, HandHeart,
  Hammer, Leaf, LogIn, UserPlus, ChevronRight,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  departmentId?: string | null;
}

// Ícone por palavra-chave da secretaria/serviço (heurística leve)
function areaIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('saúde') || n.includes('saude')) return Heart;
  if (n.includes('educ')) return GraduationCap;
  if (n.includes('social') || n.includes('assist')) return HandHeart;
  if (n.includes('obras') || n.includes('infra')) return Hammer;
  if (n.includes('ambiente') || n.includes('verde')) return Leaf;
  if (n.includes('ouvidoria') || n.includes('denúnc') || n.includes('denunc')) return MessageSquare;
  return FileText;
}

const COMO_FUNCIONA = [
  { icon: LogIn, title: 'Entre ou cadastre-se', desc: 'Acesse com seu CPF. É rápido e seguro.' },
  { icon: Search, title: 'Escolha o serviço', desc: 'Encontre o que precisa no catálogo da prefeitura.' },
  { icon: ClipboardList, title: 'Acompanhe o protocolo', desc: 'Veja o andamento do seu pedido em tempo real.' },
];

const RECURSOS = [
  { icon: FileText, title: 'Solicitar serviços', desc: 'Abra pedidos e protocolos sem sair de casa.' },
  { icon: Clock, title: 'Acompanhar em tempo real', desc: 'Saiba o status de cada solicitação.' },
  { icon: MessageSquare, title: 'Atendimento digital', desc: 'Fale com a prefeitura pelo assistente e pelo chat.' },
  { icon: Bell, title: 'Notificações', desc: 'Receba avisos sobre seus pedidos e serviços.' },
  { icon: Smartphone, title: 'No celular', desc: 'Tudo funciona direto do seu telefone.' },
  { icon: ShieldCheck, title: 'Seguro e privado', desc: 'Seus dados protegidos conforme a LGPD.' },
];

export function MunicipioLanding() {
  const { config } = useTenant();
  const primary = config.branding?.corPrimaria || '#2563eb';
  const secondary = config.branding?.corSecundaria || '#f59e0b';
  const onPrimary = readableTextOn(primary);
  const onSecondary = readableTextOn(secondary);
  const logo = config.branding?.logoUrl || null;
  const municipio = config.nomeMunicipio || config.nome;

  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    fetch(`${API}/citizen/services?limit=8`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(Array.isArray(d.services) ? d.services : []))
      .catch(() => setServices([]));
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Barra superior com identidade da prefeitura */}
      <header className="border-b sticky top-0 bg-white/90 backdrop-blur z-40" style={{ borderColor: `${primary}22` }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={config.nome} className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{ background: primary, color: onPrimary }}>
                {municipio.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-bold leading-tight text-sm sm:text-base" style={{ color: primary }}>{config.nome}</div>
              <div className="text-xs text-gray-500">{config.nomeMunicipio}{config.ufMunicipio ? `/${config.ufMunicipio}` : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cidadao/login" className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90" style={{ background: primary, color: onPrimary }}>
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
            <Link href="/cidadao/register" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border" style={{ borderColor: primary, color: primary }}>
              <UserPlus className="h-4 w-4" /> Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — o cidadão em primeiro lugar */}
      <section style={{ background: `${primary}0a` }}>
        <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4" style={{ background: secondary, color: onSecondary }}>
              Portal do Cidadão
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Os serviços de <span style={{ color: primary }}>{municipio}</span> na palma da sua mão
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Solicite serviços, acompanhe seus protocolos e fale com a prefeitura — tudo online, sem filas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cidadao/login" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold shadow-sm hover:opacity-90" style={{ background: primary, color: onPrimary }}>
                Acessar o portal <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/cidadao/register" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold border hover:bg-gray-50" style={{ borderColor: primary, color: primary }}>
                Criar minha conta
              </Link>
            </div>
          </div>

          {/* Card "como funciona" */}
          <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm" style={{ borderColor: `${primary}22` }}>
            <h2 className="font-semibold text-gray-900 mb-5">Como funciona</h2>
            <div className="space-y-5">
              {COMO_FUNCIONA.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}14`, color: primary }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < COMO_FUNCIONA.length - 1 && <div className="absolute left-1/2 top-10 h-5 w-px -translate-x-1/2" style={{ background: `${primary}22` }} />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{f.title}</div>
                      <div className="text-sm text-gray-500">{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Serviços reais do município */}
      {services.length > 0 && (
        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Serviços disponíveis</h2>
                <p className="text-gray-500 text-sm mt-1">Alguns dos serviços que você pode solicitar online</p>
              </div>
              <Link href="/cidadao/servicos" className="text-sm font-medium inline-flex items-center gap-1 hover:underline" style={{ color: primary }}>
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.slice(0, 8).map((s) => {
                const Icon = areaIcon(s.name);
                return (
                  <Link
                    key={s.id}
                    href="/cidadao/login"
                    className="group rounded-xl border p-4 hover:shadow-md transition-shadow bg-white"
                    style={{ borderColor: `${primary}1f` }}
                  >
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${primary}14`, color: primary }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-medium text-gray-900 text-sm leading-snug group-hover:opacity-80">{s.name}</div>
                    {s.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</div>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recursos do portal */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center">O que você pode fazer</h2>
          <p className="text-gray-500 text-sm text-center mt-1 mb-8">Tudo o que a prefeitura oferece, em um só lugar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECURSOS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="rounded-xl bg-white border p-5" style={{ borderColor: `${primary}1f` }}>
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-3" style={{ background: `${primary}14`, color: primary }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-gray-900">{r.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{r.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16" style={{ background: primary, color: onPrimary }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Comece agora</h2>
          <p className="mt-2" style={{ color: onPrimary, opacity: 0.85 }}>Crie sua conta e resolva sua vida com a prefeitura de {municipio} online.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Botão de destaque (secundária) — contrasta sempre com o fundo primário */}
            <Link href="/cidadao/register" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold hover:opacity-90" style={{ background: secondary, color: onSecondary }}>
              Criar minha conta <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/cidadao/login" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold border hover:opacity-90" style={{ borderColor: onPrimary === '#ffffff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)', color: onPrimary }}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Rodapé — acesso de servidores ao painel administrativo */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" /> {config.nome} — Governo Digital
          </div>
          <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            <UserCog className="h-4 w-4" /> Acesso de servidores
          </Link>
        </div>
        <div className="text-center text-xs text-gray-400 pb-4">Powered by DigiUrban</div>
      </footer>
    </main>
  );
}

export default MunicipioLanding;
