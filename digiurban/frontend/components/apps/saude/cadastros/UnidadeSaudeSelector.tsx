'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface UnidadeSaude {
  id: string;
  nome: string;
  cnes?: string;
  tipo: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  telefone?: string;
}

interface UnidadeSaudeSelectorProps {
  onSelect: (unidade: UnidadeSaude | null) => void;
  selectedUnidade?: UnidadeSaude | null;
  label?: string;
  required?: boolean;
  tipo?: string; // Filtrar por tipo (UBS, UPA, Hospital, etc.)
}

export function UnidadeSaudeSelector({
  onSelect,
  selectedUnidade,
  label = 'Buscar Unidade de Saúde',
  required = true,
  tipo,
}: UnidadeSaudeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UnidadeSaude[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      await searchUnidades(searchTerm);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, tipo]);

  const searchUnidades = async (term: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        search: term,
      });
      if (tipo) {
        params.append('tipo', tipo);
      }

      const response = await fetch(`/api/apps/saude/cadastros/unidades?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.unidades || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erro ao buscar unidades de saúde:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (unidade: UnidadeSaude) => {
    onSelect(unidade);
    setSearchTerm('');
    setShowResults(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const formatCNES = (cnes?: string) => {
    if (!cnes) return '';
    return cnes.replace(/(\d{7})/, '$1');
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      UBS: 'bg-green-100 text-green-800 border-green-200',
      UPA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      HOSPITAL: 'bg-blue-100 text-blue-800 border-blue-200',
      CLINICA: 'bg-purple-100 text-purple-800 border-purple-200',
      PRONTO_SOCORRO: 'bg-red-100 text-red-800 border-red-200',
      CAPS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      LABORATORIO: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      UBS: 'UBS',
      UPA: 'UPA',
      HOSPITAL: 'Hospital',
      CLINICA: 'Clínica',
      PRONTO_SOCORRO: 'Pronto Socorro',
      CAPS: 'CAPS',
      LABORATORIO: 'Laboratório',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="unidade-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Unidade Selecionada */}
      {selectedUnidade && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{selectedUnidade.nome}</h4>
                    <Badge className={getTipoBadgeColor(selectedUnidade.tipo)}>
                      {getTipoLabel(selectedUnidade.tipo)}
                    </Badge>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    {selectedUnidade.cnes && (
                      <div>
                        <span className="font-medium">CNES:</span> {formatCNES(selectedUnidade.cnes)}
                      </div>
                    )}
                    {selectedUnidade.endereco && (
                      <div>
                        <span className="font-medium">Endereço:</span> {selectedUnidade.endereco}
                        {selectedUnidade.bairro && `, ${selectedUnidade.bairro}`}
                        {selectedUnidade.cidade && ` - ${selectedUnidade.cidade}`}
                      </div>
                    )}
                    {selectedUnidade.telefone && (
                      <div>
                        <span className="font-medium">Telefone:</span> {selectedUnidade.telefone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Remover unidade selecionada"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo de Busca */}
      {!selectedUnidade && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="unidade-search"
              type="text"
              placeholder="Digite CNES ou nome da unidade (mín. 3 caracteres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Buscar unidade de saúde"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {results.map((unidade) => (
                <button
                  key={unidade.id}
                  type="button"
                  onClick={() => handleSelect(unidade)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  aria-label={`Selecionar ${unidade.nome}`}
                >
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-900 truncate">{unidade.nome}</div>
                        <Badge className={getTipoBadgeColor(unidade.tipo)} variant="outline">
                          {getTipoLabel(unidade.tipo)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {unidade.cnes && <div>CNES: {formatCNES(unidade.cnes)}</div>}
                        {unidade.endereco && (
                          <div className="truncate">
                            {unidade.endereco}
                            {unidade.bairro && `, ${unidade.bairro}`}
                          </div>
                        )}
                        {unidade.telefone && <div>Tel: {unidade.telefone}</div>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Nenhum resultado */}
          {showResults && results.length === 0 && !searching && searchTerm.length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
              Nenhuma unidade de saúde encontrada para "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {!selectedUnidade && (
        <p className="text-xs text-muted-foreground">
          Busque por CNES ou nome da unidade de saúde
          {tipo && ` (filtrado por ${getTipoLabel(tipo)})`}
        </p>
      )}
    </div>
  );
}
