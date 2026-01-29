'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
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

  const [openCidadao, setOpenCidadao] = useState(false);
  const [selectedCidadao, setSelectedCidadao] = useState<Cidadao | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeSaude | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimentoFila>('DEMANDA_ESPONTANEA');
  const [motivoBusca, setMotivoBusca] = useState('');
  const [vacinacao, setVacinacao] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfissionais();
      loadEquipes();
    }
  }, [open, unidadeId]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchCidadaos(searchTerm);
    }
  }, [searchTerm]);

  const searchCidadaos = async (term: string) => {
    try {
      setSearching(true);
      const response = await fetch(
        `/api/citizens/search?term=${encodeURIComponent(term)}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setCidadaos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar cidadãos:', error);
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
            <Popover open={openCidadao} onOpenChange={setOpenCidadao}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCidadao}
                  className="w-full justify-between"
                >
                  {selectedCidadao ? (
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{selectedCidadao.name}</span>
                      <span className="text-xs text-gray-500">
                        CPF: {selectedCidadao.cpf}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500">Buscar cidadão...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar por nome, CPF ou CNS..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandEmpty>
                    {searching ? (
                      <div className="flex items-center justify-center gap-2 py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Buscando...</span>
                      </div>
                    ) : searchTerm.length < 3 ? (
                      <div className="py-6 text-center text-sm">
                        Digite pelo menos 3 caracteres para buscar
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm">
                        Nenhum cidadão encontrado
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {cidadaos.map((cidadao) => (
                      <CommandItem
                        key={cidadao.id}
                        value={cidadao.id}
                        onSelect={() => {
                          setSelectedCidadao(cidadao);
                          setOpenCidadao(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCidadao?.id === cidadao.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{cidadao.name}</span>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>CPF: {cidadao.cpf}</span>
                            {cidadao.cns && <span>CNS: {cidadao.cns}</span>}
                            {cidadao.birthDate && (
                              <span>
                                Nasc: {new Date(cidadao.birthDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
