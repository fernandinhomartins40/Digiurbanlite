'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Building2,
  CalendarDays,
  Check,
  Circle,
  ClipboardList,
  FileText,
  HeartPulse,
  HelpCircle,
  MapPin,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InteractiveCardProps {
  type: 'boolean' | 'single-choice' | 'multiple-choice';
  question: string;
  description?: string;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  onSelect: (selected: string | string[]) => void;
  selectedValues?: string[];
}

const OPTION_VISUALS: Array<{ patterns: string[]; Icon: LucideIcon; color: string; bg: string; border: string }> = [
  { patterns: ['saude', 'consulta', 'medic', 'vacina'], Icon: HeartPulse, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  { patterns: ['protocolo', 'solicitacao', 'chamado', 'status'], Icon: ClipboardList, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  { patterns: ['documento', 'certidao', 'segunda via'], Icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  { patterns: ['perfil', 'cadastro', 'cpf'], Icon: User, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { patterns: ['familia', 'familiar'], Icon: Users, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
  { patterns: ['notificacao', 'alerta'], Icon: Bell, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  { patterns: ['agenda', 'data', 'horario'], Icon: CalendarDays, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100' },
  { patterns: ['localizacao', 'endereco', 'bairro'], Icon: MapPin, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
  { patterns: ['secretaria', 'setor'], Icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  { patterns: ['ajuda', 'suporte', 'atendente'], Icon: HelpCircle, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
];

const DEFAULT_OPTION_VISUALS = [
  { Icon: Circle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  { Icon: Circle, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
  { Icon: Circle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getOptionVisual(option: { id: string; label: string; description?: string }, index: number) {
  const haystack = normalizeText(`${option.label} ${option.description || ''} ${option.id}`);
  const matched = OPTION_VISUALS.find(({ patterns }) => patterns.some((pattern) => haystack.includes(pattern)));
  return matched || DEFAULT_OPTION_VISUALS[index % DEFAULT_OPTION_VISUALS.length];
}

export function InteractiveCard({
  type,
  question,
  description,
  options = [],
  onSelect,
  selectedValues = [],
}: InteractiveCardProps) {
  if (type === 'boolean') {
    return (
      <Card className="w-full min-w-0 max-w-full border-blue-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
          {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <Button
              onClick={() => onSelect('true')}
              variant="outline"
              className="h-auto rounded-lg border-emerald-200 bg-emerald-50/35 py-3 text-slate-800 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-sm">Sim</span>
              </div>
            </Button>
            <Button
              onClick={() => onSelect('false')}
              variant="outline"
              className="h-auto rounded-lg border-rose-200 bg-rose-50/35 py-3 text-slate-800 hover:border-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
            >
              <div className="flex flex-col items-center gap-1.5">
                <X className="w-5 h-5 text-red-600" />
                <span className="font-medium text-sm">Não</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'single-choice') {
    return (
      <Card className="w-full min-w-0 max-w-full border-blue-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
          {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option, index) => {
              const visual = getOptionVisual(option, index);
              const Icon = visual.Icon;

              return (
                <Button
                  key={option.id}
                  onClick={() => onSelect(option.id)}
                  variant="outline"
                  className={`w-full h-auto rounded-lg ${visual.border} bg-white py-2.5 px-3 justify-start hover:border-teal-500 hover:bg-blue-50/45 transition-colors overflow-hidden`}
                >
                  <div className="flex items-start gap-2.5 w-full min-w-0">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${visual.bg}`}>
                      {option.icon || <Icon className={`w-4 h-4 ${visual.color}`} />}
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm leading-snug break-words">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight break-words">{option.description}</p>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'multiple-choice') {
    return (
      <Card className="w-full min-w-0 max-w-full border-blue-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
              {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
            </div>
            {selectedValues.length > 0 && (
              <Badge className="bg-blue-700 text-white shrink-0 text-xs">
                {selectedValues.length} sel.
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isSelected = selectedValues.includes(option.id);
              const visual = getOptionVisual(option, index);
              const Icon = visual.Icon;
              return (
                <Button
                  key={option.id}
                  onClick={() => {
                    if (isSelected) onSelect(selectedValues.filter((id) => id !== option.id));
                    else onSelect([...selectedValues, option.id]);
                  }}
                  variant="outline"
                  className={`w-full h-auto py-2.5 px-3 justify-start transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-blue-50 border-blue-700 text-blue-900 hover:bg-blue-100'
                      : `bg-white hover:bg-teal-50 hover:border-teal-400 ${visual.border}`
                  }`}
                >
                  <div className="flex items-start gap-2.5 w-full min-w-0">
                    <div className={`w-7 h-7 shrink-0 mt-0.5 rounded-md flex items-center justify-center transition-all ${
                      isSelected ? 'bg-blue-600 text-white' : `${visual.bg} ${visual.color}`
                    }`}>
                      {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm leading-snug break-words">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight break-words">{option.description}</p>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <Button onClick={() => onSelect(selectedValues)} className="w-full mt-3 rounded-lg bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800">
              <Check className="w-4 h-4 mr-2" />
              Confirmar Seleção ({selectedValues.length})
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
