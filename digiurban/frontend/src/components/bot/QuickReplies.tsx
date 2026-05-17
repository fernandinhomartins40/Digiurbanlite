'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  HelpCircle,
  Search,
  Send,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  className?: string;
}

const REPLY_VISUALS: Array<{ patterns: string[]; Icon: LucideIcon; color: string; bg: string; border: string }> = [
  { patterns: ['saude', 'consulta', 'medic', 'vacina'], Icon: HeartPulse, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  { patterns: ['protocolo', 'status', 'andamento', 'chamado'], Icon: ClipboardList, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  { patterns: ['documento', 'certidao', 'segunda via'], Icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  { patterns: ['perfil', 'cadastro', 'cpf'], Icon: User, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { patterns: ['familia', 'familiar'], Icon: Users, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
  { patterns: ['notificacao', 'alerta'], Icon: Bell, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  { patterns: ['agenda', 'data', 'horario'], Icon: CalendarDays, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100' },
  { patterns: ['secretaria', 'setor'], Icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  { patterns: ['buscar', 'listar', 'consultar'], Icon: Search, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
  { patterns: ['ajuda', 'atendente', 'suporte'], Icon: HelpCircle, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
];

const DEFAULT_REPLY_VISUALS = [
  { Icon: Send, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  { Icon: ClipboardList, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
  { Icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getReplyVisual(reply: string, index: number) {
  const normalized = normalizeText(reply);
  const matched = REPLY_VISUALS.find(({ patterns }) => patterns.some((pattern) => normalized.includes(pattern)));
  return matched || DEFAULT_REPLY_VISUALS[index % DEFAULT_REPLY_VISUALS.length];
}

export function QuickReplies({ replies, onSelect, className = '' }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className={`flex w-full min-w-0 max-w-full flex-col gap-2 my-2 overflow-hidden ${className}`}>
      {replies.map((reply, index) => {
        const visual = getReplyVisual(reply, index);
        const Icon = visual.Icon;

        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(reply)}
            className={`w-full min-w-0 h-auto rounded-lg ${visual.border} bg-white py-2 px-3 justify-start text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 transition-colors text-left overflow-hidden`}
          >
            <span className={`mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${visual.bg}`}>
              <Icon className={`h-3.5 w-3.5 ${visual.color}`} />
            </span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere] text-xs leading-relaxed">{reply}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default QuickReplies;
