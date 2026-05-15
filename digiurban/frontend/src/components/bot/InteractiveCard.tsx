'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Circle } from 'lucide-react';
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
      <Card className="w-full min-w-0 max-w-full border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
          {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <Button
              onClick={() => onSelect('true')}
              variant="outline"
              className="h-auto rounded-lg border-slate-300 bg-white py-3 text-slate-800 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-sm">Sim</span>
              </div>
            </Button>
            <Button
              onClick={() => onSelect('false')}
              variant="outline"
              className="h-auto rounded-lg border-slate-300 bg-white py-3 text-slate-800 hover:border-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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
      <Card className="w-full min-w-0 max-w-full border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
          {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option) => (
              <Button
                key={option.id}
                onClick={() => onSelect(option.id)}
                variant="outline"
                className="w-full h-auto rounded-lg border-slate-300 bg-white py-2.5 px-3 justify-start hover:border-blue-600 hover:bg-blue-50 transition-colors overflow-hidden"
              >
                <div className="flex items-start gap-2.5 w-full min-w-0">
                  <span className="shrink-0 mt-0.5">{option.icon || <Circle className="w-4 h-4 text-blue-600" />}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm leading-snug break-words">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight break-words">{option.description}</p>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'multiple-choice') {
    return (
      <Card className="w-full min-w-0 max-w-full border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm leading-snug break-words">{question}</CardTitle>
              {description && <CardDescription className="text-xs break-words">{description}</CardDescription>}
            </div>
            {selectedValues.length > 0 && (
              <Badge className="bg-slate-900 text-white shrink-0 text-xs max-[360px]:hidden">
                {selectedValues.length} sel.
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.id);
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
                      : 'bg-white hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start gap-2.5 w-full min-w-0">
                    <div className={`w-4 h-4 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
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
            <Button onClick={() => onSelect(selectedValues)} className="w-full mt-3 rounded-lg bg-slate-900 hover:bg-slate-800">
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
