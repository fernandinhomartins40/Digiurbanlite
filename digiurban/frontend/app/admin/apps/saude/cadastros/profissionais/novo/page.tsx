'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

export default function NovoProfissional() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Médico',
    especialidade: '',
    cbo: '',
    cpf: '',
    cns: '',
    conselho: '',
    numeroConselho: '',
    ufConselho: '',
    telefone: '',
    email: '',
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
      const response = await fetch('/api/apps/saude/cadastros/profissionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Profissional criado com sucesso!');
        router.push('/admin/apps/saude/cadastros/profissionais');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao criar profissional'}`);
      }
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      alert('Erro ao criar profissional');
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
            <h1 className="text-3xl font-bold">Novo Profissional de Saúde</h1>
            <p className="text-gray-600">Cadastrar médico, enfermeiro ou outro profissional</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo do profissional"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Médico">Médico</SelectItem>
                      <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                      <SelectItem value="Dentista">Dentista</SelectItem>
                      <SelectItem value="Técnico de Enfermagem">Técnico de Enfermagem</SelectItem>
                      <SelectItem value="ACS">Agente Comunitário de Saúde (ACS)</SelectItem>
                      <SelectItem value="Farmacêutico">Farmacêutico</SelectItem>
                      <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                      <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                      <SelectItem value="Nutricionista">Nutricionista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Input
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Clínico Geral, Pediatria"
                  />
                </div>

                <div>
                  <Label htmlFor="cbo">CBO</Label>
                  <Input
                    id="cbo"
                    value={formData.cbo}
                    onChange={(e) => setFormData({ ...formData, cbo: e.target.value })}
                    placeholder="Código CBO"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="cns">CNS (Cartão Nacional de Saúde)</Label>
                  <Input
                    id="cns"
                    value={formData.cns}
                    onChange={(e) => setFormData({ ...formData, cns: e.target.value })}
                    placeholder="000 0000 0000 0000"
                  />
                </div>

                <div>
                  <Label htmlFor="conselho">Conselho de Classe</Label>
                  <Select
                    value={formData.conselho}
                    onValueChange={(value) => setFormData({ ...formData, conselho: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRM">CRM - Medicina</SelectItem>
                      <SelectItem value="COREN">COREN - Enfermagem</SelectItem>
                      <SelectItem value="CRO">CRO - Odontologia</SelectItem>
                      <SelectItem value="CRF">CRF - Farmácia</SelectItem>
                      <SelectItem value="CREFITO">CREFITO - Fisioterapia</SelectItem>
                      <SelectItem value="CRP">CRP - Psicologia</SelectItem>
                      <SelectItem value="CRN">CRN - Nutrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numeroConselho">Número do Conselho</Label>
                  <Input
                    id="numeroConselho"
                    value={formData.numeroConselho}
                    onChange={(e) => setFormData({ ...formData, numeroConselho: e.target.value })}
                    placeholder="000000"
                  />
                </div>

                <div>
                  <Label htmlFor="ufConselho">UF do Conselho</Label>
                  <Input
                    id="ufConselho"
                    value={formData.ufConselho}
                    onChange={(e) => setFormData({ ...formData, ufConselho: e.target.value.toUpperCase() })}
                    placeholder="ES"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="profissional@email.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Profissional'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
