'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Edit, UserCog, Phone, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DetalhesProfissionalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [profissional, setProfissional] = useState<any>(null);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfissional();
    fetchAgendas();
  }, [id]);

  const fetchProfissional = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/profissionais/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfissional(data);
      } else {
        toast.error('Erro ao carregar profissional');
        router.push('/admin/apps/saude/cadastros/profissionais');
      }
    } catch (error) {
      console.error('Erro ao carregar profissional:', error);
      toast.error('Erro ao carregar profissional');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgendas = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/agendas?profissionalId=${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAgendas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar agendas:', error);
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

  if (!profissional) {
    return null;
  }

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/apps/saude/cadastros/profissionais')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{profissional.nome}</h1>
            <p className="text-gray-600">{profissional.categoria} - {profissional.registroProfissional}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/apps/saude/cadastros/profissionais/${id}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <UserCog className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="text-xl font-bold">{profissional.categoria}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agendas</p>
                <p className="text-xl font-bold">{agendas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <UserCog className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={
                  profissional.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                  profissional.status === 'Ferias' ? 'bg-yellow-100 text-yellow-800' :
                  profissional.status === 'Licenca' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }>
                  {profissional.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-xl font-bold">{profissional.tempoMedioConsulta || '-'} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCog className="h-5 w-5" />
              <span>Informações Profissionais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">CPF</p>
                <p className="font-medium">{profissional.cpf}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">RG</p>
                <p className="font-medium">{profissional.rg || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registro Profissional</p>
              <p className="font-medium">{profissional.tipoRegistro} {profissional.registroProfissional}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Aceita Agendamento Online</p>
              <Badge className={profissional.aceitaAgendamento ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {profissional.aceitaAgendamento ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contato</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium">{profissional.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{profissional.email || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {profissional.especialidades && profissional.especialidades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profissional.especialidades.map((esp: any) => (
                <Badge key={esp.id} className="bg-purple-100 text-purple-800">
                  {esp.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profissional.unidades && profissional.unidades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unidades de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profissional.unidades.map((unidade: any) => (
                <Badge key={unidade.id} className="bg-blue-100 text-blue-800">
                  {unidade.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agendas Médicas</CardTitle>
        </CardHeader>
        <CardContent>
          {agendas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma agenda cadastrada para este profissional
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Dia da Semana</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Vagas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendas.map((agenda) => (
                  <TableRow key={agenda.id}>
                    <TableCell className="font-medium">{agenda.unidade?.nome}</TableCell>
                    <TableCell>{agenda.especialidade?.nome}</TableCell>
                    <TableCell>{diasSemana[agenda.diaSemana]}</TableCell>
                    <TableCell>{agenda.horaInicio} - {agenda.horaFim}</TableCell>
                    <TableCell>{agenda.vagasDisponiveis}</TableCell>
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
