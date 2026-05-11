'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ElementType, ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Gauge,
  Handshake,
  Home,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Network,
  Play,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';

type SlideDefinition = {
  id: string;
  title: string;
  component: () => ReactElement;
};

function SlideShell({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`relative flex h-full w-full overflow-hidden ${dark ? 'bg-[#193642] text-white' : 'bg-white text-[#193642]'}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0fffbf]" />
        <div className="absolute right-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full border border-[#0f6fbe]/15" />
        <div className="absolute bottom-[-120px] right-[120px] h-[300px] w-[300px] rounded-full border border-[#0fffbf]/15" />
      </div>
      <div className="relative z-10 flex h-full w-full flex-col px-16 py-12">
        <div className="mb-7 flex items-center gap-3">
          <span className={`h-1.5 w-16 rounded-full ${dark ? 'bg-[#0fffbf]' : 'bg-[#0f6fbe]'}`} />
          <p className={`text-xs font-bold uppercase ${dark ? 'text-white/55' : 'text-slate-400'}`}>{eyebrow}</p>
        </div>
        <h2 className={`mb-8 max-w-5xl text-[46px] font-black leading-[1.05] ${dark ? 'text-white' : 'text-[#193642]'}`}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function MetricCard({ value, label, icon: Icon }: { value: string; label: string; icon: ElementType }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="mb-4 h-6 w-6 text-[#0f6fbe]" />
      <p className="text-4xl font-black text-[#193642]">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{label}</p>
    </div>
  );
}

function Bullet({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'mint' | 'red' }) {
  const color = tone === 'red' ? 'text-red-500' : tone === 'mint' ? 'text-emerald-500' : 'text-[#0f6fbe]';
  return (
    <li className="flex items-start gap-3 text-[17px] leading-relaxed text-slate-600">
      <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${color}`} />
      <span>{children}</span>
    </li>
  );
}

function SlideAbertura() {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-white">
      <div className="flex flex-1 flex-col justify-center px-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#193642]">
            <Building2 className="h-6 w-6 text-[#0fffbf]" />
          </div>
          <span className="text-sm font-bold uppercase text-slate-400">Plataforma GovTech</span>
        </div>
        <h1 className="text-[82px] font-black leading-none text-[#193642]">
          Digi<span className="text-[#0f6fbe]">urban</span>
        </h1>
        <p className="mt-5 text-3xl font-semibold text-[#193642]/85">Plataforma GovTech para cidades inteligentes</p>
        <div className="mt-10 max-w-3xl border-l-4 border-[#0fffbf] pl-6">
          <p className="text-[25px] font-medium leading-snug text-slate-700">
            "O Digiurban nasceu da necessidade real de modernizar a comunicação e a gestão de demandas públicas municipais."
          </p>
        </div>
        <div className="mt-12 flex items-center gap-8 border-t border-slate-200 pt-6 text-sm text-slate-400">
          <span>Pitch de 10 minutos</span>
          <span>Incubação e validação comercial</span>
          <span>2026</span>
        </div>
      </div>
      <div className="relative flex w-[38%] items-center justify-center bg-[#193642]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative w-[330px] rounded-xl border border-white/10 bg-white/8 p-7 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Prefeitura Digital</span>
            <span className="rounded-full bg-[#0fffbf]/15 px-3 py-1 text-xs font-bold text-[#0fffbf]">MVP</span>
          </div>
          <div className="space-y-4">
            {['Cidadão solicita', 'Setor acompanha', 'Gestor decide'].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0fffbf] text-sm font-black text-[#193642]">{index + 1}</span>
                <span className="text-sm font-semibold text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideProblema() {
  const items = [
    'Processos manuais e pouca padronização',
    'WhatsApp, papel e planilhas desconectados',
    'Demandas perdidas entre setores',
    'Atendimento lento e sem histórico claro',
    'Cidadão sem acompanhamento confiável',
    'Baixa rastreabilidade para a gestão',
    'Comunicação descentralizada',
    'Falta de indicadores para decisão',
  ];

  return (
    <SlideShell eyebrow="Slide 2 - O problema" title="Muitos municípios ainda operam demandas públicas de forma fragmentada.">
      <div className="grid flex-1 grid-cols-[1fr_0.9fr] gap-10">
        <div className="rounded-xl border border-red-100 bg-red-50/80 p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-black text-[#193642]">Problema atual das prefeituras</p>
              <p className="text-sm text-slate-500">A dor é operacional, mas o impacto é político e social.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <p className="text-[16px] font-medium leading-snug text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-[#193642] p-9 text-white">
          <p className="mb-6 text-sm font-bold uppercase text-[#0fffbf]">Frase de identificação</p>
          <p className="text-[31px] font-black leading-tight">
            "Hoje muitos municípios ainda trabalham com WhatsApp, papel, planilhas e processos desconectados."
          </p>
          <p className="mt-7 border-t border-white/10 pt-6 text-lg leading-relaxed text-white/70">
            O problema não é falta de demanda. O problema é falta de gestão eficiente, visibilidade e fluxo rastreável.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideSolucao() {
  const features = [
    { icon: FileText, title: 'Protocolo digital', desc: 'Solicitações centralizadas com histórico e status.' },
    { icon: Smartphone, title: 'Portal do cidadão', desc: 'Abertura e acompanhamento pelo celular.' },
    { icon: Workflow, title: 'Gestão por setores', desc: 'Cada demanda segue para a área responsável.' },
    { icon: BarChart3, title: 'Indicadores', desc: 'Dados para acompanhar prazos, volume e eficiência.' },
    { icon: Network, title: 'Comunicação integrada', desc: 'Cidadão, servidor e gestão no mesmo fluxo.' },
    { icon: Sparkles, title: 'Automações', desc: 'Triagem e apoio operacional com potencial de IA.' },
  ];

  return (
    <SlideShell eyebrow="Slide 3 - A solução" title="O Digiurban centraliza demandas públicas em fluxos digitais rastreáveis.">
      <div className="grid flex-1 grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
              <Icon className="h-6 w-6 text-[#0f6fbe]" />
            </div>
            <h3 className="mb-2 text-xl font-black text-[#193642]">{title}</h3>
            <p className="text-[15px] leading-relaxed text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-7 rounded-xl bg-[#0f6fbe]/8 p-5">
        <p className="text-xl font-semibold text-[#193642]">
          O resultado: menos improviso, mais controle, mais transparência e melhor experiência para o cidadão.
        </p>
      </div>
    </SlideShell>
  );
}

function SlideDemo() {
  const steps = [
    { icon: Users, label: 'Login', text: 'Cidadão ou servidor acessa o ambiente.' },
    { icon: FileText, label: 'Solicitação', text: 'Demanda é aberta com dados e anexos.' },
    { icon: Workflow, label: 'Fluxo', text: 'Protocolo segue para o setor responsável.' },
    { icon: Gauge, label: 'Painel', text: 'Gestor acompanha status e indicadores.' },
  ];

  return (
    <SlideShell eyebrow="Slide 4 - Demonstração rápida" title="Não é apenas uma ideia: o MVP já existe e funciona.">
      <div className="grid flex-1 grid-cols-[0.95fr_1.05fr] gap-10">
        <div className="flex flex-col justify-center">
          <p className="mb-8 text-2xl font-semibold leading-snug text-slate-600">
            Em poucos minutos, a banca precisa perceber que o produto já passou da fase conceitual.
          </p>
          <div className="space-y-4">
            {steps.map(({ icon: Icon, label, text }, index) => (
              <div key={label} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#193642] text-sm font-black text-white">{index + 1}</span>
                <Icon className="h-5 w-5 shrink-0 text-[#0f6fbe]" />
                <div>
                  <p className="font-black text-[#193642]">{label}</p>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#193642] p-7 text-white shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-bold text-white/70">Demonstração sugerida</span>
            <Play className="h-6 w-6 text-[#0fffbf]" />
          </div>
          <div className="rounded-lg bg-white p-5 text-[#193642]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <p className="font-black">Painel Digiurban</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Online</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard value="128" label="Protocolos abertos" icon={FileText} />
              <MetricCard value="7" label="Setores envolvidos" icon={Layers} />
              <MetricCard value="82%" label="Demandas no prazo" icon={TrendingUp} />
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">Solicitação: iluminação pública</span>
                <span className="text-xs font-bold text-[#0f6fbe]">Em andamento</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[68%] rounded-full bg-[#0f6fbe]" />
              </div>
            </div>
          </div>
          <p className="mt-5 text-lg font-semibold text-white/80">Mostre só o essencial: login, painel, abertura, fluxo e acompanhamento.</p>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideDiferencial() {
  const items = [
    'Plataforma SaaS escalável',
    'Modelo multi-prefeitura',
    'Arquitetura moderna',
    'Potencial de IA para triagem',
    'Indicadores inteligentes',
    'Foco em municípios pequenos e médios',
  ];

  return (
    <SlideShell eyebrow="Slide 5 - Diferencial inovador" title="GovTech prática para transformar processos públicos em dados e fluxos." dark>
      <div className="grid flex-1 grid-cols-[1fr_0.8fr] gap-10">
        <div className="grid grid-cols-2 gap-5">
          {items.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/7 p-6">
              <ShieldCheck className="mb-5 h-7 w-7 text-[#0fffbf]" />
              <p className="text-xl font-black leading-snug text-white">{item}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center">
          <div className="rounded-xl bg-white p-8 text-[#193642]">
            <p className="text-sm font-bold uppercase text-[#0f6fbe]">Posicionamento</p>
            <p className="mt-4 text-[33px] font-black leading-tight">
              GovTech, Smart City e Transformação Digital Pública em um produto acessível.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              "O Digiurban transforma processos públicos fragmentados em fluxos digitais rastreáveis."
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideMercado() {
  return (
    <SlideShell eyebrow="Slide 6 - Mercado" title="A transformação digital ainda não chegou de forma acessível para milhares de municípios.">
      <div className="grid flex-1 grid-cols-3 gap-6">
        <MetricCard value="+5.500" label="municípios no Brasil com realidades administrativas muito diferentes." icon={Building2} />
        <MetricCard value="Pequenos" label="e médios municípios sofrem mais com orçamento, equipe e ferramentas limitadas." icon={Users} />
        <MetricCard value="SaaS" label="permite implantação replicável, suporte centralizado e evolução contínua." icon={Rocket} />
      </div>
      <div className="mt-9 grid grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="rounded-xl bg-[#193642] p-7 text-white">
          <p className="text-sm font-bold uppercase text-[#0fffbf]">Tese de mercado</p>
          <p className="mt-4 text-2xl font-black leading-tight">
            Municípios precisam digitalizar, mas nem sempre conseguem contratar soluções complexas e caras.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-7">
          <p className="text-[26px] font-black leading-tight text-[#193642]">
            "O Digiurban foi pensado para ser acessível e escalável para municípios de pequeno e médio porte."
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideModeloNegocio() {
  const revenue = [
    'Mensalidade por prefeitura',
    'Implantação e configuração inicial',
    'Módulos extras por necessidade',
    'White-label futuro para parceiros regionais',
  ];

  return (
    <SlideShell eyebrow="Slide 7 - Modelo de negócio" title="Modelo SaaS mensal, simples de entender e escalável por município.">
      <div className="grid flex-1 grid-cols-[0.85fr_1.15fr] gap-10">
        <div className="rounded-xl bg-[#0f6fbe] p-8 text-white">
          <CoinsIcon />
          <p className="mt-8 text-4xl font-black">Receita recorrente</p>
          <p className="mt-5 text-xl leading-relaxed text-white/80">
            O produto cresce com a adoção por prefeitura, módulos contratados e expansão regional.
          </p>
        </div>
        <div className="flex flex-col justify-center">
          <ul className="space-y-5">
            {revenue.map((item) => (
              <li key={item} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <ArrowRight className="h-5 w-5 text-[#0f6fbe]" />
                <span className="text-2xl font-black text-[#193642]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}

function CoinsIcon() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/15">
      <TrendingUp className="h-10 w-10 text-[#0fffbf]" />
    </div>
  );
}

function SlideEstagio() {
  const points = [
    'MVP funcional',
    'Estrutura operacional inicial',
    'Desenvolvimento próprio',
    'Conhecimento real do problema público',
    'Validação conceitual',
  ];

  return (
    <SlideShell eyebrow="Slide 8 - Estágio atual" title="O Digiurban já ultrapassou a fase de ideia.">
      <div className="grid flex-1 grid-cols-[1fr_0.95fr] gap-10">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
          <p className="mb-6 text-sm font-bold uppercase text-[#0f6fbe]">Hoje o Digiurban possui</p>
          <ul className="space-y-4">
            {points.map((item) => (
              <Bullet key={item} tone="mint">{item}</Bullet>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-[#193642] p-9 text-white">
          <Lightbulb className="mb-6 h-10 w-10 text-[#0fffbf]" />
          <p className="text-[33px] font-black leading-tight">
            "O principal desafio atual não é tecnológico, mas sim estrutural e comercial."
          </p>
          <p className="mt-6 text-lg leading-relaxed text-white/65">
            A incubadora entra exatamente no ponto de transformar produto funcional em operação validada, vendável e escalável.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideIncubadora() {
  const goals = [
    'Estruturação comercial',
    'Mentorias',
    'Networking',
    'Validação de mercado',
    'Apoio estratégico',
    'Acesso a editais',
    'Expansão regional',
  ];

  return (
    <SlideShell eyebrow="Slide 9 - O que buscamos" title="A incubação é o próximo passo para transformar MVP em negócio GovTech.">
      <div className="grid flex-1 grid-cols-[0.9fr_1.1fr] gap-10">
        <div className="flex flex-col justify-center">
          <Target className="mb-6 h-12 w-12 text-[#0f6fbe]" />
          <p className="text-[31px] font-black leading-tight text-[#193642]">
            Não buscamos apenas entrar em um programa. Buscamos estrutura para vender, validar e expandir.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Handshake className="mb-4 h-6 w-6 text-[#0f6fbe]" />
              <p className="text-xl font-black text-[#193642]">{goal}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function SlideFechamento() {
  return (
    <SlideShell eyebrow="Slide 10 - Encerramento" title="Tecnologia acessível para aproximar cidadãos e gestão pública." dark>
      <div className="flex flex-1 items-center">
        <div className="grid w-full grid-cols-[1fr_0.85fr] gap-10">
          <div>
            <p className="text-[34px] font-black leading-tight text-white">
              "O Digiurban busca transformar a relação entre cidadãos e gestão pública, levando tecnologia acessível, rastreabilidade e eficiência para municípios brasileiros."
            </p>
            <p className="mt-8 border-l-4 border-[#0fffbf] pl-6 text-2xl font-semibold leading-snug text-white/75">
              Nosso objetivo é tornar a transformação digital pública acessível também para cidades pequenas e médias.
            </p>
          </div>
          <div className="rounded-xl bg-white p-8 text-[#193642]">
            <p className="text-sm font-bold uppercase text-[#0f6fbe]">Posicionamento do fundador</p>
            <p className="mt-5 text-4xl font-black leading-tight">Você não é alguém que fez um sistema.</p>
            <p className="mt-6 text-2xl font-black text-[#0f6fbe]">Você é fundador de uma GovTech.</p>
            <div className="mt-8 flex items-center gap-3 rounded-lg bg-[#193642] p-4 text-white">
              <Rocket className="h-6 w-6 text-[#0fffbf]" />
              <span className="font-bold">Clareza, execução e visão de mercado.</span>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

const SLIDES: SlideDefinition[] = [
  { id: 'abertura', title: 'Abertura', component: SlideAbertura },
  { id: 'problema', title: 'Problema', component: SlideProblema },
  { id: 'solucao', title: 'Solução', component: SlideSolucao },
  { id: 'demo', title: 'Demo', component: SlideDemo },
  { id: 'diferencial', title: 'Diferencial', component: SlideDiferencial },
  { id: 'mercado', title: 'Mercado', component: SlideMercado },
  { id: 'modelo', title: 'Modelo', component: SlideModeloNegocio },
  { id: 'estagio', title: 'Estágio', component: SlideEstagio },
  { id: 'incubadora', title: 'Incubadora', component: SlideIncubadora },
  { id: 'fechamento', title: 'Fechamento', component: SlideFechamento },
];

export default function ApresentacaoPitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMode, setExportMode] = useState(false);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
  }, []);

  useEffect(() => {
    setExportMode(new URLSearchParams(window.location.search).get('export') === '1');
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/apresentacao/export-pdf?deck=pitch`);

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DigiUrban_Pitch_Incubadora.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar apresentação em PDF. Verifique se o servidor está rodando.');
    } finally {
      setExporting(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'f' || event.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, toggleFullscreen]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const SlideComponent = SLIDES[currentSlide].component;

  if (exportMode) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-white">
        <div
          className="relative h-screen w-screen overflow-hidden bg-white shadow-2xl"
          data-slide-frame="true"
          data-slide-count={SLIDES.length}
        >
          <SlideComponent />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-[#0f1117] ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
      {!isFullscreen && (
        <div className="mb-4 flex w-full max-w-[1280px] items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <Home className="h-4 w-4" />
            <span>Voltar ao site</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/apresentacao" className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              Apresentação comercial
            </Link>
            <span className="text-sm text-white/40">{currentSlide + 1} / {SLIDES.length}</span>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg bg-[#0fffbf]/10 px-3 py-1.5 text-sm font-medium text-[#0fffbf] transition-colors hover:bg-[#0fffbf]/20 disabled:cursor-wait disabled:opacity-50"
              title="Baixar PDF"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Gerando...' : 'Baixar PDF'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Tela cheia (F)"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`relative overflow-hidden bg-white shadow-2xl ${isFullscreen ? 'h-screen w-screen' : 'aspect-video w-full max-w-[1280px] rounded-xl'}`}
        data-slide-frame="true"
        data-slide-count={SLIDES.length}
      >
        <SlideComponent />
      </div>

      <div className={`flex items-center gap-4 ${isFullscreen ? 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2' : 'mt-4'}`}>
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="rounded-xl bg-white/10 p-3 text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${isFullscreen ? 'bg-black/40 backdrop-blur-sm' : 'bg-white/5'}`}>
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all ${index === currentSlide ? 'h-2 w-8 bg-[#0fffbf]' : 'h-2 w-2 bg-white/20 hover:bg-white/40'}`}
              title={slide.title}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentSlide === SLIDES.length - 1}
          className="rounded-xl bg-white/10 p-3 text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed right-4 top-4 z-50 rounded-lg bg-black/30 p-2 text-white/60 backdrop-blur-sm transition-colors hover:text-white"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      )}

      {!isFullscreen && (
        <p className="mt-4 text-xs text-white/20">
          Setas para navegar · Espaço para avançar · F para tela cheia
        </p>
      )}
    </div>
  );
}
