'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

interface OrganizationalUnitOption {
  id: string;
  nome: string;
  sigla?: string | null;
  tipo: string;
  department?: {
    id: string;
    name: string;
  };
}

export default function NovaUnidade() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOrganograma, setLoadingOrganograma] = useState(false);
  const [organizationalUnits, setOrganizationalUnits] = useState<OrganizationalUnitOption[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'UBS',
    cnes: '',
    endereco: '',
    bairro: '',
    cep: '',
    telefone: '',
    email: '',
    horarioFuncionamento: '',
    organizationalUnitId: '',
    isActive: true,
  });

  useEffect(() => {
    const loadOrganograma = async () => {
      try {
        setLoadingOrganograma(true);
        const response = await fetch('/api/organizational-units?isActive=true', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar unidades organizacionais');
        }

        const data = await response.json();
        setOrganizationalUnits(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erro ao carregar organograma:', error);
      } finally {
        setLoadingOrganograma(false);
      }
    };

    void loadOrganograma();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      alert('Nome é obrigatório');
      return;
    }

    if (!formData.organizationalUnitId) {
      alert('Selecione o setor/unidade organizacional');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Unidade criada com sucesso!');
        router.push('/admin/apps/saude/cadastros/unidades');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao criar unidade'}`);
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      alert('Erro ao criar unidade');
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
            <h1 className="text-3xl font-bold">Nova Unidade de Saúde</h1>
            <p className="text-gray-600">Cadastrar nova UBS, UPA, Hospital ou Clínica</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Unidade *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: UBS Centro"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UBS">UBS - Unidade Básica de Saúde</SelectItem>
                      <SelectItem value="UPA">UPA - Unidade de Pronto Atendimento</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Clínica">Clínica</SelectItem>
                      <SelectItem value="Posto">Posto de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="organizationalUnitId">Setor / Unidade Organizacional *</Label>
                  <Select
                    value={formData.organizationalUnitId}
                    onValueChange={(value) => setFormData({ ...formData, organizationalUnitId: value })}
                  >
                    <SelectTrigger id="organizationalUnitId">
                      <SelectValue placeholder={loadingOrganograma ? 'Carregando...' : 'Selecione o setor'} />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationalUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.sigla ? `${unit.sigla} - ${unit.nome}` : unit.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cnes">CNES</Label>
                  <Input
                    id="cnes"
                    value={formData.cnes}
                    onChange={(e) => setFormData({ ...formData, cnes: e.target.value })}
                    placeholder="Código CNES"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número"
                  />
                </div>

                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@unidade.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="horario">Horário de Funcionamento</Label>
                  <Textarea
                    id="horario"
                    value={formData.horarioFuncionamento}
                    onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                    placeholder="Ex: Segunda a Sexta: 7h às 17h"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Unidade'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
