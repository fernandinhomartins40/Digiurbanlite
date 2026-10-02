'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Leaf,
  MapPin,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';
import { TimePicker } from './TimePicker';
import { ConfirmationCard } from './ConfirmationCard';
import { ProgressBar } from './ProgressBar';
import { LocationPicker } from './LocationPicker';
import { RatingCard } from './RatingCard';
import { DocumentUploadCard } from './DocumentUploadCard';
import { SearchableSelect } from './SearchableSelect';
import { MessageCard } from './MessageCard';
import { ProtocolDetailCard } from './ProtocolDetailCard';
import { InteractiveCard } from './InteractiveCard';
import { QuickReplies } from './QuickReplies';
import { FormCard } from './FormCard';
import { DepartmentCarousel } from './DepartmentCarousel';
import { ServiceCarousel } from './ServiceCarousel';
import { BotDocumentUpload } from './BotDocumentUpload';
import { ReviewCard } from './ReviewCard';

interface BotMessageRendererProps {
  message: any;
  onInteraction: (data: any) => void;
  disabled?: boolean;
  /** resposta que acabou de chegar: os elementos aparecem um a um, como numa conversa */
  animate?: boolean;
  /** chamado a cada elemento que aparece (a tela acompanha rolando) */
  onReveal?: () => void;
}

/** Texto longo vira até 3 balões (quebra em parágrafos), como numa conversa */
function splitBubbles(content: string): string[] {
  const parts = String(content || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return parts;
  // listas ("- item", "1. item", "• item") ficam junto do parágrafo anterior
  const merged: string[] = [];
  for (const part of parts) {
    if (merged.length && /^([-•*]|\d+[.)])\s/.test(part)) merged[merged.length - 1] += `\n\n${part}`;
    else merged.push(part);
  }
  if (merged.length <= 3) return merged;
  return [merged[0], merged[1], merged.slice(2).join('\n\n')];
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Sequência de chegada: cada passo tem a sua espera (balão: "digitando" curto;
 * card: 110 ms). Sem animação (histórico ou "reduzir movimento"), tudo de uma vez.
 */
function useSequence(delays: number[], animate: boolean, onReveal?: () => void): number {
  const reduced = prefersReducedMotion();
  const total = delays.length;
  const [shown, setShown] = useState(animate && !reduced ? 0 : total);
  const key = delays.join(',');
  useEffect(() => {
    if (!animate || reduced) {
      setShown(total);
      return;
    }
    setShown(0);
    let cancelled = false;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (cancelled || step >= total) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        step += 1;
        setShown(step);
        next();
      }, delays[step]);
    };
    next();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, animate]);
  useEffect(() => {
    if (shown > 0) onReveal?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);
  return shown;
}

function TypingDots() {
  return (
    <div className="du-pop inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-white px-4 py-3 shadow-sm" aria-label="DigiBot digitando">
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

interface OptionVisual {
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const OPTION_VISUALS: Array<{ patterns: string[]; visual: OptionVisual }> = [
  { patterns: ['saude', 'ubs', 'consulta', 'medic', 'vacina'], visual: { Icon: HeartPulse, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' } },
  { patterns: ['educacao', 'escola', 'aluno', 'matricula'], visual: { Icon: GraduationCap, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' } },
  { patterns: ['meio ambiente', 'ambiental', 'arvore', 'fauna', 'vegetal'], visual: { Icon: Leaf, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' } },
  { patterns: ['protocolo', 'solicitacao', 'chamado', 'andamento', 'status'], visual: { Icon: ClipboardList, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' } },
  { patterns: ['documento', 'certidao', 'carteira', '2 via', 'segunda via'], visual: { Icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' } },
  { patterns: ['perfil', 'cadastro', 'cpf', 'telefone', 'endereco'], visual: { Icon: User, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100' } },
  { patterns: ['familia', 'familiar', 'dependente'], visual: { Icon: Users, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' } },
  { patterns: ['notificacao', 'alerta', 'aviso'], visual: { Icon: Bell, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' } },
  { patterns: ['agenda', 'agendamento', 'horario', 'data'], visual: { Icon: CalendarDays, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100' } },
  { patterns: ['localizacao', 'endereco', 'bairro', 'rua'], visual: { Icon: MapPin, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' } },
  { patterns: ['secretaria', 'departamento', 'setor'], visual: { Icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' } },
  { patterns: ['seguranca', 'guarda', 'denuncia'], visual: { Icon: ShieldCheck, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' } },
  { patterns: ['buscar', 'pesquisar', 'consultar', 'listar'], visual: { Icon: Search, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' } },
  { patterns: ['ajuda', 'atendente', 'humano', 'suporte'], visual: { Icon: HelpCircle, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' } },
];

const DEFAULT_OPTION_VISUALS: OptionVisual[] = [
  { Icon: MessageSquarePlus, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  { Icon: ClipboardList, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
  { Icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  { Icon: Building2, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getOptionVisual(option: any, index: number): OptionVisual {
  const haystack = normalizeText(`${option?.label || ''} ${option?.description || ''} ${option?.id || ''}`);
  const matched = OPTION_VISUALS.find(({ patterns }) => patterns.some((pattern) => haystack.includes(pattern)));
  return matched?.visual || DEFAULT_OPTION_VISUALS[index % DEFAULT_OPTION_VISUALS.length];
}

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 min-w-0 break-words [overflow-wrap:anywhere]">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-slate-900">{children}</strong>,
  ul: ({ children }: any) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }: any) => <li className="marker:text-slate-400 min-w-0 break-words [overflow-wrap:anywhere]">{children}</li>,
  hr: () => <hr className="my-4 border-blue-100" />,
  h1: ({ children }: any) => <h1 className="mb-3 text-lg font-semibold text-slate-900 break-words">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-3 text-base font-semibold text-slate-900 break-words">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 text-sm font-semibold text-slate-900 break-words">{children}</h3>,
  code: ({ children }: any) => <code className="text-xs bg-slate-100 px-1 rounded break-all">{children}</code>,
};

export function BotMessageRenderer({ message, onInteraction, disabled = false, animate = false, onReveal }: BotMessageRendererProps) {
  const metadata = message?.metadata || {};
  const messageType = message?.messageType || metadata.messageType || 'text';
  const options = Array.isArray(metadata.options) ? metadata.options : [];
  const fields = Array.isArray(metadata.fields) ? metadata.fields : [];
  const cards = Array.isArray(metadata.cards) ? metadata.cards : [];

  const renderProgress = () => {
    if (metadata?.progress && metadata?.totalSteps) {
      return (
        <ProgressBar
          currentStep={metadata.currentStepNumber || 1}
          totalSteps={metadata.totalSteps}
        />
      );
    }
    return null;
  };

  const renderLegacyInteractive = () => {
    const stepType = metadata?.stepType;

    switch (stepType) {
      case 'date':
        return (
          <CalendarPicker
            onSelect={(date) => onInteraction(date.toISOString())}
            minDate={metadata.minDate}
            maxDate={metadata.maxDate}
          />
        );
      case 'time':
        return (
          <TimePicker
            onSelect={(time) => onInteraction(time)}
            availableTimes={metadata.availableTimes}
          />
        );
      case 'location':
        return (
          <LocationPicker
            onSelect={(location) => onInteraction(location)}
            allowCurrentLocation={metadata.allowCurrentLocation}
            allowManualAddress={metadata.allowManualAddress}
          />
        );
      case 'file_upload':
        return (
          <DocumentUploadCard
            onUpload={(files) => onInteraction(files)}
            accept={metadata.accept}
            maxFiles={metadata.maxFiles}
            maxSize={metadata.maxSize}
          />
        );
      case 'searchable_select':
        return (
          <SearchableSelect
            options={metadata.options || []}
            onSelect={(value) => onInteraction(value)}
            placeholder={metadata.placeholder}
          />
        );
      case 'selection':
      case 'multiple_choice':
        return (
          <InteractiveCard
            type={stepType === 'multiple_choice' ? 'multiple-choice' : 'single-choice'}
            question={metadata.question || 'Selecione uma opcao'}
            options={metadata.options || []}
            onSelect={(selected) => onInteraction(selected)}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationCard
            data={metadata.confirmationData || {}}
            onConfirm={() => onInteraction('confirmed')}
            onCancel={() => onInteraction('cancelled')}
          />
        );
      case 'rating':
        return (
          <RatingCard
            onSubmit={(rating: number, comment?: string) => onInteraction({ rating, comment })}
            title={metadata.title}
            subtitle={metadata.subtitle}
          />
        );
      default:
        return null;
    }
  };

  // ---- sequência de chegada: balões → cartões extras → cards (um a um) → respostas rápidas
  const bubbles = splitBubbles(message?.content || '');
  const isPlainMenu = messageType === 'menu' && options.length > 0 && !['department_carousel', 'service_carousel'].includes(metadata?.displayMode);
  const extras = [metadata?.protocolDetailCard, metadata?.reviewCard].filter(Boolean).length;
  const hasStructured = Boolean(
    (messageType === 'menu' && options.length > 0) ||
      ['card', 'form', 'upload', 'location', 'date', 'time', 'file_upload', 'searchable_select', 'selection', 'multiple_choice', 'confirmation', 'rating', 'interactive'].includes(messageType)
  );
  const delays: number[] = [
    ...bubbles.map((b, i) => (i === 0 ? 350 : Math.min(900, 300 + b.length * 4))),
    ...Array.from({ length: extras }, () => 220),
    ...(isPlainMenu ? options.map((_: unknown, i: number) => (i === 0 ? 260 : 110)) : hasStructured ? [260] : []),
    ...(metadata?.quickReplies ? [180] : []),
  ];
  const shown = useSequence(delays, animate, onReveal);
  const bubblesShown = Math.min(bubbles.length, shown);
  const extrasShown = Math.max(0, Math.min(extras, shown - bubbles.length));
  const afterExtras = shown - bubbles.length - extras;
  const visibleOptions = isPlainMenu ? Math.max(0, Math.min(options.length, afterExtras)) : options.length;
  const structuredShown = isPlainMenu ? afterExtras > 0 : afterExtras >= 1;
  const quickShown = afterExtras >= (isPlainMenu ? options.length : hasStructured ? 1 : 0) + 1;
  const typing = animate && shown < delays.length && shown < bubbles.length;

  const renderStructuredInput = () => {
    if (messageType === 'menu' && options.length > 0) {
      const displayMode = metadata?.displayMode;

      if (displayMode === 'department_carousel') {
        return (
          <DepartmentCarousel
            options={options}
            onSelect={(option) => onInteraction(option)}
          />
        );
      }

      if (displayMode === 'service_carousel') {
        return (
          <ServiceCarousel
            options={options}
            categories={metadata?.categories}
            departmentName={metadata?.departmentName}
            onSelect={(option) => onInteraction(option)}
          />
        );
      }

      return (
        <div className="flex w-full min-w-0 flex-col gap-2">
          {options.slice(0, visibleOptions).map((option: any, index: number) => {
            const visual = getOptionVisual(option, index);
            const Icon = visual.Icon;

            return (
              <button
                key={option.id}
                onClick={() => onInteraction(option)}
                className={`du-pop group w-full min-w-0 rounded-lg border ${visual.border} bg-white p-3 text-left shadow-sm transition-colors duration-200 hover:border-teal-500 hover:bg-blue-50/45 overflow-hidden`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`shrink-0 rounded-lg ${visual.bg} p-2 ring-1 ring-black/5`}>
                    <Icon className={`h-4 w-4 ${visual.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-sm leading-snug break-words">{option.label}</div>
                    {option.description && (
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500 break-words">
                        {option.description}
                      </div>
                    )}
                  </div>
                  <div className={`shrink-0 rounded-md ${visual.bg} p-1.5 ${visual.color}`}>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (messageType === 'card' && cards.length > 0) {
      return (
        <div className="grid w-full min-w-0 gap-3 grid-cols-1">
          {cards.map((card: any) => (
            <MessageCard
              key={card.id}
              card={card}
              onAction={(action) => onInteraction(action)}
            />
          ))}
        </div>
      );
    }

    if (messageType === 'form' && fields.length > 0) {
      return <FormCard fields={fields} onSubmit={(data) => onInteraction(data)} />;
    }

    if (messageType === 'upload') {
      const uploadConfig = metadata.uploadConfig || {};
      const requiredDocs = metadata.requiredDocuments;

      if (Array.isArray(requiredDocs) && requiredDocs.length > 0) {
        return (
          <BotDocumentUpload
            requiredDocuments={requiredDocs}
            allowSkip={uploadConfig.allowSkip !== false}
            maxFiles={uploadConfig.maxFiles || 5}
            onSubmit={(files) => onInteraction(files)}
            onSkip={() => onInteraction('pular')}
          />
        );
      }

      const accept = Array.isArray(uploadConfig.allowedTypes)
        ? uploadConfig.allowedTypes.join(',')
        : undefined;
      const maxFiles = uploadConfig.maxFiles || (uploadConfig.multiple ? 5 : 1);
      const maxSize = uploadConfig.maxFileSize
        ? uploadConfig.maxFileSize * 1024 * 1024
        : undefined;

      return (
        <DocumentUploadCard
          onUpload={(files) => onInteraction(files)}
          accept={accept}
          maxFiles={maxFiles}
          maxSize={maxSize}
          title={uploadConfig.text || 'Envie os documentos'}
        />
      );
    }

    if (messageType === 'location') {
      const locationConfig = metadata.locationConfig || {};
      return (
        <LocationPicker
          onSelect={(location) => onInteraction(location)}
          allowCurrentLocation={locationConfig.allowCurrentLocation !== false}
          allowManualAddress={locationConfig.allowManualInput !== false}
        />
      );
    }

    return null;
  };

  const structuredInput = renderStructuredInput() || (messageType === 'interactive' && renderLegacyInteractive());

  return (
    <div className="space-y-2 w-full min-w-0 max-w-full overflow-hidden">
      {renderProgress()}

      {bubbles.slice(0, bubblesShown).map((text, i) => (
        <div key={i} className="du-pop w-full min-w-0 max-w-full rounded-lg border border-blue-100 bg-white p-3.5 shadow-sm overflow-hidden">
          <div className="min-w-0 text-sm leading-6 text-slate-800 break-words [overflow-wrap:anywhere]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {typing && <TypingDots />}

      {metadata?.protocolDetailCard && extrasShown >= 1 && (
        <div className="du-pop">
          <ProtocolDetailCard data={metadata.protocolDetailCard} />
        </div>
      )}

      {metadata?.reviewCard && extrasShown >= (metadata?.protocolDetailCard ? 2 : 1) && (
        <div className="du-pop">
          <ReviewCard data={metadata.reviewCard} />
        </div>
      )}

      {structuredInput && structuredShown && (
        <div className={`${isPlainMenu ? '' : 'du-pop '}w-full min-w-0 max-w-full overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={disabled}>
          {structuredInput}
        </div>
      )}

      {metadata?.quickReplies && quickShown && (
        <div className="du-pop">
          <QuickReplies
            replies={metadata.quickReplies}
            onSelect={(reply) => {
              if (!disabled) onInteraction(reply)
            }}
            className={disabled ? 'pointer-events-none opacity-60' : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default BotMessageRenderer;
