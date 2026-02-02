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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DelegateProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  onSuccess?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  protocolosAtivos?: number;
  cargaPercentual?: number;
  status?: string;
}

export function DelegateProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  onSuccess
}: DelegateProtocolDialogProps) {
  const [delegadoParaUserId, setDelegadoParaUserId] = useState('');
  const [motivoDelegacao, setMotivoDelegacao] = useState('');
  const [ativaAte, setAtivaAte] = useState<Date>();
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/protocols-simplified/workload-stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.servidores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!delegadoParaUserId || !motivoDelegacao || !ativaAte) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/protocols-simplified/${protocolId}/delegate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          delegadoParaUserId,
          motivoDelegacao,
          ativaAte: ativaAte.toISOString(),
          comentario
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Protocolo delegado com sucesso!');
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.error(data.error || 'Erro ao delegar protocolo');
      }
    } catch (error) {
      console.error('Erro ao delegar protocolo:', error);
      toast.error('Erro ao delegar protocolo');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDelegadoParaUserId('');
    setMotivoDelegacao('');
    setAtivaAte(undefined);
    setComentario('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delegar Protocolo Temporariamente</DialogTitle>
          <DialogDescription>
            Delegue este protocolo para outro servidor durante férias, afastamento ou sobrecarga.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Servidor Delegado */}
          <div>
            <Label htmlFor="delegadoParaUserId">
              Servidor Substituto <span className="text-red-500">*</span>
            </Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={delegadoParaUserId} onValueChange={setDelegadoParaUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um servidor" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.status === 'ATIVO')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                        {user.cargaPercentual !== undefined && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({user.protocolosAtivos} protocolos - {user.cargaPercentual}%)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Motivo da Delegação */}
          <div>
            <Label htmlFor="motivoDelegacao">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Select value={motivoDelegacao} onValueChange={setMotivoDelegacao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FERIAS">Férias</SelectItem>
                <SelectItem value="AFASTAMENTO">Afastamento</SelectItem>
                <SelectItem value="LICENCA_MEDICA">Licença Médica</SelectItem>
                <SelectItem value="SOBRECARGA">Sobrecarga de Trabalho</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Retorno */}
          <div>
            <Label>
              Data de Retorno <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !ativaAte && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {ativaAte ? (
                    format(ativaAte, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={ativaAte}
                  onSelect={setAtivaAte}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 mt-1">
              Quando esta data for atingida, o protocolo retornará automaticamente ao servidor original.
            </p>
          </div>

          {/* Comentário */}
          <div>
            <Label htmlFor="comentario">Comentário/Instruções</Label>
            <Textarea
              id="comentario"
              placeholder="Adicione instruções específicas para o servidor substituto..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
            />
          </div>
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delegar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
