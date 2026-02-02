'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, ArrowRightLeft, Forward, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Assignment {
  id: string;
  tipo: 'PRINCIPAL' | 'DELEGADO' | 'ENCAMINHADO' | 'CONSULTA' | 'APOIO';
  situacao: 'ATIVA' | 'CONCLUIDA' | 'CANCELADA' | 'SUBSTITUIDA' | 'PENDENTE';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: {
      name: string;
    };
  };
  assignedBy?: {
    id: string;
    name: string;
  };
  assignedByName?: string;
  motivo?: string;
  isDelegacao: boolean;
  delegadoPor?: string;
  ativaAte?: string;
  motivoDelegacao?: string;
  isInterdepartamental: boolean;
  departmentOrigemName?: string;
  departmentDestinoName?: string;
  employeeAssignment?: {
    organizationalUnit?: {
      nome: string;
    };
    position?: {
      nome: string;
    };
  };
  organizationalUnit?: {
    nome: string;
  };
  dataInicio: string;
  dataFim?: string;
  comentario?: string;
}

interface TimelineEvent {
  data: string;
  evento: string;
  por: string;
  tipo: string;
  situacao: string;
}

interface AssignmentHistoryTimelineProps {
  protocolId: string;
}

export function AssignmentHistoryTimeline({ protocolId }: AssignmentHistoryTimelineProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [protocolId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protocols-simplified/${protocolId}/assignments`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data.assignments || []);
        setTimeline(data.data.timeline || []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de atribuições:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'PRINCIPAL':
        return <User className="h-3 w-3 text-white" />;
      case 'DELEGADO':
        return <ArrowRightLeft className="h-3 w-3 text-white" />;
      case 'ENCAMINHADO':
        return <Forward className="h-3 w-3 text-white" />;
      case 'CONSULTA':
        return <Forward className="h-3 w-3 text-white" />;
      case 'APOIO':
        return <Users className="h-3 w-3 text-white" />;
      default:
        return <User className="h-3 w-3 text-white" />;
    }
  };

  const getTipoBadgeVariant = (tipo: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (tipo) {
      case 'PRINCIPAL':
        return 'default';
      case 'DELEGADO':
        return 'secondary';
      case 'ENCAMINHADO':
        return 'outline';
      case 'CONSULTA':
        return 'outline';
      case 'APOIO':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSituacaoIcon = (situacao: string) => {
    switch (situacao) {
      case 'ATIVA':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'CONCLUIDA':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'CANCELADA':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SUBSTITUIDA':
        return <ArrowRightLeft className="h-4 w-4 text-gray-600" />;
      case 'PENDENTE':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getSituacaoBadgeClass = (situacao: string) => {
    switch (situacao) {
      case 'ATIVA':
        return 'bg-green-500 text-white';
      case 'CONCLUIDA':
        return 'bg-blue-500 text-white';
      case 'CANCELADA':
        return 'bg-red-500 text-white';
      case 'SUBSTITUIDA':
        return 'bg-gray-500 text-white';
      case 'PENDENTE':
        return 'bg-yellow-500 text-white';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atribuições</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atribuições</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Nenhuma atribuição encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Atribuições</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline vertical */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

          {assignments.map((assignment, index) => (
            <div key={assignment.id} className="relative pl-16 pb-8 last:pb-0">
              {/* Ícone do tipo */}
              <div
                className={`absolute left-3 top-2 h-6 w-6 rounded-full ${
                  assignment.situacao === 'ATIVA' ? 'bg-green-500' : 'bg-gray-400'
                } flex items-center justify-center z-10`}
              >
                {getTipoIcon(assignment.tipo)}
              </div>

              <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-base">{assignment.user.name}</p>
                      <Badge variant={getTipoBadgeVariant(assignment.tipo)}>
                        {assignment.tipo}
                      </Badge>
                      <Badge className={getSituacaoBadgeClass(assignment.situacao)}>
                        {assignment.situacao}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      {assignment.user.department?.name || 'Sem departamento'}
                      {assignment.employeeAssignment?.organizationalUnit && (
                        <> - {assignment.employeeAssignment.organizationalUnit.nome}</>
                      )}
                    </p>

                    {assignment.employeeAssignment?.position && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Cargo: {assignment.employeeAssignment.position.nome}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>{format(new Date(assignment.dataInicio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                    {assignment.dataFim && (
                      <p className="text-xs mt-1">
                        até {format(new Date(assignment.dataFim), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Informações específicas */}
                {assignment.motivo && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <strong>Motivo:</strong> {assignment.motivo}
                    </p>
                  </div>
                )}

                {assignment.comentario && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <strong>Comentário:</strong> {assignment.comentario}
                    </p>
                  </div>
                )}

                {/* Delegação temporária */}
                {assignment.isDelegacao && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Delegação Temporária:</strong> {assignment.motivoDelegacao}
                      {assignment.ativaAte && (
                        <>
                          <br />
                          Ativa até: {format(new Date(assignment.ativaAte), 'dd/MM/yyyy', { locale: ptBR })}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Encaminhamento interdepartamental */}
                {assignment.isInterdepartamental && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800">
                      <strong>Encaminhamento Interdepartamental</strong>
                      <br />
                      De: {assignment.departmentOrigemName || 'N/A'}
                      <br />
                      Para: {assignment.departmentDestinoName || 'N/A'}
                    </p>
                  </div>
                )}

                {/* Quem atribuiu */}
                {assignment.assignedByName && (
                  <p className="text-xs text-gray-500 mt-2">
                    Atribuído por: {assignment.assignedByName}
                  </p>
                )}
              </Card>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
