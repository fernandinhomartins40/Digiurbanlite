'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Users } from 'lucide-react';

interface UnidadeSaude {
  id: string;
  nome: string;
  tipo: string;
}

export default function NovaEquipeESF() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<UnidadeSaude[]>([]);
  const [formData, setFormData] = useState({
    ine: '',
    nome: '',
    tipo: 'eSF',
    unidadeId: '',
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/unidades', {
        credentials: 'include',
      });
      const data = await response.json();
      setUnidades(data.filter((u: any) => u.isActive));
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ine || !formData.nome || !formData.tipo || !formData.unidadeId) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao criar equipe');
        return;
      }

      const equipe = await response.json();
      router.push(`/admin/apps/saude/cadastros/equipes/${equipe.id}/microareas`);
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      alert('Erro ao criar equipe');
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-green-600" />
              Nova Equipe ESF
            </h1>
            <p className="text-gray-600">
              Cadastrar nova equipe de Saúde da Família
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* INE */}
                <div className="space-y-2">
                  <Label htmlFor="ine">
                    INE (Identificação Nacional de Equipes) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ine"
                    value={formData.ine}
                    onChange={(e) => setFormData({ ...formData, ine: e.target.value })}
                    placeholder="Ex: 0123456789012"
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Código de 13 dígitos fornecido pelo Ministério da Saúde
                  </p>
                </div>

                {/* Tipo de Equipe */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">
                    Tipo de Equipe <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eSF">Equipe Saúde da Família (eSF)</SelectItem>
                      <SelectItem value="eAP">Equipe Atenção Primária (eAP)</SelectItem>
                      <SelectItem value="eAB">Equipe Atenção Básica (eAB)</SelectItem>
                      <SelectItem value="NASF">Núcleo Apoio Saúde Família (NASF)</SelectItem>
                      <SelectItem value="eCR">Equipe Consultório de Rua (eCR)</SelectItem>
                      <SelectItem value="eAD">Equipe Atenção Domiciliar (eAD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome da Equipe */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">
                    Nome da Equipe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Equipe ESF Bairro Centro"
                    required
                  />
                </div>

                {/* Unidade de Saúde */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="unidade">
                    Unidade de Saúde <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.unidadeId}
                    onValueChange={(value) => setFormData({ ...formData, unidadeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((unidade) => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome} ({unidade.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {unidades.length === 0 && (
                    <p className="text-xs text-red-500">
                      Nenhuma unidade cadastrada. Cadastre uma unidade primeiro.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Próximos Passos</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Após criar a equipe, você poderá adicionar profissionais</li>
                  <li>Definir microáreas de atuação</li>
                  <li>Vincular Agentes Comunitários de Saúde (ACS)</li>
                  <li>Atribuir cidadãos às microáreas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Equipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
