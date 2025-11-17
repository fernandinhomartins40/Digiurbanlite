'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertTriangle,
  FileCheck,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';

interface EnrollmentDetailsModalProps {
  open: boolean;
  enrollment: any;
  enrollmentDetails: any;
  loading: boolean;
  apiEndpoint: string;
  programId: string;
  onClose: () => void;
  onApprove: (enrollment: any) => void;
  onReject: (enrollment: any) => void;
  onRefresh: () => void;
}

export function EnrollmentDetailsModal({
  open,
  enrollment,
  enrollmentDetails,
  loading,
  apiEndpoint,
  programId,
  onClose,
  onApprove,
  onReject,
  onRefresh,
}: EnrollmentDetailsModalProps) {
  const { toast } = useToast();
  const [pendencyDialog, setPendencyDialog] = useState(false);
  const [pendencyDescription, setPendencyDescription] = useState('');
  const [pendencyItems, setPendencyItems] = useState<string[]>([]);
  const [newPendencyItem, setNewPendencyItem] = useState('');
  const [documentAction, setDocumentAction] = useState<{
    documentId: string;
    action: 'approve' | 'reject';
    reason?: string;
  } | null>(null);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      PENDING: { label: 'Pendente', variant: 'secondary' },
      UPLOADED: { label: 'Enviado', variant: 'default' },
      UNDER_REVIEW: { label: 'Em Análise', variant: 'default' },
      APPROVED: { label: 'Aprovado', variant: 'default' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDocumentApprove = async (documentId: string) => {
    try {
      const response = await apiClient.put(
        `${apiEndpoint}/${programId}/enrollments/${enrollment.id}/documents/${documentId}/approve`,
        {}
      );

      if (!response.ok) throw new Error('Erro ao aprovar documento');

      toast({
        title: 'Sucesso',
        description: 'Documento aprovado com sucesso',
      });

      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar documento',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentReject = async () => {
    if (!documentAction || !documentAction.reason) {
      toast({
        title: 'Erro',
        description: 'Motivo da rejeição é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.put(
        `${apiEndpoint}/${programId}/enrollments/${enrollment.id}/documents/${documentAction.documentId}/reject`,
        { reason: documentAction.reason }
      );

      if (!response.ok) throw new Error('Erro ao rejeitar documento');

      toast({
        title: 'Sucesso',
        description: 'Documento rejeitado',
      });

      setDocumentAction(null);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar documento',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePendency = async () => {
    if (!pendencyDescription.trim()) {
      toast({
        title: 'Erro',
        description: 'Descrição da pendência é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.post(
        `${apiEndpoint}/${programId}/enrollments/${enrollment.id}/pendency`,
        {
          description: pendencyDescription,
          pendencyItems,
        }
      );

      if (!response.ok) throw new Error('Erro ao criar pendência');

      toast({
        title: 'Sucesso',
        description: 'Pendência criada com sucesso',
      });

      setPendencyDialog(false);
      setPendencyDescription('');
      setPendencyItems([]);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar pendência',
        variant: 'destructive',
      });
    }
  };

  const addPendencyItem = () => {
    if (newPendencyItem.trim()) {
      setPendencyItems([...pendencyItems, newPendencyItem.trim()]);
      setNewPendencyItem('');
    }
  };

  const removePendencyItem = (index: number) => {
    setPendencyItems(pendencyItems.filter((_, i) => i !== index));
  };

  const allDocumentsApproved = () => {
    if (!enrollmentDetails?.protocol?.documentFiles) return false;
    const docs = enrollmentDetails.protocol.documentFiles;
    if (docs.length === 0) return true;
    return docs.every((doc: any) => doc.status === 'APPROVED');
  };

  const canApproveEnrollment = allDocumentsApproved();

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Inscrição</DialogTitle>
            <DialogDescription>
              Protocolo: <code className="font-mono">{enrollment?.protocol?.number}</code>
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : enrollmentDetails ? (
            <div className="space-y-6 py-4">
              {/* Dados do Candidato */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dados do Candidato
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <div className="font-medium">
                      {enrollmentDetails.applicantName || enrollmentDetails.citizen?.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">CPF:</span>
                    <div className="font-medium">
                      {enrollmentDetails.applicantCpf || enrollmentDetails.citizen?.cpf}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <div className="font-medium">
                      {enrollmentDetails.applicantEmail || enrollmentDetails.citizen?.email}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Telefone:</span>
                    <div className="font-medium">
                      {enrollmentDetails.applicantPhone || enrollmentDetails.citizen?.phone}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Data da Inscrição:</span>
                    <div className="font-medium">
                      {new Date(enrollmentDetails.enrollmentDate).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div className="font-medium">{getStatusBadge(enrollmentDetails.status)}</div>
                  </div>
                </div>
              </div>

              {/* Dados do Formulário Padrão */}
              {enrollmentDetails.protocol?.formData && Object.keys(enrollmentDetails.protocol.formData).length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Formulário Padrão
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    {Object.entries(enrollmentDetails.protocol.formData).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                        <span className="text-sm text-muted-foreground font-medium">{key}:</span>
                        <span className="text-sm font-medium text-right max-w-md">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados do Formulário Customizado */}
              {enrollmentDetails.protocol?.customData && Object.keys(enrollmentDetails.protocol.customData).length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Formulário Customizado
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    {Object.entries(enrollmentDetails.protocol.customData).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                        <span className="text-sm text-muted-foreground font-medium">{key}:</span>
                        <span className="text-sm font-medium text-right max-w-md">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentos Anexados */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Documentos Anexados
                  {!canApproveEnrollment && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Aprovação pendente
                    </Badge>
                  )}
                </h3>
                {enrollmentDetails.protocol?.documentFiles && enrollmentDetails.protocol.documentFiles.length > 0 ? (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    {enrollmentDetails.protocol.documentFiles.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background rounded border">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{doc.documentType}</div>
                            {doc.fileName && <div className="text-xs text-muted-foreground">{doc.fileName}</div>}
                            {doc.rejectionReason && (
                              <div className="text-xs text-destructive mt-1">
                                Motivo: {doc.rejectionReason}
                              </div>
                            )}
                          </div>
                          <div>{getStatusBadge(doc.status)}</div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          {doc.fileUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Abrir
                            </Button>
                          )}
                          {doc.status !== 'APPROVED' && doc.status !== 'REJECTED' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleDocumentApprove(doc.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDocumentAction({ documentId: doc.id, action: 'reject' })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
                    Nenhum documento anexado
                  </div>
                )}
              </div>

              {/* Pendências */}
              {enrollmentDetails.protocol?.interactions && enrollmentDetails.protocol.interactions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico de Pendências
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    {enrollmentDetails.protocol.interactions.map((interaction: any, idx: number) => (
                      <div key={idx} className="p-3 bg-background rounded border">
                        <div className="text-sm font-medium">{interaction.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(interaction.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={() => setPendencyDialog(true)}
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Criar Pendência
            </Button>
            {enrollmentDetails?.status === 'PENDING' && (
              <>
                <Button
                  variant="default"
                  onClick={() => onApprove(enrollmentDetails)}
                  disabled={!canApproveEnrollment}
                  title={!canApproveEnrollment ? 'Todos os documentos devem ser aprovados primeiro' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Inscrição
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onReject(enrollmentDetails)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Inscrição
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeitar Documento */}
      <Dialog open={!!documentAction} onOpenChange={(open) => !open && setDocumentAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Documento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={documentAction?.reason || ''}
                onChange={(e) =>
                  setDocumentAction(
                    documentAction ? { ...documentAction, reason: e.target.value } : null
                  )
                }
                placeholder="Ex: Documento ilegível, fora do prazo de validade..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentAction(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDocumentReject}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Pendência */}
      <Dialog open={pendencyDialog} onOpenChange={setPendencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Pendência</DialogTitle>
            <DialogDescription>
              Crie uma pendência para solicitar documentos ou informações adicionais do cidadão
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição Geral da Pendência *</Label>
              <Textarea
                value={pendencyDescription}
                onChange={(e) => setPendencyDescription(e.target.value)}
                placeholder="Ex: Documentação incompleta, necessário envio de novos documentos..."
                required
                rows={3}
              />
            </div>
            <div>
              <Label>Itens da Pendência</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newPendencyItem}
                  onChange={(e) => setNewPendencyItem(e.target.value)}
                  placeholder="Ex: Enviar RG atualizado"
                  onKeyPress={(e) => e.key === 'Enter' && addPendencyItem()}
                />
                <Button type="button" onClick={addPendencyItem}>
                  Adicionar
                </Button>
              </div>
              {pendencyItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {pendencyItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{item}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePendencyItem(idx)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendencyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePendency}>
              Criar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
