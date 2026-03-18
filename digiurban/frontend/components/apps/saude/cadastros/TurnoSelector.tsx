'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, X, Loader2, ChevronDown, Sun, Sunset, Moon, MoonStar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Turno {
  id: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  cor?: string;
  descricao?: string;
  ativo?: boolean;
}

interface TurnoSelectorProps {
  onSelect: (turno: Turno | null) => void;
  selectedTurno?: Turno | null;
  label?: string;
  required?: boolean;
}

export function TurnoSelector({
  onSelect,
  selectedTurno,
  label = 'Selecionar Turno',
  required = true,
}: TurnoSelectorProps) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apps/saude/cadastros/turnos?ativo=true');
      if (response.ok) {
        const data = await response.json();
        setTurnos(data.turnos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar turnos:', error);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (turno: Turno) => {
    onSelect(turno);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
  };

  const formatHora = (hora: string) => {
    // Formata HH:mm:ss para HH:mm
    return hora.substring(0, 5);
  };

  const getCorBadge = (cor?: string) => {
    if (!cor) return 'bg-gray-100 text-gray-800 border-gray-200';

    // Se for cor hexadecimal
    if (cor.startsWith('#')) {
      return '';
    }

    // Cores predefinidas
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colors[cor.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTurnoIcono = (nome: string) => {
    const lower = nome.toLowerCase();
    if (lower.includes('manha') || lower.includes('man\u00e3')) return Sun;
    if (lower.includes('tarde')) return Sunset;
    if (lower.includes('noite')) return Moon;
    if (lower.includes('madrugada')) return MoonStar;
    return Clock;
  };

  const SelectedTurnoIcon = selectedTurno ? getTurnoIcono(selectedTurno.nome) : Clock;
  const filteredTurnos = turnos.filter((turno) =>
    turno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="turno-selector">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Turno Selecionado */}
      {selectedTurno && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SelectedTurnoIcon className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{selectedTurno.nome}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge
                      className={getCorBadge(selectedTurno.cor)}
                      style={
                        selectedTurno.cor?.startsWith('#')
                          ? {
                              backgroundColor: selectedTurno.cor + '20',
                              color: selectedTurno.cor,
                              borderColor: selectedTurno.cor + '40',
                            }
                          : undefined
                      }
                    >
                      {formatHora(selectedTurno.horaInicio)} - {formatHora(selectedTurno.horaFim)}
                    </Badge>
                  </div>
                  {selectedTurno.descricao && (
                    <p className="text-xs text-gray-500 mt-1">{selectedTurno.descricao}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Remover turno selecionado"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Turno */}
      {!selectedTurno && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full justify-between"
            aria-label="Abrir seletor de turno"
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              {loading ? 'Carregando turnos...' : 'Selecione um turno'}
            </span>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            )}
          </Button>

          {/* Dropdown com Turnos */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {/* Campo de busca no dropdown */}
              {turnos.length > 5 && (
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Filtrar turnos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-8"
                      aria-label="Filtrar turnos"
                    />
                  </div>
                </div>
              )}

              {/* Lista de Turnos */}
              <div className="max-h-64 overflow-y-auto">
                {filteredTurnos.length > 0 ? (
                  filteredTurnos.map((turno) => {
                    const TurnoIcon = getTurnoIcono(turno.nome);
                    return (
                    <button
                      key={turno.id}
                      type="button"
                      onClick={() => handleSelect(turno)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      aria-label={`Selecionar turno ${turno.nome}`}
                    >
                      <div className="flex items-start gap-2">
                        <TurnoIcon className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 mb-1">{turno.nome}</div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getCorBadge(turno.cor)}
                              variant="outline"
                              style={
                                turno.cor?.startsWith('#')
                                  ? {
                                      backgroundColor: turno.cor + '20',
                                      color: turno.cor,
                                      borderColor: turno.cor + '40',
                                    }
                                  : undefined
                              }
                            >
                              {formatHora(turno.horaInicio)} - {formatHora(turno.horaFim)}
                            </Badge>
                          </div>
                          {turno.descricao && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{turno.descricao}</p>
                          )}
                        </div>
                      </div>
                    </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchTerm ? `Nenhum turno encontrado para "${searchTerm}"` : 'Nenhum turno disponÃƒÂ­vel'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedTurno && !loading && (
        <p className="text-xs text-muted-foreground">
          Selecione um turno de trabalho ({turnos.length} disponÃƒÂ­veis)
        </p>
      )}

      {/* Overlay para fechar dropdown ao clicar fora */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
