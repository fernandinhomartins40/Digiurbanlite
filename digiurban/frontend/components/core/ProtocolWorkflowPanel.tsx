'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Play, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ProtocolStage {
  id: string;
  stageName: string;
  stageOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  result?: string;
  notes?: string;
  assignedTo?: string;
  completedBy?: string;
}

interface Props {
  protocolId: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock
  },
  IN_PROGRESS: {
    label: 'Em Andamento',
    color: 'bg-blue-100 text-blue-800',
    icon: Play
  },
  COMPLETED: {
    label: 'Concluída',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  FAILED: {
    label: 'Falhou',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  SKIPPED: {
    label: 'Pulada',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  }
};

export function ProtocolWorkflowPanel({ protocolId }: Props) {
  const [stages, setStages] = useState<ProtocolStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<ProtocolStage | null>(null);
  const [notes, setNotes] = useState('');
  const [failReason, setFailReason] = useState('');
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);

  useEffect(() => {
    if (protocolId) {
      loadStages();
    }
  }, [protocolId]);

  const loadStages = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/stages`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar etapas');
      }

      const result = await response.json();
      setStages((result.data || []).sort((a: ProtocolStage, b: ProtocolStage) => a.stageOrder - b.stageOrder));
    } catch (error: any) {
      console.error('Erro ao carregar etapas:', error);
      toast.error(error.message || 'Erro ao carregar etapas');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteClick = (stage: ProtocolStage) => {
    setSelectedStage(stage);
    setNotes('');
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedStage) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/stages/${selectedStage.id}/complete`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result: 'APPROVED', notes })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao concluir etapa');
      }

      toast.success('Etapa concluída com sucesso!');
      setIsCompleteDialogOpen(false);
      setSelectedStage(null);
      loadStages();
    } catch (error: any) {
      console.error('Erro ao concluir etapa:', error);
      toast.error(error.message || 'Erro ao concluir etapa');
    }
  };

  const handleFailClick = (stage: ProtocolStage) => {
    setSelectedStage(stage);
    setFailReason('');
    setIsFailDialogOpen(true);
  };

  const handleFailConfirm = async () => {
    if (!selectedStage || !failReason.trim()) {
      toast.error('Motivo da falha é obrigatório');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/stages/${selectedStage.id}/fail`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: failReason })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao marcar etapa como falha');
      }

      toast.success('Etapa marcada como falha');
      setIsFailDialogOpen(false);
      setSelectedStage(null);
      loadStages();
    } catch (error: any) {
      console.error('Erro ao marcar etapa como falha:', error);
      toast.error(error.message || 'Erro ao marcar etapa como falha');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando workflow...</div>
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Nenhuma etapa de workflow configurada para este protocolo.
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = stages.filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED').length;
  const progressPercent = (completedCount / stages.length) * 100;
  const currentStage = stages.find(s => s.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow do Protocolo</CardTitle>
          <CardDescription>
            {completedCount} de {stages.length} etapas concluídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {progressPercent.toFixed(0)}% completo
          </p>
        </CardContent>
      </Card>

      {/* Timeline de etapas */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const StatusIcon = statusConfig[stage.status].icon;
          const isCurrentStage = stage.status === 'IN_PROGRESS';

          return (
            <Card
              key={stage.id}
              className={`transition-all ${isCurrentStage ? 'border-blue-500 shadow-lg' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {/* Número da etapa */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-semibold
                          ${stage.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                            stage.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' :
                            stage.status === 'FAILED' ? 'bg-red-500 text-white' :
                            'bg-gray-200 text-gray-600'}
                        `}
                      >
                        {stage.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          stage.stageOrder
                        )}
                      </div>
                      {index < stages.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                      )}
                    </div>

                    {/* Conteúdo da etapa */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{stage.stageName}</h3>
                        <Badge className={statusConfig[stage.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[stage.status].label}
                        </Badge>
                      </div>

                      {stage.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          Prazo: {new Date(stage.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      {stage.startedAt && (
                        <p className="text-sm text-muted-foreground">
                          Iniciada em: {new Date(stage.startedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      {stage.completedAt && (
                        <p className="text-sm text-muted-foreground">
                          Concluída em: {new Date(stage.completedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      {stage.notes && (
                        <div className="bg-gray-50 border rounded-md p-3 mt-2">
                          <p className="text-sm">
                            <strong>Observações:</strong> {stage.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {stage.status === 'IN_PROGRESS' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteClick(stage)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleFailClick(stage)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Falhar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Conclusão */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Etapa</DialogTitle>
            <DialogDescription>
              Confirme a conclusão da etapa "{selectedStage?.stageName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a conclusão desta etapa..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCompleteConfirm}>
              Concluir Etapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Falha */}
      <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Etapa como Falha</DialogTitle>
            <DialogDescription>
              Informe o motivo da falha na etapa "{selectedStage?.stageName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="failReason">Motivo *</Label>
              <Textarea
                id="failReason"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Descreva o motivo da falha nesta etapa..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleFailConfirm}>
              Marcar como Falha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
