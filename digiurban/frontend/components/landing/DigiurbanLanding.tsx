'use client';

/**
 * ============================================================================
 * LANDING INSTITUCIONAL DIGIURBAN (domínio raiz)
 * ============================================================================
 * Fiel às referências do kit de marca (desktop, tablet e celular), com toques
 * de Liquid Glass: barra do topo, selos, painel "Olá, Cidadão!", cartões,
 * botões contornados e o selo "Confiança". Estilos em app/landing/landing.css.
 * Imagens em public/landing/{mobile,tablet,desktop} (Digiurban_Assets/web).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  DatabaseBackup,
  Facebook,
  FilePlus2,
  FileText,
  HandCoins,
  HardHat,
  HeartPulse,
  Instagram,
  Landmark,
  Linkedin,
  Lock,
  Menu,
  MessageCircle,
  MessageSquareText,
  MonitorSmartphone,
  Play,
  ReceiptText,
  Recycle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShieldPlus,
  Star,
  ThumbsUp,
  UserRound,
  Users,
  UsersRound,
  X,
  Drama,
  Bell,
  CalendarCheck2,
  FolderOpen,
  Heart,
} from 'lucide-react';

import { LeadDialogProvider, sendLead, useOpenLead } from './LeadDialog';

const CONTATO = 'suporte@digiurban.com.br';
const mailto = (subject: string, body = '') =>
  `mailto:${CONTATO}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;

/* ---------------------------------------------------------------- imagens */

type Device = 'mobile' | 'tablet' | 'desktop';
const WIDTH: Record<Device, number> = { mobile: 800, tablet: 1280, desktop: 1920 };

/** Objeto recortado (mascote, celular, escudo…): escolhe o tamanho pelo espaço ocupado */
function Asset({
  name,
  alt,
  className,
  sizes,
  portrait,
  eager,
}: {
  name: string;
  alt: string;
  className?: string;
  sizes: string;
  portrait?: boolean;
  eager?: boolean;
}) {
  const w = (d: Device) => Math.round(WIDTH[d] * (portrait ? 2 / 3 : 1));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/landing/desktop/${name}.webp`}
      srcSet={(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => `/landing/${d}/${name}.webp ${w(d)}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}

/** Fundo da seção: arte própria para celular (retrato), tablet e computador */
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

const NAV = [
  { label: 'Início', href: '#inicio' },
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Para quem é', href: '#para-quem-e' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Planos', href: '#planos' },
  { label: 'Conteúdo', href: '/apresentacao' },
  { label: 'Contato', href: '#contato' },
];

const HERO_ACTIONS: { label: string; icon: LucideIcon }[] = [
  { label: 'Abrir um Protocolo', icon: FilePlus2 },
  { label: 'Emitir Doc. Solicitação', icon: FileText },
  { label: 'Agendar Atendimento', icon: CalendarDays },
  { label: 'Solicitar Serviço', icon: HandCoins },
  { label: 'Falar com a Prefeitura', icon: MessageSquareText },
];

const STATS: { value: string; label: string; icon: LucideIcon; fill?: boolean }[] = [
  { value: '+ 250', label: 'Municípios atendidos', icon: BarChart3 },
  { value: '+ 1,2 milhão', label: 'Cidadãos beneficiados', icon: Users, fill: true },
  { value: '98%', label: 'Satisfação dos usuários', icon: ThumbsUp, fill: true },
  { value: '24/7', label: 'Plataforma disponível', icon: Clock3 },
];

const ABOUT_FEATURES: { label: string; short: string; icon: LucideIcon }[] = [
  { label: 'Mais transparência na gestão pública', short: 'Mais transparência', icon: Settings },
  { label: 'Serviços acessíveis de qualquer lugar', short: 'De qualquer lugar', icon: MonitorSmartphone },
  { label: 'Cidades mais eficientes e sustentáveis', short: 'Cidades eficientes', icon: UsersRound },
];

const BOOKS = ['Cidadão', 'Prefeitura', 'Transparência', 'Inovação', 'Desenvolvimento'];

const STEPS: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: 'Cadastre-se', desc: 'Crie sua conta de forma rápida e segura.', icon: FileText },
  { title: 'Solicite o serviço', desc: 'Escolha o serviço, preencha as informações e envie.', icon: FileText },
  { title: 'Acompanhe', desc: 'Acompanhe o andamento em tempo real.', icon: Search },
  { title: 'Resolva', desc: 'Receba o resultado de forma digital, sem sair de casa.', icon: Check },
];

const SERVICES: { title: string; desc: string; icon: LucideIcon; teal?: boolean }[] = [
  { title: 'Saúde', desc: 'Agendamentos, solicitações e informações.', icon: HeartPulse },
  { title: 'Educação', desc: 'Matrículas, declarações e protocolos.', icon: BookOpenText },
  { title: 'Assistência Social', desc: 'Solicitação de benefícios e acompanhamento.', icon: UserRound },
  { title: 'Obras e Urbanismo', desc: 'Alvarás, habite-se e consultas.', icon: HardHat },
  { title: 'Meio Ambiente', desc: 'Licenças, autorizações e denúncias.', icon: Recycle, teal: true },
  { title: 'Cultura e Lazer', desc: 'Eventos, inscrições e espaços públicos.', icon: Drama },
  { title: 'Tributação', desc: 'Emissão de guias e certidões.', icon: ReceiptText },
  { title: 'Outros Serviços', desc: 'E muito mais, de acordo com o seu município.', icon: Landmark },
];

const CONTROL = ['Solicite serviços online', 'Acompanhe em tempo real', 'Receba notificações', 'Avalie o atendimento'];

const PHONE_ROWS: { label: string; icon: LucideIcon }[] = [
  { label: 'Meus Protocolos', icon: FolderOpen },
  { label: 'Meus Documentos', icon: FileText },
  { label: 'Agendamentos', icon: CalendarCheck2 },
  { label: 'Meus Favoritos', icon: Heart },
];

const BENEFITS: { label: string; icon: LucideIcon; solid?: boolean }[] = [
  { label: 'Redução de custos operacionais', icon: Settings },
  { label: 'Processos mais ágeis e transparentes', icon: FileText },
  { label: 'Dados e relatórios para melhor gestão', icon: ChartNoAxesColumnIncreasing, solid: true },
  { label: 'Conformidade com a legislação (LGPD)', icon: ShieldPlus },
];

const TESTIMONIALS = [
  {
    quote: 'O Digiurban facilitou muito a minha vida. Consegui resolver tudo pelo celular, sem precisar ir até a prefeitura.',
    name: 'Mariana Silva',
    role: 'Cidadã de Ribeirão - PR',
    avatar: 'avatar-demo-feminino',
  },
  {
    quote: 'A plataforma trouxe mais organização, transparência e agilidade para nossa gestão municipal.',
    name: 'Carlos Mendes',
    role: 'Prefeito de Novaes - SP',
    avatar: 'avatar-demo-masculino',
  },
];

const SECURITY: { label: string; icon: LucideIcon; teal?: boolean }[] = [
  { label: 'Criptografia de ponta a ponta', icon: Lock },
  { label: 'Conformidade com a LGPD', icon: ShieldCheck, teal: true },
  { label: 'Backup e alta disponibilidade', icon: DatabaseBackup, teal: true },
  { label: 'Monitoramento contínuo', icon: Activity },
];

/** Rodapé: itens sem página própria ficam como texto (sem link quebrado) */
const FOOTER: { title: string; links: { label: string; href?: string }[] }[] = [
  {
    title: 'Soluções',
    links: [
      { label: 'Serviços Municipais', href: '#solucoes' },
      { label: 'Para o Cidadão', href: '/cidadao/login' },
      { label: 'Para a Prefeitura', href: '#recursos' },
      { label: 'Integrações', href: '/apresentacao' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre o Digiurban', href: '#sobre' },
      { label: 'Blog' },
      { label: 'Carreiras' },
      { label: 'Contato', href: mailto('Contato pelo site') },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Central de Ajuda', href: mailto('Ajuda') },
      { label: 'Tutoriais', href: '/apresentacao' },
      { label: 'Perguntas Frequentes', href: '#como-funciona' },
      { label: 'Suporte', href: mailto('Suporte') },
    ],
  },
];

/* ------------------------------------------------------------------ peças */

function NavLink({ href, className, children, onClick }: { href: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  if (href.startsWith('#') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
    <header className="dl-nav sticky top-0 z-50">
      <Container className="flex h-[60px] items-center gap-3 md:h-[68px] lg:h-[80px]">
        <Link href="/landing" aria-label="Digiurban — início" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/logo-colorida-480.png" srcSet="/landing/logo-colorida-480.png 1x, /landing/logo-colorida-960.png 2x" alt="Digiurban" className="h-[26px] w-auto md:h-[32px] lg:h-[40px]" />
        </Link>

        <nav aria-label="Seções" className="ml-auto hidden items-center gap-5 xl:gap-7 whitespace-nowrap text-[14px] xl:text-[15.5px] font-medium text-[#22407c] lg:flex">
          {NAV.map((item, i) => (
            <NavLink key={item.label} href={item.href} className={`transition-colors hover:text-[var(--dl-blue)] ${i === 0 ? 'text-[var(--dl-blue)]' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-5">
          <Link href="/cidadao/servicos" aria-label="Buscar serviços" className="hidden h-10 w-10 items-center justify-center rounded-full text-[#1b3f86] transition-colors hover:bg-white/70 lg:flex">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/admin/login" className="dl-btn dl-btn-line hidden h-[50px] rounded-2xl px-6 text-[16px] lg:inline-flex">
            <CircleUserRound className="h-5 w-5 text-[var(--dl-blue)]" />
            Entrar
          </Link>
          <Link href="/cidadao/login" className="dl-btn dl-btn-teal h-[40px] rounded-xl px-4 text-[14px] md:h-[44px] md:px-5 md:text-[13.5px] lg:h-[50px] lg:rounded-2xl lg:px-7 lg:text-[16px]">
            <CircleUserRound className="h-5 w-5 lg:hidden" />
            Acessar Portal
          </Link>
          <button
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="dl-glass flex h-[40px] w-[40px] items-center justify-center rounded-xl text-[var(--dl-blue)] md:h-[44px] md:w-[44px] lg:h-[50px] lg:w-[50px] lg:rounded-2xl"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
    </header>

      {/* Fora do <header>: vidro dentro de vidro não desfoca (backdrop-filter aninhado) */}
      {open && (
        <>
          <button type="button" aria-label="Fechar menu" className="fixed inset-0 top-[60px] z-40 cursor-default bg-[#0b2a8c]/10 md:top-[68px] lg:top-[80px]" onClick={() => setOpen(false)} />
          <div className="dl-glass dl-sheet dl-rim fixed right-3 top-[68px] z-50 md:top-[76px] lg:top-[88px] w-[min(320px,calc(100vw-24px))] rounded-[26px] p-3 sm:right-6">
            <nav aria-label="Menu" className="flex flex-col">
              {NAV.map((item) => (
                <NavLink key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#1b3f86] hover:bg-white/80">
                  {item.label}
                </NavLink>
              ))}
              <div className="my-2 h-px bg-[#c9dcf5]" />
              <Link href="/cidadao/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] font-semibold text-[var(--dl-blue)] hover:bg-white/80">
                Portal do Cidadão
              </Link>
              <Link href="/admin/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#1b3f86] hover:bg-white/80">
                Entrar como servidor
              </Link>
              <Link href="/apresentacao-pitch" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#1b3f86] hover:bg-white/80">
                Pitch
              </Link>
              <Link href="/validar-documento" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#1b3f86] hover:bg-white/80">
                Validar documento
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

/** Painel "Olá, Cidadão!" do hero — vidro espesso */
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
          {HERO_ACTIONS.map(({ label, icon: Icon }, i) => (
            <li key={label} className={i > 0 ? 'border-t border-[#dbe7f7]' : ''}>
              <Link href="/cidadao/login" className="group flex items-center gap-[4cqw] py-[3.2cqw] md:gap-2 md:py-[8px] lg:gap-3 lg:py-[12px]">
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

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden rounded-b-[26px] text-white md:rounded-none">
      <Bg name="fundo-hero" eager />
      <Container className="pt-7 md:min-h-[430px] md:pt-9 lg:min-h-[510px] lg:pt-9">
        <div className="relative z-10 text-center md:max-w-[50%] md:pb-10 md:text-left lg:max-w-[45%] xl:max-w-[560px] lg:pb-6">
          <span className="dl-btn-ghost inline-flex items-center gap-2 rounded-full border-0 px-3.5 py-1.5 text-[12px] font-medium md:text-[12px] lg:px-4 lg:py-2 lg:text-[15px]" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
            <BarChart3 className="h-4 w-4" />
            Cidades mais inteligentes, pessoas mais felizes
          </span>
          <h1 className="mt-4 text-[34px] font-bold leading-[1.04] tracking-[-0.02em] sm:text-[40px] md:text-[34px] lg:mt-4 lg:text-[54px]">
            Serviços públicos
            <br />
            <span className="dl-grad-text">modernos e acessíveis</span>
            <br />
            para todos
          </h1>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-[1.45] text-white/90 md:mx-0 md:text-[13.5px] lg:mt-3 lg:max-w-[540px] lg:text-[20px]">
            Digitalize, simplifique e conecte o seu município. Com o Digiurban, o cidadão resolve suas demandas de forma rápida, segura e 100% online.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 md:items-start lg:mt-5">
            <Link href="/cidadao/login" className="dl-btn dl-btn-teal h-[48px] w-[260px] rounded-[14px] text-[16px] md:w-auto md:px-6 lg:h-[58px] lg:px-10 lg:text-[19px]">
              Acessar Portal do Cidadão
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/apresentacao" className="dl-btn dl-btn-ghost h-[46px] w-[260px] rounded-[14px] text-[16px] md:w-auto md:px-6 lg:h-[56px] lg:px-10 lg:text-[19px]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0f5bd8]">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
              Conheça a Plataforma
            </Link>
          </div>
        </div>

        {/* Ilustração: mascote + painel. Celular: lado a lado abaixo do texto */}
        <div className="relative mt-6 flex items-end md:absolute md:bottom-0 md:right-6 md:top-4 md:mt-0 md:w-[50%] lg:left-[46%] lg:right-0 lg:top-2 lg:w-auto">
          <Asset
            name="mascote-hero"
            alt="Mascote do Digiurban mostrando o aplicativo no celular"
            sizes="(max-width: 767px) 60vw, 40vw"
            eager
            className="relative z-30 -mb-[1%] -ml-[4%] -mr-[14%] w-[72%] select-none md:absolute md:bottom-0 md:left-[-8%] md:mr-0 md:h-[70%] md:w-auto md:max-w-none lg:left-[-2%] lg:h-full"
          />
          <HeroPanel className="relative z-20 mb-12 w-[46%] shrink-0 md:absolute md:right-0 md:top-[14%] md:mb-0 md:w-[232px] lg:right-[-1%] lg:top-[12%] lg:w-[300px]" />
        </div>
        <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center gap-1.5 md:hidden" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
        </div>
      </Container>
    </section>
  );
}

function Stats() {
  return (
    <section aria-label="Números do Digiurban" className="bg-white/70 py-4 md:py-5 lg:py-6">
      <Container className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        {STATS.map(({ value, label, icon: Icon, fill }) => (
          <div key={label} className="dl-card flex items-center gap-3 rounded-2xl px-3 py-3 md:gap-4 md:px-5 md:py-4">
            <span className="dl-icon h-11 w-11 rounded-xl md:h-12 md:w-12 lg:h-[62px] lg:w-[62px] lg:rounded-2xl">
              <Icon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" fill={fill ? 'currentColor' : 'none'} />
            </span>
            <div className="min-w-0">
              <p className="dl-h whitespace-nowrap text-[19px] md:text-[21px] lg:text-[29px]">{value}</p>
              <p className="text-[12px] leading-tight md:text-[12.5px] lg:text-[16px]">{label}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

function About() {
  return (
    <section id="sobre" className="relative overflow-hidden">
      <Bg name="fundo-sobre" imgClassName="md:object-[center_88%]" />
      <Container className="pb-4 pt-7 md:hidden">
        <Chip>Sobre o Digiurban</Chip>
        <h2 className="dl-h mt-3 text-[23px]">Tecnologia que aproxima a prefeitura das pessoas</h2>
        <p className="mt-2 text-[14px] leading-snug">Serviços da prefeitura em um só lugar, com o cidadão no centro de tudo.</p>
        <div className="mt-4">
          <Link href="/apresentacao" className="dl-btn dl-btn-blue h-[46px] rounded-xl px-6 text-[15px]">
            Conheça nossa história
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-3 gap-1">
          {ABOUT_FEATURES.map(({ short, icon: Icon }, i) => (
            <li key={short} className={`flex flex-col items-center text-center ${i > 0 ? 'border-l border-[#d6e4f7]' : ''}`}>
              <span className="dl-glass flex h-11 w-11 items-center justify-center rounded-full text-[var(--dl-blue)]">
                <Icon className="h-5 w-5" fill={i === 0 ? 'currentColor' : 'none'} />
              </span>
              <span className="mt-1.5 px-1 text-[12px] leading-tight text-[#3d4f70]">{short}</span>
            </li>
          ))}
        </ul>
        {/* Por último: mascote e livros ficam no "chão" da foto de fundo */}
        <AboutArt className="mx-auto mt-3 aspect-[1.2/1] max-w-[440px]" mobile />
      </Container>
      <Container className="hidden grid-cols-[1.08fr_1fr] items-center gap-6 py-9 md:grid">
        <div className="relative z-10">
          <Chip>Sobre o Digiurban</Chip>
          <h2 className="dl-h mt-3 text-[18px] sm:text-[26px] md:text-[26px] lg:text-[48px]">
            Tecnologia que aproxima
            <br className="hidden sm:block" /> a prefeitura das pessoas
          </h2>
          <p className="mt-2 max-w-[590px] text-[12px] leading-[1.4] sm:text-[15px] md:mt-3 md:text-[15px] lg:text-[22px]">
            O Digiurban é uma plataforma completa de digitalização de serviços públicos municipais, que simplifica processos, reduz custos e coloca o cidadão no centro de tudo.
          </p>
          <Link href="/apresentacao" className="dl-btn dl-btn-blue mt-4 h-[40px] rounded-xl px-4 text-[13px] md:mt-5 md:h-[42px] md:px-6 md:text-[13.5px] lg:h-[54px] lg:px-9 lg:text-[18px]">
            Conheça nossa história
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
          <ul className="mt-5 grid max-w-[600px] grid-cols-3 gap-1 md:mt-6">
            {ABOUT_FEATURES.map(({ label, icon: Icon }, i) => (
              <li key={label} className={`flex flex-col items-center text-center ${i > 0 ? 'border-l border-[#d6e4f7]' : ''}`}>
                <span className="dl-glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--dl-blue)] md:h-12 md:w-12 lg:h-16 lg:w-16">
                  <Icon className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8" fill={i === 0 ? 'currentColor' : 'none'} />
                </span>
                <span className="mt-2 px-0.5 text-[9.5px] leading-tight text-[#3d4f70] md:text-[12px] lg:text-[15px]">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <AboutArt className="aspect-[1.25/1]" />
      </Container>
    </section>
  );
}

/** Mascote com notebook + livros "Cidadão… Desenvolvimento" + frase manuscrita */
function AboutArt({ className = '', mobile }: { className?: string; mobile?: boolean }) {
  return (
    <div className={`relative w-full ${className}`}>
      <p className={`dl-script absolute right-[2%] top-[0%] z-20 rotate-[-9deg] text-center text-[#0f5bd8] ${mobile ? 'text-[19px]' : 'text-[2.6vw] lg:text-[34px]'}`}>
        Tecnologia
        <br />a serviço
        <br />
        das pessoas!
        <span className="mx-auto mt-1 block h-[3px] w-[80%] rounded-full bg-gradient-to-r from-[#3af6d6] to-[#13dbe7]" />
      </p>
      {/* Sombras de contato: mascote e livros apoiados no chão */}
      <span aria-hidden className={`absolute bottom-0 z-0 h-[8%] translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(11,42,140,0.32),transparent)] ${mobile ? 'left-[8%] w-[50%]' : 'left-[8%] w-[54%]'}`} />
      <span aria-hidden className={`absolute bottom-0 z-0 h-[6%] translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(11,42,140,0.28),transparent)] ${mobile ? 'left-[53%] w-[48%]' : 'left-[55%] w-[46%]'}`} />
      <Asset
        name="mascote-sobre"
        alt="Mascote do Digiurban com notebook"
        sizes="(max-width: 767px) 75vw, 30vw"
        className={`absolute bottom-0 z-10 ${mobile ? 'left-[-4%] w-[74%]' : 'left-[-6%] w-[80%]'}`}
      />
      <div className={`dl-cq absolute bottom-[-5%] ${mobile ? 'right-[-2%] w-[50%]' : 'right-[-3%] w-[48%]'}`}>
        <Asset name="livros-planta" alt="" sizes="(max-width: 767px) 50vw, 20vw" className="w-full" />
        {/* Rótulos nas lombadas (a arte vem sem texto) */}
        <ul aria-label="Pilares" className="absolute inset-0">
          {BOOKS.map((label, i) => (
            <li
              key={label}
              className="absolute left-[33%] font-bold uppercase leading-none tracking-[0.04em]"
              style={{
                top: `${[39, 49.5, 60.5, 70.3, 80.2][i]}%`,
                transform: 'translateY(-50%)',
                fontSize: '5.2cqw',
                color: i >= 3 ? '#0b2a8c' : '#ffffff',
                textShadow: i >= 3 ? 'none' : '0 1px 2px rgba(0,30,90,0.35)',
              }}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white/80 py-7 md:py-8 lg:py-8">
      <Container>
        <div className="text-center">
          <Chip>Como funciona</Chip>
          <h2 className="dl-h mt-2 text-[21px] sm:text-[24px] md:text-[24px] lg:text-[37px]">Simples para o cidadão. Poderoso para o município.</h2>
          <p className="mx-auto mt-1.5 max-w-[1100px] text-[13px] sm:text-[14px] md:text-[13.5px] lg:text-[20px]">
            Em poucos passos, o cidadão acessa, solicita e acompanha seus serviços. E a prefeitura ganha eficiência na gestão.
          </p>
        </div>
        <ol className="mx-auto mt-5 grid max-w-[1150px] gap-2.5 md:mt-5 md:grid-cols-2 md:gap-4">
          {STEPS.map(({ title, desc, icon: Icon }, i) => (
            <li key={title} className="dl-card flex items-center gap-3 rounded-2xl px-4 py-3 md:gap-4 md:px-6 md:py-5">
              <span className="dl-num h-8 w-8 text-[15px] md:h-10 md:w-10 md:text-[16px] lg:h-11 lg:w-11 lg:text-[20px]">
                {i === 3 ? (
                  <>
                    <Check className="h-4 w-4 md:hidden" strokeWidth={3} />
                    <span className="hidden md:inline">4</span>
                  </>
                ) : (
                  i + 1
                )}
              </span>
              <span className="dl-icon h-11 w-11 rounded-xl md:h-[50px] md:w-[50px] md:rounded-2xl lg:h-[68px] lg:w-[68px]">
                <Icon className="h-6 w-6 md:h-8 md:w-8 lg:h-9 lg:w-9" strokeWidth={i === 3 ? 3 : 2} />
              </span>
              <div className="min-w-0">
                <h3 className="dl-h text-[15px] md:text-[16px] lg:text-[22px]">{title}</h3>
                <p className="text-[13px] leading-snug md:max-w-[320px] md:text-[13.5px] lg:text-[19px]">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Services() {
  const cta = (
    <Link href="/cidadao/servicos" className="dl-btn dl-btn-blue h-[42px] rounded-xl px-6 text-[14px] md:h-[42px] md:text-[13.5px] lg:h-[54px] lg:px-8 lg:text-[17px]">
      Ver todos os serviços
      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
    </Link>
  );
  return (
    <section id="solucoes" className="bg-gradient-to-b from-[#eef5ff] to-[#f5f9ff] py-7 md:py-8 lg:py-8">
      <Container>
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <Chip>Principais serviços</Chip>
            <h2 className="dl-h mt-2 text-[21px] sm:text-[24px] md:text-[24px] lg:text-[37px]">Tudo o que o cidadão precisa, em um só lugar</h2>
            <p className="mt-1.5 max-w-[900px] text-[13px] sm:text-[14px] md:text-[13.5px] lg:text-[19px]">
              Do atendimento básico aos serviços mais complexos, o Digiurban centraliza e facilita o acesso.
            </p>
          </div>
          <div className="hidden shrink-0 md:block">{cta}</div>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-2.5 md:mt-6 md:gap-4">
          {SERVICES.map(({ title, desc, icon: Icon, teal }) => (
            <li key={title}>
              <Link href="/cidadao/servicos" className="dl-card flex h-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 md:gap-5 md:px-5 md:py-4 lg:py-[18px]">
                <span className={`dl-icon h-10 w-10 rounded-xl md:h-[50px] md:w-[50px] md:rounded-2xl lg:h-[66px] lg:w-[66px] ${teal ? '!text-[#19c9c0]' : ''}`}>
                  <Icon className="h-5 w-5 md:h-8 md:w-8 lg:h-9 lg:w-9" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h3 className="dl-h text-[13.5px] md:text-[15px] lg:text-[21px]">{title}</h3>
                  <p className="line-clamp-2 text-[11.5px] leading-snug md:line-clamp-none md:max-w-[280px] md:text-[12.5px] lg:text-[17px]">{desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-center md:hidden">{cta}</div>
      </Container>
    </section>
  );
}

function CitizenControl() {
  return (
    <section id="para-quem-e" className="relative overflow-hidden">
      <Bg name="fundo-cidade" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-white/20 md:from-white/80 md:via-white/75" />
      <Container className="pt-7 md:hidden">
        <h2 className="dl-h text-[24px]">O cidadão no controle</h2>
        <p className="mt-1.5 text-[14px] leading-snug">Menos filas e mais tempo para o que importa.</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {CONTROL.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[13px] leading-tight text-[#28406b]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3af6d6] to-[#12c9c9] text-white">
                <Check className="h-3 w-3" strokeWidth={3.2} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="relative mt-3 flex items-end justify-between">
          <p className="dl-script absolute left-0 top-0 z-20 rotate-[-10deg] text-center text-[17px] text-[#0f5bd8]">
            Mais tempo para
            <br />o que importa!
            <span className="mx-auto mt-1 block h-[3px] w-[80%] rounded-full bg-gradient-to-r from-[#3af6d6] to-[#13dbe7]" />
          </p>
          <Asset
            name="mascote-cidadao"
            alt="Mascote do Digiurban fazendo sinal de positivo"
            sizes="70vw"
            className="relative z-10 -mb-[3%] ml-[-4%] mt-[16%] w-[66%]"
          />
          <PhoneMock className="-mb-[10%] w-[36%]" sizes="40vw" />
        </div>
      </Container>
      <Container className="hidden grid-cols-[1fr_1.05fr_0.9fr] items-end gap-4 pt-4 md:grid lg:pr-[5%]">
        <div className="relative self-stretch">
          <p className="dl-script absolute left-[-4%] top-[4%] z-20 rotate-[-10deg] text-center text-[2vw] text-[#0f5bd8] lg:left-[-8%] lg:top-[3%] lg:text-[26px]">
            Mais
            <br />
            tempo para
            <br />o que importa!
            <span className="mx-auto mt-1 block h-[3px] w-[80%] rounded-full bg-gradient-to-r from-[#3af6d6] to-[#13dbe7]" />
          </p>
          <Asset
            name="mascote-cidadao"
            alt="Mascote do Digiurban fazendo sinal de positivo"
            sizes="30vw"
            className="absolute bottom-0 right-[-6%] z-10 h-[74%] w-auto max-w-none translate-y-[3.5%] lg:right-[-10%] lg:h-[90%]"
          />
        </div>
        <div className="self-center pb-5 md:pb-8">
          <h2 className="dl-h text-[16px] sm:text-[22px] md:text-[24px] lg:text-[38px] lg:whitespace-nowrap">O cidadão no controle</h2>
          <p className="mt-1.5 max-w-[440px] text-[11.5px] leading-snug sm:text-[14px] md:text-[13.5px] lg:text-[20px]">
            Mais autonomia, menos filas, mais tempo para o que realmente importa.
          </p>
          <ul className="mt-3 space-y-1.5 md:mt-4 md:space-y-2.5">
            {CONTROL.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[11.5px] text-[#28406b] sm:text-[14px] md:gap-3 md:text-[14px] lg:text-[20px]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3af6d6] to-[#12c9c9] text-white shadow-[0_4px_10px_-4px_rgba(18,200,200,0.9)] md:h-7 md:w-7">
                  <Check className="h-3 w-3 md:h-4 md:w-4" strokeWidth={3.2} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <PhoneMock className="-mb-[30%] self-end" sizes="18vw" />
      </Container>
    </section>
  );
}

/** Celular do kit com a tela do app desenhada por cima */
function PhoneMock({ className = '', sizes }: { className?: string; sizes: string }) {
  return (
    <div className={`dl-cq relative ${className}`}>
      <Asset name="celular-tela-vazia" alt="" portrait sizes={sizes} className="relative w-full" />
      {/* Conteúdo da tela (a arte do celular vem com a tela vazia) */}
      {/* Área exata da tela na arte (medida no PNG): conteúdo recortado nos cantos e
          com leve perspectiva — a tela é ~3% mais estreita em cima */}
      <div
        className="absolute bottom-[8.4%] left-[20.6%] right-[22.9%] top-[10.6%] overflow-hidden rounded-[6cqw] px-[3cqw] pt-[5cqw] text-[#07569d]"
        style={{ transform: 'perspective(260cqw) rotateX(3deg)', transformOrigin: '50% 100%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/logo-colorida-480.png" alt="Digiurban" className="w-[40cqw] max-w-full" />
        <p className="mt-[5cqw] text-[7cqw] font-bold leading-none">Olá, João!</p>
        <p className="mt-[2cqw] text-[3.6cqw] leading-tight text-[#58718a]">Aqui você tem acesso a todos os serviços do seu município.</p>
        <ul className="mt-[5cqw] space-y-[2.6cqw]">
          {PHONE_ROWS.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-[3cqw] rounded-[2.5cqw] bg-[#f3f9ff] px-[2.5cqw] py-[2.4cqw]">
              <span className="flex h-[7cqw] w-[7cqw] shrink-0 items-center justify-center rounded-[1.6cqw] bg-gradient-to-b from-[#1aa7ff] to-[#0b78e8] text-white">
                <Icon className="h-[4.4cqw] w-[4.4cqw]" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[3.9cqw] font-medium">{label}</span>
              <ChevronRight className="h-[4.4cqw] w-[4.4cqw] shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <section id="recursos" className="bg-white/85 py-6 md:py-8 lg:py-8">
      <Container>
        <div className="text-center">
          <Chip>Para o seu município</Chip>
          <h2 className="dl-h mt-2 text-[21px] sm:text-[24px] md:text-[24px] lg:text-[37px]">Mais eficiência. Mais resultados.</h2>
          <p className="mt-1 text-[13px] sm:text-[14px] md:text-[13.5px] lg:text-[19px]">O Digiurban moderniza a gestão pública e gera impacto real na vida das pessoas.</p>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-4">
          {BENEFITS.map(({ label, icon: Icon, solid }) => (
            <li key={label} className="dl-card flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 md:gap-4 md:px-4 md:py-4 lg:px-5 lg:py-5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-[44px] md:w-[44px] lg:h-[58px] lg:w-[58px] ${
                  solid ? 'bg-gradient-to-b from-[#3af6d6] to-[#12c9c9] text-white shadow-[0_8px_16px_-8px_rgba(18,200,200,0.9)]' : 'dl-icon'
                }`}
              >
                <Icon className="h-5 w-5 md:h-7 md:w-7" fill={label.startsWith('Redução') ? 'currentColor' : 'none'} strokeWidth={label.startsWith('Redução') ? 1.4 : 2.2} />
              </span>
              <span className="text-[11.5px] leading-snug text-[#3d4f70] md:text-[12.5px] lg:text-[17px]">{label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="depoimentos" className="bg-[#eef5fd]/90 py-6 md:py-7 lg:py-7">
      <Container className="grid gap-4 sm:grid-cols-[0.95fr_1fr_1fr] sm:items-center md:gap-5 lg:grid-cols-[1.25fr_1fr_1fr]">
        <div>
          <Chip>Depoimentos</Chip>
          <h2 className="dl-h mt-2 text-[21px] md:text-[22px] lg:text-[38px]">Quem usa, recomenda</h2>
          <p className="mt-1.5 text-[12.5px] leading-snug md:text-[12.5px] lg:text-[19px]">
            Histórias reais de municípios e cidadãos que já transformaram sua experiência com o Digiurban.
          </p>
          <a href={mailto('Quero conhecer mais depoimentos')} className="dl-btn dl-btn-blue mt-3 h-[38px] rounded-xl px-4 text-[13px] md:mt-4 md:h-[40px] md:px-5 md:text-[13.5px] lg:h-[50px] lg:px-8 lg:text-[17px]">
            Ver mais depoimentos
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="dl-card flex flex-col gap-2.5 rounded-2xl p-3 md:flex-row md:gap-4 md:p-5">
              <Asset
                name={t.avatar}
                alt={`Foto de ${t.name} (demonstração)`}
                sizes="96px"
                className="h-12 w-12 shrink-0 rounded-full object-cover shadow-[0_4px_12px_-6px_rgba(0,0,0,0.5)] md:h-[60px] md:w-[60px] lg:h-[84px] lg:w-[84px]"
              />
              <div className="min-w-0">
                <blockquote className="text-[11.5px] leading-snug text-[#3d4f70] md:text-[12px] lg:text-[16px]">“{t.quote}”</blockquote>
                <figcaption className="mt-2">
                  <p className="dl-h text-[13px] md:text-[13.5px] lg:text-[18px]">{t.name}</p>
                  <p className="text-[11px] md:text-[12px] lg:text-[15px]">{t.role}</p>
                  <div className="mt-1 flex gap-0.5 text-[#ffb400]" aria-label="5 de 5 estrelas">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-current md:h-[18px] md:w-[18px]" />
                    ))}
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Security() {
  return (
    <section id="seguranca" className="bg-white/85 py-6 md:py-7 lg:py-7">
      <Container className="grid items-center gap-5 sm:grid-cols-[1fr_1.4fr] md:grid-cols-[1.05fr_1.5fr]">
        <div>
          <Chip>Segurança</Chip>
          <h2 className="dl-h mt-2 text-[21px] md:text-[22px] lg:text-[38px]">
            Seus dados protegidos,
            <br />
            sempre
          </h2>
          <p className="mt-1.5 text-[14px] leading-snug sm:text-[12.5px] md:text-[12.5px] lg:text-[19px]">
            <span className="sm:hidden">Boas práticas de segurança e conformidade com a LGPD.</span>
            <span className="hidden sm:inline">O Digiurban segue as melhores práticas de segurança da informação e está em conformidade com a LGPD, garantindo a privacidade dos dados dos cidadãos.</span>
          </p>
          <a href="#seguranca" className="dl-btn dl-btn-blue mt-3 h-[38px] rounded-xl px-4 text-[13px] md:mt-4 md:h-[40px] md:px-5 md:text-[13.5px] lg:h-[50px] lg:px-8 lg:text-[17px]">
            Saiba mais sobre segurança
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-[1.1fr_1fr] items-center gap-3 sm:border-l sm:border-[#dfe9f7] sm:pl-5 md:pl-8">
          <ul className="space-y-3 md:space-y-4">
            {SECURITY.map(({ label, icon: Icon, teal }) => (
              <li key={label} className="flex items-center gap-2.5 text-[12px] text-[#3d4f70] md:gap-3 md:text-[12.5px] lg:text-[18px]">
                <span className={`dl-icon h-8 w-8 rounded-full md:h-10 md:w-10 lg:h-11 lg:w-11 ${teal ? '!text-[#12bdb8]' : ''}`}>
                  <Icon className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.4} />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <div className="relative">
            <Asset name="escudo-seguranca" alt="Escudo com cadeado" sizes="(max-width: 767px) 40vw, 22vw" className="w-full drop-shadow-[0_20px_30px_rgba(20,110,240,0.25)]" />
            <div className="dl-tinted dl-rim absolute bottom-[14%] right-[-4%] rounded-2xl px-3 py-2 md:right-[-8%] md:px-4 md:py-3 lg:px-6 lg:py-4">
              <p className="text-[12px] font-bold md:text-[13.5px] lg:text-[19px]">Confiança</p>
              <p className="text-[10.5px] leading-tight text-white/90 md:text-[12px] lg:text-[17px]">
                para uma cidade
                <br />
                mais digital.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  const openLead = useOpenLead();
  return (
    <section id="planos" className="relative overflow-hidden text-white">
      <Bg name="fundo-hero" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0b3ea8]/40 via-[#0a3a9e]/55 to-[#082f86]/80" />
      <Container className="pt-8 text-center md:hidden">
        <h2 className="text-[25px] font-bold leading-[1.1] tracking-[-0.02em]">Pronto para transformar o seu município?</h2>
        <p className="mt-2 text-[14px] text-white/90">Junte-se às cidades que já estão no Digiurban.</p>
        <div className="mx-auto mt-4 flex max-w-[320px] flex-col gap-2.5">
          <button type="button" onClick={() => openLead('demo')} className="dl-btn dl-btn-teal h-[48px] rounded-xl text-[15px]">
            Solicitar uma Demonstração
            <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => openLead('contact')} className="dl-btn dl-btn-ghost h-[46px] rounded-xl text-[15px]">
            <Play className="h-4 w-4" />
            Falar com um Especialista
          </button>
        </div>
        <div className="relative mt-3 flex items-end">
          <Asset name="mascote-cta" alt="Mascote do Digiurban comemorando" sizes="70vw" className="relative -mb-[4%] ml-[-4%] w-[62%]" />
          <p className="dl-script mb-[14%] flex-1 rotate-[-10deg] text-[21px]">
            Juntos por
            <br />
            cidades melhores!
            <span className="mx-auto mt-1.5 block h-[3px] w-[80%] rounded-full bg-gradient-to-r from-[#3af6d6] to-[#13dbe7]" />
          </p>
        </div>
      </Container>
      <Container className="hidden grid-cols-[0.7fr_1.6fr_0.8fr] items-end gap-4 pt-4 md:grid lg:grid-cols-[0.62fr_1.6fr_0.7fr]">
        <Asset
          name="mascote-cta"
          alt="Mascote do Digiurban comemorando"
          sizes="(max-width: 767px) 30vw, 22vw"
          className="relative -mb-[10%] w-[118%] max-w-none md:w-[112%]"
        />
        <div className="self-center pb-5 md:pb-7">
          <h2 className="text-[19px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[24px] md:text-[24px] lg:text-[42px]">
            Pronto para transformar
            <br />o seu município?
          </h2>
          <p className="mt-1.5 max-w-[620px] text-[12px] leading-snug text-white/90 sm:text-[14px] md:text-[13.5px] lg:text-[20px]">
            Junte-se a centenas de cidades que já estão construindo um futuro mais digital, eficiente e humano com o Digiurban.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 md:mt-5 md:gap-3">
            <button type="button" onClick={() => openLead('demo')} className="dl-btn dl-btn-teal h-[36px] rounded-xl px-3 text-[12px] md:h-[42px] md:px-6 md:text-[13.5px] lg:h-[50px] lg:text-[16px]">
              Solicitar uma Demonstração
              <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => openLead('contact')} className="dl-btn dl-btn-ghost h-[36px] rounded-xl px-3 text-[12px] md:h-[42px] md:px-6 md:text-[13.5px] lg:h-[50px] lg:text-[16px]">
              <Play className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Falar com um Especialista
            </button>
          </div>
        </div>
        <p className="dl-script hidden self-center rotate-[-10deg] pb-6 whitespace-nowrap text-center text-[2.4vw] sm:block lg:text-[36px]">
          Juntos por
          <br />
          cidades melhores!
          <span className="mx-auto mt-2 block h-[3px] w-[80%] rounded-full bg-gradient-to-r from-[#3af6d6] to-[#13dbe7]" />
        </p>
      </Container>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [news, setNews] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const social: { label: string; icon: LucideIcon }[] = [
    { label: 'Instagram', icon: Instagram },
    { label: 'Facebook', icon: Facebook },
    { label: 'YouTube', icon: Bell },
    { label: 'LinkedIn', icon: Linkedin },
  ];
  return (
    <footer id="contato" className="bg-[#0b1d33] text-[#b9c7dc]">
      <Container className="grid grid-cols-3 gap-x-4 gap-y-6 py-7 md:grid-cols-[1.3fr_1fr_1fr_1fr_1.5fr] md:py-9">
        <div className="col-span-3 md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/logo-letras-brancas-480.png" srcSet="/landing/logo-letras-brancas-480.png 1x, /landing/logo-letras-brancas-960.png 2x" alt="Digiurban" className="h-7 w-auto md:h-8 lg:h-10" />
          <p className="mt-2 text-[13px] leading-snug">
            Cidades mais digitais,
            <br />
            serviços mais humanos.
          </p>
          <ul className="mt-4 flex gap-2.5" aria-label="Redes sociais">
            {social.map(({ label, icon: Icon }) => (
              <li key={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white">
                {label === 'YouTube' ? <YoutubeGlyph /> : <Icon className="h-4 w-4" />}
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <p className="text-[13px] font-semibold text-white md:text-[12.5px]">{col.title}</p>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] md:text-[13.5px]">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <NavLink href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </NavLink>
                  ) : (
                    <span>{l.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-3 md:col-span-1">
          <p className="text-[13px] font-semibold text-white md:text-[12.5px]">Receba novidades</p>
          <form
            className="mt-2.5 flex overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setNews('sending');
              try {
                await sendLead({ kind: 'newsletter', email: email.trim() });
                setNews('sent');
                setEmail('');
              } catch {
                setNews('error');
              }
            }}
          >
            <label htmlFor="dl-news" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="dl-news"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-[#8ea0bb] outline-none"
            />
            <button type="submit" aria-label="Enviar" disabled={news === 'sending'} className="dl-btn-blue flex w-12 items-center justify-center">
              <Send className="h-4 w-4" />
            </button>
          </form>
          {news === 'sent' && <p className="mt-2 text-[12.5px] text-[#2ee6d6]">Pronto! Você vai receber nossas novidades.</p>}
          {news === 'error' && <p className="mt-2 text-[12.5px] text-red-300">Não foi possível cadastrar agora. Tente de novo.</p>}
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center gap-2 py-4 text-[12px] md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Digiurban. Todos os direitos reservados.</p>
          <p className="flex items-center gap-3">
            <span>Termos de Uso</span>
            <span className="h-3 w-px bg-white/25" />
            <span>Política de Privacidade</span>
          </p>
          <p className="flex items-center gap-1.5">
            Desenvolvido para cidades que evoluem.
            <Heart className="h-4 w-4 fill-[#2ee6d6] text-[#2ee6d6]" />
          </p>
        </Container>
      </div>
    </footer>
  );
}

/** Ícone do YouTube (o Lucide tem, mas desenhado como TV; este segue a referência) */
function YoutubeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15.1V8.9l5.2 3.1L10 15.1Z" />
    </svg>
  );
}

export function DigiurbanLanding() {
  return (
    <LeadDialogProvider>
    <div className="dl min-h-screen">
      <Header />
      <main>
        <Hero />
        <Stats />
        <About />
        <HowItWorks />
        <Services />
        <CitizenControl />
        <Benefits />
        <Testimonials />
        <Security />
        <FinalCta />
      </main>
      <Footer />
    </div>
    </LeadDialogProvider>
  );
}
