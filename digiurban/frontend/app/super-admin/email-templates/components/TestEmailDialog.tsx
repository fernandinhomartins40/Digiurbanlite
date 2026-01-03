'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  variables: string[];
}

interface TestEmailDialogProps {
  template: EmailTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestEmailDialog({ template, open, onOpenChange }: TestEmailDialogProps) {
  const [email, setEmail] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!email) {
      toast.error('Digite um email válido');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/email-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          variables,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email de teste enviado com sucesso!');
        onOpenChange(false);
        setEmail('');
        setVariables({});
      } else {
        toast.error(data.message || 'Erro ao enviar email de teste');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Erro ao enviar email de teste');
    } finally {
      setSending(false);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  // Sample values for variables
  const getSampleValue = (variable: string): string => {
    const samples: Record<string, string> = {
      citizenName: 'João Silva',
      userName: 'João Silva',
      tenantName: 'DigiUrban',
      siteName: 'Portal do Cidadão',
      siteUrl: 'https://digiurban.com.br',
      supportEmail: 'suporte@digiurban.com.br',
      protocolNumber: '2024-0001',
      serviceName: 'Solicitação de Exemplo',
      confirmationUrl: 'https://digiurban.com.br/confirm/123456',
      recoveryUrl: 'https://digiurban.com.br/recover/123456',
      trackingUrl: 'https://digiurban.com.br/protocol/2024-0001',
      status: 'Em andamento',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      comment: 'Esta é uma observação de exemplo.',
    };

    return samples[variable] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Email de Teste</DialogTitle>
          <DialogDescription>
            Envie um email de teste para validar o template &quot;{template.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="test-email">Email de destino *</Label>
            <Input
              id="test-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          {/* Variables */}
          {template.variables.length > 0 && (
            <div className="space-y-3">
              <Label>Valores das Variáveis</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {template.variables.map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={`var-${variable}`} className="text-sm text-muted-foreground">
                      {`{{${variable}}}`}
                    </Label>
                    <Input
                      id={`var-${variable}`}
                      value={variables[variable] || getSampleValue(variable)}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={getSampleValue(variable)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSendTest} disabled={sending || !email}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Teste
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
