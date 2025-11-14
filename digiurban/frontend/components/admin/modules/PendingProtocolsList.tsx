/**
 * Componente para listar protocolos pendentes de aprovação
 * Usado nas páginas de módulos das secretarias
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ModuleConfig } from '@/lib/module-configs/types';

interface PendingProtocolsListProps {
  config?: ModuleConfig;
  departmentType?: string;
  // Backward compatibility
  moduleType?: string;
  moduleName?: string;
}

interface Protocol {
  id: string;
  number: string;
  title: string;
  createdAt: string;
  customData?: Record<string, any>;
  citizen: {
    name: string;
    cpf?: string;
  };
}

interface PendingProtocolsData {
  data: Protocol[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export function PendingProtocolsList({
  config,
  departmentType,
  moduleType: legacyModuleType,
  moduleName: legacyModuleName
}: PendingProtocolsListProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();

  // Use new props or fallback to legacy
  const moduleType = config?.key || legacyModuleType || '';
  const moduleName = config?.displayName || legacyModuleName || '';
  const dept = config?.departmentType || departmentType || '';

  const [page, setPage] = useState(1);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [data, setData] = useState<PendingProtocolsData>({
    data: [],
    pagination: { total: 0, page: 1, pages: 1 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Buscar protocolos pendentes
  useEffect(() => {
    const fetchPendingProtocols = async () => {
      if (!moduleType || !dept) {
        console.log('⚠️ PendingProtocolsList: Missing moduleType or dept', { moduleType, dept });
        return;
      }

      const url = `/api/admin/secretarias/${dept}/${moduleType}/pending?page=${page}&limit=10`;
      console.log('📡 PendingProtocolsList: Fetching', url);

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest(url, { method: 'GET' }) as PendingProtocolsData;

        console.log('✅ PendingProtocolsList: Response received', response);
        setData(response);
      } catch (err: any) {
        console.error('❌ PendingProtocolsList: Error', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingProtocols();
  }, [moduleType, dept, page, apiRequest]);

  const handleApprove = async () => {
    if (!selectedProtocol) return;

    setIsApproving(true);
    try {
      await apiRequest(
        `/api/protocols-simplified/${selectedProtocol.id}/approve`,
        {
          method: 'PUT',
          body: JSON.stringify({
            comment: comment || 'Aprovado pelo servidor',
          }),
        }
      );

      toast.success('Protocolo aprovado com sucesso!');
      setShowApproveDialog(false);
      setSelectedProtocol(null);
      setComment('');

      // Recarregar lista
      setData(prev => ({
        ...prev,
        data: prev.data.filter(p => p.id !== selectedProtocol.id)
      }));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar protocolo');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProtocol || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setIsRejecting(true);
    try {
      await apiRequest(
        `/api/protocols-simplified/${selectedProtocol.id}/reject`,
        {
          method: 'PUT',
          body: JSON.stringify({
            reason: rejectReason,
          }),
        }
      );

      toast.success('Protocolo rejeitado');
      setShowRejectDialog(false);
      setSelectedProtocol(null);
      setRejectReason('');

      // Recarregar lista
      setData(prev => ({
        ...prev,
        data: prev.data.filter(p => p.id !== selectedProtocol.id)
      }));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar protocolo');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos Pendentes</CardTitle>
          <CardDescription>
            Solicitações aguardando aprovação para {moduleName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 p-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">Erro ao carregar protocolos pendentes</p>
        </CardContent>
      </Card>
    );
  }

  const protocols = data?.data || [];
  const pagination = data?.pagination;

  if (protocols.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos Pendentes</CardTitle>
          <CardDescription>
            Solicitações aguardando aprovação para {moduleName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
            <p className="text-sm text-muted-foreground">
              Não há protocolos pendentes de aprovação no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Protocolos Pendentes</CardTitle>
              <CardDescription>
                {pagination?.total || 0} solicitações aguardando aprovação
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Clock className="h-3 w-3 mr-1" />
              {pagination?.total || 0} pendentes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {protocols.map((protocol: any) => (
              <Card key={protocol.id} className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info do Protocolo */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {protocol.number}
                        </Badge>
                        <h4 className="font-semibold">{protocol.title}</h4>
                      </div>

                      {/* Cidadão */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{protocol.citizen.name}</span>
                        {protocol.citizen.cpf && (
                          <span className="font-mono">• CPF: {protocol.citizen.cpf}</span>
                        )}
                      </div>

                      {/* Data */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Solicitado em{' '}
                          {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {/* Preview dos Dados */}
                      {protocol.customData && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs font-medium mb-1">Dados informados:</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {Object.entries(protocol.customData).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                            {Object.keys(protocol.customData).length > 3 && (
                              <p className="text-xs italic">
                                + {Object.keys(protocol.customData).length - 3} campos
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedProtocol(protocol);
                          setShowApproveDialog(true);
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedProtocol(protocol);
                          setShowRejectDialog(true);
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/admin/protocolos/${protocol.id}`)}
                        title="Ver protocolo completo com todas as interações, documentos e pendências"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Protocolo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Protocolo</DialogTitle>
            <DialogDescription>
              Ao aprovar, o registro será criado no módulo {moduleName} e o protocolo será marcado
              como concluído.
            </DialogDescription>
          </DialogHeader>

          {selectedProtocol && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Protocolo: {selectedProtocol.number}</p>
                <p className="text-sm text-muted-foreground">
                  Cidadão: {selectedProtocol.citizen.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approve-comment">Comentário (opcional)</Label>
                <Textarea
                  id="approve-comment"
                  placeholder="Ex: Documentação conferida e aprovada"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setComment('');
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? 'Aprovando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Protocolo</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O protocolo será cancelado e o cidadão será notificado.
            </DialogDescription>
          </DialogHeader>

          {selectedProtocol && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Protocolo: {selectedProtocol.number}</p>
                <p className="text-sm text-muted-foreground">
                  Cidadão: {selectedProtocol.citizen.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">
                  Motivo da Rejeição <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Ex: Documentação incompleta - falta comprovante de residência"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
