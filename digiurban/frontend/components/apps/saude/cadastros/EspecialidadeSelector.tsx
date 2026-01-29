'use client';

import { useState, useEffect } from 'react';
import { Search, Stethoscope, X, Loader2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Especialidade {
  id: string;
  nome: string;
  area?: string;
  tempoMedioConsulta?: number;
  descricao?: string;
}

interface EspecialidadeSelectorProps {
  onSelect: (especialidade: Especialidade | Especialidade[] | null) => void;
  selectedEspecialidade?: Especialidade | Especialidade[] | null;
  label?: string;
  required?: boolean;
  multiple?: boolean; // Permitir seleção múltipla
}

export function EspecialidadeSelector({
  onSelect,
  selectedEspecialidade,
  label = 'Buscar Especialidade',
  required = true,
  multiple = false,
}: EspecialidadeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Especialidade[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Especialidade[]>([]);

  useEffect(() => {
    // Inicializar selectedItems com base em selectedEspecialidade
    if (multiple && Array.isArray(selectedEspecialidade)) {
      setSelectedItems(selectedEspecialidade);
    } else if (!multiple && selectedEspecialidade && !Array.isArray(selectedEspecialidade)) {
      setSelectedItems([selectedEspecialidade]);
    } else {
      setSelectedItems([]);
    }
  }, [selectedEspecialidade, multiple]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      await searchEspecialidades(searchTerm);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const searchEspecialidades = async (term: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        search: term,
      });

      const response = await fetch(`/api/apps/saude/cadastros/especialidades?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.especialidades || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (especialidade: Especialidade) => {
    if (multiple) {
      const alreadySelected = selectedItems.some((item) => item.id === especialidade.id);
      let newSelection: Especialidade[];

      if (alreadySelected) {
        newSelection = selectedItems.filter((item) => item.id !== especialidade.id);
      } else {
        newSelection = [...selectedItems, especialidade];
      }

      setSelectedItems(newSelection);
      onSelect(newSelection);
    } else {
      setSelectedItems([especialidade]);
      onSelect(especialidade);
      setSearchTerm('');
      setShowResults(false);
      setResults([]);
    }
  };

  const handleRemove = (especialidadeId: string) => {
    if (multiple) {
      const newSelection = selectedItems.filter((item) => item.id !== especialidadeId);
      setSelectedItems(newSelection);
      onSelect(newSelection.length > 0 ? newSelection : null);
    } else {
      setSelectedItems([]);
      onSelect(null);
    }
  };

  const handleClearAll = () => {
    setSelectedItems([]);
    onSelect(null);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const formatTempo = (minutos?: number) => {
    if (!minutos) return '';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const getAreaColor = (area?: string) => {
    if (!area) return 'bg-gray-100 text-gray-800 border-gray-200';

    const colors: Record<string, string> = {
      'CLINICA_MEDICA': 'bg-blue-100 text-blue-800 border-blue-200',
      'CIRURGIA': 'bg-red-100 text-red-800 border-red-200',
      'PEDIATRIA': 'bg-pink-100 text-pink-800 border-pink-200',
      'GINECOLOGIA': 'bg-purple-100 text-purple-800 border-purple-200',
      'SAUDE_MENTAL': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'DIAGNOSTICO': 'bg-green-100 text-green-800 border-green-200',
      'ODONTOLOGIA': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colors[area] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isSelected = (especialidadeId: string) => {
    return selectedItems.some((item) => item.id === especialidadeId);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="especialidade-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Especialidades Selecionadas */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          {selectedItems.map((especialidade) => (
            <Card key={especialidade.id} className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm">{especialidade.nome}</h4>
                        {especialidade.area && (
                          <Badge className={getAreaColor(especialidade.area)} variant="outline">
                            {especialidade.area.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      {especialidade.tempoMedioConsulta && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Tempo médio:</span>{' '}
                          {formatTempo(especialidade.tempoMedioConsulta)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(especialidade.id)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={`Remover ${especialidade.nome}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {multiple && selectedItems.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="w-full"
            >
              Limpar todas ({selectedItems.length})
            </Button>
          )}
        </div>
      )}

      {/* Campo de Busca */}
      {(multiple || selectedItems.length === 0) && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="especialidade-search"
              type="text"
              placeholder="Digite o nome da especialidade (mín. 2 caracteres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Buscar especialidade"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {results.map((especialidade) => {
                const selected = isSelected(especialidade.id);
                return (
                  <button
                    key={especialidade.id}
                    type="button"
                    onClick={() => handleSelect(especialidade)}
                    className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      selected ? 'bg-blue-50' : ''
                    }`}
                    aria-label={`${selected ? 'Remover' : 'Selecionar'} ${especialidade.nome}`}
                  >
                    <div className="flex items-start gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="font-medium text-gray-900">{especialidade.nome}</div>
                          {selected && multiple && (
                            <Badge variant="default" className="bg-blue-600">
                              Selecionado
                            </Badge>
                          )}
                          {especialidade.area && (
                            <Badge className={getAreaColor(especialidade.area)} variant="outline">
                              {especialidade.area.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {especialidade.tempoMedioConsulta && (
                            <div>Tempo médio: {formatTempo(especialidade.tempoMedioConsulta)}</div>
                          )}
                          {especialidade.descricao && (
                            <div className="truncate">{especialidade.descricao}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Nenhum resultado */}
          {showResults && results.length === 0 && !searching && searchTerm.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
              Nenhuma especialidade encontrada para "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {selectedItems.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Busque por nome da especialidade
          {multiple && ' (permite seleção múltipla)'}
        </p>
      )}
    </div>
  );
}
