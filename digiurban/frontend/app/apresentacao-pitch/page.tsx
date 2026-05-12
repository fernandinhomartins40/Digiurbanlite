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
  Globe,
  Handshake,
  Home,
  Layers,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
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
  Zap,
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
      <div className="relative z-10 flex h-full w-full flex-col px-14 py-9">
        <div className="mb-4 flex items-center gap-3">
          <span className={`h-1.5 w-16 rounded-full ${dark ? 'bg-[#0fffbf]' : 'bg-[#0f6fbe]'}`} />
          <p className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-white/55' : 'text-slate-400'}`}>{eyebrow}</p>
        </div>
        <h2 className={`mb-5 max-w-5xl text-[38px] font-black leading-[1.05] ${dark ? 'text-white' : 'text-[#193642]'}`}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function BigStat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-5xl font-black text-[#0f6fbe]">{value}</p>
      <p className="mt-2 text-base font-bold text-[#193642]">{label}</p>
      {sub && <p className="mt-1 text-sm leading-snug text-slate-400">{sub}</p>}
    </div>
  );
}

function Bullet({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'mint' | 'red' }) {
  const color = tone === 'red' ? 'text-red-500' : tone === 'mint' ? 'text-emerald-500' : 'text-[#0f6fbe]';
  return (
    <li className="flex items-start gap-3 text-[17px] leading-relaxed text-slate-600">
      <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <span>{children}</span>
    </li>
  );
}

// ─── SLIDE 1 ─── Abertura
function SlideAbertura() {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-white">
      <div className="flex flex-1 flex-col justify-center px-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#193642]">
            <Building2 className="h-6 w-6 text-[#0fffbf]" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400">GovTech · Brasil · 2026</span>
        </div>

        <h1 className="text-[80px] font-black leading-none text-[#193642]">
          Digi<span className="text-[#0f6fbe]">urban</span>
        </h1>

        <p className="mt-4 text-[28px] font-semibold text-[#193642]/80">
          Plataforma de gestão pública municipal
        </p>

        <div className="mt-9 max-w-2xl border-l-4 border-[#0fffbf] pl-6">
          <p className="text-[22px] font-medium leading-snug text-slate-600">
            Digitalizamos o atendimento, os protocolos e a gestão de demandas de prefeituras brasileiras — de ponta a ponta.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-6">
          <div className="rounded-lg bg-[#193642] px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0fffbf]">MVP funcional</p>
            <p className="mt-0.5 text-lg font-black text-white">Produto construído</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Objetivo</p>
            <p className="mt-0.5 text-lg font-black text-[#193642]">Validação e incubação</p>
          </div>
        </div>
      </div>

      <div className="relative flex w-[36%] items-center justify-center bg-[#193642]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative w-[320px] rounded-2xl border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#0fffbf]">Como funciona</p>
          <div className="space-y-4">
            {[
              { n: '1', label: 'Cidadão abre solicitação', sub: 'pelo celular ou computador' },
              { n: '2', label: 'Servidor acompanha', sub: 'com histórico e prazos' },
              { n: '3', label: 'Gestor decide', sub: 'com dados e indicadores' },
            ].map(({ n, label, sub }) => (
              <div key={n} className="flex items-start gap-3 rounded-xl bg-white/8 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0fffbf] text-sm font-black text-[#193642]">{n}</span>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-white/50">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 2 ─── Problema
function SlideProblema() {
  const dores = [
    { icon: FileText, text: 'Demandas registradas no WhatsApp e em papel' },
    { icon: Network, text: 'Setores desconectados, sem histórico unificado' },
    { icon: AlertTriangle, text: 'Cidadão sem visibilidade do andamento' },
    { icon: BarChart3, text: 'Gestores sem dados para tomar decisões' },
    { icon: Layers, text: 'Retrabalho por falta de padronização' },
    { icon: Zap, text: 'Prazos não rastreados, SLAs invisíveis' },
  ];

  return (
    <SlideShell eyebrow="O problema" title="A gestão de demandas públicas ainda é manual, lenta e invisível.">
      <div className="grid flex-1 grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="grid grid-cols-2 gap-4">
          {dores.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/70 p-5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-[15px] font-semibold leading-snug text-slate-700">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex-1 rounded-xl bg-[#193642] p-7 text-white">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#0fffbf]">A realidade hoje</p>
            <p className="text-[26px] font-black leading-snug">
              "Prefeituras usam WhatsApp, planilhas e papel para gerenciar demandas de milhares de cidadãos."
            </p>
            <p className="mt-5 border-t border-white/10 pt-5 text-base leading-relaxed text-white/65">
              O custo disso são demandas perdidas, cidadãos insatisfeitos e gestores às cegas.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Impacto direto</p>
            <p className="mt-3 text-xl font-black leading-snug text-[#193642]">
              Ineficiência operacional que prejudica a imagem da gestão e a confiança do cidadão.
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 3 ─── Solução
function SlideSolucao() {
  const modulos = [
    { icon: FileText, title: 'Protocolos digitais', desc: 'Abertura, triagem, histórico e SLA em um único fluxo rastreável.' },
    { icon: Smartphone, title: 'Portal do cidadão', desc: 'Solicitações e acompanhamento em tempo real pelo celular.' },
    { icon: Workflow, title: 'Gestão por setor', desc: 'Cada demanda roteia automaticamente para a área responsável.' },
    { icon: BarChart3, title: 'Painel de indicadores', desc: 'Volume, prazos, desempenho e gargalos em tempo real.' },
    { icon: Sparkles, title: 'Bot de atendimento', desc: 'Triagem automática e respostas inteligentes 24h.' },
    { icon: ShieldCheck, title: 'Assinatura digital', desc: 'Documentos oficiais assinados digitalmente com validade jurídica.' },
  ];

  return (
    <SlideShell eyebrow="A solução" title="Uma plataforma que conecta cidadão, servidor e gestor no mesmo fluxo digital.">
      <div className="grid flex-1 grid-cols-3 gap-4">
        {modulos.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#193642]">
              <Icon className="h-5 w-5 text-[#0fffbf]" />
            </div>
            <h3 className="mb-1.5 text-[17px] font-black text-[#193642]">{title}</h3>
            <p className="text-[14px] leading-relaxed text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-[#0f6fbe] px-7 py-4">
        <p className="text-lg font-bold text-white">
          Resultado: menos improviso, mais controle — e o cidadão acompanha tudo em tempo real.
        </p>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 4 ─── Produto / Demo
function SlideDemo() {
  return (
    <SlideShell eyebrow="O produto" title="MVP completo: do cadastro do cidadão ao painel do gestor.">
      <div className="grid flex-1 grid-cols-[1fr_1fr] gap-10">
        <div className="flex flex-col gap-4">
          {[
            { n: '1', title: 'Cidadão acessa o portal', desc: 'Cria conta, abre solicitação e anexa documentos pelo celular.' },
            { n: '2', title: 'Protocolo gerado automaticamente', desc: 'Número único, setor responsável e prazo definidos na abertura.' },
            { n: '3', title: 'Servidor atende com histórico', desc: 'Muda status, responde ao cidadão e registra todo andamento.' },
            { n: '4', title: 'Gestor monitora o painel', desc: 'SLA, volume por setor, demandas atrasadas e evolução mensal.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#193642] text-sm font-black text-[#0fffbf]">{n}</span>
              <div>
                <p className="font-black text-[#193642]">{title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#193642] p-6 text-white">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-bold text-white/60">Painel — visão do gestor</p>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Ao vivo
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { v: '43', l: 'Protocolos abertos' },
              { v: '8', l: 'Setores ativos' },
              { v: '91%', l: 'Dentro do prazo' },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-lg bg-white/10 p-4 text-center">
                <p className="text-3xl font-black text-[#0fffbf]">{v}</p>
                <p className="mt-1 text-xs font-medium text-white/60">{l}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {[
              { label: 'Iluminação pública', pct: '75%', status: 'Em andamento', color: 'bg-[#0f6fbe]' },
              { label: 'Poda de árvore', pct: '40%', status: 'Aguardando', color: 'bg-amber-400' },
              { label: 'Alvará comercial', pct: '100%', status: 'Concluído', color: 'bg-emerald-400' },
            ].map(({ label, pct, status, color }) => (
              <div key={label} className="rounded-lg bg-white/8 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{label}</span>
                  <span className="text-xs text-white/50">{status}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${color}`} style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#0fffbf]/20 bg-[#0fffbf]/8 p-3">
            <Play className="h-4 w-4 text-[#0fffbf]" />
            <p className="text-xs font-semibold text-white/80">Demonstração ao vivo disponível</p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 5 ─── Diferenciais
function SlideDiferencial() {
  return (
    <SlideShell eyebrow="Por que o Digiurban" title="Não é mais um sistema de protocolo. É uma plataforma GovTech completa." dark>
      <div className="grid flex-1 grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Rocket, title: 'Multi-prefeitura', desc: 'Uma instância serve várias prefeituras. Escala sem multiplicar custo.' },
            { icon: Smartphone, title: 'Mobile-first', desc: 'Portal do cidadão pensado para funcionar bem em qualquer celular.' },
            { icon: Sparkles, title: 'IA integrada', desc: 'Bot de triagem automática e sugestões para o servidor.' },
            { icon: BarChart3, title: 'Dados em tempo real', desc: 'Dashboards por setor, por gestor e por período.' },
            { icon: ShieldCheck, title: 'Assinatura digital', desc: 'Documentos com validade jurídica, sem papel.' },
            { icon: Workflow, title: 'Fluxos configuráveis', desc: 'Editor visual de fluxos sem necessidade de código.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/7 p-5">
              <Icon className="mb-3 h-6 w-6 text-[#0fffbf]" />
              <p className="text-base font-black text-white">{title}</p>
              <p className="mt-1 text-xs leading-snug text-white/55">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex-1 rounded-xl bg-white p-7 text-[#193642]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0f6fbe]">Posicionamento</p>
            <p className="mt-4 text-[28px] font-black leading-tight">
              GovTech acessível para municípios que precisam digitalizar sem contratar gigantes de TI.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/7 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Versus concorrentes</p>
            <p className="mt-3 text-lg font-black leading-snug text-white">
              Soluções tradicionais custam R$ 80–300k/ano e exigem infraestrutura própria. O Digiurban é SaaS, implantação em dias.
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 6 ─── Mercado
function SlideMercado() {
  return (
    <SlideShell eyebrow="Mercado" title="Mais de 5.500 municípios precisam digitalizar. A maioria ainda não tem como.">
      <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <BigStat value="5.570" label="municípios no Brasil" sub="91% com menos de 100 mil habitantes — sem TI robusta" />
        <BigStat value="R$ 2,4bi" label="mercado GovTech estimado" sub="Crescimento de 18% ao ano no segmento municipal" />
        <BigStat value="~3.900" label="municípios sem solução digital" sub="Público-alvo direto do Digiurban" />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <div className="rounded-xl bg-[#193642] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0fffbf]">Nossa tese</p>
          <p className="mt-3 text-xl font-black leading-snug">
            Municípios pequenos e médios têm a dor, a verba de modernização e a pressão política — mas não têm a solução certa.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estratégia de entrada</p>
          <ul className="mt-3 space-y-2">
            {[
              'Municípios de 10–100 mil habitantes',
              'Expansão via indicação entre prefeitos',
              'Parcerias com associações de municípios (AMUNIs)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-semibold text-[#193642]">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0f6fbe]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 7 ─── Modelo de Negócio
function SlideModeloNegocio() {
  return (
    <SlideShell eyebrow="Modelo de negócio" title="SaaS por assinatura — receita recorrente, previsível e escalável.">
      <div className="grid flex-1 grid-cols-[1fr_1.1fr] gap-10">
        <div className="flex flex-col gap-4">
          {[
            { tier: 'Básico', price: 'R$ 1.200/mês', features: 'Protocolos, portal do cidadão, 1 admin' },
            { tier: 'Profissional', price: 'R$ 2.500/mês', features: 'Todos os módulos, bot, assinatura digital' },
            { tier: 'Enterprise', price: 'Sob consulta', features: 'Multi-secretaria, white-label, SLA dedicado' },
          ].map(({ tier, price, features }) => (
            <div key={tier} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-[#193642]">{tier}</p>
                <p className="text-xl font-black text-[#0f6fbe]">{price}</p>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{features}</p>
            </div>
          ))}

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Receitas adicionais</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Implantação', 'Treinamento', 'Módulos extras', 'White-label'].map((item) => (
                <span key={item} className="rounded-full bg-[#193642] px-3 py-1 text-xs font-bold text-white">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-[#193642] p-6 text-white">
            <TrendingUp className="mb-3 h-8 w-8 text-[#0fffbf]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#0fffbf]">Projeção — 12 meses pós-lançamento</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { v: '15', l: 'prefeituras contratantes' },
                { v: 'R$ 37k', l: 'MRR (receita mensal)' },
                { v: 'R$ 450k', l: 'ARR projetado' },
                { v: '< 6 meses', l: 'payback estimado' },
              ].map(({ v, l }) => (
                <div key={l} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xl font-black text-[#0fffbf]">{v}</p>
                  <p className="mt-0.5 text-xs text-white/60">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Custo de aquisição</p>
            <p className="mt-2 text-lg font-black text-[#193642]">Ciclo de venda B2G estimado em 30–90 dias por prefeitura.</p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 8 ─── Estágio atual
function SlideEstagio() {
  return (
    <SlideShell eyebrow="Estágio atual" title="MVP completo construído. Próximo passo: primeira prefeitura contratante.">
      <div className="grid flex-1 grid-cols-[1fr_1fr] gap-10">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#0f6fbe]">O que já está pronto</p>
            <ul className="space-y-3">
              {[
                'Portal do cidadão com abertura de solicitações',
                'Painel administrativo com 21 secretarias configuradas',
                'Sistema de protocolos com SLA e histórico completo',
                'Bot de atendimento com fluxos configuráveis',
                'Assinatura digital de documentos',
                'Módulos de saúde, educação, obras e mais',
                'App PWA — funciona como app no celular',
              ].map((item) => (
                <Bullet key={item} tone="mint">{item}</Bullet>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-[#193642] p-6 text-white">
            <Lightbulb className="mb-3 h-8 w-8 text-[#0fffbf]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#0fffbf]">O que falta para vender</p>
            <ul className="mt-4 space-y-3">
              {[
                'Estrutura comercial e processos de venda',
                'Contrato e compliance para setor público',
                'Primeiro case real para validação',
                'Equipe de suporte para implantação',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-base text-white/80">
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#0fffbf]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Ponto de partida real</p>
            <p className="mt-2 text-lg font-black leading-snug text-[#193642]">
              O produto existe. O problema existe. A incubação vai acelerar a chegada ao primeiro cliente.
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 9 ─── Equipe
function SlideEquipe() {
  return (
    <SlideShell eyebrow="Quem está por trás" title="Fundado por quem entende tecnologia e o problema público de perto.">
      <div className="grid flex-1 grid-cols-[1fr_1fr] gap-10">
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#193642] text-2xl font-black text-[#0fffbf]">LF</div>
              <div>
                <p className="text-xl font-black text-[#193642]">Luiz Fernando</p>
                <p className="text-sm font-semibold text-[#0f6fbe]">Fundador & Desenvolvedor</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                'Desenvolveu 100% do MVP (frontend, backend, infra)',
                'Experiência com sistemas de gestão pública',
                'Arquitetura moderna: Next.js, Node.js, PostgreSQL',
                'Deploy em produção com Docker e CI/CD',
              ].map((item) => (
                <Bullet key={item} tone="blue">{item}</Bullet>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Stack tecnológico</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Next.js 14', 'Node.js', 'PostgreSQL', 'Redis', 'Socket.IO', 'Docker', 'IA / llama.cpp'].map((t) => (
                <span key={t} className="rounded-full bg-[#193642] px-3 py-1 text-xs font-bold text-white">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-[#193642] p-6 text-white">
            <Target className="mb-3 h-8 w-8 text-[#0fffbf]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#0fffbf]">O que buscamos na incubadora</p>
            <ul className="mt-4 space-y-3">
              {[
                'Mentorias em vendas para setor público (B2G)',
                'Acesso a redes de prefeitos e gestores',
                'Estruturação jurídica e comercial',
                'Apoio para captação e editais de inovação',
                'Primeiro piloto real com uma prefeitura parceira',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-base text-white/80">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0fffbf]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#0f6fbe]/20 bg-[#0f6fbe]/5 p-5">
            <p className="text-sm font-bold text-[#193642]">
              Buscamos um parceiro para transformar um produto funcional em um negócio GovTech sustentável.
            </p>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// ─── SLIDE 10 ─── Fechamento
function SlideFechamento() {
  return (
    <SlideShell eyebrow="Digiurban" title="Gestão pública digital, acessível para todo município brasileiro." dark>
      <div className="flex flex-1 items-start">
        <div className="grid w-full grid-cols-[1fr_0.85fr] gap-8">
          <div className="flex flex-col gap-5">
            <p className="text-[26px] font-black leading-snug text-white">
              "Enquanto grandes cidades digitalizam, milhares de municípios ainda gerenciam demandas no WhatsApp. O Digiurban resolve isso."
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { v: 'Produto', l: 'MVP funcional pronto' },
                { v: 'Mercado', l: '+5.500 municípios' },
                { v: 'Modelo', l: 'SaaS recorrente' },
              ].map(({ v, l }) => (
                <div key={v} className="rounded-xl bg-white/10 p-5 text-center">
                  <p className="text-xl font-black text-[#0fffbf]">{v}</p>
                  <p className="mt-1 text-xs text-white/55">{l}</p>
                </div>
              ))}
            </div>

            <p className="border-l-4 border-[#0fffbf] pl-5 text-xl font-semibold text-white/75">
              Produto construído. Problema real. Modelo replicável. Falta dar escala.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 text-[#193642]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0f6fbe]">Próximos passos</p>
            <ul className="mt-3 space-y-2.5">
              {[
                'Piloto com 1ª prefeitura parceira',
                'Estruturação comercial e jurídica',
                'Time de vendas B2G',
                '15 prefeituras em 12 meses',
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#193642] text-xs font-black text-[#0fffbf]">{i + 1}</span>
                  <span className="text-base font-semibold text-[#193642]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contato</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#193642]">
                <Mail className="h-4 w-4 text-[#0f6fbe]" />
                charlesochile123@gmail.com
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#193642]">
                <Globe className="h-4 w-4 text-[#0f6fbe]" />
                digiurban.com.br
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#193642] p-3">
              <Rocket className="h-5 w-5 text-[#0fffbf]" />
              <span className="text-sm font-bold text-white">Obrigado. Perguntas?</span>
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
  { id: 'demo', title: 'Produto', component: SlideDemo },
  { id: 'diferencial', title: 'Diferenciais', component: SlideDiferencial },
  { id: 'mercado', title: 'Mercado', component: SlideMercado },
  { id: 'modelo', title: 'Modelo', component: SlideModeloNegocio },
  { id: 'estagio', title: 'Estágio', component: SlideEstagio },
  { id: 'equipe', title: 'Equipe', component: SlideEquipe },
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

      if (!response.ok) throw new Error('Erro ao gerar PDF');

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
