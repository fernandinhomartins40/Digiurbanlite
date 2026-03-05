'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Pill, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MedicamentoRename {
  id: string;
  nome: string;
  principioAtivo: string;
  concentracao: string;
  tipo: string;
  apresentacao: string;
  catmat: string;
  isControlado: boolean;
}

interface MedicamentoRenameAutocompleteProps {
  onSelect: (medicamento: MedicamentoRename) => void;
  selectedMedicamento?: MedicamentoRename | null;
}

export default function MedicamentoRenameAutocomplete({
  onSelect,
  selectedMedicamento,
}: MedicamentoRenameAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicamentoRename[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar medicamentos com debounce
  const searchMedicamentos = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saude/farmacia/medicamentos/rename/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar medicamentos');
      }

      const data = await response.json();
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Erro ao buscar medicamentos RENAME:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchMedicamentos(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMedicamentos]);

  const handleSelect = (medicamento: MedicamentoRename) => {
    onSelect(medicamento);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null as any);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      COMPRIMIDO: '💊 Comprimido',
      CAPSULA: '⚪ Cápsula',
      XAROPE: '🥤 Xarope',
      SOLUCAO: '💧 Solução',
      SUSPENSAO: '🧪 Suspensão',
      POMADA: '🧴 Pomada',
      CREME: '🧴 Creme',
      INJETAVEL: '💉 Injetável',
      AEROSOL: '🌬️ Aerosol',
      OUTRO: '📦 Outro',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="medicamento-rename-search">
        Buscar Medicamento da RENAME *
      </Label>

      {/* Campo selecionado */}
      {selectedMedicamento && (
        <div className="mb-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Pill className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-green-900">{selectedMedicamento.nome}</p>
                  {selectedMedicamento.isControlado && (
                    <Badge variant="destructive" className="text-xs">
                      Controlado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Princípio Ativo:</span>{' '}
                  {selectedMedicamento.principioAtivo}
                </p>
                <p className="text-sm text-green-600">
                  {getTipoLabel(selectedMedicamento.tipo)}
                  {selectedMedicamento.concentracao && ` • ${selectedMedicamento.concentracao}`}
                </p>
                {selectedMedicamento.catmat && (
                  <p className="text-xs text-green-500">
                    CATMAT: {selectedMedicamento.catmat}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Alterar
            </button>
          </div>
        </div>
      )}

      {/* Campo de busca */}
      {!selectedMedicamento && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              id="medicamento-rename-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Digite o nome do medicamento ou princípio ativo..."
              className="pl-10"
              autoComplete="off"
            />
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* Dropdown de resultados */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {results.map((medicamento) => (
                <button
                  key={medicamento.id}
                  type="button"
                  onClick={() => handleSelect(medicamento)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {medicamento.nome}
                        </p>
                        {medicamento.isControlado && (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            Controlado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Princípio Ativo:</span>{' '}
                        {medicamento.principioAtivo}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getTipoLabel(medicamento.tipo)}</span>
                        {medicamento.concentracao && (
                          <>
                            <span>•</span>
                            <span>{medicamento.concentracao}</span>
                          </>
                        )}
                      </div>
                      {medicamento.catmat && (
                        <p className="text-xs text-gray-400 mt-1">
                          CATMAT: {medicamento.catmat}
                        </p>
                      )}
                    </div>
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Nenhum resultado */}
          {showDropdown && !loading && query.length >= 2 && results.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              <p className="text-sm">Nenhum medicamento encontrado na RENAME</p>
              <p className="text-xs mt-1">
                Tente buscar por outro nome ou princípio ativo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      {!selectedMedicamento && (
        <p className="text-xs text-muted-foreground">
          Busque por nome comercial, princípio ativo ou código CATMAT do medicamento
        </p>
      )}
    </div>
  );
}
