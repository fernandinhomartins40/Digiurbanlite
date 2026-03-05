'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, ArrowRight, Database, PenTool, Pill, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MedicamentoRenameAutocomplete, {
  MedicamentoRename,
} from '@/components/saude/farmacia/MedicamentoRenameAutocomplete';

type TipoCadastro = 'rename' | 'manual';

export default function NovoEstoquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>('rename');
  const [medicamentoRename, setMedicamentoRename] = useState<MedicamentoRename | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    principioAtivo: '',
    concentracao: '',
    formaFarmaceutica: 'COMPRIMIDO',
    fabricante: '',
    lote: '',
    validade: '',
    quantidade: '',
    estoqueMinimo: '',
    localizacao: '',
    observacoes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleMedicamentoRenameSelect = (medicamento: MedicamentoRename) => {
    setMedicamentoRename(medicamento);
    // Pré-preencher campos do formulário com dados da RENAME
    if (medicamento) {
      setFormData({
        ...formData,
        nome: medicamento.nome,
        principioAtivo: medicamento.principioAtivo,
        concentracao: medicamento.concentracao || '',
        formaFarmaceutica: medicamento.tipo || 'COMPRIMIDO',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        lote: formData.lote,
        validade: formData.validade,
        quantidade: parseInt(formData.quantidade),
        estoqueMinimo: parseInt(formData.estoqueMinimo),
        localizacao: formData.localizacao || undefined,
        observacoes: formData.observacoes || undefined,
      };

      // Se for RENAME, enviar ID do medicamento
      if (tipoCadastro === 'rename' && medicamentoRename) {
        payload.medicamentoId = medicamentoRename.id;
        payload.isRename = true;
      } else {
        // Se for manual, enviar todos os dados do medicamento
        payload.nome = formData.nome;
        payload.principioAtivo = formData.principioAtivo;
        payload.concentracao = formData.concentracao || undefined;
        payload.formaFarmaceutica = formData.formaFarmaceutica;
        payload.fabricante = formData.fabricante || undefined;
        payload.isRename = false;
      }

      const response = await fetch('/api/saude/farmacia/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao cadastrar medicamento');
      }

      alert('Medicamento cadastrado no estoque com sucesso!');
      router.push('/admin/apps/saude/farmacia/estoque');
    } catch (error: any) {
      console.error('Erro ao cadastrar medicamento:', error);
      alert(`Erro ao cadastrar medicamento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Validações comuns
    const commonValid =
      formData.lote &&
      formData.validade &&
      formData.quantidade &&
      formData.estoqueMinimo;

    if (tipoCadastro === 'rename') {
      return commonValid && medicamentoRename !== null;
    } else {
      return (
        commonValid &&
        formData.nome &&
        formData.principioAtivo &&
        formData.formaFarmaceutica
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-green-600" />
            Novo Medicamento no Estoque
          </h1>
          <p className="text-gray-500 mt-1">
            Cadastre um novo item no estoque da farmácia municipal
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Cadastro */}
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Tipo de Cadastro
            </CardTitle>
            <CardDescription>
              Escolha entre usar a base de medicamentos da RENAME ou cadastro manual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={tipoCadastro}
              onValueChange={(value) => {
                setTipoCadastro(value as TipoCadastro);
                setMedicamentoRename(null);
                // Resetar campos ao mudar o tipo
                setFormData({
                  ...formData,
                  nome: '',
                  principioAtivo: '',
                  concentracao: '',
                  formaFarmaceutica: 'COMPRIMIDO',
                  fabricante: '',
                });
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="rename"
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tipoCadastro === 'rename'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <RadioGroupItem value="rename" id="rename" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      Medicamento da RENAME
                    </span>
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Base oficial com 100+ medicamentos do SUS. Mais rápido e padronizado.
                  </p>
                </div>
              </Label>

              <Label
                htmlFor="manual"
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tipoCadastro === 'manual'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">Cadastro Manual</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Para medicamentos não incluídos na lista oficial da RENAME.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* MODO RENAME - Autocomplete */}
        {tipoCadastro === 'rename' && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Medicamento</CardTitle>
              <CardDescription>
                Busque o medicamento na base oficial da RENAME 2024
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedicamentoRenameAutocomplete
                onSelect={handleMedicamentoRenameSelect}
                selectedMedicamento={medicamentoRename}
              />

              {medicamentoRename && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Medicamento selecionado da RENAME! Agora preencha os dados de lote,
                    validade e quantidade abaixo.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* MODO MANUAL - Informações do Medicamento */}
        {tipoCadastro === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Medicamento</CardTitle>
              <CardDescription>Dados de identificação do medicamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Comercial *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: Paracetamol 750mg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="principioAtivo">Princípio Ativo *</Label>
                  <Input
                    id="principioAtivo"
                    value={formData.principioAtivo}
                    onChange={(e) => handleChange('principioAtivo', e.target.value)}
                    placeholder="Ex: Paracetamol"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="concentracao">Concentração</Label>
                  <Input
                    id="concentracao"
                    value={formData.concentracao}
                    onChange={(e) => handleChange('concentracao', e.target.value)}
                    placeholder="Ex: 750mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formaFarmaceutica">Forma Farmacêutica *</Label>
                  <Select
                    value={formData.formaFarmaceutica}
                    onValueChange={(value) => handleChange('formaFarmaceutica', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPRIMIDO">💊 Comprimido</SelectItem>
                      <SelectItem value="CAPSULA">⚪ Cápsula</SelectItem>
                      <SelectItem value="XAROPE">🥤 Xarope</SelectItem>
                      <SelectItem value="SOLUCAO">💧 Solução</SelectItem>
                      <SelectItem value="SUSPENSAO">🧪 Suspensão</SelectItem>
                      <SelectItem value="POMADA">🧴 Pomada</SelectItem>
                      <SelectItem value="CREME">🧴 Creme</SelectItem>
                      <SelectItem value="INJETAVEL">💉 Injetável</SelectItem>
                      <SelectItem value="AEROSOL">🌬️ Aerosol</SelectItem>
                      <SelectItem value="OUTRO">📦 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Input
                    id="fabricante"
                    value={formData.fabricante}
                    onChange={(e) => handleChange('fabricante', e.target.value)}
                    placeholder="Ex: EMS, Medley, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados de Lote e Validade - Comum para ambos os modos */}
        {(tipoCadastro === 'manual' || medicamentoRename) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Lote e Validade</CardTitle>
                <CardDescription>
                  Informações de rastreabilidade e prazo de validade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lote">Número do Lote *</Label>
                    <Input
                      id="lote"
                      value={formData.lote}
                      onChange={(e) => handleChange('lote', e.target.value)}
                      placeholder="Ex: LOT123456"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="validade">Data de Validade *</Label>
                    <Input
                      id="validade"
                      type="date"
                      value={formData.validade}
                      onChange={(e) => handleChange('validade', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantidade e Estoque */}
            <Card>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
                <CardDescription>Quantidade e limites de estoque</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantidade">Quantidade Inicial *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="0"
                      value={formData.quantidade}
                      onChange={(e) => handleChange('quantidade', e.target.value)}
                      placeholder="Ex: 1000"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantidade de unidades sendo adicionadas ao estoque
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="estoqueMinimo">Estoque Mínimo *</Label>
                    <Input
                      id="estoqueMinimo"
                      type="number"
                      min="0"
                      value={formData.estoqueMinimo}
                      onChange={(e) => handleChange('estoqueMinimo', e.target.value)}
                      placeholder="Ex: 100"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sistema alertará quando atingir este valor
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="localizacao">Localização no Estoque</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => handleChange('localizacao', e.target.value)}
                    placeholder="Ex: Prateleira A - Setor 3 - Posição 12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Facilita a localização física do medicamento
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="observacoes">Informações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Ex: Armazenar em local refrigerado, controlado pela ANVISA, etc."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/apps/saude/farmacia/estoque')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  'Cadastrando...'
                ) : (
                  <>
                    Cadastrar no Estoque
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
