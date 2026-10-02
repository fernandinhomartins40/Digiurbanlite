'use client';

/**
 * ============================================================================
 * PORTAL DO CIDADÃO — landing do município ({prefeitura}.digiurban.com.br)
 * ============================================================================
 * Mesmo padrão visual da landing institucional (app/landing/landing.css:
 * DigiUrban Glass, Outfit, arte da cidade e mascote), com a identidade do
 * município: logo, nome e cor de destaque (ícones, links, selos). É o PORTAL
 * DO CIDADÃO — nenhum pitch de venda do DigiUrban.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bell,
  Bot,
  Building2,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  FolderOpen,
  GraduationCap,
  HandHeart,
  Hammer,
  Heart,
  Leaf,
  LogIn,
  MessageCircle,
  MessageSquareText,
  Search,
  ShieldCheck,
  Smartphone,
  UserCog,
  UserPlus,
} from 'lucide-react';
import { useTenant } from '@/components/providers/TenantProvider';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
}

/* ---------------------------------------------------------------- imagens (mesmas da landing institucional) */

type Device = 'mobile' | 'tablet' | 'desktop';
const WIDTH: Record<Device, number> = { mobile: 800, tablet: 1280, desktop: 1920 };

function Asset({ name, alt, className, sizes, eager }: { name: string; alt: string; className?: string; sizes: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/landing/desktop/${name}.webp`}
      srcSet={(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => `/landing/${d}/${name}.webp ${WIDTH[d]}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}

function Bg({ name, className = '', imgClassName = '', eager }: { name: string; className?: string; imgClassName?: string; eager?: boolean }) {
  return (
    <picture className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <source media="(max-width: 639px)" srcSet={`/landing/mobile/${name}.webp`} />
      <source media="(max-width: 1023px)" srcSet={`/landing/tablet/${name}.webp`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/landing/desktop/${name}.webp`} alt="" className={`h-full w-full object-cover ${imgClassName}`} loading={eager ? 'eager' : 'lazy'} />
    </picture>
  );
}

const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="dl-chip">
    <span aria-hidden className="text-[1.25em] leading-none">+</span>
    {children}
  </span>
);

/* ------------------------------------------------------------------ dados */

function areaIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('saúde') || n.includes('saude') || n.includes('consulta') || n.includes('vacina') || n.includes('caps')) return Heart;
  if (n.includes('educ') || n.includes('escola') || n.includes('estudante') || n.includes('matr')) return GraduationCap;
  if (n.includes('social') || n.includes('assist') || n.includes('mulher') || n.includes('benef')) return HandHeart;
  if (n.includes('obra') || n.includes('alvar') || n.includes('constru') || n.includes('infra')) return Hammer;
  if (n.includes('ambient') || n.includes('poda') || n.includes('árvore') || n.includes('arvore')) return Leaf;
  if (n.includes('segur') || n.includes('alerta')) return ShieldCheck;
  if (n.includes('ouvidoria') || n.includes('denúnc') || n.includes('denunc')) return MessageSquareText;
  return FileText;
}

const HERO_ACTIONS: { label: string; icon: LucideIcon; href: string }[] = [
  { label: 'Solicitar um serviço', icon: FilePlus2, href: '/cidadao/login' },
  { label: 'Acompanhar meu pedido', icon: ClipboardList, href: '/cidadao/login' },
  { label: 'Falar com o DigiBot', icon: Bot, href: '/cidadao/login' },
  { label: 'Meus documentos', icon: FolderOpen, href: '/cidadao/login' },
];

const STEPS = [
  { title: 'Entre ou cadastre-se', desc: 'Acesse com seu CPF. É rápido e seguro.' },
  { title: 'Escolha o serviço', desc: 'Encontre o que precisa ou peça ao DigiBot com suas palavras.' },
  { title: 'Acompanhe o pedido', desc: 'Veja o andamento e receba avisos a cada novidade.' },
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: FileText, title: 'Solicitar serviços', desc: 'Abra pedidos sem sair de casa.' },
  { icon: Clock3, title: 'Acompanhar em tempo real', desc: 'Saiba a situação de cada pedido.' },
  { icon: MessageCircle, title: 'Atendimento digital', desc: 'O DigiBot responde na hora; um atendente quando precisar.' },
  { icon: Bell, title: 'Avisos', desc: 'Receba novidades dos seus pedidos.' },
  { icon: Smartphone, title: 'No celular', desc: 'Instale o app e use direto do telefone.' },
  { icon: ShieldCheck, title: 'Seguro e privado', desc: 'Seus dados protegidos conforme a LGPD.' },
];

/* ------------------------------------------------------------------ seções */

function Header({ name, place, logo, initial }: { name: string; place: string; logo: string | null; initial: string }) {
  return (
    <header className="dl-nav sticky top-0 z-50">
      <Container className="flex h-[62px] items-center gap-3 md:h-[70px] lg:h-[80px]">
        <Link href="/landing" className="flex min-w-0 items-center gap-3" aria-label={`${name} — início`}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={name} className="h-9 w-auto max-w-[120px] object-contain md:h-11" />
          ) : (
            <span className="dl-icon h-10 w-10 rounded-xl text-[18px] font-bold md:h-11 md:w-11">{initial}</span>
          )}
          <span className="min-w-0">
            <span className="dl-h block truncate text-[14px] md:text-[16px] lg:text-[18px]">{name}</span>
            <span className="block truncate text-[12px] md:text-[13px]">{place}</span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* celular: "Entrar" (quem já tem conta é a maioria; criar conta está no topo da página) */}
          <Link href="/cidadao/login" className="dl-btn dl-btn-teal h-[40px] rounded-xl px-4 text-[14px] sm:hidden">
            <LogIn className="h-[18px] w-[18px]" />
            Entrar
          </Link>
          <Link href="/cidadao/login" className="dl-btn dl-btn-line hidden h-[44px] rounded-xl px-5 text-[15px] sm:inline-flex lg:h-[50px] lg:rounded-2xl">
            <LogIn className="h-[18px] w-[18px] text-[var(--dl-blue)]" />
            Entrar
          </Link>
          <Link href="/cidadao/login?tab=register" className="dl-btn dl-btn-teal hidden h-[44px] rounded-xl px-4 text-[14px] sm:inline-flex lg:h-[50px] lg:rounded-2xl lg:px-6 lg:text-[16px]">
            <UserPlus className="h-[18px] w-[18px]" />
            Criar conta
          </Link>
        </div>
      </Container>
    </header>
  );
}

function HeroPanel({ className = '' }: { className?: string }) {
  return (
    <div className={`dl-cq ${className}`}>
      <div className="dl-glass dl-glass-solid dl-rim rounded-[7cqw] p-[5.5cqw] text-left md:rounded-[22px] md:p-[16px] lg:p-[20px]">
        <div className="flex items-center gap-[4cqw] md:gap-3">
          <span className="flex h-[12cqw] w-[12cqw] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#2d93ff] to-[#0f67e6] text-white shadow-[0_6px_14px_-6px_rgba(15,103,230,0.9)] md:h-9 md:w-9 lg:h-11 lg:w-11">
            <MessageCircle className="h-[6.5cqw] w-[6.5cqw] md:h-[18px] md:w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="dl-h text-[8.2cqw] md:text-[15px] lg:text-[21px]">Olá, Cidadão!</p>
            <p className="text-[5.4cqw] text-[#6b7c99] md:text-[12px] lg:text-[13px]">O que você deseja fazer hoje?</p>
          </div>
        </div>
        <ul className="mt-[4cqw] md:mt-3">
          {HERO_ACTIONS.map(({ label, icon: Icon, href }, i) => (
            <li key={label} className={i > 0 ? 'border-t border-[#dbe7f7]' : ''}>
              <Link href={href} className="group flex items-center gap-[4cqw] py-[3.2cqw] md:gap-2 md:py-[8px] lg:gap-3 lg:py-[12px]">
                <span className="dl-icon h-[11cqw] w-[11cqw] rounded-[3cqw] md:h-8 md:w-8 md:rounded-[9px] lg:h-9 lg:w-9">
                  <Icon className="h-[6cqw] w-[6cqw] md:h-[17px] md:w-[17px]" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[5.8cqw] font-medium text-[#183e7e] md:text-[12px] lg:text-[15px]">{label}</span>
                <ChevronRight className="h-[6cqw] w-[6cqw] shrink-0 text-[#1b4f9a] transition-transform group-hover:translate-x-0.5 md:h-4 md:w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Hero({ municipio, uf }: { municipio: string; uf?: string }) {
  return (
    <section className="relative overflow-hidden rounded-b-[26px] text-white md:rounded-none">
      <Bg name="fundo-hero" eager />
      <Container className="pt-7 md:min-h-[430px] md:pt-9 lg:min-h-[510px]">
        <div className="relative z-10 text-center md:max-w-[50%] md:pb-10 md:text-left lg:max-w-[45%] xl:max-w-[560px] lg:pb-6">
          <span className="dl-btn-ghost inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium lg:px-4 lg:py-2 lg:text-[15px]" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
            <Building2 className="h-4 w-4" />
            Portal do Cidadão · {municipio}
            {uf ? `/${uf}` : ''}
          </span>
          <h1 className="mt-4 text-[32px] font-bold leading-[1.06] tracking-[-0.02em] sm:text-[38px] md:text-[34px] lg:text-[52px]">
            Os serviços de
            <br />
            <span className="dl-grad-text">{municipio}</span>
            <br />
            na palma da sua mão
          </h1>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-[1.45] text-white/90 md:mx-0 md:text-[14px] lg:max-w-[520px] lg:text-[19px]">
            Peça serviços, acompanhe seus pedidos e fale com a prefeitura — tudo online, sem filas.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 md:items-start">
            <Link href="/cidadao/login" className="dl-btn dl-btn-teal h-[48px] w-[260px] rounded-[14px] text-[16px] md:w-auto md:px-6 lg:h-[58px] lg:px-10 lg:text-[19px]">
              Acessar o portal
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/cidadao/login?tab=register" className="dl-btn dl-btn-ghost h-[46px] w-[260px] rounded-[14px] text-[16px] md:w-auto md:px-6 lg:h-[56px] lg:px-10 lg:text-[19px]">
              <UserPlus className="h-5 w-5" />
              Criar minha conta
            </Link>
          </div>
        </div>

        <div className="relative mt-6 flex items-end md:absolute md:bottom-0 md:right-6 md:top-4 md:mt-0 md:w-[50%] lg:left-[46%] lg:right-0 lg:top-2 lg:w-auto">
          <Asset
            name="mascote-hero"
            alt="Mascote mostrando o aplicativo no celular"
            sizes="(max-width: 767px) 60vw, 40vw"
            eager
            className="relative z-30 -mb-[1%] -ml-[4%] -mr-[14%] w-[72%] select-none md:absolute md:bottom-0 md:left-[-8%] md:mr-0 md:h-[70%] md:w-auto md:max-w-none lg:left-[-2%] lg:h-full"
          />
          <HeroPanel className="relative z-20 mb-12 w-[46%] shrink-0 md:absolute md:right-0 md:top-[14%] md:mb-0 md:w-[232px] lg:right-[-1%] lg:top-[12%] lg:w-[300px]" />
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="text-center">
          <Chip>Como funciona</Chip>
          <h2 className="dl-h mt-3 text-[24px] md:text-[30px] lg:text-[36px]">Em três passos você resolve</h2>
        </div>
        <ol className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="dl-card flex items-start gap-4 rounded-2xl p-4 md:flex-col md:p-6">
              <span className="dl-num h-10 w-10 text-[17px] md:h-12 md:w-12 md:text-[20px]">{i + 1}</span>
              <div>
                <p className="dl-h text-[17px] md:text-[19px]">{s.title}</p>
                <p className="mt-1 text-[14px] leading-snug md:text-[15px]">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Services({ services }: { services: ServiceItem[] }) {
  if (!services.length) return null;
  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      <Bg name="fundo-sobre" className="opacity-60" />
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Chip>Serviços</Chip>
            <h2 className="dl-h mt-3 text-[24px] md:text-[30px] lg:text-[36px]">Serviços disponíveis</h2>
            <p className="mt-1 text-[14px] md:text-[16px]">Alguns dos pedidos que você pode fazer online</p>
          </div>
          <Link href="/cidadao/servicos" className="dl-btn dl-btn-line h-[42px] rounded-xl px-5 text-[14px]">
            <Search className="h-4 w-4 text-[var(--dl-blue)]" />
            Ver todos
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {services.map((s) => {
            const Icon = areaIcon(s.name);
            return (
              <Link key={s.id} href="/cidadao/login" className="dl-card group flex gap-3 rounded-2xl p-4 lg:flex-col">
                <span className="dl-icon h-11 w-11 rounded-xl">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="dl-h block text-[15px] leading-snug md:text-[16px]">{s.name}</span>
                  {s.description && <span className="mt-1 line-clamp-2 block text-[13px] leading-snug">{s.description}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function Features() {
  return (
    <section className="py-10 md:py-14">
      <Container className="grid items-center gap-8 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <Chip>O que você pode fazer</Chip>
          <h2 className="dl-h mt-3 text-[24px] md:text-[30px] lg:text-[36px]">Tudo o que a prefeitura oferece, em um só lugar</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="dl-card flex items-start gap-3 rounded-2xl p-4">
                <span className="dl-icon h-11 w-11 rounded-xl">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="dl-h text-[16px]">{title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden justify-center lg:flex">
          <Asset name="mascote-cidadao" alt="Mascote ajudando um cidadão" sizes="35vw" className="w-[88%] select-none" />
        </div>
      </Container>
    </section>
  );
}

function FinalCta({ municipio }: { municipio: string }) {
  return (
    <section className="relative overflow-hidden text-white">
      <Bg name="fundo-hero" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0b3ea8]/40 via-[#0a3a9e]/55 to-[#082f86]/80" />
      <Container className="grid items-end gap-4 pt-8 md:grid-cols-[0.8fr_1.6fr] md:pt-6">
        <Asset name="mascote-cta" alt="Mascote comemorando" sizes="(max-width: 767px) 55vw, 30vw" className="order-2 mx-auto -mb-[3%] w-[55%] select-none md:order-1 md:w-[85%]" />
        <div className="order-1 pb-2 text-center md:order-2 md:pb-12 md:text-left">
          <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px] lg:text-[42px]">Comece agora</h2>
          <p className="mt-2 text-[15px] text-white/90 lg:text-[19px]">Crie sua conta e resolva a sua vida com a prefeitura de {municipio} pela internet.</p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Link href="/cidadao/login?tab=register" className="dl-btn dl-btn-teal h-[48px] rounded-xl px-7 text-[16px] lg:h-[54px] lg:text-[18px]">
              Criar minha conta
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/cidadao/login" className="dl-btn dl-btn-ghost h-[46px] rounded-xl px-7 text-[16px] lg:h-[52px] lg:text-[18px]">
              <CircleUserRound className="h-5 w-5" />
              Já tenho conta
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <footer className="bg-[#0b1d33] text-[#b9c7dc]">
      <Container className="flex flex-col items-center justify-between gap-4 py-6 text-[14px] sm:flex-row">
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> {name} — Governo Digital
        </span>
        <Link href="/admin/login" className="flex items-center gap-2 font-medium text-white hover:underline">
          <UserCog className="h-4 w-4" /> Acesso de servidores
        </Link>
      </Container>
      <div className="flex items-center justify-center gap-2 border-t border-white/10 py-3 text-[12px]">
        Plataforma
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/logo-letras-brancas-480.png" alt="Digiurban" className="h-4 w-auto opacity-80" />
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ página */

export function MunicipioLanding() {
  const { config } = useTenant();
  const primary = config.branding?.corPrimaria || '#1673f0';
  const logo = config.branding?.logoUrl || null;
  const municipio = (config.nomeMunicipio || config.nome || '').trim();
  const place = `${municipio}${config.ufMunicipio ? `/${config.ufMunicipio}` : ''}`;

  const [services, setServices] = useState<ServiceItem[]>([]);
  useEffect(() => {
    fetch(`${API}/citizen/services?limit=24`, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(Array.isArray(d.services) ? d.services : []))
      .catch(() => setServices([]));
  }, []);

  // sem repetidos (o catálogo pode ter dois serviços com o mesmo nome)
  const shown = useMemo(() => {
    const seen = new Set<string>();
    return services
      .filter((s) => {
        const k = s.name.trim().toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 8);
  }, [services]);

  // cor de destaque do município nos ícones, links e selos
  const style = { '--dl-blue': primary } as CSSProperties;

  return (
    <main className="dl min-h-screen" style={style}>
      <Header name={config.nome} place={place} logo={logo} initial={municipio.charAt(0) || 'P'} />
      <Hero municipio={municipio} uf={config.ufMunicipio || undefined} />
      <HowItWorks />
      <Services services={shown} />
      <Features />
      <FinalCta municipio={municipio} />
      <Footer name={config.nome} />
    </main>
  );
}

export default MunicipioLanding;
