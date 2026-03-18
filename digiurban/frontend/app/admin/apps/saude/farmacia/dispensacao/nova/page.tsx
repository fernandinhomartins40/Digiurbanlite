'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { Pill, Plus, Trash2, Search, Package, AlertCircle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ItemDispensacao {
  estoqueId: string;
  medicamento: string;
  quantidadeDisponivel: number;
  quantidade: number;
  lote: string;
  validade: string;
}

export default function NovaDispensacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCidadao, setSelectedCidadao] = useState<any>(null);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [prescricoes, setPrescricoes] = useState<any[]>([]);
  const [searchMedicamento, setSearchMedicamento] = useState('');
  const [itens, setItens] = useState<ItemDispensacao[]>([]);
  const [formData, setFormData] = useState({
    prescricaoId: '',
    observacoes: '',
  });

  useEffect(() => {
    loadEstoque();
  }, []);

  useEffect(() => {
    if (selectedCidadao) {
      loadPrescricoes(selectedCidadao.id);
    }
  }, [selectedCidadao]);

  const loadEstoque = async () => {
    try {
      const response = await fetch('/api/saude/farmacia/estoque?status=DISPONIVEL', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEstoque(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    }
  };

  const loadPrescricoes = async (cidadaoId: string) => {
    try {
      const response = await fetch(
        `/api/saude/consulta-medica/prescricoes/pendentes?cidadaoId=${cidadaoId}&status=ATIVA`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPrescricoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar prescrições:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePrescricaoChange = (prescricaoId: string) => {
    setFormData({ ...formData, prescricaoId });

    // Auto-preencher itens da prescrição
    const prescricao = prescricoes.find((p) => p.id === prescricaoId);
    if (prescricao && prescricao.medicamentos) {
      const novosItens: ItemDispensacao[] = [];

      prescricao.medicamentos.forEach((med: any) => {
        // Buscar no estoque
        const estoqueItem = estoque.find((e) =>
          e.nome.toLowerCase().includes(med.medicamento.toLowerCase())
        );

        if (estoqueItem) {
          novosItens.push({
            estoqueId: estoqueItem.id,
            medicamento: estoqueItem.nome,
            quantidadeDisponivel: estoqueItem.quantidade,
            quantidade: parseInt(med.quantidade) || 1,
            lote: estoqueItem.lote,
            validade: estoqueItem.validade,
          });
        }
      });

      setItens(novosItens);
    }
  };

  const adicionarItem = () => {
    if (!searchMedicamento) {
      alert('Busque um medicamento primeiro');
      return;
    }

    const estoqueItem = estoque.find((e) =>
      e.nome.toLowerCase().includes(searchMedicamento.toLowerCase())
    );

    if (!estoqueItem) {
      alert('Medicamento não encontrado no estoque');
      return;
    }

    const jaAdicionado = itens.find((i) => i.estoqueId === estoqueItem.id);
    if (jaAdicionado) {
      alert('Este medicamento já foi adicionado');
      return;
    }

    setItens([
      ...itens,
      {
        estoqueId: estoqueItem.id,
        medicamento: estoqueItem.nome,
        quantidadeDisponivel: estoqueItem.quantidade,
        quantidade: 1,
        lote: estoqueItem.lote,
        validade: estoqueItem.validade,
      },
    ]);

    setSearchMedicamento('');
  };

  const removerItem = (index: number) => {
    const novosItens = [...itens];
    novosItens.splice(index, 1);
    setItens(novosItens);
  };

  const atualizarQuantidade = (index: number, quantidade: number) => {
    const novosItens = [...itens];
    novosItens[index].quantidade = quantidade;
    setItens(novosItens);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCidadao) {
      alert('Selecione um cidadão');
      return;
    }

    if (itens.length === 0) {
      alert('Adicione pelo menos um medicamento');
      return;
    }

    // Validar quantidades
    for (const item of itens) {
      if (item.quantidade > item.quantidadeDisponivel) {
        alert(`Quantidade solicitada de "${item.medicamento}" excede o estoque disponível (${item.quantidadeDisponivel})`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/saude/farmacia/dispensacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cidadaoId: selectedCidadao.id,
          prescricaoId: formData.prescricaoId || undefined,
          observacoes: formData.observacoes || undefined,
          itens: itens.map((item) => ({
            estoqueId: item.estoqueId,
            quantidade: item.quantidade,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      alert('Dispensação registrada com sucesso!');
      router.push('/admin/apps/saude/farmacia/dispensacao');
    } catch (error: any) {
      console.error('Erro ao registrar dispensação:', error);
      alert(`Erro ao registrar dispensação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const medicamentosFiltrados = estoque.filter((e) =>
    e.nome.toLowerCase().includes(searchMedicamento.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Pill className="h-8 w-8 text-green-600" />
            Nova Dispensação
          </h1>
          <p className="text-gray-500 mt-1">
            Registre a entrega de medicamentos ao cidadão
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
            <CardDescription>
              Busque o paciente que receberá os medicamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CidadaoSelector
              onSelect={setSelectedCidadao}
              selectedCidadao={selectedCidadao}
              label="Paciente"
              required
            />
          </CardContent>
        </Card>

        {/* Prescrição (Opcional) */}
        {selectedCidadao && prescricoes.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-base">Prescrições Ativas</CardTitle>
              <CardDescription>
                Selecione uma prescrição para auto-preencher os medicamentos (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.prescricaoId}
                onValueChange={handlePrescricaoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma prescrição (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {prescricoes.map((prescricao) => (
                    <SelectItem key={prescricao.id} value={prescricao.id}>
                      Prescrição #{prescricao.numero} - Dr. {prescricao.medico?.nome} - {new Date(prescricao.dataEmissao).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Adicionar Medicamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Medicamentos
            </CardTitle>
            <CardDescription>
              Busque e adicione os medicamentos que serão dispensados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de Medicamento */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Digite o nome do medicamento..."
                  value={searchMedicamento}
                  onChange={(e) => setSearchMedicamento(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="button" onClick={adicionarItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Sugestões de Medicamentos */}
            {searchMedicamento && medicamentosFiltrados.length > 0 && (
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
                {medicamentosFiltrados.slice(0, 5).map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => {
                      setSearchMedicamento(med.nome);
                      adicionarItem();
                    }}
                    className="w-full text-left p-2 hover:bg-white rounded transition-colors text-sm"
                  >
                    <div className="font-medium">{med.nome}</div>
                    <div className="text-xs text-gray-500">
                      Estoque: {med.quantidade} unidades • Lote: {med.lote}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Lista de Itens */}
            {itens.length > 0 ? (
              <div className="space-y-2">
                <Label>Medicamentos Selecionados ({itens.length})</Label>
                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-white border rounded-lg"
                    >
                      <Pill className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.medicamento}</div>
                        <div className="text-xs text-gray-500">
                          Lote: {item.lote} • Validade: {new Date(item.validade).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Qtd:</Label>
                        <Input
                          type="number"
                          min="1"
                          max={item.quantidadeDisponivel}
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <Badge variant="outline" className="text-xs">
                          Disp: {item.quantidadeDisponivel}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Nenhum medicamento adicionado ainda
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="observacoes">Informações Adicionais</Label>
            <Input
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Ex: Orientado sobre posologia, efeitos colaterais..."
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/apps/saude/farmacia/dispensacao')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCidadao || itens.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Registrando...' : 'Registrar Dispensação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
