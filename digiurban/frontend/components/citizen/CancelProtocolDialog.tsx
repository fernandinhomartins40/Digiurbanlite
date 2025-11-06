'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, XCircle } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { toast } from 'sonner';

interface CancelProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  protocolNumber: string;
  onSuccess?: () => void;
}

export function CancelProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  protocolNumber,
  onSuccess,
}: CancelProtocolDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiRequest } = useCitizenAuth();

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo do cancelamento');
      return;
    }

    try {
      setIsLoading(true);

      await apiRequest(`/citizen/protocols/${protocolId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      toast.success('Protocolo cancelado com sucesso');
      onOpenChange(false);
      setReason('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao cancelar protocolo';
      toast.error(errorMessage);
      console.error('Erro ao cancelar protocolo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Cancelar Protocolo
          </DialogTitle>
          <DialogDescription>
            Você está prestes a cancelar o protocolo <strong>{protocolNumber}</strong>.
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Atenção:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>O protocolo será marcado como cancelado</li>
                  <li>Não será possível reabrir o protocolo</li>
                  <li>A secretaria será notificada sobre o cancelamento</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base font-medium">
              Motivo do cancelamento *
            </Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do cancelamento do protocolo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              O motivo do cancelamento ficará registrado no histórico do protocolo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason('');
            }}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar Cancelamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
