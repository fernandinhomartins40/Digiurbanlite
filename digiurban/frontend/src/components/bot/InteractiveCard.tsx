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
  selectedValues = []
}: InteractiveCardProps) {
  const handleBooleanSelect = (value: boolean) => {
    onSelect(value ? 'true' : 'false');
  };

  const handleSingleChoiceSelect = (optionId: string) => {
    onSelect(optionId);
  };

  const handleMultipleChoiceToggle = (optionId: string) => {
    if (selectedValues.includes(optionId)) {
      onSelect(selectedValues.filter(id => id !== optionId));
    } else {
      onSelect([...selectedValues, optionId]);
    }
  };

  // Card para Sim/Não (Boolean)
  if (type === 'boolean') {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base leading-snug">{question}</CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleBooleanSelect(true)}
              variant="outline"
              className="h-auto py-3 bg-white hover:bg-green-50 hover:border-green-600 transition-all"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-sm">Sim</span>
              </div>
            </Button>
            <Button
              onClick={() => handleBooleanSelect(false)}
              variant="outline"
              className="h-auto py-3 bg-white hover:bg-red-50 hover:border-red-600 transition-all"
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

  // Card para Escolha Única
  if (type === 'single-choice') {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base leading-snug">{question}</CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleSingleChoiceSelect(option.id)}
                variant="outline"
                className="w-full h-auto py-2.5 px-3 justify-start bg-white hover:bg-blue-50 hover:border-blue-600 transition-all"
              >
                <div className="flex items-center gap-2.5 w-full min-w-0">
                  <span className="shrink-0">{option.icon || <Circle className="w-4 h-4 text-blue-600" />}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm leading-snug">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                        {option.description}
                      </p>
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

  // Card para Múltipla Escolha
  if (type === 'multiple-choice') {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base leading-snug">{question}</CardTitle>
              {description && (
                <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
              )}
            </div>
            {selectedValues.length > 0 && (
              <Badge className="bg-blue-600 text-white shrink-0 text-xs">
                {selectedValues.length} selecionado{selectedValues.length > 1 ? 's' : ''}
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
                  onClick={() => handleMultipleChoiceToggle(option.id)}
                  variant="outline"
                  className={`w-full h-auto py-2.5 px-3 justify-start transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-blue-600 hover:bg-blue-200'
                      : 'bg-white hover:bg-blue-50 hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full min-w-0">
                    <div
                      className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm leading-snug">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <Button
              onClick={() => onSelect(selectedValues)}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Seleção
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
