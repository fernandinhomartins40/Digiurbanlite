'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, ArrowLeft, UserPlus, Users, User, Search, Stethoscope, Activity } from 'lucide-react';

interface ServidorSaude {
  id: string;
  name: string;
  email: string;
  departmentName: string;
  dadosSaude: {
    id: string;
    categoria: string;
    registroProfissional: string | null;
    tipoRegistro: string | null;
    ufRegistro: string | null;
    cns: string | null;
    cbo: string | null;
    ativo: boolean;
    especialidades: any;
  } | null;
  _count: {
    vinculosUnidades: number;
    vinculosEquipes: number;
  };
}

export default function ServidoresSaudeListagem() {
  const router = useRouter();
  const [servidores, setServidores] = useState<ServidorSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVOS');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadServidores();
  }, [filtroCategoria, filtroStatus]);

  const loadServidores = async () => {
    try {
      setLoading(true);
      let url = '/api/professional-data/health';

      const params = new URLSearchParams();
      if (filtroCategoria && filtroCategoria !== 'TODAS') params.append('categoria', filtroCategoria);
      if (filtroStatus === 'ATIVOS') params.append('ativo', 'true');
      if (filtroStatus === 'INATIVOS') params.append('ativo', 'false');

      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transformar os dados para o formato esperado pelo frontend
      const servidoresFormatados = Array.isArray(data) ? data.map((item: any) => ({
        id: item.user?.id || item.userId,
        name: item.user?.name || '',
        email: item.user?.email || '',
        departmentName: item.user?.assignments?.[0]?.department?.name ||
                        item.user?.assignments?.[0]?.organizationalUnit?.nome ||
                        'Sem lotação',
        dadosSaude: {
          id: item.id,
          categoria: item.categoria,
          registroProfissional: item.registroProfissional,
          tipoRegistro: item.tipoRegistro,
          ufRegistro: item.ufRegistro,
          cns: item.cns,
          cbo: item.cbo,
          ativo: item.ativo,
          especialidades: item.especialidades,
        },
        _count: {
          vinculosUnidades: 0, // TODO: Buscar vínculos
          vinculosEquipes: 0,  // TODO: Buscar vínculos
        },
      })) : [];

      setServidores(servidoresFormatados);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
      setServidores([]);
    } finally {
      setLoading(false);
    }
  };

  const servidoresFiltrados = servidores.filter((s) =>
    s.name.toLowerCase().includes(busca.toLowerCase()) ||
    s.email.toLowerCase().includes(busca.toLowerCase()) ||
    (s.dadosSaude?.registroProfissional?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (s.dadosSaude?.cns?.toLowerCase() || '').includes(busca.toLowerCase())
  );

  const categorias = ['MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'ACS', 'DENTISTA', 'FARMACEUTICO', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'NUTRICIONISTA', 'FISIOTERAPEUTA', 'OUTRO'];

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      MEDICO: 'Médico',
      ENFERMEIRO: 'Enfermeiro',
      TECNICO_ENFERMAGEM: 'Téc. Enfermagem',
      ACS: 'ACS',
      DENTISTA: 'Dentista',
      FARMACEUTICO: 'Farmacêutico',
      PSICOLOGO: 'Psicólogo',
      ASSISTENTE_SOCIAL: 'Assistente Social',
      NUTRICIONISTA: 'Nutricionista',
      FISIOTERAPEUTA: 'Fisioterapeuta',
      OUTRO: 'Outro',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      MEDICO: 'bg-blue-100 text-blue-800',
      ENFERMEIRO: 'bg-green-100 text-green-800',
      TECNICO_ENFERMAGEM: 'bg-teal-100 text-teal-800',
      ACS: 'bg-purple-100 text-purple-800',
      DENTISTA: 'bg-cyan-100 text-cyan-800',
      FARMACEUTICO: 'bg-orange-100 text-orange-800',
      PSICOLOGO: 'bg-pink-100 text-pink-800',
      ASSISTENTE_SOCIAL: 'bg-indigo-100 text-indigo-800',
      NUTRICIONISTA: 'bg-yellow-100 text-yellow-800',
      FISIOTERAPEUTA: 'bg-red-100 text-red-800',
      OUTRO: 'bg-gray-100 text-gray-800',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                Servidores de Saúde
              </h1>
              <p className="text-gray-600">Gestão de vínculos e dados de saúde dos servidores</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/servidores-saude/vincular')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Vincular Servidor
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as categorias</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoriaLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVOS">Ativos</SelectItem>
                    <SelectItem value="INATIVOS">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, e-mail, registro ou CNS..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{servidores.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {servidores.filter((s) => s.dadosSaude?.ativo).length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vínculos Unidades</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {servidores.reduce((acc, s) => acc + s._count.vinculosUnidades, 0)}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vínculos Equipes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {servidores.reduce((acc, s) => acc + s._count.vinculosEquipes, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Servidores Cadastrados ({servidoresFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Carregando servidores...</p>
              </div>
            ) : servidoresFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum servidor encontrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/admin/apps/saude/cadastros/servidores-saude/vincular')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Vincular primeiro servidor
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>CNS</TableHead>
                      <TableHead>CBO</TableHead>
                      <TableHead className="text-center">Vínculos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidoresFiltrados.map((servidor) => (
                      <TableRow key={servidor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {servidor.name}
                            </p>
                            <p className="text-sm text-gray-500">{servidor.email}</p>
                            <p className="text-xs text-gray-400">{servidor.departmentName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {servidor.dadosSaude ? (
                            <Badge className={getCategoriaColor(servidor.dadosSaude.categoria)}>
                              {getCategoriaLabel(servidor.dadosSaude.categoria)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {servidor.dadosSaude?.registroProfissional ? (
                            <div>
                              <p className="font-medium">{servidor.dadosSaude.registroProfissional}</p>
                              <p className="text-xs text-gray-500">
                                {servidor.dadosSaude.tipoRegistro} - {servidor.dadosSaude.ufRegistro}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {servidor.dadosSaude?.cns || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {servidor.dadosSaude?.cbo || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-xs">
                              {servidor._count.vinculosUnidades} unidade(s)
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {servidor._count.vinculosEquipes} equipe(s)
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {servidor.dadosSaude ? (
                            <Badge variant={servidor.dadosSaude.ativo ? 'default' : 'secondary'}>
                              {servidor.dadosSaude.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sem vínculo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/apps/saude/cadastros/servidores-saude/${servidor.id}`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              ℹ️ Sobre Servidores de Saúde
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Primeiro passo</strong>: Servidor deve estar cadastrado no Digiurban</li>
              <li>• <strong>Segundo passo</strong>: Vincular servidor à saúde com categoria e dados profissionais</li>
              <li>• <strong>Terceiro passo</strong>: Vincular a unidades e/ou equipes ESF</li>
              <li>• Um servidor pode ter vínculos em múltiplas unidades e equipes</li>
              <li>• Os vínculos determinam onde o profissional pode atender</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
