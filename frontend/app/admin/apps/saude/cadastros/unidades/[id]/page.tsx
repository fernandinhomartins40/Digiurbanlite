'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Edit, Building2, MapPin, Phone, Mail, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Sala {
  id: number;
  nome: string;
  numero: string;
  tipo: string;
  andar: string | null;
  capacidade: number | null;
}

export default function DetalhesUnidadePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [unidade, setUnidade] = useState<any>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnidade();
    fetchSalas();
  }, [id]);

  const fetchUnidade = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/unidades/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUnidade(data);
      } else {
        toast.error('Erro ao carregar unidade');
        router.push('/admin/apps/saude/cadastros/unidades');
      }
    } catch (error) {
      console.error('Erro ao carregar unidade:', error);
      toast.error('Erro ao carregar unidade');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalas = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/salas?unidadeId=${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSalas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!unidade) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/apps/saude/cadastros/unidades')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{unidade.nome}</h1>
            <p className="text-gray-600">Detalhes da unidade de saúde</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/apps/saude/cadastros/unidades/${id}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <p className="text-xl font-bold">{unidade.tipo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Salas</p>
                <p className="text-xl font-bold">{salas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge
                  className={
                    unidade.status === 'Ativo'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {unidade.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">CNES</p>
                <p className="text-xl font-bold">{unidade.cnes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Endereço</p>
              <p className="font-medium">{unidade.endereco || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bairro</p>
                <p className="font-medium">{unidade.bairro || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CEP</p>
                <p className="font-medium">{unidade.cep || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cidade</p>
                <p className="font-medium">{unidade.cidade || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="font-medium">{unidade.estado || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contato e Horários</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium">{unidade.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{unidade.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horário de Funcionamento</p>
              <p className="font-medium">{unidade.horarioFuncionamento || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Abertura</p>
                <p className="font-medium">{unidade.horarioAbertura || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fechamento</p>
                <p className="font-medium">{unidade.horarioFechamento || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {unidade.especialidades && unidade.especialidades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Especialidades Atendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unidade.especialidades.map((esp: any) => (
                <Badge key={esp.id} className="bg-purple-100 text-purple-800">
                  {esp.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Salas/Consultórios</CardTitle>
        </CardHeader>
        <CardContent>
          {salas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma sala cadastrada para esta unidade
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Capacidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salas.map((sala) => (
                  <TableRow key={sala.id}>
                    <TableCell className="font-medium">{sala.nome}</TableCell>
                    <TableCell>{sala.numero}</TableCell>
                    <TableCell>
                      <Badge>{sala.tipo}</Badge>
                    </TableCell>
                    <TableCell>{sala.andar || '-'}</TableCell>
                    <TableCell>{sala.capacidade || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
