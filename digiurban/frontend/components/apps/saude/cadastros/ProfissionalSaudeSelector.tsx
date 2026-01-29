'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ProfissionalSaude {
  id: string;
  nome: string;
  cpf?: string;
  categoria: string;
  registroProfissional?: string;
  especialidades?: string[];
  status: string;
  telefone?: string;
  email?: string;
}

interface ProfissionalSaudeSelectorProps {
  onSelect: (profissional: ProfissionalSaude | null) => void;
  selectedProfissional?: ProfissionalSaude | null;
  label?: string;
  required?: boolean;
  categoria?: string; // Filtrar por categoria (MEDICO, ENFERMEIRO, etc.)
}

export function ProfissionalSaudeSelector({
  onSelect,
  selectedProfissional,
  label = 'Buscar Profissional de Saúde',
  required = true,
  categoria,
}: ProfissionalSaudeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProfissionalSaude[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      await searchProfissionais(searchTerm);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, categoria]);

  const searchProfissionais = async (term: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        search: term,
        status: 'ATIVO',
      });
      if (categoria) {
        params.append('categoria', categoria);
      }

      const response = await fetch(`/api/apps/saude/cadastros/profissionais?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.profissionais || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais de saúde:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (profissional: ProfissionalSaude) => {
    onSelect(profissional);
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

  const formatCPF = (cpf?: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800 border-green-200',
      FERIAS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      AFASTADO: 'bg-red-100 text-red-800 border-red-200',
      LICENCA: 'bg-orange-100 text-orange-800 border-orange-200',
      INATIVO: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ATIVO: 'Ativo',
      FERIAS: 'Férias',
      AFASTADO: 'Afastado',
      LICENCA: 'Licença',
      INATIVO: 'Inativo',
    };
    return labels[status] || status;
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      MEDICO: 'Médico(a)',
      ENFERMEIRO: 'Enfermeiro(a)',
      TECNICO_ENFERMAGEM: 'Téc. Enfermagem',
      DENTISTA: 'Dentista',
      PSICOLOGO: 'Psicólogo(a)',
      FISIOTERAPEUTA: 'Fisioterapeuta',
      NUTRICIONISTA: 'Nutricionista',
      FARMACEUTICO: 'Farmacêutico(a)',
      ASSISTENTE_SOCIAL: 'Assistente Social',
      AGENTE_SAUDE: 'Agente de Saúde',
    };
    return labels[categoria] || categoria;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="profissional-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Profissional Selecionado */}
      {selectedProfissional && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{selectedProfissional.nome}</h4>
                    <Badge className={getStatusBadgeColor(selectedProfissional.status)}>
                      {getStatusLabel(selectedProfissional.status)}
                    </Badge>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Categoria:</span>{' '}
                      {getCategoriaLabel(selectedProfissional.categoria)}
                    </div>
                    {selectedProfissional.registroProfissional && (
                      <div>
                        <span className="font-medium">Registro:</span>{' '}
                        {selectedProfissional.registroProfissional}
                      </div>
                    )}
                    {selectedProfissional.cpf && (
                      <div>
                        <span className="font-medium">CPF:</span> {formatCPF(selectedProfissional.cpf)}
                      </div>
                    )}
                    {selectedProfissional.especialidades && selectedProfissional.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProfissional.especialidades.map((esp, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {esp}
                          </Badge>
                        ))}
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
                aria-label="Remover profissional selecionado"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campo de Busca */}
      {!selectedProfissional && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="profissional-search"
              type="text"
              placeholder="Digite CPF, registro ou nome do profissional (mín. 3 caracteres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Buscar profissional de saúde"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Resultados da Busca */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {results.map((profissional) => (
                <button
                  key={profissional.id}
                  type="button"
                  onClick={() => handleSelect(profissional)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  aria-label={`Selecionar ${profissional.nome}`}
                >
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="font-medium text-gray-900 truncate">{profissional.nome}</div>
                        <Badge className={getStatusBadgeColor(profissional.status)} variant="outline">
                          {getStatusLabel(profissional.status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>{getCategoriaLabel(profissional.categoria)}</div>
                        {profissional.registroProfissional && (
                          <div>Registro: {profissional.registroProfissional}</div>
                        )}
                        {profissional.especialidades && profissional.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profissional.especialidades.slice(0, 3).map((esp, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                            {profissional.especialidades.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profissional.especialidades.length - 3}
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
          {showResults && results.length === 0 && !searching && searchTerm.length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
              Nenhum profissional de saúde encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {!selectedProfissional && (
        <p className="text-xs text-muted-foreground">
          Busque por CPF, registro profissional ou nome
          {categoria && ` (filtrado por ${getCategoriaLabel(categoria)})`}
        </p>
      )}
    </div>
  );
}
