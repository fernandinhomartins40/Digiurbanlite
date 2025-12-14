'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Plus, FileText, UserCheck, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProtocolPending {
  id: string;
  type: 'DOCUMENT' | 'APPROVAL' | 'INFO' | 'OTHER';
  title: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  blocksProgress: boolean;
  dueDate?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  createdBy?: string;
  resolvedBy?: string;
}

interface Props {
  protocolId: string;
}

const typeConfig = {
  DOCUMENT: {
    label: 'Documento',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800'
  },
  APPROVAL: {
    label: 'Aprovação',
    icon: UserCheck,
    color: 'bg-purple-100 text-purple-800'
  },
  INFO: {
    label: 'Informação',
    icon: Info,
    color: 'bg-yellow-100 text-yellow-800'
  },
  OTHER: {
    label: 'Outro',
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-800'
  }
};

const statusConfig = {
  OPEN: {
    label: 'Aberta',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  RESOLVED: {
    label: 'Resolvida',
    color: 'bg-green-100 text-green-800 border-green-300'
  }
};

export function ProtocolPendingsPanel({ protocolId }: Props) {
  const [pendings, setPendings] = useState<ProtocolPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<ProtocolPending | null>(null);
  const [resolution, setResolution] = useState('');

  const [newPending, setNewPending] = useState({
    type: 'OTHER' as ProtocolPending['type'],
    title: '',
    description: '',
    blocksProgress: true,
    dueDate: ''
  });

  useEffect(() => {
    if (protocolId) {
      loadPendings();
    }
  }, [protocolId]);

  const loadPendings = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/pendings`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar pendências');
      }

      const result = await response.json();
      setPendings(result.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pendências:', error);
      toast.error(error.message || 'Erro ao carregar pendências');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPending.title.trim() || !newPending.description.trim()) {
      toast.error('Título e descrição são obrigatórios');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols/${protocolId}/pendings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPending,
          dueDate: newPending.dueDate || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pendência');
      }

      toast.success('Pendência criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewPending({
        type: 'OTHER',
        title: '',
        description: '',
        blocksProgress: true,
        dueDate: ''
      });
      loadPendings();
    } catch (error: any) {
      console.error('Erro ao criar pendência:', error);
      toast.error(error.message || 'Erro ao criar pendência');
    }
  };

  const handleResolveClick = (pending: ProtocolPending) => {
    setSelectedPending(pending);
    setResolution('');
    setIsResolveDialogOpen(true);
  };

  const handleResolveConfirm = async () => {
    if (!selectedPending) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/protocols/${protocolId}/pendings/${selectedPending.id}/resolve`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution: resolution || 'Pendência resolvida' })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao resolver pendência');
      }

      toast.success('Pendência resolvida com sucesso!');
      setIsResolveDialogOpen(false);
      setSelectedPending(null);
      loadPendings();
    } catch (error: any) {
      console.error('Erro ao resolver pendência:', error);
      toast.error(error.message || 'Erro ao resolver pendência');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando pendências...</div>
        </CardContent>
      </Card>
    );
  }

  const openPendings = pendings.filter(p => p.status === 'OPEN');
  const resolvedPendings = pendings.filter(p => p.status === 'RESOLVED');

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pendências do Protocolo</CardTitle>
              <CardDescription>
                {openPendings.length} aberta{openPendings.length !== 1 ? 's' : ''} • {resolvedPendings.length} resolvida{resolvedPendings.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Pendência
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Pendências abertas */}
      {openPendings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Pendências Abertas
          </h3>
          {openPendings.map((pending) => {
            const TypeIcon = typeConfig[pending.type].icon;

            return (
              <Card key={pending.id} className="border-red-200 bg-red-50/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold">{pending.title}</h4>
                        <Badge className={typeConfig[pending.type].color}>
                          {typeConfig[pending.type].label}
                        </Badge>
                        {pending.blocksProgress && (
                          <Badge variant="destructive">Bloqueia Progresso</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{pending.description}</p>

                      {pending.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Prazo:</strong> {new Date(pending.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Criada em {new Date(pending.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleResolveClick(pending)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pendências resolvidas */}
      {resolvedPendings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pendências Resolvidas
          </h3>
          {resolvedPendings.map((pending) => {
            const TypeIcon = typeConfig[pending.type].icon;

            return (
              <Card key={pending.id} className="border-green-200 bg-green-50/30 opacity-75">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-semibold">{pending.title}</h4>
                      <Badge className={typeConfig[pending.type].color}>
                        {typeConfig[pending.type].label}
                      </Badge>
                      <Badge className={statusConfig.RESOLVED.color}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolvida
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{pending.description}</p>

                    {pending.resolution && (
                      <div className="bg-green-100 border border-green-300 rounded-md p-3">
                        <p className="text-sm text-green-900">
                          <strong>Resolução:</strong> {pending.resolution}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Resolvida em {pending.resolvedAt && new Date(pending.resolvedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pendings.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Nenhuma pendência registrada para este protocolo.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criar Pendência */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pendência</DialogTitle>
            <DialogDescription>
              Crie uma pendência manual para este protocolo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={newPending.type}
                onValueChange={(value) => setNewPending({ ...newPending, type: value as ProtocolPending['type'] })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCUMENT">Documento</SelectItem>
                  <SelectItem value="APPROVAL">Aprovação</SelectItem>
                  <SelectItem value="INFO">Informação</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newPending.title}
                onChange={(e) => setNewPending({ ...newPending, title: e.target.value })}
                placeholder="Ex: Aguardando documento adicional"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={newPending.description}
                onChange={(e) => setNewPending({ ...newPending, description: e.target.value })}
                placeholder="Descreva a pendência..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Prazo (opcional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={newPending.dueDate}
                onChange={(e) => setNewPending({ ...newPending, dueDate: e.target.value })}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blocksProgress"
                checked={newPending.blocksProgress}
                onChange={(e) => setNewPending({ ...newPending, blocksProgress: e.target.checked })}
              />
              <Label htmlFor="blocksProgress">Bloqueia progresso do protocolo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Criar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resolver Pendência */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Pendência</DialogTitle>
            <DialogDescription>
              Informe como a pendência "{selectedPending?.title}" foi resolvida
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolução (opcional)</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Descreva como a pendência foi resolvida..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleResolveConfirm}>
              Resolver Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
