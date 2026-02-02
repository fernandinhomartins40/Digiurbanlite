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

interface ForwardProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  onSuccess?: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  department?: {
    name: string;
  };
}

export function ForwardProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  onSuccess
}: ForwardProtocolDialogProps) {
  const [tipoEncaminhamento, setTipoEncaminhamento] = useState<'ENCAMINHADO' | 'CONSULTA'>('ENCAMINHADO');
  const [forwardToDepartmentId, setForwardToDepartmentId] = useState('');
  const [forwardToUserId, setForwardToUserId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prazoResposta, setPrazoResposta] = useState<Date>();
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (forwardToDepartmentId) {
      const filtered = users.filter(u => u.departmentId === forwardToDepartmentId);
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [forwardToDepartmentId, users]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await fetch('/api/departments', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
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

      const response = await fetch(`/api/protocols-simplified/${protocolId}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          forwardToUserId,
          forwardToDepartmentId: forwardToDepartmentId || undefined,
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
    setForwardToDepartmentId('');
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
          {/* Tipo de Encaminhamento */}
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

          {/* Departamento Destino */}
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
                  <SelectValue placeholder="Selecione um departamento (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Mesmo departamento</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Servidor Destino */}
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
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                      {user.department && (
                        <span className="text-xs text-gray-500 ml-2">
                          - {user.department.name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Motivo */}
          <div>
            <Label htmlFor="motivo">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="motivo"
              placeholder="Ex: Necessário parecer técnico, Fora da competência, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {/* Prazo de Resposta */}
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

          {/* Comentário */}
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
