'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Users, Sparkles, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getFullApiUrl } from '@/lib/api-config';

interface AssignProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  departmentId?: string;
  currentStageId?: string;
  onSuccess?: () => void;
}

interface ServerWithWorkload {
  userId: string;
  name: string;
  email: string;
  protocolosAtivos: number;
  protocolosPendentes: number;
  protocolosPrazoVencido: number;
  cargaPercentual: number;
  status: string;
  isStageRequired?: boolean;
  isStageSuggested?: boolean;
  stageAssignmentMode?: 'REQUIRED_EXECUTION' | 'SUGGEST_ASSIGNMENT' | null;
  stageAssignmentLabel?: string | null;
  employeeAssignment?: {
    organizationalUnit?: string;
    position?: string;
    cargaHoraria?: number;
  };
}

interface Suggestion {
  userId: string;
  name: string;
  email: string;
  score: number;
  razoes: string[];
  protocolosAtivos: number;
  cargaPercentual: number;
  isStageRequired?: boolean;
  isStageSuggested?: boolean;
  stageAssignmentLabel?: string | null;
  employeeAssignment?: {
    organizationalUnit?: string;
    position?: string;
  };
}

export function AssignProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  departmentId,
  currentStageId,
  onSuccess
}: AssignProtocolDialogProps) {
  const [selectedTab, setSelectedTab] = useState('individual');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<ServerWithWorkload[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWorkloadStats();
      fetchSuggestions();
    }
  }, [open, departmentId, currentStageId, protocolId]);

  const fetchWorkloadStats = async () => {
    if (!departmentId) {
      console.warn('⚠️ [ASSIGN-DIALOG] departmentId não fornecido, buscando todos os servidores');
    }

    try {
      setLoadingServers(true);
      const params = new URLSearchParams();
      if (departmentId) {
        params.set('departmentId', departmentId);
      }
      params.set('protocolId', protocolId);
      if (currentStageId) {
        params.set('stageId', currentStageId);
      }

      const url = getFullApiUrl(`/protocols/workload-stats${params.toString() ? `?${params.toString()}` : ''}`);

      console.log('🌐 [ASSIGN-DIALOG] Fazendo requisição para:', url);
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });
      console.log('📊 [ASSIGN-DIALOG] Status da resposta:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ASSIGN-DIALOG] Servidores carregados:', data.data);
        console.log('✅ [ASSIGN-DIALOG] Total de servidores:', data.data?.servidores?.length || 0);
        const servidores = Array.isArray(data?.data?.servidores) ? data.data.servidores : [];
        setServers(servidores);
      } else {
        console.error('❌ [ASSIGN-DIALOG] Resposta com erro. Status:', response.status);
        const error = await response.json();
        console.error('❌ [ASSIGN-DIALOG] Detalhes do erro:', error);
        toast.error('Erro ao carregar servidores: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ [ASSIGN-DIALOG] Exceção ao buscar carga de trabalho:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoadingServers(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const params = new URLSearchParams();
      if (departmentId) {
        params.set('departmentId', departmentId);
      }
      if (currentStageId) {
        params.set('stageId', currentStageId);
      }

      const url = getFullApiUrl(
        `/protocols/${protocolId}/suggest-assignee${params.toString() ? `?${params.toString()}` : ''}`
      );

      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sugestões carregadas:', data.data);
        const sugestoes = Array.isArray(data?.data?.sugestoes) ? data.data.sugestoes : [];
        setSuggestions(sugestoes);
      } else {
        const error = await response.json();
        console.error('Erro ao buscar sugestões:', error);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) {
      toast.error('Selecione um servidor');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/assign`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          assignedUserId: selectedAssignee,
          comment,
          stageId: currentStageId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Protocolo atribuído com sucesso!');
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        // Tratamento de erro específico para servidor em férias/afastado
        if (data.code && data.code.startsWith('SERVIDOR_')) {
          toast.error(data.error, {
            description: data.suggestedDelegates?.length > 0
              ? 'Verifique as sugestões de substitutos disponíveis'
              : undefined
          });
        } else {
          toast.error(data.error || 'Erro ao atribuir protocolo');
        }
      }
    } catch (error) {
      console.error('Erro ao atribuir protocolo:', error);
      toast.error('Erro ao atribuir protocolo');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAssignee('');
    setComment('');
    setSelectedTab('individual');
  };

  const getCargaBadgeVariant = (carga: number): 'default' | 'secondary' | 'destructive' => {
    if (carga >= 75) return 'destructive';
    if (carga >= 50) return 'secondary';
    return 'default';
  };

  const getCargaBadgeClass = (carga: number) => {
    if (carga >= 75) return 'bg-red-500 text-white';
    if (carga >= 50) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Atribuir Protocolo</DialogTitle>
          <DialogDescription>
            Selecione o servidor ou equipe responsável por este protocolo
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="individual">
              <User className="h-4 w-4 mr-2" />
              Servidor Individual
            </TabsTrigger>
            <TabsTrigger value="sugestoes">
              <Sparkles className="h-4 w-4 mr-2" />
              Sugestões IA
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="individual" className="m-0">
              {loadingServers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : servers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">Nenhum servidor disponível</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {departmentId
                      ? 'Não há servidores cadastrados neste departamento'
                      : 'Não há servidores cadastrados no sistema'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {servers.map((server) => (
                    <Card
                      key={server.userId}
                      className={`p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedAssignee === server.userId
                          ? 'border-blue-500 border-2 bg-blue-50'
                          : 'border'
                      }`}
                      onClick={() => setSelectedAssignee(server.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{server.name}</p>
                            {server.isStageRequired && (
                              <Badge className="bg-emerald-600 text-white">
                                Responsável da etapa
                              </Badge>
                            )}
                            {!server.isStageRequired && server.isStageSuggested && (
                              <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Sugestão da etapa
                              </Badge>
                            )}
                            {selectedAssignee === server.userId && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {server.employeeAssignment?.organizationalUnit || 'Sem lotação'}
                          </p>
                          {server.stageAssignmentLabel && (
                            <p className="text-xs text-emerald-700 mt-1">
                              {server.stageAssignmentLabel}
                            </p>
                          )}
                          {server.employeeAssignment?.position && (
                            <p className="text-xs text-gray-400">
                              {server.employeeAssignment.position}
                            </p>
                          )}
                        </div>

                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getCargaBadgeClass(server.cargaPercentual)}>
                              {server.protocolosAtivos} protocolos
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Carga: {server.cargaPercentual}%
                          </p>
                          {server.status !== 'ATIVO' && (
                            <Badge variant="destructive" className="text-xs">
                              {server.status}
                            </Badge>
                          )}
                          {server.protocolosPrazoVencido > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              {server.protocolosPrazoVencido} vencido(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sugestoes" className="m-0">
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={suggestion.userId}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedAssignee === suggestion.userId
                          ? 'border-blue-500 border-2 bg-blue-50'
                          : 'border'
                      } ${index === 0 ? 'border-green-500 border-2' : ''}`}
                      onClick={() => setSelectedAssignee(suggestion.userId)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          {index === 0 && (
                            <Badge className="bg-green-500 text-white">
                              Recomendado
                            </Badge>
                          )}
                          {suggestion.isStageRequired && (
                            <Badge className="bg-emerald-600 text-white">
                              Responsável da etapa
                            </Badge>
                          )}
                          {!suggestion.isStageRequired && suggestion.isStageSuggested && (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                              Sugestão da etapa
                            </Badge>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{suggestion.name}</p>
                              {selectedAssignee === suggestion.userId && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {suggestion.employeeAssignment?.position || 'Sem cargo'}
                            </p>
                            {suggestion.employeeAssignment?.organizationalUnit && (
                              <p className="text-xs text-gray-400">
                                {suggestion.employeeAssignment.organizationalUnit}
                              </p>
                            )}
                            {suggestion.stageAssignmentLabel && (
                              <p className="text-xs text-emerald-700 mt-1">
                                {suggestion.stageAssignmentLabel}
                              </p>
                            )}

                            <ul className="mt-2 space-y-1">
                              {suggestion.razoes.map((razao, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-gray-600 flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span>{razao}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600">
                            {suggestion.score}
                          </div>
                          <p className="text-xs text-gray-500">Score</p>
                          <Badge className={`${getCargaBadgeClass(suggestion.cargaPercentual)} mt-2`} variant="outline">
                            {suggestion.protocolosAtivos} ativos
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {suggestions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhuma sugestão disponível no momento</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-4 flex-shrink-0">
          <Label htmlFor="comment">Comentário/Instruções</Label>
          <Textarea
            id="comment"
            placeholder="Adicione instruções específicas para o servidor..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedAssignee}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
