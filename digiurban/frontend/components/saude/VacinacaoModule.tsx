'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Syringe, Plus, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Vacina {
  id: string;
  nome: string;
  faixaEtariaInicio?: number; // em meses
  faixaEtariaFim?: number;
  doses: number;
  intervaloDosDias?: number;
}

interface VacinaAplicada {
  id: string;
  vacinaId: string;
  vacina: Vacina;
  doseNumero: number;
  dataAplicacao: Date;
  lote: string;
  fabricante: string;
  localAplicacao: string;
  profissionalId: string;
  observacoes?: string;
}

interface VacinacaoModuleProps {
  citizenId: string;
  idade: number; // em meses
}

export function VacinacaoModule({ citizenId, idade }: VacinacaoModuleProps) {
  const [loading, setLoading] = useState(true);
  const [vacinasDisponiveis, setVacinasDisponiveis] = useState<Vacina[]>([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState<VacinaAplicada[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVacina, setSelectedVacina] = useState<Vacina | null>(null);
  const [doseNumero, setDoseNumero] = useState(1);
  const [dataAplicacao, setDataAplicacao] = useState('');
  const [lote, setLote] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [localAplicacao, setLocalAplicacao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    loadVacinas();
    loadVacinasAplicadas();
  }, [citizenId]);

  const loadVacinas = async () => {
    try {
      const response = await fetch(`/api/saude/vacinas?idade=${idade}`);
      if (response.ok) {
        const data = await response.json();
        setVacinasDisponiveis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar vacinas:', error);
    }
  };

  const loadVacinasAplicadas = async () => {
    try {
      const response = await fetch(`/api/saude/vacinas-aplicadas?citizenId=${citizenId}`);
      if (response.ok) {
        const data = await response.json();
        setVacinasAplicadas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar vacinas aplicadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vacina: Vacina) => {
    setSelectedVacina(vacina);
    setDialogOpen(true);
    setDataAplicacao(new Date().toISOString().split('T')[0]);
  };

  const handleSalvarVacinacao = async () => {
    if (!selectedVacina || !dataAplicacao || !lote || !fabricante || !localAplicacao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/saude/vacinas-aplicadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId,
          vacinaId: selectedVacina.id,
          doseNumero,
          dataAplicacao,
          lote,
          fabricante,
          localAplicacao,
          observacoes,
        }),
      });

      if (response.ok) {
        alert('Vacinação registrada com sucesso!');
        setDialogOpen(false);
        resetForm();
        loadVacinasAplicadas();
      } else {
        throw new Error('Erro ao registrar vacinação');
      }
    } catch (error) {
      console.error('Erro ao salvar vacinação:', error);
      alert('Erro ao registrar vacinação');
    }
  };

  const resetForm = () => {
    setSelectedVacina(null);
    setDoseNumero(1);
    setDataAplicacao('');
    setLote('');
    setFabricante('');
    setLocalAplicacao('');
    setObservacoes('');
  };

  const getStatusVacina = (vacina: Vacina) => {
    const aplicadas = vacinasAplicadas.filter((v) => v.vacinaId === vacina.id);

    if (aplicadas.length === 0) {
      return { status: 'pendente', label: 'Pendente', icon: XCircle, color: 'text-red-600' };
    }

    if (aplicadas.length < vacina.doses) {
      return {
        status: 'parcial',
        label: `${aplicadas.length}/${vacina.doses} doses`,
        icon: Clock,
        color: 'text-yellow-600',
      };
    }

    return {
      status: 'completo',
      label: 'Completo',
      icon: CheckCircle,
      color: 'text-green-600',
    };
  };

  const isVacinaAtrasada = (vacina: Vacina) => {
    const status = getStatusVacina(vacina);
    if (status.status === 'completo') return false;

    // Considera atrasada se passou da faixa etária
    if (vacina.faixaEtariaFim && idade > vacina.faixaEtariaFim) {
      return true;
    }

    return false;
  };

  const getFaixaEtaria = () => {
    if (idade < 12) return 'LACTENTE';
    if (idade < 24) return 'CRIANCA_1_2_ANOS';
    if (idade < 60) return 'CRIANCA_2_5_ANOS';
    if (idade < 144) return 'CRIANCA_5_12_ANOS';
    if (idade < 216) return 'ADOLESCENTE';
    if (idade < 720) return 'ADULTO';
    return 'IDOSO';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando calendário vacinal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendário Vacinal</h2>
          <p className="text-sm text-gray-500">Faixa Etária: {getFaixaEtaria()}</p>
        </div>
      </div>

      {/* Grid de Vacinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vacinasDisponiveis.map((vacina) => {
          const status = getStatusVacina(vacina);
          const atrasada = isVacinaAtrasada(vacina);
          const Icon = status.icon;

          return (
            <Card
              key={vacina.id}
              className={atrasada ? 'border-red-300 bg-red-50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{vacina.nome}</CardTitle>
                  <Icon className={`h-5 w-5 ${status.color}`} />
                </div>
                {atrasada && (
                  <Badge variant="destructive" className="w-fit">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Atrasada
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="text-gray-600">Doses: {vacina.doses}</div>
                  <div className={`font-medium ${status.color}`}>{status.label}</div>
                </div>

                {/* Doses aplicadas */}
                {vacinasAplicadas
                  .filter((v) => v.vacinaId === vacina.id)
                  .map((aplicada) => (
                    <div
                      key={aplicada.id}
                      className="text-xs bg-green-50 border border-green-200 rounded p-2"
                    >
                      <div className="font-medium">
                        {aplicada.doseNumero}ª dose -{' '}
                        {new Date(aplicada.dataAplicacao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-gray-600">
                        Lote: {aplicada.lote} - {aplicada.fabricante}
                      </div>
                    </div>
                  ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOpenDialog(vacina)}
                  disabled={status.status === 'completo'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Aplicação
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Registro de Aplicação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-blue-600" />
              Registrar Aplicação de Vacina
            </DialogTitle>
          </DialogHeader>

          {selectedVacina && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-semibold text-blue-900">{selectedVacina.nome}</div>
                <div className="text-sm text-blue-700">
                  Esquema: {selectedVacina.doses} dose(s)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doseNumero">Número da Dose *</Label>
                  <Select
                    value={doseNumero.toString()}
                    onValueChange={(v) => setDoseNumero(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedVacina.doses }, (_, i) => i + 1).map(
                        (num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}ª dose
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAplicacao">Data de Aplicação *</Label>
                  <Input
                    id="dataAplicacao"
                    type="date"
                    value={dataAplicacao}
                    onChange={(e) => setDataAplicacao(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lote">Lote *</Label>
                  <Input
                    id="lote"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="Número do lote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fabricante">Fabricante *</Label>
                  <Input
                    id="fabricante"
                    value={fabricante}
                    onChange={(e) => setFabricante(e.target.value)}
                    placeholder="Ex: Instituto Butantan"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="localAplicacao">Local de Aplicação *</Label>
                  <Select value={localAplicacao} onValueChange={setLocalAplicacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELTÓIDE_ESQUERDO">Deltoide Esquerdo</SelectItem>
                      <SelectItem value="DELTÓIDE_DIREITO">Deltoide Direito</SelectItem>
                      <SelectItem value="VASTO_LATERAL_ESQUERDO">
                        Vasto Lateral Esquerdo
                      </SelectItem>
                      <SelectItem value="VASTO_LATERAL_DIREITO">
                        Vasto Lateral Direito
                      </SelectItem>
                      <SelectItem value="DORSO_GLUTEO">Dorso Glúteo</SelectItem>
                      <SelectItem value="VENTROGLUTEO">Ventroglúteo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Reações adversas, intercorrências..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarVacinacao}>
              <Syringe className="mr-2 h-4 w-4" />
              Registrar Aplicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
