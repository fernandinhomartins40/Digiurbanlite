'use client';

/**
 * PÃ¡gina: Servidores da SaÃºde (Integrado com Sistema Unificado V2.0)
 *
 * Esta pÃ¡gina lista todos os servidores com dados de saÃºde e usa o
 * Sistema Unificado de VinculaÃ§Ã£o V2.0 para gerenciar seus vÃ­nculos.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, UserPlus, Filter } from 'lucide-react';

interface HealthData {
  id: string;
  categoria: string;
  registroProfissional?: string;
  tipoRegistro?: string;
  cns?: string;
  status: string;
}

interface Assignment {
  id: string;
  situacao: string;
  organizationalUnit: {
    id: string;
    nome: string;
    sigla: string;
  };
  position: {
    id: string;
    nome: string;
  };
}

interface TeamMembership {
  id: string;
  ativo: boolean;
  team: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface Servidor {
  id: string;
  name: string;
  email: string;
  healthData: HealthData;
  department?: {
    id: string;
    name: string;
  };
  assignments: Assignment[];
  teamMemberships: TeamMembership[];
}

const CATEGORIAS = [
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'ACS',
  'DENTISTA',
  'PSICOLOGO',
  'NUTRICIONISTA',
  'FARMACEUTICO',
  'FISIOTERAPEUTA',
  'ASSISTENTE_SOCIAL',
];

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo', variant: 'default' as const },
  { value: 'INATIVO', label: 'Inativo', variant: 'secondary' as const },
  { value: 'FERIAS', label: 'FÃ©rias', variant: 'outline' as const },
  { value: 'AFASTADO', label: 'Afastado', variant: 'destructive' as const },
  { value: 'LICENCA', label: 'LicenÃ§a', variant: 'secondary' as const },
];

export default function ServidoresSaudePage() {
  const router = useRouter();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    status: 'ATIVO',
  });

  const fetchServidores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/saude/servidores?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar servidores');
      }

      const data = await response.json();
      setServidores(data);
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      alert('Erro ao carregar servidores. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServidores();
  }, [filters.categoria, filters.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServidores();
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge variant={statusOption?.variant || 'default'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <HealthAppHeader
        title="Servidores da Saúde"
        description="Gerenciamento integrado com sistema unificado de vínculos."
        icon={UserPlus}
        actions={
          <Button onClick={() => router.push('/admin/apps/saude/servidores/vincular')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Vincular servidor
          </Button>
        }
      />


      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categoria */}
            <Select
              value={filters.categoria}
              onValueChange={(value) => setFilters({ ...filters, categoria: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            Servidores{' '}
            <span className="text-muted-foreground font-normal">
              ({servidores.length} {servidores.length === 1 ? 'servidor' : 'servidores'})
            </span>
          </CardTitle>
          <CardDescription>
            Lista de servidores com dados profissionais de saÃºde
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : servidores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum servidor encontrado com os filtros selecionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">VÃ­nculos Ativos</TableHead>
                  <TableHead className="text-center">Equipes Ativas</TableHead>
                  <TableHead className="text-right">AÃ§Ãµes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servidores.map((servidor) => {
                  const vinculosAtivos = servidor.assignments.filter(
                    (a) => a.situacao === 'ATIVO'
                  ).length;
                  const equipesAtivas = servidor.teamMemberships.filter(
                    (t) => t.ativo
                  ).length;

                  return (
                    <TableRow key={servidor.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/admin/servidores/${servidor.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {servidor.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">{servidor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {servidor.healthData.categoria.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {servidor.healthData.tipoRegistro}{' '}
                        {servidor.healthData.registroProfissional || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(servidor.healthData.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={vinculosAtivos > 0 ? 'default' : 'secondary'}>
                          {vinculosAtivos}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={equipesAtivas > 0 ? 'default' : 'secondary'}>
                          {equipesAtivas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/servidores/${servidor.id}`)}
                        >
                          Ver Perfil
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
