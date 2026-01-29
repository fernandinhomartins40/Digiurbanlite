'use client';

import { useState, useEffect } from 'react';
import { Search, DoorOpen, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Sala {
  id: string;
  nome: string;
  numero?: string;
  tipo: string;
  andar?: string;
  capacidade?: number;
  equipamentos?: string[];
  status?: string;
  unidadeNome?: string;
}

interface SalaSelectorProps {
  onSelect: (sala: Sala | null) => void;
  selectedSala?: Sala | null;
  label?: string;
  required?: boolean;
  unidadeId?: string; // Filtrar por unidade
  tipo?: string; // Filtrar por tipo (CONSULTORIO, CIRURGICA, etc.)
}

export function SalaSelector({
  onSelect,
  selectedSala,
  label = 'Buscar Sala',
  required = true,
  unidadeId,
  tipo,
}: SalaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Sala[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Se não tiver unidadeId, não buscar
    if (!unidadeId && searchTerm.length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Se tiver unidadeId mas sem termo de busca, buscar todas as salas da unidade
    if (unidadeId && searchTerm.length === 0) {
      const delaySearch = setTimeout(async () => {
        await searchSalas('');
      }, 300);
      return () => clearTimeout(delaySearch);
    }

    // Busca com termo
    if (searchTerm.length >= 2 || unidadeId) {
      const delaySearch = setTimeout(async () => {
        await searchSalas(searchTerm);
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, unidadeId, tipo]);

  const searchSalas = async (term: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();

      if (term) {
        params.append('search', term);
      }
      if (unidadeId) {
        params.append('unidadeId', unidadeId);
      }
      if (tipo) {
        params.append('tipo', tipo);
      }

      const response = await fetch(`/api/apps/saude/cadastros/salas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.salas || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erro ao buscar salas:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (sala: Sala) => {
    onSelect(sala);
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

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      CONSULTORIO: 'bg-blue-100 text-blue-800 border-blue-200',
      CIRURGICA: 'bg-red-100 text-red-800 border-red-200',
      EMERGENCIA: 'bg-orange-100 text-orange-800 border-orange-200',
      EXAME: 'bg-green-100 text-green-800 border-green-200',
      INTERNACAO: 'bg-purple-100 text-purple-800 border-purple-200',
      PROCEDIMENTO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      OBSERVACAO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      ENFERMAGEM: 'bg-pink-100 text-pink-800 border-pink-200',
      ODONTOLOGIA: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      VACINA: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CONSULTORIO: 'Consultório',
      CIRURGICA: 'Cirúrgica',
      EMERGENCIA: 'Emergência',
      EXAME: 'Exames',
      INTERNACAO: 'Internação',
      PROCEDIMENTO: 'Procedimentos',
      OBSERVACAO: 'Observação',
      ENFERMAGEM: 'Enfermagem',
      ODONTOLOGIA: 'Odontologia',
      VACINA: 'Vacinação',
    };
    return labels[tipo] || tipo;
  };

  const getStatusBadgeColor = (status?: string) => {
    if (!status) return '';
    const colors: Record<string, string> = {
      DISPONIVEL: 'bg-green-100 text-green-800 border-green-200',
      EM_USO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      MANUTENCAO: 'bg-red-100 text-red-800 border-red-200',
      DESATIVADA: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || '';
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return '';
    const labels: Record<string, string> = {
      DISPONIVEL: 'Disponível',
      EM_USO: 'Em Uso',
      MANUTENCAO: 'Manutenção',
      DESATIVADA: 'Desativada',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="sala-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {!unidadeId && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Selecione uma unidade de saúde primeiro para buscar salas
        </div>
      )}

      {/* Sala Selecionada */}
      {selectedSala && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <DoorOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{selectedSala.nome}</h4>
                    <Badge className={getTipoBadgeColor(selectedSala.tipo)}>
                      {getTipoLabel(selectedSala.tipo)}
                    </Badge>
                    {selectedSala.status && (
                      <Badge className={getStatusBadgeColor(selectedSala.status)}>
                        {getStatusLabel(selectedSala.status)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    {selectedSala.numero && (
                      <div>
                        <span className="font-medium">Número:</span> {selectedSala.numero}
                      </div>
                    )}
                    {selectedSala.andar && (
                      <div>
                        <span className="font-medium">Andar:</span> {selectedSala.andar}
                      </div>
                    )}
                    {selectedSala.capacidade && (
                      <div>
                        <span className="font-medium">Capacidade:</span> {selectedSala.capacidade} pessoas
                      </div>
                    )}
                    {selectedSala.equipamentos && selectedSala.equipamentos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSala.equipamentos.slice(0, 3).map((equip, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {equip}
                          </Badge>
                        ))}
                        {selectedSala.equipamentos.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedSala.equipamentos.length - 3}
                          </Badge>
                        )}
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
                aria-label="Remover sala selecionada"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo de Busca */}
      {!selectedSala && unidadeId && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="sala-search"
              type="text"
              placeholder="Digite nome ou número da sala (ou deixe vazio para ver todas)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Buscar sala"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {results.map((sala) => (
                <button
                  key={sala.id}
                  type="button"
                  onClick={() => handleSelect(sala)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  aria-label={`Selecionar ${sala.nome}`}
                >
                  <div className="flex items-start gap-2">
                    <DoorOpen className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="font-medium text-gray-900">{sala.nome}</div>
                        <Badge className={getTipoBadgeColor(sala.tipo)} variant="outline">
                          {getTipoLabel(sala.tipo)}
                        </Badge>
                        {sala.status && (
                          <Badge className={getStatusBadgeColor(sala.status)} variant="outline">
                            {getStatusLabel(sala.status)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div className="flex gap-3">
                          {sala.numero && <span>Nº {sala.numero}</span>}
                          {sala.andar && <span>Andar {sala.andar}</span>}
                          {sala.capacidade && <span>Cap. {sala.capacidade}</span>}
                        </div>
                        {sala.equipamentos && sala.equipamentos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sala.equipamentos.slice(0, 2).map((equip, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {equip}
                              </Badge>
                            ))}
                            {sala.equipamentos.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{sala.equipamentos.length - 2}
                              </Badge>
                            )}
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
          {showResults && results.length === 0 && !searching && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
              {searchTerm ? `Nenhuma sala encontrada para "${searchTerm}"` : 'Nenhuma sala disponível nesta unidade'}
            </div>
          )}
        </div>
      )}

      {!selectedSala && unidadeId && (
        <p className="text-xs text-muted-foreground">
          Busque por nome ou número da sala
          {tipo && ` (filtrado por ${getTipoLabel(tipo)})`}
        </p>
      )}
    </div>
  );
}
