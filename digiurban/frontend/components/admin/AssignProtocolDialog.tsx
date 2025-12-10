'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { toast } from 'sonner';
import { UserPlus, Loader2, User } from 'lucide-react';

interface Protocol {
  id: string;
  number: string;
  title: string;
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    role: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
}

interface AssignProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: Protocol | null;
  onSuccess: () => void;
}

export function AssignProtocolDialog({
  open,
  onOpenChange,
  protocol,
  onSuccess
}: AssignProtocolDialogProps) {
  const { apiRequest } = useAdminAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [comment, setComment] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Carregar membros da equipe do departamento
  useEffect(() => {
    if (open && protocol) {
      loadTeamMembers();
    }
  }, [open, protocol]);

  const loadTeamMembers = async () => {
    if (!protocol) return;

    try {
      setLoadingTeam(true);
      const response = await apiRequest('/api/admin/team');
      const allMembers = response.teamMembers || response.data?.teamMembers || [];

      // Filtrar apenas servidores do departamento do protocolo
      const filteredMembers = allMembers.filter((member: TeamMember) =>
        member.departmentId === protocol.departmentId &&
        ['USER', 'COORDINATOR', 'MANAGER'].includes(member.role)
      );

      setTeamMembers(filteredMembers);

      // Se protocolo já tem servidor atribuído, selecionar
      if (protocol.assignedUser) {
        setSelectedUserId(protocol.assignedUser.id);
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      toast.error('Erro ao carregar lista de servidores');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleAssign = async () => {
    if (!protocol || !selectedUserId) {
      toast.error('Selecione um servidor');
      return;
    }

    try {
      setLoading(true);

      await apiRequest(`/api/protocols/${protocol.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignedUserId: selectedUserId,
          comment: comment || undefined
        })
      });

      const selectedMember = teamMembers.find(m => m.id === selectedUserId);
      toast.success('Protocolo atribuído com sucesso!', {
        description: `Atribuído para ${selectedMember?.name}`
      });

      onSuccess();
      onOpenChange(false);
      setComment('');
      setSelectedUserId('');
    } catch (error: any) {
      console.error('Erro ao atribuir protocolo:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao atribuir protocolo');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      MANAGER: 'bg-purple-100 text-purple-800',
      COORDINATOR: 'bg-blue-100 text-blue-800',
      USER: 'bg-gray-100 text-gray-800'
    };

    const roleLabels: Record<string, string> = {
      MANAGER: 'Gerente',
      COORDINATOR: 'Coordenador',
      USER: 'Servidor'
    };

    return (
      <Badge variant="outline" className={roleColors[role] || ''}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  if (!protocol) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Atribuir Protocolo
          </DialogTitle>
          <DialogDescription>
            Protocolo <span className="font-mono font-medium">{protocol.number}</span> - {protocol.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Departamento */}
          <div className="space-y-2">
            <Label>Departamento</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {protocol.department?.name || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Servidor Atual (se houver) */}
          {protocol.assignedUser && (
            <div className="space-y-2">
              <Label>Atualmente atribuído para</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {protocol.assignedUser.name}
                </span>
                {getRoleBadge(protocol.assignedUser.role)}
              </div>
            </div>
          )}

          {/* Seleção de Servidor */}
          <div className="space-y-2">
            <Label htmlFor="server">
              Servidor Responsável <span className="text-destructive">*</span>
            </Label>
            {loadingTeam ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                Nenhum servidor disponível neste departamento
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="server">
                  <SelectValue placeholder="Selecione um servidor" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({member.email})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Comentário (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="comment">Observações (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Adicione instruções ou observações sobre a atribuição..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || !selectedUserId || teamMembers.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
