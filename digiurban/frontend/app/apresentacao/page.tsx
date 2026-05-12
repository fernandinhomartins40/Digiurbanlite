'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Maximize2,
  Minimize2,
  Building2,
  Smartphone,
  HeartPulse,
  BarChart3,
  ListChecks,
  UserRound,
  Building,
  Users,
  Bot,
  ClipboardList,
  FileSignature,
  FileText,
  Bell,
  Workflow,
  Shield,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Upload,
  Send,
  Eye,
  EyeOff,
  ArrowRight,
  Stethoscope,
  Pill,
  Ambulance,
  Wheat,
  Monitor,
  Mail,
  Fingerprint,
  Play,
  AlertTriangle,
  Zap,
  ThumbsUp,
  PieChart,
  PersonStanding,
  Settings,
  Cloud,
  UserCog,
  QrCode,
  Camera,
  Search,
  HelpCircle,
  UsersRound,
  UserPen,
  FileCheck,
  HardHat,
  Gauge,
  Inbox,
  ListChecks as ListChecksIcon,
  MapPinned,
  Filter,
  Map,
  ImageIcon,
  Wand2,
  Share2,
  Plus,
  GraduationCap,
  HandHeart,
  Trees,
  ShieldAlert,
  TrafficCone,
  Palette,
  Dumbbell,
  Home as HomeIcon,
  Coins,
  MapPin as MapPinIcon,
  ShieldCheck,
  ArrowDown,
  Syringe,
  FileHeart,
  Bus,
  PenTool,
  LineChart,
  BellRing,
  ClipboardCheck,
  GitBranch,
  Repeat,
  Timer,
  CalendarCheck,
  Network,
  Layers,
  ShieldHalf,
  CloudUpload,
  KeyRound,
  Lock,
  ShieldEllipsis,
  CheckCheck,
  Container,
  WifiOff,
  Gift,
  Rocket,
  GraduationCap as GradCapIcon,
  Headphones,
  RefreshCw,
  ServerIcon,
  Smile,
  Gavel,
  Scale,
  Laptop,
  SendHorizonal,
  Download,
  Loader2,
} from 'lucide-react';

// ============================================================================
// SLIDE COMPONENTS
// ============================================================================

function SlideCapa() {
  return (
    <div className="w-full h-full flex relative overflow-hidden bg-white">
      {/* Right dark panel */}
      <div className="absolute top-0 right-0 w-[38%] h-full bg-gradient-to-b from-[#193642] via-[#0d2a34] to-[#0a1f28]">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0f6fbe] via-[#0fffbf] to-[#a7dbc9]" />
        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-40px] w-[300px] h-[300px] rounded-full border border-[#0fffbf]/10" />
        <div className="absolute bottom-[60px] right-[60px] w-[200px] h-[200px] rounded-full border border-[#0fffbf]/10" />
        <div className="absolute top-[200px] right-[200px] w-[120px] h-[120px] rounded-full border border-[#0f6fbe]/15" />
        {/* Dot grid */}
        <div className="absolute bottom-10 right-8 grid grid-cols-5 gap-2 opacity-20">
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className="w-1 h-1 bg-[#0fffbf] rounded-full" />
          ))}
        </div>
      </div>

      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col justify-center pl-14 pr-8 z-10">
        {/* Brand mark */}
        <div className="flex items-center mb-10">
          <div className="w-11 h-11 bg-[#193642] rounded-[10px] flex items-center justify-center mr-3.5">
            <Building2 className="w-5 h-5 text-[#0fffbf]" />
          </div>
          <span className="text-[13px] font-bold text-slate-400 tracking-[3px] uppercase">Plataforma Gov.Tech</span>
        </div>

        {/* Title */}
        <h1 className="text-[72px] font-black text-[#193642] leading-none tracking-tight mb-1.5">
          Digi<span className="text-[#0f6fbe]">Urban</span>
        </h1>

        {/* Subtitle */}
        <div className="mb-8">
          <h2 className="text-[26px] font-semibold text-[#193642]/85 tracking-tight">
            Gestão Pública Digital Integrada
          </h2>
          <div className="h-1 w-14 bg-gradient-to-r from-[#0f6fbe] to-[#0fffbf] mt-4 rounded-full" />
        </div>

        {/* Tagline */}
        <p className="text-[17px] text-slate-500 leading-relaxed max-w-[500px] mb-10">
          Conecta cidadãos, servidores e gestores em tempo real — do protocolo ao relatório, da solicitação à avaliação.
        </p>

        {/* Feature badges 2x2 */}
        <div className="grid grid-cols-2 gap-4 max-w-[480px] mb-10">
          {[
            { icon: Smartphone, title: 'PWA Mobile-first', desc: 'Acesso fácil para o cidadão', bg: 'bg-[#0f6fbe]/10', color: 'text-[#0f6fbe]' },
            { icon: HeartPulse, title: 'Saúde Integrada', desc: 'Prontuário, Farmácia e TFD', bg: 'bg-[#0fffbf]/10', color: 'text-emerald-600' },
            { icon: BarChart3, title: 'Dashboards Executivos', desc: 'KPIs e relatórios em tempo real', bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { icon: ListChecks, title: 'Workflows com SLA', desc: 'Controle total de prazos', bg: 'bg-orange-50', color: 'text-orange-600' },
          ].map(({ icon: Icon, title, desc, bg, color }) => (
            <div key={title} className="flex items-center gap-3">
              <div className={`w-[42px] h-[42px] rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#193642]">{title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-8 pt-5 border-t border-slate-200 max-w-[480px]">
          <span className="text-xs text-slate-400"><Building2 className="w-3 h-3 inline mr-1.5" />GovTech · SaaS</span>
          <span className="text-xs text-slate-400 font-semibold">MVP Funcional</span>
          <span className="text-xs text-slate-400">Brasil · 2026</span>
        </div>
      </div>

      {/* RIGHT CONTENT - Cards */}
      <div className="w-[38%] h-full z-10 relative flex items-center justify-center">
        {/* Card Gestor */}
        <div className="absolute top-[100px] right-9 w-[220px] bg-white rounded-[14px] shadow-xl p-[18px] border-l-4 border-[#0f6fbe]">
          <div className="flex items-center mb-3.5">
            <UserRound className="w-3.5 h-3.5 text-[#0f6fbe] mr-2" />
            <span className="font-bold text-[13px] text-[#193642]">Painel Gestor</span>
          </div>
          <div className="flex gap-1.5 mb-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded" />
            <div className="flex-[0.6] h-1.5 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="flex-1 h-7 bg-[#0f6fbe]/5 rounded-md" />
            <div className="flex-1 h-7 bg-[#0f6fbe]/5 rounded-md" />
            <div className="flex-1 h-7 bg-[#0f6fbe]/5 rounded-md" />
          </div>
        </div>

        {/* Card Prefeitura (center) */}
        <div className="w-[260px] bg-white rounded-[14px] shadow-xl p-6 border-t-4 border-[#0fffbf] z-20">
          <div className="flex justify-between items-center mb-[18px]">
            <div className="flex items-center gap-2">
              <Building className="w-[15px] h-[15px] text-[#0f6fbe]" />
              <span className="font-bold text-sm text-[#193642]">Prefeitura Digital</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#0fffbf] rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-[#0fffbf] bg-[#0fffbf]/10 px-2.5 py-0.5 rounded-full tracking-wide">ONLINE</span>
            </div>
          </div>
          <div className="flex justify-between text-center mb-[18px]">
            {[
              { n: '21', l: 'Secretarias' },
              { n: 'SaaS', l: 'Modelo' },
              { n: 'PWA', l: 'Mobile' },
            ].map(({ n, l }) => (
              <div key={l}>
                <p className="text-2xl font-extrabold text-[#193642]">{n}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{l}</p>
              </div>
            ))}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
            <div className="h-full w-[100%] bg-gradient-to-r from-[#0f6fbe] to-[#0fffbf] rounded-full" />
          </div>
          <p className="text-[10px] text-slate-400 text-right">MVP completo</p>
        </div>

        {/* Card Cidadao */}
        <div className="absolute bottom-[110px] left-6 w-[200px] bg-white rounded-[14px] shadow-xl p-4 border-b-4 border-[#0f6fbe]">
          <div className="flex items-center mb-3">
            <Users className="w-3.5 h-3.5 text-[#0f6fbe] mr-2" />
            <span className="font-bold text-[13px] text-[#193642]">Cidadão</span>
          </div>
          <div className="flex items-center bg-slate-50 p-2 rounded-[10px] mb-2.5 gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0f6fbe]/10 flex items-center justify-center shrink-0">
              <Bot className="w-[13px] h-[13px] text-[#0f6fbe]" />
            </div>
            <div className="flex-1">
              <div className="h-[5px] bg-slate-200 rounded w-4/5 mb-1.5" />
              <div className="h-[5px] bg-slate-200 rounded w-3/5" />
            </div>
          </div>
          <div className="w-full py-2 bg-[#0f6fbe] text-white text-xs font-bold text-center rounded-lg tracking-wide">
            + Nova Solicitação
          </div>
        </div>

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <line x1="140" y1="520" x2="160" y2="420" stroke="#0f6fbe" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.2" />
          <line x1="200" y1="310" x2="250" y2="230" stroke="#0f6fbe" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.2" />
        </svg>
      </div>
    </div>
  );
}

function SlideProblema() {
  const problems = [
    { icon: PersonStanding, title: 'Atendimento Presencial', desc: 'Cidadão precisa ir à prefeitura para solicitar serviços simples.' },
    { icon: FileText, title: 'Burocracia em Papel', desc: 'Servidor perde horas com planilhas e controle manual.' },
    { icon: EyeOff, title: 'Gestão sem Visão', desc: 'Prefeito sem acesso a dados reais do que acontece na cidade.' },
    { icon: Users, title: 'Silos Departamentais', desc: 'Secretarias não se comunicam de forma integrada.' },
    { icon: PieChart, title: 'Ausência de Métricas', desc: 'Sem controle de SLA, prazos ou satisfação do cidadão.' },
  ];

  const features = [
    { icon: Smartphone, title: '100% Digital', desc: 'Zero papel' },
    { icon: Zap, title: 'Tempo Real', desc: 'Dados ao vivo' },
    { icon: Eye, title: 'Transparência', desc: 'Controle total' },
    { icon: ThumbsUp, title: 'Satisfação', desc: 'Foco no cidadão' },
  ];

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* LEFT: O Desafio */}
      <div className="flex-1 flex flex-col justify-center pl-16 pr-12 bg-white">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-red-500 font-bold tracking-[3px] text-xs uppercase">O Desafio Atual</h3>
        </div>

        <h2 className="text-4xl font-black text-[#193642] mb-8 tracking-tight leading-tight">
          Gargalos da <br />Gestão Tradicional
        </h2>

        <div className="space-y-5">
          {problems.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <Icon className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-lg">{title}</p>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: A Solução */}
      <div className="w-1/2 h-full bg-gradient-to-br from-[#193642] via-[#193642] to-[#0d2a34] flex flex-col justify-center pl-12 pr-16 relative shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.3)]">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Decorative blur */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#0fffbf] rounded-full blur-3xl opacity-10" />

        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0fffbf]/20 flex items-center justify-center mr-3 border border-[#0fffbf]/50">
              <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
            </div>
            <h3 className="text-[#0fffbf] font-bold tracking-[3px] text-xs uppercase">A Solução DigiUrban</h3>
          </div>

          <h2 className="text-[44px] font-black text-white leading-tight mb-6 tracking-tight">
            Uma plataforma <br />
            <span className="text-[#0fffbf]">única e integrada.</span>
          </h2>

          <p className="text-xl text-blue-100/80 leading-relaxed border-l-4 border-[#0fffbf] pl-6 mb-10">
            Centralizamos em um só lugar tudo que hoje está espalhado em planilhas, WhatsApp e papel — com rastreabilidade, prazos e dados reais para o gestor decidir.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                <Icon className="w-5 h-5 text-[#0fffbf] shrink-0" />
                <div>
                  <p className="font-bold text-sm text-white">{title}</p>
                  <p className="text-xs text-blue-200/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlidePortais() {
  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="pt-12 px-16 pb-8">
        <div className="flex items-center mb-3">
          <div className="h-1.5 w-16 bg-[#0fffbf] mr-4 rounded-full" />
          <p className="text-xs font-bold tracking-[3px] text-slate-500 uppercase">Visão Geral</p>
        </div>
        <h2 className="text-4xl font-black text-[#193642] tracking-tight">Os 3 Portais Integrados</h2>
        <p className="text-xl text-slate-500 mt-2 font-light max-w-4xl">
          Uma única plataforma servindo três públicos distintos com interfaces otimizadas para cada necessidade.
        </p>
      </div>

      {/* 3 Cards */}
      <div className="flex-1 px-16 pb-8 grid grid-cols-3 gap-6">
        {/* Portal do Cidadão */}
        <div className="relative rounded-2xl bg-sky-50 border-t-[8px] border-[#0f6fbe] p-6 flex flex-col items-center shadow-lg overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-md">
            <Smartphone className="w-7 h-7 text-[#0f6fbe]" />
          </div>
          <h3 className="text-xl font-bold text-[#193642] mb-1">Portal do Cidadão</h3>
          <span className="inline-block px-3 py-1 bg-sky-200 text-sky-800 rounded-full text-xs font-bold mb-5 uppercase tracking-wide">
            Mobile-first / PWA
          </span>
          <ul className="text-left w-full space-y-3 text-slate-700">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Acesso 24/7 pelo celular, sem precisar instalar app (PWA).</p>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Solicita serviços, envia documentos e avalia o atendimento.</p>
            </li>
            <li className="flex items-start">
              <Bot className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2 font-semibold">Chatbot inteligente (DigiBot) que guia passo a passo.</p>
            </li>
          </ul>
          <Users className="absolute bottom-4 right-4 w-20 h-20 text-sky-200 opacity-10" />
        </div>

        {/* Painel Administrativo */}
        <div className="relative rounded-2xl bg-slate-50 border-t-[8px] border-[#193642] p-6 flex flex-col items-center shadow-lg overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-md">
            <UserCog className="w-7 h-7 text-[#193642]" />
          </div>
          <h3 className="text-xl font-bold text-[#193642] mb-1">Painel Administrativo</h3>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-5 uppercase tracking-wide">
            Desktop / Servidor
          </span>
          <ul className="text-left w-full space-y-3 text-slate-700">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Ambiente de trabalho diário dos servidores da prefeitura.</p>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Gerenciamento de protocolos, geração de documentos e relatórios.</p>
            </li>
            <li className="flex items-start">
              <Building className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Cada secretaria possui seu painel dedicado com métricas.</p>
            </li>
          </ul>
          <ClipboardList className="absolute bottom-4 right-4 w-20 h-20 text-blue-200 opacity-10" />
        </div>

        {/* Painel Super Admin */}
        <div className="relative rounded-2xl bg-[#1e293b] border-t-[8px] border-[#0fffbf] p-6 flex flex-col items-center shadow-xl overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4 border border-slate-600">
            <Settings className="w-7 h-7 text-[#0fffbf]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Painel Super Admin</h3>
          <span className="inline-block px-3 py-1 bg-teal-900 text-[#0fffbf] rounded-full text-xs font-bold mb-5 uppercase tracking-wide">
            Gestão da Plataforma
          </span>
          <ul className="text-left w-full space-y-3 text-slate-300">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0fffbf] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Para fornecedores gerenciarem múltiplos municípios.</p>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-[#0fffbf] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Controle de billing, planos e configurações globais.</p>
            </li>
            <li className="flex items-start">
              <Cloud className="w-4 h-4 text-[#0fffbf] mt-0.5 shrink-0" />
              <p className="text-sm ml-2">Modelo SaaS Multi-tenant (ambientes isolados).</p>
            </li>
          </ul>
          <Monitor className="absolute bottom-4 right-4 w-20 h-20 text-slate-600 opacity-20" />
        </div>
      </div>
    </div>
  );
}

function SlideJornadaCidadao() {
  const digibotFeatures = [
    { icon: Search, title: 'Consultar Protocolos', desc: 'Busca por número ou listagem' },
    { icon: UserPen, title: 'Atualizar Cadastro', desc: 'Dados, telefone e endereço' },
    { icon: FileCheck, title: 'Gerenciar Documentos', desc: 'Histórico de uploads e downloads' },
    { icon: UsersRound, title: 'Composição Familiar', desc: 'Vínculos para programas sociais' },
    { icon: HelpCircle, title: 'FAQ Interativo', desc: 'Tira-dúvidas automático' },
    { icon: Bell, title: 'Central de Avisos', desc: 'Visualizar notificações não lidas' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="px-12 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <span className="bg-blue-100 text-[#0f6fbe] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mr-3">Mobile-First</span>
              <h3 className="text-slate-500 text-xs uppercase tracking-[3px] font-bold">Jornada do Usuário</h3>
            </div>
            <h2 className="text-4xl font-black text-[#193642] tracking-tight">
              Jornada do Cidadão: <span className="text-[#0fffbf]">Exemplo Tapa-Buraco</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Cenário: Dona Maria precisa de reparo na rua</span>
          </div>
        </div>
      </div>

      {/* Timeline — 4 steps */}
      <div className="flex-1 px-12 py-6 relative">
        {/* Connecting line */}
        <div className="absolute top-[40px] left-[10%] right-[10%] h-1 bg-slate-200 z-0" />

        <div className="grid grid-cols-4 gap-6 h-full">
          {/* Step 1 — Cadastro */}
          <div className="pt-8 h-full">
            <div className="relative bg-white rounded-2xl shadow-lg border-b-4 border-[#0fffbf] p-6 flex flex-col items-center text-center h-full">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#193642] text-white flex items-center justify-center font-bold text-sm shadow-md border-4 border-white z-20">1</div>
              <QrCode className="w-8 h-8 text-[#0f6fbe] mb-4 mt-2" />
              <h3 className="text-lg font-bold text-[#193642] mb-2">Cadastro e Acesso</h3>
              <div className="text-left w-full space-y-2 mt-2">
                <div className="flex items-start">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 mr-2 shrink-0" />
                  <p className="text-xs text-slate-600">Acesso via Link ou QR Code da prefeitura</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 mr-2 shrink-0" />
                  <p className="text-xs text-slate-600">Cadastro simplificado (CPF, Nome, Tel)</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 mr-2 shrink-0" />
                  <p className="text-xs text-slate-600">Login automático, sem instalação (PWA)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 — Solicitar */}
          <div className="pt-8 h-full">
            <div className="relative bg-white rounded-2xl shadow-lg border-b-4 border-[#0fffbf] p-6 flex flex-col items-center text-center h-full">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#193642] text-white flex items-center justify-center font-bold text-sm shadow-md border-4 border-white z-20">2</div>
              <Bot className="w-8 h-8 text-[#0fffbf] mb-4 mt-2" />
              <h3 className="text-lg font-bold text-[#193642] mb-2">Solicitar Serviço</h3>
              {/* Mini chat mockup */}
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 mb-3">
                <div className="bg-sky-100 rounded-lg rounded-tl-none p-2 mb-1">
                  <p className="text-[10px] text-sky-700">Olá! Posso ajudar?</p>
                </div>
                <div className="bg-[#0fffbf]/20 rounded-lg rounded-tr-none p-2 ml-auto max-w-[80%]">
                  <p className="text-[10px] text-teal-800">Buraco na rua</p>
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <p className="text-xs text-slate-600 flex items-center gap-1"><Camera className="w-3 h-3 text-slate-400" /> Envio de foto</p>
                <p className="text-xs text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> Geolocalização automática</p>
                <div className="bg-slate-100 p-1.5 rounded border border-slate-200 mt-2 text-center">
                  <p className="text-[10px] font-mono text-slate-500 font-bold">PROT-2026-000123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 — Acompanhamento */}
          <div className="pt-8 h-full">
            <div className="relative bg-white rounded-2xl shadow-lg border-b-4 border-[#0fffbf] p-6 flex flex-col items-center text-center h-full">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#193642] text-white flex items-center justify-center font-bold text-sm shadow-md border-4 border-white z-20">3</div>
              <Bell className="w-8 h-8 text-orange-500 mb-4 mt-2" />
              <h3 className="text-lg font-bold text-[#193642] mb-2">Acompanhamento</h3>
              {/* Status mockup */}
              <div className="w-full bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500">Status Atual</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded font-medium">Em Execução</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-[#0f6fbe] h-1.5 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="text-left w-full space-y-2">
                <div className="flex items-start">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 mr-2 shrink-0" />
                  <p className="text-xs text-slate-600">Notificações Push em tempo real</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 mr-2 shrink-0" />
                  <p className="text-xs text-slate-600">Histórico de interações</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 — Conclusão */}
          <div className="pt-8 h-full">
            <div className="relative bg-white rounded-2xl shadow-lg border-b-4 border-[#0fffbf] p-6 flex flex-col items-center text-center h-full">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#193642] text-white flex items-center justify-center font-bold text-sm shadow-md border-4 border-white z-20">4</div>
              <Star className="w-8 h-8 text-yellow-400 mb-4 mt-2" />
              <h3 className="text-lg font-bold text-[#193642] mb-2">Conclusão</h3>
              <div className="text-center w-full mb-3">
                <p className="text-xs font-bold text-green-600 mb-1">Problema Resolvido!</p>
                <div className="flex justify-center text-yellow-400 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="text-left w-full border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-600 text-center italic">&ldquo;Avaliação alimenta indicadores de satisfação da gestão.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — DigiBot features */}
      <div className="bg-[#193642] text-white px-12 py-5 z-20">
        <div className="flex items-center mb-3">
          <MessageSquare className="w-5 h-5 text-[#0fffbf] mr-3" />
          <h3 className="font-bold text-lg">O que mais o DigiBot faz?</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          {digibotFeatures.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideJornadaServidor() {
  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="px-12 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mr-3">Painel Administrativo</span>
              <h3 className="text-slate-500 text-xs uppercase tracking-[3px] font-bold">Jornada do Servidor</h3>
            </div>
            <h2 className="text-4xl font-black text-[#193642] tracking-tight">
              Gestão Eficiente: <span className="text-[#0fffbf]">Departamento de Obras</span>
            </h2>
          </div>
          {/* Persona */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">João Silva</p>
              <p className="text-[10px] text-slate-500 uppercase">Coord. de Obras</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content split */}
      <div className="flex flex-1 px-12 pb-8 gap-8 min-h-0">
        {/* LEFT: Dashboard mockup */}
        <div className="w-7/12 h-full flex flex-col">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 h-full flex flex-col overflow-hidden">
            {/* Browser bar */}
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center">
              <div className="flex gap-1.5 mr-4">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="bg-white px-3 py-1 rounded text-[10px] text-slate-400 border border-slate-200 flex-1 text-center font-mono">
                admin.digiurban.gov.br/obras/dashboard
              </div>
            </div>

            {/* App interface */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-[50px] bg-[#1e293b] flex flex-col items-center pt-4 gap-4">
                <Gauge className="w-4 h-4 text-white bg-[#0fffbf]/30 rounded p-0.5" />
                <Inbox className="w-4 h-4 text-slate-400" />
                <ListChecks className="w-4 h-4 text-slate-400" />
                <MapPinned className="w-4 h-4 text-slate-400" />
                <div className="flex-1" />
                <Settings className="w-4 h-4 text-slate-400 mb-4" />
              </div>

              {/* Dashboard content */}
              <div className="flex-1 bg-slate-100 p-4 flex flex-col gap-3 min-h-0">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white rounded-md p-2 border border-slate-200">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Ativos</p>
                    <p className="text-lg font-bold text-[#193642]">142</p>
                    <p className="text-[8px] text-green-500">+12% vs ontem</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-slate-200 border-l-4 border-l-red-500">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">SLA Vencido</p>
                    <p className="text-lg font-bold text-red-600">8</p>
                    <p className="text-[8px] text-red-400">Ação imediata</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-slate-200">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Satisfação</p>
                    <div className="flex text-yellow-400 gap-0.5 my-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-400">4.8/5.0</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-slate-200">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Resolução</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 mb-0.5">
                      <div className="bg-[#0fffbf] h-1.5 rounded-full" style={{ width: '92%' }} />
                    </div>
                    <p className="text-[8px] text-[#0fffbf] font-bold">92%</p>
                  </div>
                </div>

                {/* Chart + List row */}
                <div className="flex gap-3 flex-1 min-h-0">
                  {/* Chart area (static mockup) */}
                  <div className="w-2/3 bg-white rounded-md border border-slate-200 p-3 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[10px] font-bold text-slate-700">Tendência de Solicitações (7 dias)</h4>
                      <span className="text-[9px] text-[#0f6fbe] font-medium">Ver Relatório</span>
                    </div>
                    {/* Static chart bars */}
                    <div className="flex-1 flex items-end gap-2 px-1">
                      {[12, 19, 15, 25, 22, 10, 8].map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-gradient-to-t from-[#0f6fbe] to-[#0fffbf] rounded-t-sm opacity-80"
                            style={{ height: `${(v / 25) * 100}%`, minHeight: '4px' }}
                          />
                          <span className="text-[8px] text-slate-400">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Protocol list */}
                  <div className="w-1/3 bg-white rounded-md border border-slate-200 flex flex-col overflow-hidden">
                    <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-700">Urgentes</h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                      <div className="px-2 py-1.5 border-l-2 border-l-red-500 bg-red-50">
                        <p className="text-[10px] font-bold text-slate-800">Buraco Av. Brasil</p>
                        <p className="text-[8px] text-slate-500">PROT-123 · Há 2h</p>
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] font-bold text-slate-800">Queda de Árvore</p>
                        <p className="text-[8px] text-slate-500">PROT-124 · Há 3h</p>
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] font-bold text-slate-800">Iluminação</p>
                        <p className="text-[8px] text-slate-500">PROT-125 · Há 4h</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAB */}
                <div className="self-end w-8 h-8 bg-[#193642] rounded-full shadow-lg flex items-center justify-center text-white shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Step-by-step narrative */}
        <div className="w-5/12 flex flex-col justify-between h-full py-2">
          {/* Step 1 */}
          <div className="relative flex gap-4">
            <div className="absolute top-8 left-[15px] bottom-[-16px] w-0.5 bg-slate-200 z-0" />
            <div className="w-8 h-8 rounded-full bg-[#193642] text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">1</div>
            <div>
              <h3 className="text-lg font-bold text-[#193642]">Dashboard de Controle</h3>
              <p className="text-sm text-slate-600 mb-2">Visão macro para tomada de decisão imediata.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">KPIs em Tempo Real</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">Alertas de SLA</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">Gráficos de Tendência</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex gap-4">
            <div className="absolute top-8 left-[15px] bottom-[-16px] w-0.5 bg-slate-200 z-0" />
            <div className="w-8 h-8 rounded-full bg-[#0fffbf] text-[#193642] flex items-center justify-center font-bold text-sm shrink-0 z-10">2</div>
            <div>
              <h3 className="text-lg font-bold text-[#193642]">Gerenciar Protocolos</h3>
              <p className="text-sm text-slate-600 mb-2">Filtros avançados para organizar a fila de trabalho.</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1"><Filter className="w-3 h-3 text-[#0fffbf]" /> Por Status/Prioridade</p>
                <p className="flex items-center gap-1"><Map className="w-3 h-3 text-[#0fffbf]" /> Visualização em Mapa</p>
                <p className="flex items-center gap-1"><ImageIcon className="w-3 h-3 text-[#0fffbf]" /> Galeria de Fotos</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex gap-4">
            <div className="absolute top-8 left-[15px] bottom-[-16px] w-0.5 bg-slate-200 z-0" />
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">3</div>
            <div>
              <h3 className="text-lg font-bold text-[#193642]">Execução do Serviço</h3>
              <p className="text-sm text-slate-600 mb-2">Workflow digital completo, sem papel.</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" /> Atribuição de responsável</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" /> Registro de pendências (ex: aguarda material)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" /> Conclusão com foto do &ldquo;Depois&rdquo;</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">4</div>
            <div>
              <h3 className="text-lg font-bold text-[#193642]">Funcionalidades Avançadas</h3>
              <div className="bg-slate-100 rounded-lg p-3 mt-1 border border-slate-200 space-y-2">
                <div className="flex items-start gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Atribuição Inteligente</p>
                    <p className="text-[10px] text-slate-500">Sistema sugere servidor com menor carga.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Share2 className="w-4 h-4 text-[#0f6fbe] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Encaminhamento</p>
                    <p className="text-[10px] text-slate-500">Transfere para outra secretaria com 1 clique.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideModulos() {
  const departments = [
    { icon: HardHat, name: 'Obras Públicas', bg: 'bg-orange-100', color: 'text-orange-600' },
    { icon: GraduationCap, name: 'Educação', bg: 'bg-blue-100', color: 'text-blue-600' },
    { icon: HandHeart, name: 'Assist. Social', bg: 'bg-pink-100', color: 'text-pink-600' },
    { icon: Trees, name: 'Meio Ambiente', bg: 'bg-green-100', color: 'text-green-600' },
    { icon: Wheat, name: 'Agricultura', bg: 'bg-yellow-100', color: 'text-yellow-600' },
    { icon: ShieldAlert, name: 'Defesa Civil', bg: 'bg-red-100', color: 'text-red-600' },
    { icon: TrafficCone, name: 'Mobilidade', bg: 'bg-indigo-100', color: 'text-indigo-600' },
    { icon: Palette, name: 'Cultura', bg: 'bg-purple-100', color: 'text-purple-600' },
    { icon: Dumbbell, name: 'Esportes', bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { icon: HomeIcon, name: 'Habitação', bg: 'bg-cyan-100', color: 'text-cyan-600' },
    { icon: Coins, name: 'Finanças', bg: 'bg-slate-200', color: 'text-slate-600' },
    { icon: MapPinIcon, name: 'Turismo', bg: 'bg-sky-100', color: 'text-sky-600' },
    { icon: ShieldCheck, name: 'Segurança', bg: 'bg-gray-200', color: 'text-gray-700' },
  ];

  const healthCards = [
    {
      icon: Stethoscope, title: 'Atendimento e-SUS', iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
      items: ['Acolhimento / Escuta Inicial', 'Classificação de Risco (Manchester)', 'Triagem de Enfermagem', 'Painel de Chamada (TV)'],
    },
    {
      icon: Pill, title: 'Farmácia Municipal', iconBg: 'bg-green-50', iconColor: 'text-green-600',
      items: ['Controle de estoque (Lote/Validade)', 'Dispensação integrada à receita', 'Transferência entre unidades', 'Alertas de estoque baixo'],
    },
    {
      icon: Bus, title: 'Gestão de TFD', iconBg: 'bg-orange-50', iconColor: 'text-orange-600',
      items: ['Tratamento Fora de Domicílio', 'Regulação de vagas e viagens', 'Lista de passageiros e frota', 'Prestação de contas e diárias'],
    },
    {
      icon: FileHeart, title: 'Prontuário Eletrônico', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
      items: ['Histórico completo do paciente', 'Alergias e Comorbidades', 'Emissão de Receitas e Atestados', 'Controle de Imunizações (Vacinas)'],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="px-12 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <span className="bg-blue-100 text-[#0f6fbe] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mr-3">Ecossistema Completo</span>
              <h3 className="text-slate-500 text-xs uppercase tracking-[3px] font-bold">Módulos Especializados</h3>
            </div>
            <h2 className="text-4xl font-black text-[#193642] tracking-tight">
              14 Secretarias <span className="text-[#0fffbf]">Pré-Configuradas</span>
            </h2>
          </div>
          <p className="text-sm text-slate-500 italic max-w-md text-right">
            &ldquo;Cada secretaria possui ambiente dedicado, serviços específicos e painéis de controle independentes.&rdquo;
          </p>
        </div>
      </div>

      {/* 14 Departments grid (5 cols) */}
      <div className="px-12 py-4">
        <div className="grid grid-cols-5 gap-2.5">
          {departments.map(({ icon: Icon, name, bg, color }) => (
            <div key={name} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 transition-colors">
              <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs font-bold text-slate-700">{name}</p>
            </div>
          ))}
          {/* Highlighted Health — spans 2 columns */}
          <div className="col-span-2 flex items-center gap-3 bg-[#0fffbf] border border-[#0fffbf] rounded-lg px-4 py-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-[#0fffbf]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#193642] uppercase tracking-wider">Destaque</p>
              <p className="text-sm font-bold text-[#193642]">Saúde Integrada</p>
            </div>
            <ArrowDown className="w-4 h-4 text-[#193642] opacity-50" />
          </div>
        </div>
      </div>

      {/* Health deep-dive section */}
      <div className="flex-1 px-12 pb-6">
        <div className="h-full rounded-2xl bg-teal-50 border border-teal-200 border-l-[6px] border-l-[#0fffbf] p-5 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-teal-200 rounded-full opacity-20 pointer-events-none" />
          <div className="absolute right-40 -top-20 w-60 h-60 bg-blue-100 rounded-full opacity-30 pointer-events-none" />

          {/* Section header */}
          <div className="flex items-center mb-5 relative z-10">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center mr-4 shadow-sm border border-teal-100">
              <Stethoscope className="w-6 h-6 text-[#0fffbf]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-teal-900">Diferencial Competitivo: Sistema de Saúde</h3>
              <p className="text-teal-700 text-sm">Integração completa com e-SUS e gestão hospitalar/UBS</p>
            </div>
          </div>

          {/* 4 Health cards */}
          <div className="grid grid-cols-4 gap-4 relative z-10">
            {healthCards.map(({ icon: Icon, title, iconBg, iconColor, items }) => (
              <div key={title} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-teal-200 transition-colors">
                <div className="flex items-center mb-3">
                  <div className={`${iconBg} p-2 rounded-lg mr-3`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item} className="flex items-start">
                      <CheckCircle2 className="w-3 h-3 text-[#0fffbf] mt-0.5 mr-2 shrink-0" />
                      <p className="text-xs text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideFuncionalidades() {
  const features = [
    {
      icon: FileSignature,
      badge: 'Documentos',
      title: 'Documentos & Assinatura Digital',
      color: 'border-[#0f6fbe]',
      badgeBg: 'bg-blue-100 text-[#0f6fbe]',
      iconBg: 'bg-[#0f6fbe]/10',
      iconColor: 'text-[#0f6fbe]',
      bgIcon: FileText,
      bgIconColor: 'text-blue-100',
      items: [
        'Templates WYSIWYG com variáveis dinâmicas',
        'Assinatura digital automática no PDF',
        'Geração em lote por secretaria',
        'Histórico versionado por protocolo',
      ],
    },
    {
      icon: LineChart,
      badge: 'Analytics',
      title: 'Relatórios & Dashboards',
      color: 'border-purple-500',
      badgeBg: 'bg-purple-100 text-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      bgIcon: PieChart,
      bgIconColor: 'text-purple-100',
      items: [
        '6 templates prontos (PDF e Excel)',
        'Dashboard executivo em tempo real',
        'KPIs e benchmarks por secretaria',
        'Exportação CSV com filtros avançados',
      ],
    },
    {
      icon: BellRing,
      badge: 'Comunicação',
      title: 'Notificações & Mensageria',
      color: 'border-orange-500',
      badgeBg: 'bg-orange-100 text-orange-700',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      bgIcon: Send,
      bgIconColor: 'text-orange-100',
      items: [
        'Push notifications em tempo real',
        'Chat interno entre servidores',
        'Chatbot DigiBot para cidadãos',
        'Alertas de SLA e pendências',
      ],
    },
    {
      icon: Users,
      badge: 'Cidadão',
      title: 'Gestão de Cidadãos & Programas',
      color: 'border-[#0fffbf]',
      badgeBg: 'bg-teal-100 text-teal-700',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      bgIcon: UsersRound,
      bgIconColor: 'text-teal-100',
      items: [
        'Cadastro unificado com composição familiar',
        'Vinculação a programas sociais',
        'Portal self-service (PWA mobile)',
        'Histórico completo de atendimentos',
      ],
    },
    {
      icon: GitBranch,
      badge: 'Workflows',
      title: 'Fluxos de Trabalho Configuráveis',
      color: 'border-slate-500',
      badgeBg: 'bg-slate-200 text-slate-700',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-600',
      bgIcon: Network,
      bgIconColor: 'text-slate-100',
      items: [
        'Etapas customizáveis por serviço',
        'Atribuição automática com balanceamento',
        'Controle de SLA com prazos por etapa',
        'Encaminhamento entre departamentos',
      ],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute -right-40 -top-40 w-96 h-96 bg-[#0fffbf] rounded-full blur-[120px] opacity-[0.04] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#0f6fbe] rounded-full blur-[100px] opacity-[0.04] pointer-events-none" />

      {/* Header */}
      <div className="px-12 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <span className="bg-[#193642] text-[#0fffbf] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mr-3">Transversal</span>
              <h3 className="text-slate-500 text-xs uppercase tracking-[3px] font-bold">Funcionalidades Compartilhadas</h3>
            </div>
            <h2 className="text-4xl font-black text-[#193642] tracking-tight">
              Funcionalidades <span className="text-[#0fffbf]">que permeiam toda a plataforma</span>
            </h2>
          </div>
          <p className="text-sm text-slate-500 italic max-w-xs text-right">
            &ldquo;Disponíveis para todas as secretarias e departamentos.&rdquo;
          </p>
        </div>
      </div>

      {/* Cards grid — 3 top + 2 bottom */}
      <div className="flex-1 px-12 pb-6">
        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {features.slice(0, 3).map(({ icon: Icon, badge, title, color, badgeBg, iconBg, iconColor, bgIcon: BgIcon, bgIconColor, items }) => (
            <div key={title} className={`relative bg-white rounded-2xl border-t-[5px] ${color} p-5 shadow-md overflow-hidden`}>
              {/* Background icon */}
              <BgIcon className={`absolute -bottom-4 -right-4 w-28 h-28 ${bgIconColor} opacity-30 pointer-events-none`} />

              {/* Icon + badge */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeBg}`}>{badge}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[#193642] mb-4 relative z-10">{title}</h3>

              {/* Features list */}
              <div className="space-y-2.5 relative z-10">
                {items.map((item) => (
                  <div key={item} className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0fffbf] mt-0.5 mr-2.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: 2 cards (wider) */}
        <div className="grid grid-cols-2 gap-4">
          {features.slice(3, 5).map(({ icon: Icon, badge, title, color, badgeBg, iconBg, iconColor, bgIcon: BgIcon, bgIconColor, items }) => (
            <div key={title} className={`relative bg-white rounded-2xl border-t-[5px] ${color} p-5 shadow-md overflow-hidden`}>
              {/* Background icon */}
              <BgIcon className={`absolute -bottom-4 -right-4 w-28 h-28 ${bgIconColor} opacity-30 pointer-events-none`} />

              {/* Icon + badge + title inline for wider cards */}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeBg}`}>{badge}</span>
                  <h3 className="text-lg font-bold text-[#193642] mt-1">{title}</h3>
                </div>
              </div>

              {/* Features list — 2 columns for wider cards */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 relative z-10">
                {items.map((item) => (
                  <div key={item} className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0fffbf] mt-0.5 mr-2.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideDiferenciais() {
  const techCards = [
    {
      icon: Layers,
      iconColor: 'text-[#0fffbf]',
      title: 'Stack Moderna',
      badges: ['Next.js 14', 'Node.js', 'TypeScript', 'PostgreSQL', 'Prisma ORM'],
    },
    {
      icon: ShieldHalf,
      iconColor: 'text-red-400',
      title: 'Segurança de Dados',
      items: [
        { icon: KeyRound, text: 'Autenticação JWT com cookies httpOnly', color: 'text-red-400' },
        { icon: Lock, text: 'Criptografia AES-256-GCM', color: 'text-red-400' },
        { icon: ShieldEllipsis, text: 'Audit Log completo de ações', color: 'text-red-400' },
        { icon: CheckCheck, text: 'Proteção OWASP Top 10', color: 'text-red-400' },
      ],
    },
    {
      icon: CloudUpload,
      iconColor: 'text-[#0f6fbe]',
      title: 'Escalabilidade & Infra',
      items: [
        { icon: Users, text: 'Arquitetura Multi-tenant (Isolada)', color: 'text-[#0f6fbe]' },
        { icon: Container, text: 'Docker-ready para qualquer cloud', color: 'text-[#0f6fbe]' },
        { icon: WifiOff, text: 'PWA com funcionamento Offline', color: 'text-[#0f6fbe]' },
        { icon: Zap, text: 'Real-time via Socket.IO', color: 'text-[#0f6fbe]' },
      ],
    },
  ];

  const plans = [
    {
      name: 'Basic',
      subtitle: 'Pequenos Municípios',
      price: 'R$ 1.200/mês',
      variant: 'basic' as const,
      items: [
        'Protocolos Digitais',
        'App do Cidadão (PWA)',
        'Dashboard Básico',
        'Até 10 usuários admin',
      ],
    },
    {
      name: 'Professional',
      subtitle: 'Gestão Completa',
      price: 'R$ 2.500/mês',
      variant: 'featured' as const,
      items: [
        'Tudo do Basic +',
        'Módulo de Saúde',
        'Módulo Agricultura',
        'Relatórios Avançados',
        'Chatbot Inteligente',
      ],
    },
    {
      name: 'Enterprise',
      subtitle: 'Cidades Inteligentes',
      price: 'Sob consulta',
      variant: 'enterprise' as const,
      items: [
        'Tudo do Pro +',
        'Gestão de TFD',
        'Assinatura Digital',
        'Analytics Completo',
        'API para Integrações',
      ],
    },
  ];

  const included = [
    { icon: Rocket, text: 'Implantação Assistida' },
    { icon: GradCapIcon, text: 'Treinamento EAD' },
    { icon: Headphones, text: 'Suporte Técnico' },
    { icon: RefreshCw, text: 'Atualizações Contínuas' },
    { icon: Cloud, text: 'Hospedagem Cloud' },
  ];

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* LEFT: Technical */}
      <div className="w-[40%] bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex flex-col justify-center px-8 py-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -bottom-10 -left-10 text-white/[0.03] pointer-events-none">
          <Monitor className="w-[200px] h-[200px]" />
        </div>
        <div className="absolute top-16 -right-10 text-white/[0.03] pointer-events-none">
          <ServerIcon className="w-[150px] h-[150px]" />
        </div>

        <div className="mb-6 relative z-10">
          <span className="text-[#0fffbf] text-xs font-bold uppercase tracking-[3px] mb-2 block">Por Baixo do Capô</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Diferenciais Técnicos</h2>
          <p className="text-slate-400 text-sm mt-2">Arquitetura moderna, segura e escalável para gestão pública.</p>
        </div>

        <div className="space-y-3 relative z-10">
          {/* Stack */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-start mb-2.5">
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-3 shrink-0">
                <Layers className="w-4 h-4 text-[#0fffbf]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Stack Moderna</h3>
                <div className="flex flex-wrap gap-1.5">
                  {techCards[0].badges!.map((badge) => (
                    <span key={badge} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0fffbf]/10 text-[#0fffbf] border border-[#0fffbf]/30">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-3 shrink-0">
                <ShieldHalf className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">Segurança de Dados</h3>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  {techCards[1].items!.map(({ icon: ItemIcon, text, color }) => (
                    <li key={text} className="flex items-center gap-2">
                      <ItemIcon className={`w-3 h-3 ${color} shrink-0`} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Scalability */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-3 shrink-0">
                <CloudUpload className="w-4 h-4 text-[#0f6fbe]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">Escalabilidade & Infra</h3>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  {techCards[2].items!.map(({ icon: ItemIcon, text, color }) => (
                    <li key={text} className="flex items-center gap-2">
                      <ItemIcon className={`w-3 h-3 ${color} shrink-0`} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Business */}
      <div className="w-[60%] bg-slate-50 flex flex-col px-10 py-8 relative">
        <div className="mb-6">
          <span className="bg-blue-100 text-[#0f6fbe] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Comercial</span>
          <h2 className="text-3xl font-extrabold text-[#193642] tracking-tight">Modelo de Negócio</h2>
          <p className="text-slate-500 text-sm mt-1">Flexibilidade para municípios de todos os portes.</p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-3 gap-4 mb-6 items-center">
          {plans.map(({ name, subtitle, price, variant, items }) => (
            <div
              key={name}
              className={`rounded-xl p-4 flex flex-col text-center relative ${
                variant === 'featured'
                  ? 'bg-white border-2 border-[#0fffbf] shadow-lg shadow-[#0fffbf]/20 z-10 min-h-[260px]'
                  : variant === 'enterprise'
                    ? 'bg-[#193642] text-white border border-[#193642] min-h-[240px]'
                    : 'bg-white border border-slate-200 border-t-4 border-t-slate-400 min-h-[220px]'
              }`}
            >
              {variant === 'featured' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0fffbf] text-[#193642] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                  Mais Popular
                </div>
              )}
              <h3 className={`text-lg font-bold mt-1 ${
                variant === 'featured' ? 'text-[#193642]' : variant === 'enterprise' ? 'text-white' : 'text-slate-700'
              }`}>
                {name}
              </h3>
              <p className={`text-[10px] uppercase tracking-wide ${
                variant === 'enterprise' ? 'text-blue-200' : 'text-slate-400'
              }`}>
                {subtitle}
              </p>
              <p className={`text-base font-black my-2 ${
                variant === 'featured' ? 'text-[#0fffbf]' : variant === 'enterprise' ? 'text-[#0fffbf]' : 'text-[#0f6fbe]'
              }`}>
                {price}
              </p>
              <ul className="flex-1 text-left space-y-2">
                {items.map((item, idx) => (
                  <li key={item} className={`flex items-start text-[11px] leading-snug ${
                    idx === 0 && variant !== 'basic'
                      ? variant === 'enterprise' ? 'font-bold text-white' : 'font-bold text-slate-800'
                      : variant === 'enterprise' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {idx === 0 && variant !== 'basic' ? (
                      <CheckCheck className={`w-3.5 h-3.5 mr-2 mt-0.5 shrink-0 ${variant === 'enterprise' ? 'text-[#0fffbf]' : 'text-[#0fffbf]'}`} />
                    ) : (
                      <CheckCircle2 className={`w-3.5 h-3.5 mr-2 mt-0.5 shrink-0 ${
                        variant === 'featured' ? 'text-[#0fffbf]' : variant === 'enterprise' ? 'text-[#0fffbf]' : 'text-green-500'
                      }`} />
                    )}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Included in all */}
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center">
            <Gift className="w-4 h-4 text-[#0f6fbe] mr-2" />
            Incluso em todos os planos
          </h4>
          <div className="grid grid-cols-3 gap-y-2.5 gap-x-6">
            {included.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center text-xs text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-2 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideFechamento() {
  const values = [
    { icon: Zap, title: 'Eficiência Operacional', desc: 'Eliminação de papel, fim do retrabalho e processos 100% digitais.', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Eye, title: 'Transparência Total', desc: 'Cidadão acompanha solicitações em tempo real pelo celular.', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: PieChart, title: 'Controle de Gestão', desc: 'Dashboards executivos com dados reais para tomada de decisão.', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Smile, title: 'Satisfação do Cidadão', desc: 'Atendimento 24/7 simplificado via Chatbot e App sem instalação.', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { icon: Gavel, title: 'Conformidade Legal', desc: 'Assinatura digital, rastreabilidade e auditoria completa.', iconBg: 'bg-slate-200', iconColor: 'text-slate-600' },
    { icon: ServerIcon, title: 'Escalabilidade', desc: 'Arquitetura em nuvem que cresce junto com a demanda da cidade.', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  ];

  const steps = [
    { num: '01', title: 'Demonstração Técnica', desc: 'Visão detalhada dos fluxos.', icon: Laptop },
    { num: '02', title: 'Piloto Controlado', desc: 'Validação em 2-3 secretarias.', icon: Rocket },
    { num: '03', title: 'Dimensionamento', desc: 'Definição de equipe e suporte.', icon: UsersRound },
  ];

  return (
    <div className="w-full h-full flex relative overflow-hidden">
      {/* LEFT: Value Summary */}
      <div className="flex-1 bg-slate-50 p-10 flex flex-col">
        <div className="mb-6">
          <span className="bg-blue-100 text-[#0f6fbe] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Resumo de Valor</span>
          <h1 className="text-4xl font-extrabold text-[#193642] tracking-tight">
            O Legado para o <span className="text-[#0fffbf]">Município</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Por que o DigiUrban transforma a gestão pública?</p>
        </div>

        {/* Value Grid */}
        <div className="grid grid-cols-2 gap-3.5 flex-1">
          {values.map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-start shadow-sm hover:border-slate-300 transition-colors">
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mr-3 shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-0.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-snug">{desc}</p>
              </div>
            </div>
          ))}

          {/* Health Highlight — Full Width */}
          <div className="col-span-2 bg-teal-50 rounded-xl border border-teal-200 p-3.5 flex items-start">
            <div className="w-9 h-9 rounded-lg bg-[#0fffbf] flex items-center justify-center mr-3 shrink-0">
              <HeartPulse className="w-4 h-4 text-[#193642]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="font-bold text-teal-800 text-sm">Saúde Integrada (Diferencial)</h3>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded uppercase tracking-wide">Exclusivo</span>
              </div>
              <p className="text-xs text-teal-700 leading-snug">Sistema completo com Prontuário, Farmácia, TFD e Classificação de Risco integrados nativamente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: CTA & Next Steps */}
      <div className="w-[420px] bg-gradient-to-br from-[#193642] via-[#193642] to-[#0d2a34] p-10 flex flex-col justify-between relative overflow-hidden">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Decorative icon */}
        <div className="absolute -right-10 top-16 text-white/[0.04] pointer-events-none">
          <SendHorizonal className="w-[180px] h-[180px] -rotate-12" />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Próximos Passos</h2>
          <div className="space-y-3">
            {steps.map(({ num, title, desc, icon: StepIcon }) => (
              <div key={num} className="flex items-center bg-white/10 border border-white/10 p-4 rounded-xl hover:bg-white/15 hover:translate-x-1 transition-all cursor-default">
                <span className="text-2xl font-extrabold text-[#0fffbf]/70 mr-4 w-8">{num}</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">{title}</h4>
                  <p className="text-xs text-blue-200 mt-0.5">{desc}</p>
                </div>
                <StepIcon className="w-5 h-5 text-[#0fffbf] ml-3 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline box */}
        <div className="bg-[#0fffbf] rounded-xl p-5 relative z-10 shadow-lg">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-[#193642] mr-3 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-[#193642] text-sm uppercase tracking-wide">Cronograma de Implantação</h4>
              <p className="text-[#193642] text-sm mt-1">
                Base (Protocolos): <span className="font-bold bg-white text-[#193642] px-1.5 py-0.5 rounded text-xs">2 a 4 semanas</span>
              </p>
              <p className="text-[#193642]/70 text-xs mt-1">
                + Módulo Saúde Completo: 2 a 3 semanas adicionais
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-5 border-t border-white/10 mt-4 text-center">
          <p className="text-blue-200 text-sm mb-1">Vamos transformar sua cidade?</p>
          <p className="text-white font-bold text-lg">charlesochile123@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

function SlideROI() {
  const comparativo = [
    { criterio: 'Implantação', tradicional: '6–18 meses', digiurban: '2–4 semanas', destaque: true },
    { criterio: 'Custo anual', tradicional: 'R$ 80–300k', digiurban: 'A partir de R$ 14,4k', destaque: true },
    { criterio: 'Infraestrutura', tradicional: 'Servidores próprios', digiurban: 'Cloud SaaS (zero infra)', destaque: false },
    { criterio: 'Atualização', tradicional: 'Contratos de manutenção', digiurban: 'Contínua, inclusa no plano', destaque: false },
    { criterio: 'Módulo de Saúde', tradicional: 'Sistema separado', digiurban: 'Nativo e integrado', destaque: true },
    { criterio: 'Portal do cidadão', tradicional: 'Presencial ou site estático', digiurban: 'PWA mobile sem instalação', destaque: false },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header */}
      <div className="px-14 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-1.5">
              <span className="bg-[#193642] text-[#0fffbf] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mr-3">Comparativo</span>
              <h3 className="text-slate-500 text-xs uppercase tracking-[3px] font-bold">DigiUrban vs. Soluções Tradicionais</h3>
            </div>
            <h2 className="text-[34px] font-black text-[#193642] tracking-tight">
              Mais rápido, mais barato, <span className="text-[#0fffbf]">mais completo.</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Retorno sobre investimento</p>
            <p className="text-3xl font-black text-[#0f6fbe]">&lt; 6 meses</p>
            <p className="text-xs text-slate-400">estimativa conservadora</p>
          </div>
        </div>
      </div>

      {/* Tabela comparativa */}
      <div className="flex-1 px-14 pb-8 min-h-0">
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col min-h-0">
          {/* Header da tabela */}
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Critério</div>
            <div className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 border-l border-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Soluções tradicionais
            </div>
            <div className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#0f6fbe] border-l border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0fffbf]" /> DigiUrban
            </div>
          </div>

          {/* Linhas */}
          <div className="flex-1 divide-y divide-slate-100 overflow-hidden">
            {comparativo.map(({ criterio, tradicional, digiurban, destaque }) => (
              <div key={criterio} className={`grid grid-cols-3 ${destaque ? 'bg-[#0f6fbe]/3' : 'bg-white'}`}>
                <div className="px-6 py-4 flex items-center">
                  <span className={`text-sm font-bold ${destaque ? 'text-[#193642]' : 'text-slate-600'}`}>{criterio}</span>
                  {destaque && <span className="ml-2 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">chave</span>}
                </div>
                <div className="px-6 py-4 border-l border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-slate-500">{tradicional}</span>
                </div>
                <div className="px-6 py-4 border-l border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className={`text-sm font-semibold ${destaque ? 'text-[#0f6fbe]' : 'text-slate-700'}`}>{digiurban}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé da tabela */}
          <div className="bg-[#193642] px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              Implantação assistida inclusa + suporte + atualizações contínuas
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[#0fffbf] font-black text-lg">A partir de R$ 1.200/mês</span>
              <span className="text-xs text-white/50">por município</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDES ARRAY
// ============================================================================

const SLIDES = [
  { id: 'capa', title: 'Capa', component: SlideCapa },
  { id: 'problema', title: 'O Problema', component: SlideProblema },
  { id: 'portais', title: '3 Portais', component: SlidePortais },
  { id: 'cidadao', title: 'Jornada Cidadão', component: SlideJornadaCidadao },
  { id: 'servidor', title: 'Jornada Servidor', component: SlideJornadaServidor },
  { id: 'modulos', title: 'Módulos', component: SlideModulos },
  { id: 'funcionalidades', title: 'Funcionalidades', component: SlideFuncionalidades },
  { id: 'diferenciais', title: 'Diferenciais & Negócio', component: SlideDiferenciais },
  { id: 'roi', title: 'Comparativo & ROI', component: SlideROI },
  { id: 'fechamento', title: 'Fechamento', component: SlideFechamento },
];

// ============================================================================
// MAIN PRESENTATION PAGE
// ============================================================================

export default function ApresentacaoPage() {
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
      const response = await fetch(`${apiUrl}/apresentacao/export-pdf`);

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DigiUrban_Apresentacao_Comercial.pdf`;
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

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, toggleFullscreen, isFullscreen]);

  // Listen for fullscreen exit via Escape
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
    <div className={`min-h-screen bg-[#0f1117] flex flex-col items-center justify-center ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
      {/* Top bar (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="w-full max-w-[1280px] flex items-center justify-between mb-4">
          <Link href="/landing" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <Home className="w-4 h-4" />
            <span>Voltar ao site</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm">{currentSlide + 1} / {SLIDES.length}</span>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0fffbf]/10 hover:bg-[#0fffbf]/20 text-[#0fffbf] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
              title="Baixar PDF"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Gerando...' : 'Baixar PDF'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Tela cheia (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide viewport */}
      <div
        className={`relative bg-white overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'w-screen h-screen'
            : 'w-full max-w-[1280px] aspect-video rounded-xl'
        }`}
        data-slide-frame="true"
        data-slide-count={SLIDES.length}
      >
        <SlideComponent />
      </div>

      {/* Controls */}
      <div className={`flex items-center gap-4 ${isFullscreen ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50' : 'mt-4'}`}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Slide dots / mini nav */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isFullscreen ? 'bg-black/40 backdrop-blur-sm' : 'bg-white/5'}`}>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all rounded-full ${
                i === currentSlide
                  ? 'w-8 h-2 bg-[#0fffbf]'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
              title={slide.title}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentSlide === SLIDES.length - 1}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Fullscreen exit hint */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* Keyboard hint (hidden in fullscreen) */}
      {!isFullscreen && (
        <p className="text-white/20 text-xs mt-4">
          Setas para navegar &middot; Espaço para avançar &middot; F para tela cheia
        </p>
      )}
    </div>
  );
}
