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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AssignTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  onSuccess?: () => void;
}

interface TeamMember {
  id: string;
  userId: string;
  papel: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  ativo: boolean;
}

interface Team {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  coordenadorId?: string;
  coordenador?: {
    name: string;
  };
  membros: TeamMember[];
  ativo: boolean;
}

export function AssignTeamDialog({
  open,
  onOpenChange,
  protocolId,
  onSuccess
}: AssignTeamDialogProps) {
  const [teamId, setTeamId] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  useEffect(() => {
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      setSelectedTeam(team || null);
    } else {
      setSelectedTeam(null);
    }
  }, [teamId, teams]);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await fetch('/api/teams?ativo=true', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      toast.error('Erro ao carregar equipes');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSubmit = async () => {
    if (!teamId) {
      toast.error('Selecione uma equipe');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/protocols/${protocolId}/assign-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teamId,
          comentario
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Protocolo atribuído para equipe ${selectedTeam?.nome}!`);
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.error(data.error || 'Erro ao atribuir protocolo para equipe');
      }
    } catch (error) {
      console.error('Erro ao atribuir protocolo para equipe:', error);
      toast.error('Erro ao atribuir protocolo para equipe');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTeamId('');
    setComentario('');
    setSelectedTeam(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Protocolo para Equipe</DialogTitle>
          <DialogDescription>
            Atribua este protocolo para uma equipe completa. Todos os membros ativos receberão a atribuição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Equipe */}
          <div>
            <Label htmlFor="teamId">
              Equipe <span className="text-red-500">*</span>
            </Label>
            {loadingTeams ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{team.nome}</span>
                        {team.sigla && (
                          <span className="text-xs text-gray-500">({team.sigla})</span>
                        )}
                        <Badge variant="outline" className="ml-2">
                          {team.membros.filter(m => m.ativo).length} membros
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Visualização dos Membros da Equipe */}
          {selectedTeam && (
            <Card className="p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-sm mb-1">Equipe: {selectedTeam.nome}</h4>
                {selectedTeam.coordenador && (
                  <p className="text-xs text-gray-500">
                    Coordenador: {selectedTeam.coordenador.name}
                  </p>
                )}
                <Badge variant="outline" className="mt-2">
                  {selectedTeam.tipo}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">
                  Membros Ativos ({selectedTeam.membros.filter(m => m.ativo).length})
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedTeam.membros
                    .filter(m => m.ativo)
                    .map((membro) => (
                      <div
                        key={membro.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(membro.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{membro.user.name}</p>
                          <p className="text-xs text-gray-500">{membro.papel}</p>
                        </div>
                        {membro.userId === selectedTeam.coordenadorId && (
                          <Badge variant="default" className="text-xs">
                            Coord.
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}

          {/* Comentário */}
          <div>
            <Label htmlFor="comentario">Comentário/Instruções</Label>
            <Textarea
              id="comentario"
              placeholder="Adicione instruções específicas para a equipe..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
            />
          </div>

          {selectedTeam && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-800">
                <strong>Atenção:</strong> Todos os {selectedTeam.membros.filter(m => m.ativo).length} membros ativos
                receberão atribuição deste protocolo. O coordenador será definido como responsável principal.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
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
          <Button onClick={handleSubmit} disabled={loading || !teamId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir para Equipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
