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
import { ArrowLeft, Search, Stethoscope, Activity, Users, User, Link2, Building2 } from 'lucide-react';

interface ServidorSaude {
  id: string;
  name: string;
  email: string;
  healthData: {
    categoria: string;
    registroProfissional: string | null;
    tipoRegistro: string | null;
    ufRegistro: string | null;
    cns: string | null;
    cbo: string | null;
    status: string;
  } | null;
  department: { name: string } | null;
  assignments: {
    id: string;
    situacao: string;
    organizationalUnit: { nome: string } | null;
  }[];
  equipesParticipa: {
    id: string;
    ativo: boolean;
    team: { nome: string } | null;
  }[];
}

const CATEGORIAS = [
  { value: 'MEDICO', label: 'Médico' },
  { value: 'ENFERMEIRO', label: 'Enfermeiro' },
  { value: 'TECNICO_ENFERMAGEM', label: 'Téc. Enfermagem' },
  { value: 'ACS', label: 'ACS' },
  { value: 'DENTISTA', label: 'Dentista' },
  { value: 'FARMACEUTICO', label: 'Farmacêutico' },
  { value: 'PSICOLOGO', label: 'Psicólogo' },
  { value: 'ASSISTENTE_SOCIAL', label: 'Assistente Social' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'FISIOTERAPEUTA', label: 'Fisioterapeuta' },
  { value: 'OUTRO', label: 'Outro' },
];

function getCategoriaLabel(cat: string) {
  return CATEGORIAS.find((c) => c.value === cat)?.label || cat;
}

function getCategoriaColor(cat: string): string {
  const map: Record<string, string> = {
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
  };
  return map[cat] || 'bg-gray-100 text-gray-800';
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
      const params = new URLSearchParams();
      if (filtroCategoria !== 'TODAS') params.append('categoria', filtroCategoria);
      if (filtroStatus === 'ATIVOS') params.append('status', 'ATIVO');
      if (filtroStatus === 'INATIVOS') params.append('status', 'INATIVO');

      const response = await fetch(`/api/saude/servidores?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const data = await response.json();
      setServidores(Array.isArray(data) ? data : []);
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
    (s.healthData?.registroProfissional || '').toLowerCase().includes(busca.toLowerCase()) ||
    (s.healthData?.cns || '').toLowerCase().includes(busca.toLowerCase())
  );

  // Estatísticas derivadas
  const totalAtivos = servidores.filter((s) => s.healthData?.status === 'ATIVO').length;
  const totalVinculos = servidores.reduce((acc, s) => acc + (s.assignments?.filter((a) => a.situacao === 'ATIVO').length || 0), 0);
  const totalEquipes = servidores.reduce((acc, s) => acc + (s.equipesParticipa?.filter((e) => e.ativo).length || 0), 0);

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
              <p className="text-gray-600">Listagem de profissionais vinculados ao sistema de saúde</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/apps/saude/cadastros/vinculos')} className="bg-blue-600 hover:bg-blue-700">
            <Link2 className="h-4 w-4 mr-2" />
            Gerenciar Vínculos
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', valor: servidores.length, cor: 'text-blue-600', icon: <Users className="h-7 w-7 text-blue-200" /> },
            { label: 'Ativos', valor: totalAtivos, cor: 'text-green-600', icon: <Activity className="h-7 w-7 text-green-200" /> },
            { label: 'Vínculos Ativos', valor: totalVinculos, cor: 'text-purple-600', icon: <Building2 className="h-7 w-7 text-purple-200" /> },
            { label: 'Equipes ESF', valor: totalEquipes, cor: 'text-orange-600', icon: <Users className="h-7 w-7 text-orange-200" /> },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
                  </div>
                  {item.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <Search className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, e-mail, registro ou CNS..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as categorias</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVOS">Ativos</SelectItem>
                    <SelectItem value="INATIVOS">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  onClick={() => router.push('/admin/apps/saude/cadastros/vinculos')}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Criar primeira vinculação
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
                      <TableHead>Vínculos</TableHead>
                      <TableHead>Equipes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidoresFiltrados.map((servidor) => {
                      const vinculosAtivos = servidor.assignments?.filter((a) => a.situacao === 'ATIVO') || [];
                      const equipesAtivas = servidor.equipesParticipa?.filter((e) => e.ativo) || [];
                      return (
                        <TableRow key={servidor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400" />
                                {servidor.name}
                              </p>
                              <p className="text-sm text-gray-500">{servidor.email}</p>
                              {servidor.department && <p className="text-xs text-gray-400">{servidor.department.name}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {servidor.healthData ? (
                              <Badge className={getCategoriaColor(servidor.healthData.categoria)}>
                                {getCategoriaLabel(servidor.healthData.categoria)}
                              </Badge>
                            ) : <span className="text-gray-400 italic text-sm">—</span>}
                          </TableCell>
                          <TableCell>
                            {servidor.healthData?.registroProfissional ? (
                              <div>
                                <p className="font-medium text-sm">{servidor.healthData.registroProfissional}</p>
                                <p className="text-xs text-gray-500">
                                  {servidor.healthData.tipoRegistro} — {servidor.healthData.ufRegistro}
                                </p>
                              </div>
                            ) : <span className="text-gray-400 text-sm">—</span>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {servidor.healthData?.cns || '—'}
                          </TableCell>
                          <TableCell>
                            {vinculosAtivos.length === 0 ? (
                              <span className="text-gray-400 text-sm">Nenhum</span>
                            ) : (
                              <div className="space-y-0.5">
                                {vinculosAtivos.map((v, i) => (
                                  <p key={i} className="text-sm">{v.organizationalUnit?.nome || '—'}</p>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {equipesAtivas.length === 0 ? (
                              <span className="text-gray-400 text-sm">—</span>
                            ) : equipesAtivas.map((e, i) => (
                              <Badge key={i} variant="outline" className="text-xs mr-1">{e.team?.nome || '—'}</Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={servidor.healthData?.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            >
                              {servidor.healthData?.status || 'Sem dados'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/apps/saude/cadastros/servidores-saude/${servidor.id}`)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
