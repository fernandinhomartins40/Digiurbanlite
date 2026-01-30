'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

export default function NovaSala() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    tipo: 'Consultório',
    capacidade: '',
    equipamentos: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Sala criada com sucesso!');
        router.push('/admin/apps/saude/cadastros/salas');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao criar sala'}`);
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Sala/Consultório</h1>
            <p className="text-gray-600">Cadastrar nova sala de atendimento ou consultório</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Sala *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Consultório 1, Sala de Enfermagem"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ex: 101, 102"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultório">Consultório</SelectItem>
                      <SelectItem value="Enfermagem">Sala de Enfermagem</SelectItem>
                      <SelectItem value="Odontologia">Consultório Odontológico</SelectItem>
                      <SelectItem value="Vacinação">Sala de Vacinação</SelectItem>
                      <SelectItem value="Curativo">Sala de Curativo</SelectItem>
                      <SelectItem value="Procedimentos">Sala de Procedimentos</SelectItem>
                      <SelectItem value="Observação">Sala de Observação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacidade">Capacidade</Label>
                  <Input
                    id="capacidade"
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                    placeholder="Número de pessoas"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="equipamentos">Equipamentos Disponíveis</Label>
                  <Textarea
                    id="equipamentos"
                    value={formData.equipamentos}
                    onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
                    placeholder="Liste os equipamentos disponíveis nesta sala..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Sala'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
