'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchCitizen, type Citizen } from '@/hooks/useSearchCitizen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Mail, MapPin, X, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CitizenSelectorProps {
  selectedCitizen: Citizen | null;
  onCitizenSelect: (citizen: Citizen | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  showFullDetails?: boolean;
}

export function CitizenSelector({
  selectedCitizen,
  onCitizenSelect,
  disabled = false,
  required = true,
  label = 'Cidadão',
  showFullDetails = true,
}: CitizenSelectorProps) {
  const { searchByName, loading: searchLoading } = useSearchCitizen();
  const [nameSearch, setNameSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Citizen[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Busca em tempo real
  const performSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setNotFound(false);
      return;
    }

    try {
      setSearchError(null);
      const results = await searchByName(searchTerm);
      setSearchResults(results);
      setShowResults(true);
      setNotFound(results.length === 0);
    } catch (error) {
      setSearchError('Erro ao buscar cidadãos. Tente novamente.');
      setSearchResults([]);
    }
  }, [searchByName]);

  const handleNameChange = (value: string) => {
    setNameSearch(value);
    setSearchError(null);

    // Debounce da busca
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setNotFound(false);
    }
  };

  const handleSelectCitizen = (citizen: Citizen) => {
    onCitizenSelect(citizen);
    setNameSearch('');
    setSearchResults([]);
    setShowResults(false);
    setNotFound(false);
  };

  const handleRemoveCitizen = () => {
    onCitizenSelect(null);
    setNotFound(false);
    setNameSearch('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {!selectedCitizen ? (
        <div className="relative" ref={resultsRef}>
          <Card className={disabled ? 'opacity-50' : ''}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchName">Buscar por Nome</Label>
                <div className="relative">
                  <Input
                    id="searchName"
                    placeholder="Digite o nome do cidadão (mínimo 3 caracteres)"
                    value={nameSearch}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={disabled}
                    className="pr-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!searchLoading && nameSearch.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                {searchError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {searchError}
                  </p>
                )}
              </div>

              {/* Dica de Uso */}
              {!notFound && nameSearch.length < 3 && (
                <div className="text-sm text-gray-500 flex items-start space-x-2">
                  <Search className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Digite o nome do cidadão para buscar. Os resultados aparecerão automaticamente conforme você digita.
                  </p>
                </div>
              )}

              {/* Cidadão Não Encontrado */}
              {notFound && nameSearch.length >= 3 && (
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">Nenhum Cidadão Encontrado</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Não encontramos nenhum cidadão cadastrado com o nome <strong>{nameSearch}</strong>.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    O cidadão deve estar previamente cadastrado no sistema antes de ser vinculado como produtor rural.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Resultados */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 shadow-lg border-2 max-h-80 overflow-y-auto">
              <CardContent className="p-2">
                {searchResults.map((citizen) => (
                  <button
                    key={citizen.id}
                    type="button"
                    onClick={() => handleSelectCitizen(citizen)}
                    className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors border-b last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{citizen.name}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          CPF: {formatCPF(citizen.cpf)}
                        </div>
                        {citizen.email && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {citizen.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCitizen.name}</h3>
                    <Badge variant="outline" className="text-green-700 border-green-300 mt-1">
                      CPF: {formatCPF(selectedCitizen.cpf)}
                    </Badge>
                  </div>
                </div>

                {showFullDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {selectedCitizen.email && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedCitizen.email}</span>
                      </div>
                    )}
                    {selectedCitizen.phone && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedCitizen.phone}</span>
                      </div>
                    )}
                    {selectedCitizen.address && (
                      <div className="flex items-start space-x-2 text-gray-700 md:col-span-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>
                          {typeof selectedCitizen.address === 'string'
                            ? selectedCitizen.address
                            : `${selectedCitizen.address?.logradouro || ''}, ${selectedCitizen.address?.numero || ''} - ${selectedCitizen.address?.bairro || ''}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCitizen}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
