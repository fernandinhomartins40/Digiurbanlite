'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  completedAt?: string;
  completedBy?: string;
  comments?: string;
  documents?: { name: string; url: string }[];
}

export interface WorkflowAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  requiresComment?: boolean;
  requiresDocument?: boolean;
  confirmMessage?: string;
}

export interface WorkflowPanelProps {
  workflowId: string;
  steps: WorkflowStep[];
  currentStep?: string;
  availableActions?: WorkflowAction[];
  onAction?: (actionId: string, data: { comment?: string; documents?: File[] }) => Promise<void>;
  onViewHistory?: () => void;
  showTimeline?: boolean;
}

export function WorkflowPanel({
  workflowId,
  steps,
  currentStep,
  availableActions = [],
  onAction,
  onViewHistory,
  showTimeline = true,
}: WorkflowPanelProps) {
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionClick = (action: WorkflowAction) => {
    if (action.confirmMessage) {
      if (!confirm(action.confirmMessage)) return;
    }
    setSelectedAction(action);
  };

  const handleSubmitAction = async () => {
    if (!selectedAction || !onAction) return;

    if (selectedAction.requiresComment && !comment.trim()) {
      alert('Por favor, adicione um comentário.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction(selectedAction.id, { comment: comment.trim() || undefined });
      setSelectedAction(null);
      setComment('');
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluído</Badge>;
      case 'current':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      {availableActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Disponíveis</CardTitle>
            <CardDescription>
              Escolha uma ação para prosseguir com o fluxo de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'default'}
                  onClick={() => handleActionClick(action)}
                  disabled={isSubmitting}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
              {onViewHistory && (
                <Button variant="outline" onClick={onViewHistory}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Histórico Completo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline */}
      {showTimeline && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Trabalho</CardTitle>
            <CardDescription>Workflow ID: {workflowId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-2.5 top-10 h-full w-0.5 ${
                        step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  {/* Step */}
                  <div className="flex gap-4">
                    <div className="relative z-10 flex-shrink-0">{getStepIcon(step.status)}</div>

                    <div className="flex-1 space-y-2 pb-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{step.name}</h4>
                          {step.completedAt && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(step.completedAt).toLocaleString('pt-BR')}
                              {step.completedBy && ` • ${step.completedBy}`}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(step.status)}
                      </div>

                      {step.comments && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <p className="text-sm">{step.comments}</p>
                          </div>
                        </div>
                      )}

                      {step.documents && step.documents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {step.documents.map((doc, docIndex) => (
                            <a
                              key={docIndex}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {doc.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAction?.label}</DialogTitle>
            <DialogDescription>
              {selectedAction?.requiresComment
                ? 'Adicione um comentário explicando sua decisão.'
                : 'Confirme a ação abaixo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAction?.requiresComment && (
              <div className="space-y-2">
                <Label htmlFor="comment">Comentário *</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Digite seu comentário aqui..."
                  rows={4}
                  required
                />
              </div>
            )}

            {selectedAction?.requiresDocument && (
              <div className="space-y-2">
                <Label htmlFor="documents">Documentos</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAction(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitAction} disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
