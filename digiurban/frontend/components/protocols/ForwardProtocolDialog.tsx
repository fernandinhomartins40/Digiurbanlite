'use client';

import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getFullApiUrl } from '@/lib/api-config';

const SAME_DEPARTMENT_VALUE = '__same_department__';

interface ForwardProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  currentDepartmentId?: string;
  onSuccess?: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface AssignableUser {
  userId: string;
  name: string;
  email: string;
  departmentId?: string | null;
  departmentName?: string | null;
  protocolosAtivos?: number;
  cargaPercentual?: number;
  status?: string;
}

export function ForwardProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  currentDepartmentId,
  onSuccess
}: ForwardProtocolDialogProps) {
  const [tipoEncaminhamento, setTipoEncaminhamento] = useState<'ENCAMINHADO' | 'CONSULTA'>('ENCAMINHADO');
  const [forwardToDepartmentId, setForwardToDepartmentId] = useState(SAME_DEPARTMENT_VALUE);
  const [forwardToUserId, setForwardToUserId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prazoResposta, setPrazoResposta] = useState<Date>();
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AssignableUser[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAssignableUsers();
    }
  }, [open]);

  useEffect(() => {
    const destinationDepartmentId =
      forwardToDepartmentId === SAME_DEPARTMENT_VALUE
        ? currentDepartmentId
        : forwardToDepartmentId || currentDepartmentId;

    const filtered = destinationDepartmentId
      ? users.filter((user) => user.departmentId === destinationDepartmentId)
      : users;

    setFilteredUsers(filtered);
  }, [currentDepartmentId, forwardToDepartmentId, users]);

  const fetchAssignableUsers = async () => {
    try {
      setLoadingDepartments(true);
      setLoadingUsers(true);

      const response = await fetch(getFullApiUrl('/protocols/workload-stats'), {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar servidores disponíveis');
      }

      const data = await response.json();
      const servidores = (data.data?.servidores || []) as AssignableUser[];
      setUsers(servidores);

      const availableDepartments = servidores
        .filter((user) => user.departmentId && user.departmentName)
        .reduce<Department[]>((acc, user) => {
          if (!acc.some((dept) => dept.id === user.departmentId)) {
            acc.push({
              id: user.departmentId!,
              name: user.departmentName!
            });
          }

          return acc;
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name));

      setDepartments(availableDepartments);
    } catch (error) {
      console.error('Erro ao buscar servidores para encaminhamento:', error);
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoadingDepartments(false);
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!forwardToUserId || !motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/forward`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          forwardToUserId,
          forwardToDepartmentId:
            forwardToDepartmentId === SAME_DEPARTMENT_VALUE ? undefined : forwardToDepartmentId || undefined,
          tipoEncaminhamento,
          motivo,
          prazoResposta: prazoResposta?.toISOString(),
          comentario
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          tipoEncaminhamento === 'ENCAMINHADO'
            ? 'Protocolo encaminhado com sucesso!'
            : 'Consulta solicitada com sucesso!'
        );
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.error(data.error || 'Erro ao encaminhar protocolo');
      }
    } catch (error) {
      console.error('Erro ao encaminhar protocolo:', error);
      toast.error('Erro ao encaminhar protocolo');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipoEncaminhamento('ENCAMINHADO');
    setForwardToDepartmentId(SAME_DEPARTMENT_VALUE);
    setForwardToUserId('');
    setMotivo('');
    setPrazoResposta(undefined);
    setComentario('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Encaminhar Protocolo</DialogTitle>
          <DialogDescription>
            Encaminhe este protocolo para outro servidor ou departamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Tipo de Encaminhamento <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={tipoEncaminhamento}
              onValueChange={(value) => setTipoEncaminhamento(value as 'ENCAMINHADO' | 'CONSULTA')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ENCAMINHADO" id="encaminhado" />
                <Label htmlFor="encaminhado" className="font-normal cursor-pointer">
                  <div>
                    <p className="font-medium">Encaminhamento</p>
                    <p className="text-xs text-gray-500">
                      Transfere a responsabilidade do protocolo para outro servidor
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CONSULTA" id="consulta" />
                <Label htmlFor="consulta" className="font-normal cursor-pointer">
                  <div>
                    <p className="font-medium">Consulta/Parecer</p>
                    <p className="text-xs text-gray-500">
                      Solicita opinião de outro servidor, mantendo a responsabilidade atual
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="forwardToDepartmentId">
              Departamento Destino {tipoEncaminhamento === 'ENCAMINHADO' && <span className="text-red-500">*</span>}
            </Label>
            {loadingDepartments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={forwardToDepartmentId} onValueChange={setForwardToDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SAME_DEPARTMENT_VALUE}>
                    {currentDepartmentId ? 'Mesmo departamento atual' : 'Sem filtro de departamento'}
                  </SelectItem>
                  {departments
                    .filter((dept) => dept.id !== currentDepartmentId)
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="forwardToUserId">
              Servidor Destino <span className="text-red-500">*</span>
            </Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={forwardToUserId} onValueChange={setForwardToUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um servidor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers
                    .filter((user) => user.status === 'ATIVO')
                    .map((user) => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.name}
                        {user.departmentName && (
                          <span className="text-xs text-gray-500 ml-2">
                            - {user.departmentName}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="motivo">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="motivo"
              placeholder="Ex: Necessário parecer técnico, fora da competência, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {tipoEncaminhamento === 'CONSULTA' && (
            <div>
              <Label>Prazo de Resposta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !prazoResposta && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazoResposta ? (
                      format(prazoResposta, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecione a data (opcional)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={prazoResposta}
                    onSelect={setPrazoResposta}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div>
            <Label htmlFor="comentario">Comentário/Instruções</Label>
            <Textarea
              id="comentario"
              placeholder="Adicione instruções ou contexto adicional..."
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
            {tipoEncaminhamento === 'ENCAMINHADO' ? 'Encaminhar' : 'Solicitar Consulta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
