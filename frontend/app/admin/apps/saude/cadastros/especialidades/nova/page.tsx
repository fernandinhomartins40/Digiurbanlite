'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NovaEspecialidadePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    area: '',
    tempoMedioConsulta: '',
    cor: '#6366f1',
    requisitosPaciente: '',
    examesComuns: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.area) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/apps/saude/cadastros/especialidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tempoMedioConsulta: formData.tempoMedioConsulta ? parseInt(formData.tempoMedioConsulta) : null,
          examesComuns: formData.examesComuns ? JSON.parse(formData.examesComuns) : null,
        }),
      });

      if (response.ok) {
        toast.success('Especialidade criada com sucesso');
        router.push('/admin/apps/saude/cadastros/especialidades');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar especialidade');
      }
    } catch (error) {
      console.error('Erro ao criar especialidade:', error);
      toast.error('Erro ao criar especialidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/apps/saude/cadastros/especialidades')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Especialidade Médica</h1>
          <p className="text-gray-600">Cadastrar nova especialidade médica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome *
                </label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da especialidade"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da especialidade"
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Área *
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Clinica Medica">Clínica Médica</option>
                    <option value="Cirurgia">Cirurgia</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Ginecologia e Obstetricia">Ginecologia e Obstetrícia</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Odontologia">Odontologia</option>
                    <option value="Psicologia">Psicologia</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Nutricao">Nutrição</option>
                    <option value="Outras">Outras</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tempo Médio de Consulta (minutos)
                  </label>
                  <Input
                    type="number"
                    value={formData.tempoMedioConsulta}
                    onChange={(e) => setFormData({ ...formData, tempoMedioConsulta: e.target.value })}
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Cor (para visualização em agendas)
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requisitos e Exames</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Requisitos do Paciente
                </label>
                <textarea
                  value={formData.requisitosPaciente}
                  onChange={(e) => setFormData({ ...formData, requisitosPaciente: e.target.value })}
                  placeholder="Ex: Jejum de 8 horas, trazer exames anteriores..."
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exames Comuns (JSON)
                </label>
                <textarea
                  value={formData.examesComuns}
                  onChange={(e) => setFormData({ ...formData, examesComuns: e.target.value })}
                  placeholder='["Hemograma", "Glicemia", "Colesterol"]'
                  className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: Array JSON de strings
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/apps/saude/cadastros/especialidades')}
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
