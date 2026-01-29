'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { EspecialidadeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

export default function NovaUnidadePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    cnes: '',
    cnpj: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    horarioFuncionamento: '',
    horarioAbertura: '',
    horarioFechamento: '',
    especialidadeIds: [] as number[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.tipo || !formData.cidade || !formData.estado) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/apps/saude/cadastros/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Unidade criada com sucesso');
        router.push('/admin/apps/saude/cadastros/unidades');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar unidade');
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      toast.error('Erro ao criar unidade');
    } finally {
      setLoading(false);
    }
  };

  const estadosBrasileiros = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/apps/saude/cadastros/unidades')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Unidade de Saúde</h1>
          <p className="text-gray-600">Cadastrar nova unidade de saúde</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome *
                  </label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome da unidade"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="UBS">UBS - Unidade Básica de Saúde</option>
                    <option value="UPA">UPA - Unidade de Pronto Atendimento</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Policlinica">Policlínica</option>
                    <option value="CEO">CEO - Centro de Especialidades Odontológicas</option>
                    <option value="CAPS">CAPS - Centro de Atenção Psicossocial</option>
                    <option value="Laboratorio">Laboratório</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CNES
                  </label>
                  <Input
                    value={formData.cnes}
                    onChange={(e) => setFormData({ ...formData, cnes: e.target.value })}
                    placeholder="Código CNES"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CNPJ
                  </label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço
                </label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bairro
                  </label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cidade *
                  </label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    {estadosBrasileiros.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  CEP
                </label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Horário de Funcionamento
                </label>
                <Input
                  value={formData.horarioFuncionamento}
                  onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                  placeholder="Ex: Segunda a Sexta, 07:00 às 17:00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horário de Abertura
                  </label>
                  <Input
                    type="time"
                    value={formData.horarioAbertura}
                    onChange={(e) => setFormData({ ...formData, horarioAbertura: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horário de Fechamento
                  </label>
                  <Input
                    type="time"
                    value={formData.horarioFechamento}
                    onChange={(e) => setFormData({ ...formData, horarioFechamento: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades Atendidas</CardTitle>
            </CardHeader>
            <CardContent>
              <EspecialidadeSelector
                value={formData.especialidadeIds}
                onChange={(ids) => setFormData({ ...formData, especialidadeIds: ids })}
                multiple
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/apps/saude/cadastros/unidades')}
            >
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
