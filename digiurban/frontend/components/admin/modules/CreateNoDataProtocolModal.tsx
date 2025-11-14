// ============================================================
// CREATE NO DATA PROTOCOL MODAL - Criar Protocolo Simples
// ============================================================
// Modal simplificado para criar protocolos de serviços SEM_DADOS
// Sem formulário dinâmico - apenas informações básicas

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';
import { NoDataService } from '@/hooks/useNoDataServices';

interface CreateNoDataProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: NoDataService[];
  departmentSlug: string;
  onSuccess?: () => void;
}

export function CreateNoDataProtocolModal({
  isOpen,
  onClose,
  services,
  departmentSlug,
  onSuccess
}: CreateNoDataProtocolModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      toast.error('Selecione um serviço');
      return;
    }

    if (!description.trim()) {
      toast.error('Informe uma descrição');
      return;
    }

    try {
      setIsSubmitting(true);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/protocols`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: selectedServiceId,
          customData: {
            description: description.trim()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar protocolo');
      }

      const data = await response.json();

      toast.success('Protocolo criado com sucesso!', {
        description: `Protocolo #${data.protocol.protocolNumber} criado`
      });

      // Reset form
      setSelectedServiceId('');
      setDescription('');

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
      toast.error('Erro ao criar protocolo', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Protocolo - Serviços Gerais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Serviço */}
          <div className="space-y-2">
            <Label htmlFor="service">Selecione o Serviço *</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Escolha um serviço..." />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Serviços gerais não possuem formulários - apenas tracking de status
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Protocolo *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente a solicitação ou ocorrência..."
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Informe os detalhes da solicitação
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">ℹ️ Sobre Serviços Gerais</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Protocolos simples sem formulários dinâmicos</li>
              <li>• Status: Vinculado → Em Progresso → Concluído</li>
              <li>• Ideal para tracking rápido de ocorrências</li>
              <li>• Você pode adicionar documentos e comentários depois</li>
            </ul>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedServiceId || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Protocolo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
