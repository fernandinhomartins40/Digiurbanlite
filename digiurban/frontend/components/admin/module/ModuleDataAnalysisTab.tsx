'use client';

/**
 * ============================================================================
 * MÓDULO: Análise de Dados
 * ============================================================================
 *
 * ABA 2: Análise e aprovação granular de campos de dados
 * Visualização consolidada de TODOS os campos de TODOS os protocolos
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CheckCheck,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useProtocolDataFields } from '@/hooks/useProtocolDataFields';
import { toast } from 'sonner';

interface ModuleDataAnalysisTabProps {
  protocols: any[];
  service: any;
}

export function ModuleDataAnalysisTab({
  protocols,
  service
}: ModuleDataAnalysisTabProps) {
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingField, setRejectingField] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Estatísticas consolidadas
  const consolidatedStats = useMemo(() => {
    let totalFields = 0;
    let approvedFields = 0;
    let pendingFields = 0;
    let rejectedFields = 0;

    protocols.forEach(protocol => {
      const fieldCount = protocol.dataFields?.length || 0;
      totalFields += fieldCount;

      protocol.dataFields?.forEach((field: any) => {
        if (field.status === 'APPROVED') approvedFields++;
        if (field.status === 'PENDING' || field.status === 'UNDER_REVIEW') pendingFields++;
        if (field.status === 'REJECTED') rejectedFields++;
      });
    });

    const percentageApproved = totalFields > 0
      ? Math.round((approvedFields / totalFields) * 100)
      : 0;

    return {
      totalFields,
      approvedFields,
      pendingFields,
      rejectedFields,
      percentageApproved,
      protocolsWithPending: protocols.filter(p =>
        p.dataFields?.some((f: any) => f.status === 'PENDING' || f.status === 'UNDER_REVIEW')
      ).length
    };
  }, [protocols]);

  // Filtrar protocolos
  const filteredProtocols = useMemo(() => {
    let filtered = protocols;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p =>
        p.dataFields?.some((f: any) => {
          if (filterStatus === 'pending') return f.status === 'PENDING' || f.status === 'UNDER_REVIEW';
          if (filterStatus === 'approved') return f.status === 'APPROVED';
          if (filterStatus === 'rejected') return f.status === 'REJECTED';
          return true;
        })
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.number || p.protocolNumber || '').toLowerCase().includes(searchLower) ||
        p.citizen?.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [protocols, filterStatus, searchTerm]);

  // Componente para linha de campo
  const FieldRow = ({ protocol, field, onApprove, onReject }: any) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: 'text-yellow-600', icon: Clock, label: 'Pendente' },
      UNDER_REVIEW: { color: 'text-blue-600', icon: AlertTriangle, label: 'Em Revisão' },
      APPROVED: { color: 'text-green-600', icon: CheckCircle2, label: 'Aprovado' },
      REJECTED: { color: 'text-red-600', icon: XCircle, label: 'Rejeitado' },
      CORRECTED: { color: 'text-purple-600', icon: CheckCheck, label: 'Corrigido' },
    };

    const config = statusConfig[field.status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{field.fieldLabel}</span>
              {field.isRequired && (
                <Badge variant="outline" className="text-xs">Obrigatório</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground break-words">
              {field.fieldValue || '—'}
            </div>
            {field.rejectionReason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <strong>Motivo da rejeição:</strong> {field.rejectionReason}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1 ${config.color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-xs">{config.label}</span>
            </div>
          </div>
        </div>

        {(field.status === 'PENDING' || field.status === 'CORRECTED') && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              onClick={() => onApprove(field)}
              className="flex-1"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(field)}
              className="flex-1"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Componente para card de protocolo
  const ProtocolCard = ({ protocol }: any) => {
    const { fields, stats, loading, approveField, rejectField, approveAllFields } =
      useProtocolDataFields(protocol.id);

    const isExpanded = expandedProtocol === protocol.id;

    const handleApprove = async (field: any) => {
      try {
        await approveField(field.id);
      } catch (error) {
        // Erro já tratado no hook
      }
    };

    const handleReject = (field: any) => {
      setRejectingField({ ...field, protocolId: protocol.id });
      setRejectDialogOpen(true);
    };

    const handleApproveAll = async () => {
      try {
        await approveAllFields();
        toast.success('Todos os campos foram aprovados!');
      } catch (error) {
        // Erro já tratado no hook
      }
    };

    if (loading) {
      return (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Carregando campos...
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Protocolo #{protocol.number || protocol.protocolNumber}
              </CardTitle>
              <CardDescription>
                {protocol.citizen?.name || 'Cidadão não identificado'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {stats && (
                <>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{stats.percentageApproved}%</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.approved}/{stats.total} aprovados
                    </div>
                  </div>
                  {stats.pending > 0 && (
                    <Badge variant="outline" className="text-yellow-600">
                      {stats.pending} pendentes
                    </Badge>
                  )}
                  {stats.rejected > 0 && (
                    <Badge variant="destructive">
                      {stats.rejected} rejeitados
                    </Badge>
                  )}
                </>
              )}
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3">
            {stats && stats.pending > 0 && (
              <Button
                onClick={handleApproveAll}
                variant="default"
                className="w-full"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Aprovar Todos os Campos Pendentes ({stats.pending})
              </Button>
            )}

            <div className="space-y-2">
              {fields.map((field: any) => (
                <FieldRow
                  key={field.id}
                  protocol={protocol}
                  field={field}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // Confirmar rejeição
  const confirmReject = async () => {
    if (!rejectingField || !rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      const { rejectField } = useProtocolDataFields(rejectingField.protocolId);
      await rejectField(rejectingField.id, rejectionReason);

      setRejectDialogOpen(false);
      setRejectingField(null);
      setRejectionReason('');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas Consolidadas */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral da Aprovação de Dados</CardTitle>
          <CardDescription>
            Estatísticas consolidadas de todos os protocolos do módulo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{consolidatedStats.totalFields}</div>
              <div className="text-xs text-muted-foreground">Total de Campos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{consolidatedStats.approvedFields}</div>
              <div className="text-xs text-muted-foreground">Aprovados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{consolidatedStats.pendingFields}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{consolidatedStats.rejectedFields}</div>
              <div className="text-xs text-muted-foreground">Rejeitados</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso Geral</span>
              <span className="font-semibold">{consolidatedStats.percentageApproved}%</span>
            </div>
            <Progress value={consolidatedStats.percentageApproved} className="h-2" />
          </div>

          {consolidatedStats.protocolsWithPending > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {consolidatedStats.protocolsWithPending} protocolos com campos pendentes de aprovação
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cidadão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Com Pendentes</SelectItem>
                <SelectItem value="approved">Todos Aprovados</SelectItem>
                <SelectItem value="rejected">Com Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Protocolos */}
      <div className="space-y-3">
        {filteredProtocols.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhum protocolo encontrado
            </CardContent>
          </Card>
        ) : (
          filteredProtocols.map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))
        )}
      </div>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Campo</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do campo "{rejectingField?.fieldLabel}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: CPF inválido, documento ilegível, informação inconsistente..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
