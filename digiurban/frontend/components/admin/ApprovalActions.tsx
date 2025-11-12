'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalActionsProps {
  itemId: string;
  itemType: string;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function ApprovalActions({
  itemId,
  itemType,
  onApprove,
  onReject,
  disabled = false,
  size = 'sm'
}: ApprovalActionsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(itemId, notes);
      toast.success(`${itemType} aprovado com sucesso!`);
      setApproveDialogOpen(false);
      setNotes('');
    } catch (error) {
      toast.error(`Erro ao aprovar ${itemType.toLowerCase()}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setIsLoading(true);
    try {
      await onReject(itemId, reason);
      toast.success(`${itemType} rejeitado`);
      setRejectDialogOpen(false);
      setReason('');
    } catch (error) {
      toast.error(`Erro ao rejeitar ${itemType.toLowerCase()}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size={size}
          variant="default"
          onClick={() => setApproveDialogOpen(true)}
          disabled={disabled}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Aprovar
        </Button>
        <Button
          size={size}
          variant="destructive"
          onClick={() => setRejectDialogOpen(true)}
          disabled={disabled}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rejeitar
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar {itemType}</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar este {itemType.toLowerCase()}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre a aprovação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {itemType}</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O solicitante será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo da Rejeição *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da rejeição..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
