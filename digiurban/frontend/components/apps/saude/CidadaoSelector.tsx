'use client';

import { useState, useEffect } from 'react';
import { Search, User, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Cidadao {
  id: string;
  name: string;
  cpf?: string;
  cns?: string; // Cartão Nacional de Saúde
  birthDate?: string;
  phone?: string;
  email?: string;
}

interface CidadaoSelectorProps {
  onSelect: (cidadao: Cidadao) => void;
  selectedCidadao?: Cidadao | null;
  label?: string;
  required?: boolean;
}

export function CidadaoSelector({
  onSelect,
  selectedCidadao,
  label = 'Buscar Cidadão',
  required = true,
}: CidadaoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Cidadao[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      await searchCidadaos(searchTerm);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const searchCidadaos = async (term: string) => {
    setSearching(true);
    try {
      const response = await fetch(`/api/citizens/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.citizens || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erro ao buscar cidadãos:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (cidadao: Cidadao) => {
    onSelect(cidadao);
    setSearchTerm('');
    setShowResults(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null as any);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNS = (cns?: string) => {
    if (!cns) return '';
    return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cidadao-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Cidadão Selecionado */}
      {selectedCidadao && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{selectedCidadao.name}</h4>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    {selectedCidadao.cpf && (
                      <div>
                        <span className="font-medium">CPF:</span> {formatCPF(selectedCidadao.cpf)}
                      </div>
                    )}
                    {selectedCidadao.cns && (
                      <div>
                        <span className="font-medium">CNS:</span> {formatCNS(selectedCidadao.cns)}
                      </div>
                    )}
                    {selectedCidadao.birthDate && (
                      <div>
                        <span className="font-medium">Idade:</span> {calculateAge(selectedCidadao.birthDate)}
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
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo de Busca */}
      {!selectedCidadao && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="cidadao-search"
              type="text"
              placeholder="Digite CPF, CNS ou nome do cidadão (mín. 3 caracteres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {results.map((cidadao) => (
                <button
                  key={cidadao.id}
                  type="button"
                  onClick={() => handleSelect(cidadao)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{cidadao.name}</div>
                      <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                        {cidadao.cpf && <div>CPF: {formatCPF(cidadao.cpf)}</div>}
                        {cidadao.cns && <div>CNS: {formatCNS(cidadao.cns)}</div>}
                        {cidadao.birthDate && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {calculateAge(cidadao.birthDate)}
                            </Badge>
                          </div>
                        )}
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
              Nenhum cidadão encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {!selectedCidadao && (
        <p className="text-xs text-muted-foreground">
          Busque por CPF (000.000.000-00), CNS (000 0000 0000 0000) ou nome completo
        </p>
      )}
    </div>
  );
}
