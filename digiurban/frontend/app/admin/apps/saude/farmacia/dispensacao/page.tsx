'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { registrarDispensacao } from '@/lib/api/farmacia-api';
import { Package, Plus, Trash2, FileText } from 'lucide-react';

interface ItemDispensacao {
  estoqueId: string;
  medicamento: string;
  quantidade: number;
  lote: string;
}

export default function DispensacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prescricaoId: '',
    citizenId: '',
    profissionalId: '',
    observacoes: '',
  });
  const [itens, setItens] = useState<ItemDispensacao[]>([]);
  const [novoItem, setNovoItem] = useState({
    estoqueId: '',
    medicamento: '',
    quantidade: 1,
    lote: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddItem = () => {
    if (!novoItem.estoqueId || !novoItem.medicamento || novoItem.quantidade <= 0) {
      alert('Preencha todos os campos do item');
      return;
    }

    setItens([...itens, { ...novoItem }]);
    setNovoItem({
      estoqueId: '',
      medicamento: '',
      quantidade: 1,
      lote: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itens.length === 0) {
      alert('Adicione ao menos um item à dispensação');
      return;
    }

    setLoading(true);

    try {
      await registrarDispensacao({
        prescricaoId: formData.prescricaoId || undefined,
        citizenId: formData.citizenId,
        profissionalId: formData.profissionalId,
        itens: itens.map((item) => ({
          estoqueId: item.estoqueId,
          quantidade: item.quantidade,
        })),
        observacoes: formData.observacoes || undefined,
      });

      alert('Dispensação registrada com sucesso!');
      router.push('/admin/apps/saude/farmacia');
    } catch (error) {
      console.error('Erro ao registrar dispensação:', error);
      alert('Erro ao registrar dispensação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Dispensação</h1>
          <p className="text-gray-500 mt-1">
            Registre a entrega de medicamentos ao paciente
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Dispensação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados da Dispensação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prescricaoId">ID da Prescrição (Opcional)</Label>
                <Input
                  id="prescricaoId"
                  value={formData.prescricaoId}
                  onChange={(e) => handleChange('prescricaoId', e.target.value)}
                  placeholder="Digite o ID da prescrição"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para dispensação sem prescrição
                </p>
              </div>

              <div>
                <Label htmlFor="citizenId">ID do Cidadão *</Label>
                <Input
                  id="citizenId"
                  value={formData.citizenId}
                  onChange={(e) => handleChange('citizenId', e.target.value)}
                  placeholder="Digite o ID do cidadão"
                  required
                />
              </div>

              <div>
                <Label htmlFor="profissionalId">ID do Profissional *</Label>
                <Input
                  id="profissionalId"
                  value={formData.profissionalId}
                  onChange={(e) => handleChange('profissionalId', e.target.value)}
                  placeholder="Digite o ID do profissional"
                  required
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Observações sobre a dispensação"
                  rows={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adicionar Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Medicamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="estoqueId">ID do Estoque</Label>
                <Input
                  id="estoqueId"
                  value={novoItem.estoqueId}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, estoqueId: e.target.value })
                  }
                  placeholder="ID do estoque"
                />
              </div>

              <div>
                <Label htmlFor="medicamento">Medicamento</Label>
                <Input
                  id="medicamento"
                  value={novoItem.medicamento}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, medicamento: e.target.value })
                  }
                  placeholder="Nome do medicamento"
                />
              </div>

              <div>
                <Label htmlFor="lote">Lote</Label>
                <Input
                  id="lote"
                  value={novoItem.lote}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, lote: e.target.value })
                  }
                  placeholder="Número do lote"
                />
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={novoItem.quantidade}
                    onChange={(e) =>
                      setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) })
                    }
                    placeholder="Qtd"
                  />
                  <Button type="button" onClick={handleAddItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens da Dispensação
              <Badge variant="secondary" className="ml-2">
                {itens.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum item adicionado ainda
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.medicamento}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Lote: {item.lote || '-'} | ID Estoque: {item.estoqueId}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {item.quantidade} unidade{item.quantidade !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || itens.length === 0}>
            {loading ? 'Registrando...' : 'Registrar Dispensação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
