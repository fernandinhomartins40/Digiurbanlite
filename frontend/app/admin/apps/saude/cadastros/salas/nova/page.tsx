'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

export default function NovaSalaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    unidadeId: null as number | null,
    nome: '',
    numero: '',
    tipo: '',
    andar: '',
    capacidade: '',
    equipamentos: '',
    observacoes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unidadeId || !formData.nome || !formData.numero || !formData.tipo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/apps/saude/cadastros/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          capacidade: formData.capacidade ? parseInt(formData.capacidade) : null,
          equipamentos: formData.equipamentos ? formData.equipamentos.split(',').map(e => e.trim()) : [],
        }),
      });

      if (response.ok) {
        toast.success('Sala criada com sucesso');
        router.push('/admin/apps/saude/cadastros/salas');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar sala');
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error('Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/apps/saude/cadastros/salas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Sala/Consultório</h1>
          <p className="text-gray-600">Cadastrar nova sala ou consultório</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Unidade de Saúde *</label>
                <UnidadeSaudeSelector
                  value={formData.unidadeId}
                  onChange={(id) => setFormData({ ...formData, unidadeId: id })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome da sala"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número *</label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ex: 101, A1, etc"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Consultorio">Consultório</option>
                    <option value="Sala de Exames">Sala de Exames</option>
                    <option value="Sala de Vacina">Sala de Vacina</option>
                    <option value="Sala de Curativo">Sala de Curativo</option>
                    <option value="Sala de Observacao">Sala de Observação</option>
                    <option value="Sala Cirurgica">Sala Cirúrgica</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Andar</label>
                  <Input
                    value={formData.andar}
                    onChange={(e) => setFormData({ ...formData, andar: e.target.value })}
                    placeholder="Ex: Térreo, 1º, 2º..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Capacidade</label>
                  <Input
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                    placeholder="Quantidade de pessoas"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Equipamentos (separados por vírgula)</label>
                <Input
                  value={formData.equipamentos}
                  onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
                  placeholder="Ex: Maca, Estetoscópio, Computador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre a sala"
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/apps/saude/cadastros/salas')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
