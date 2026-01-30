'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { User, X, Search, Loader2 } from 'lucide-react';
import { TipoAtendimentoFila } from '@/types/saude';

interface Cidadao {
  id: string;
  name: string;
  cpf: string;
  birthDate?: Date;
  cns?: string;
}

interface Profissional {
  id: string;
  name: string;
  especialidade?: string;
  cbo?: string;
}

interface EquipeSaude {
  id: string;
  nome: string;
  ine: string;
}

interface AdicionarAtendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  unidadeId: string;
}

export function AdicionarAtendimentoDialog({
  open,
  onOpenChange,
  onSubmit,
  unidadeId,
}: AdicionarAtendimentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadaos, setCidadaos] = useState<Cidadao[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [equipes, setEquipes] = useState<EquipeSaude[]>([]);

  const [selectedCidadao, setSelectedCidadao] = useState<Cidadao | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeSaude | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimentoFila>('DEMANDA_ESPONTANEA');
  const [motivoBusca, setMotivoBusca] = useState('');
  const [vacinacao, setVacinacao] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset estados quando abre o modal
      setSearchTerm('');
      setCidadaos([]);
      loadProfissionais();
      loadEquipes();
    }
  }, [open, unidadeId]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const timer = setTimeout(() => {
        searchCidadaos(searchTerm);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setCidadaos([]);
    }
  }, [searchTerm]);

  const searchCidadaos = async (term: string) => {
    try {
      setSearching(true);
      const response = await fetch(
        `/api/admin/citizens/search?q=${encodeURIComponent(term)}&limit=10`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        // Suportar múltiplos formatos de resposta
        const citizensList = data.citizens || data.data?.citizens || data.data || [];
        setCidadaos(Array.isArray(citizensList) ? citizensList : []);
      }
    } catch (error) {
      console.error('Erro ao buscar cidadãos:', error);
      setCidadaos([]);
    } finally {
      setSearching(false);
    }
  };

  const loadProfissionais = async () => {
    try {
      const response = await fetch(`/api/saude/profissionais?unidadeId=${unidadeId}`);
      if (response.ok) {
        const data = await response.json();
        setProfissionais(data);
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const loadEquipes = async () => {
    try {
      const response = await fetch(`/api/saude/equipes?unidadeId=${unidadeId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const handleSelectProfissional = (profissionalId: string) => {
    setSelectedProfissional(profissionalId);

    // Auto-preencher equipe do profissional (se houver)
    // TODO: Implementar lógica de busca da equipe do profissional
    if (equipes.length > 0 && !selectedEquipe) {
      setSelectedEquipe(equipes[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCidadao || !selectedProfissional || !motivoBusca) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        citizenId: selectedCidadao.id,
        profissionalId: selectedProfissional,
        equipeId: selectedEquipe?.id,
        tipoAtendimento,
        motivoBusca,
        vacinacao,
        unidadeId,
      });

      // Resetar formulário
      setSelectedCidadao(null);
      setSelectedProfissional('');
      setSelectedEquipe(null);
      setTipoAtendimento('DEMANDA_ESPONTANEA');
      setMotivoBusca('');
      setVacinacao(false);
      setSearchTerm('');

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar à fila:', error);
      alert('Erro ao adicionar paciente à fila');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Paciente à Fila</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Buscar Cidadão */}
          <div className="space-y-2">
            <Label>Cidadão *</Label>

            {!selectedCidadao ? (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Digite o nome, CPF ou CNS do cidadão (mín. 3 caracteres)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="off"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Resultados da Busca */}
                {cidadaos.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {cidadaos.map((cidadao) => (
                      <button
                        key={cidadao.id}
                        type="button"
                        onClick={() => {
                          setSelectedCidadao(cidadao);
                          setSearchTerm('');
                          setCidadaos([]);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{cidadao.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          CPF: {cidadao.cpf}
                          {cidadao.cns && ` • CNS: ${cidadao.cns}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sem resultados */}
                {searchTerm.length >= 3 && !searching && cidadaos.length === 0 && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200 mt-2">
                    Nenhum cidadão encontrado com este termo
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{selectedCidadao.name}</h4>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <div>CPF: {selectedCidadao.cpf}</div>
                        {selectedCidadao.cns && <div>CNS: {selectedCidadao.cns}</div>}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCidadao(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <Label htmlFor="profissional">Profissional *</Label>
            <Select value={selectedProfissional} onValueChange={handleSelectProfissional}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                    {prof.especialidade && ` - ${prof.especialidade}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipe */}
          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe</Label>
            <Select
              value={selectedEquipe?.id || ''}
              onValueChange={(value) => {
                const equipe = equipes.find((e) => e.id === value);
                setSelectedEquipe(equipe || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome} - INE: {equipe.ine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Atendimento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Atendimento *</Label>
            <Select
              value={tipoAtendimento}
              onValueChange={(value) => setTipoAtendimento(value as TipoAtendimentoFila)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEMANDA_ESPONTANEA">Demanda Espontânea</SelectItem>
                <SelectItem value="AGENDADO">Agendado</SelectItem>
                <SelectItem value="URGENCIA">Urgência</SelectItem>
                <SelectItem value="RETORNO">Retorno</SelectItem>
                <SelectItem value="RENOVACAO_RECEITA">Renovação de Receita</SelectItem>
                <SelectItem value="VACINACAO">Vacinação</SelectItem>
                <SelectItem value="PROCEDIMENTO">Procedimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Motivo da Busca */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Busca *</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva brevemente o motivo da procura do atendimento..."
              value={motivoBusca}
              onChange={(e) => setMotivoBusca(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Vacinação */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vacinacao"
              checked={vacinacao}
              onCheckedChange={(checked) => setVacinacao(checked as boolean)}
            />
            <Label
              htmlFor="vacinacao"
              className="text-sm font-normal cursor-pointer"
            >
              Também necessita de vacinação
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar à Fila'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
