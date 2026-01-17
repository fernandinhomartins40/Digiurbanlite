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
        <CardHeader>
          <CardTitle className="text-base">{question}</CardTitle>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleBooleanSelect(true)}
              variant="outline"
              className="h-auto py-4 bg-white hover:bg-green-50 hover:border-green-600 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <Check className="w-6 h-6 text-green-600" />
                <span className="font-medium">Sim</span>
              </div>
            </Button>
            <Button
              onClick={() => handleBooleanSelect(false)}
              variant="outline"
              className="h-auto py-4 bg-white hover:bg-red-50 hover:border-red-600 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <X className="w-6 h-6 text-red-600" />
                <span className="font-medium">Não</span>
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
        <CardHeader>
          <CardTitle className="text-base">{question}</CardTitle>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleSingleChoiceSelect(option.id)}
                variant="outline"
                className="w-full h-auto py-3 px-4 justify-start bg-white hover:bg-blue-50 hover:border-blue-600 transition-all"
              >
                <div className="flex items-center gap-3 w-full">
                  {option.icon || <Circle className="w-5 h-5 text-blue-600" />}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
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
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{question}</CardTitle>
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
            {selectedValues.length > 0 && (
              <Badge className="bg-blue-600 text-white">
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
                  className={`w-full h-auto py-3 px-4 justify-start transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-blue-600 hover:bg-blue-200'
                      : 'bg-white hover:bg-blue-50 hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
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
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
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
