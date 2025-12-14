'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProtocolDocument {
  id: string;
  documentType: string;
  isRequired: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  rejectionReason?: string;
  notes?: string;
  uploadedAt?: string;
  reviewedAt?: string;
}

interface Props {
  protocolId: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock
  },
  APPROVED: {
    label: 'Aprovado',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle
  },
  UNDER_REVIEW: {
    label: 'Em Análise',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: AlertCircle
  }
};

export function ProtocolDocumentsPanel({ protocolId }: Props) {
  const [documents, setDocuments] = useState<ProtocolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<ProtocolDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (protocolId) {
      loadDocuments();
    }
  }, [protocolId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/documents`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar documentos');
      }

      const result = await response.json();
      setDocuments(result.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      toast.error(error.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/documents/${docId}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Documento aprovado' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar documento');
      }

      toast.success('Documento aprovado com sucesso!');
      loadDocuments();
    } catch (error: any) {
      console.error('Erro ao aprovar documento:', error);
      toast.error(error.message || 'Erro ao aprovar documento');
    }
  };

  const handleRejectClick = (doc: ProtocolDocument) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/documents/${selectedDoc.id}/reject`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao rejeitar documento');
      }

      toast.success('Documento rejeitado');
      setIsRejectDialogOpen(false);
      setSelectedDoc(null);
      loadDocuments();
    } catch (error: any) {
      console.error('Erro ao rejeitar documento:', error);
      toast.error(error.message || 'Erro ao rejeitar documento');
    }
  };

  const handlePreview = (doc: ProtocolDocument) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando documentos...</div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Nenhum documento anexado a este protocolo.
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const approvedCount = documents.filter(d => d.status === 'APPROVED').length;

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos do Protocolo</CardTitle>
          <CardDescription>
            {approvedCount} aprovado{approvedCount !== 1 ? 's' : ''} de {documents.length} total
            {pendingCount > 0 && ` • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de documentos */}
      <div className="grid gap-4">
        {documents.map((doc) => {
          const StatusIcon = statusConfig[doc.status].icon;

          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{doc.documentType}</h3>
                      {doc.isRequired && (
                        <Badge variant="outline" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>

                    <Badge className={statusConfig[doc.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[doc.status].label}
                    </Badge>

                    {doc.fileName && (
                      <p className="text-sm text-muted-foreground">
                        Arquivo: {doc.fileName}
                        {doc.fileSize && ` (${(doc.fileSize / 1024).toFixed(2)} KB)`}
                      </p>
                    )}

                    {doc.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">
                          <strong>Motivo da rejeição:</strong> {doc.rejectionReason}
                        </p>
                      </div>
                    )}

                    {doc.notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {doc.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {doc.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(doc)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    )}

                    {doc.status === 'PENDING' && doc.fileUrl && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(doc)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Rejeição */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Documento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do documento "{selectedDoc?.documentType}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documento ilegível, data vencida, informações incompletas..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Rejeitar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.documentType}</DialogTitle>
            <DialogDescription>{selectedDoc?.fileName}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedDoc?.fileUrl && (
              <iframe
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/protocols/${protocolId}/documents/${selectedDoc.id}/download?inline=true`}
                className="w-full h-[60vh] border rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
