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
import { ArrowLeft, Save, Users, Info } from 'lucide-react';

interface UnidadeSaude {
  id: string;
  nome: string;
  tipo: string;
  organizationalUnitId?: string | null;
}

interface TeamOption {
  id: string;
  nome: string;
  sigla?: string | null;
  tipo: string;
  ativo: boolean;
  organizationalUnitId?: string | null;
}

export default function NovaEquipeESF() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<UnidadeSaude[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [formData, setFormData] = useState({
    ine: '',
    nome: '',
    tipo: 'eSF',
    unidadeId: '',
    teamId: '',
    ativo: true,
  });

  useEffect(() => {
    loadUnidades();
    loadTeams();
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

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await fetch('/api/teams?ativo=true', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar equipes organizacionais');
      }

      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar equipes organizacionais:', error);
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const unidadeSelecionada = unidades.find((item) => item.id === formData.unidadeId);
  const teamsFiltrados = teams.filter((team) => {
    if (!team.ativo) return false;
    if (!unidadeSelecionada?.organizationalUnitId || !team.organizationalUnitId) return true;
    return unidadeSelecionada.organizationalUnitId === team.organizationalUnitId;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ine || !formData.nome || !formData.tipo || !formData.unidadeId || !formData.teamId) {
      alert('Preencha todos os campos obrigatÃ³rios');
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
              Cadastrar nova equipe de SaÃºde da FamÃ­lia
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
                    INE (IdentificaÃ§Ã£o Nacional de Equipes) <span className="text-red-500">*</span>
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
                    CÃ³digo de 13 dÃ­gitos fornecido pelo MinistÃ©rio da SaÃºde
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
                      <SelectItem value="eSF">Equipe SaÃºde da FamÃ­lia (eSF)</SelectItem>
                      <SelectItem value="eAP">Equipe AtenÃ§Ã£o PrimÃ¡ria (eAP)</SelectItem>
                      <SelectItem value="eAB">Equipe AtenÃ§Ã£o BÃ¡sica (eAB)</SelectItem>
                      <SelectItem value="NASF">NÃºcleo Apoio SaÃºde FamÃ­lia (NASF)</SelectItem>
                      <SelectItem value="eCR">Equipe ConsultÃ³rio de Rua (eCR)</SelectItem>
                      <SelectItem value="eAD">Equipe AtenÃ§Ã£o Domiciliar (eAD)</SelectItem>
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

                {/* Unidade de SaÃºde */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="unidade">
                    Unidade de SaÃºde <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.unidadeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unidadeId: value, teamId: '' })
                    }
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="teamId">
                    Equipe Organizacional <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                  >
                    <SelectTrigger id="teamId">
                      <SelectValue
                        placeholder={loadingTeams ? 'Carregando equipes...' : 'Selecione a equipe organizacional'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsFiltrados.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.sigla ? `${team.sigla} - ${team.nome}` : team.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 inline-flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Próximos Passos
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>ApÃ³s criar a equipe, vocÃª poderÃ¡ adicionar profissionais</li>
                  <li>Definir microÃ¡reas de atuaÃ§Ã£o</li>
                  <li>Vincular Agentes ComunitÃ¡rios de SaÃºde (ACS)</li>
                  <li>Atribuir cidadÃ£os Ã s microÃ¡reas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* BotÃµes de AÃ§Ã£o */}
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
