'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Send,
  Save,
  X,
  Paperclip,
  Users,
  Mail,
  Loader2,
  ChevronDown,
  FileText
} from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export default function ComposeEmailPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    priority: 3
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);

      // Buscar contas de email disponíveis
      const accountsResponse = await apiRequest('/admin/email-accounts', {
        method: 'GET'
      });

      if (accountsResponse?.success && accountsResponse.accounts) {
        const activeAccounts = accountsResponse.accounts.filter((acc: EmailAccount) => acc.isActive);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setSelectedAccount(activeAccounts[0].id);
        }
      }

      // Buscar templates disponíveis
      try {
        const templatesResponse = await apiRequest('/admin/email-service/templates', {
          method: 'GET'
        });
        if (templatesResponse && Array.isArray(templatesResponse)) {
          setTemplates(templatesResponse);
        }
      } catch (error) {
        console.log('Templates não disponíveis');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const useTemplate = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.textContent || template.htmlContent.replace(/<[^>]*>/g, '')
    }));
    setShowTemplates(false);
    toast({
      title: 'Template aplicado',
      description: `Template "${template.name}" foi aplicado ao email`
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateForm = (): boolean => {
    if (!selectedAccount) {
      toast({
        title: 'Erro',
        description: 'Selecione uma conta de email para enviar',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.to.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o destinatário',
        variant: 'destructive'
      });
      return false;
    }

    // Validar emails separados por vírgula
    const toEmails = formData.to.split(',').map(e => e.trim());
    for (const email of toEmails) {
      if (!validateEmail(email)) {
        toast({
          title: 'Erro',
          description: `Email inválido: ${email}`,
          variant: 'destructive'
        });
        return false;
      }
    }

    if (!formData.subject.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o assunto do email',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Erro',
        description: 'Escreva a mensagem do email',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        accountId: selectedAccount,
        to: formData.to.split(',').map(e => e.trim()),
        cc: formData.cc ? formData.cc.split(',').map(e => e.trim()) : undefined,
        bcc: formData.bcc ? formData.bcc.split(',').map(e => e.trim()) : undefined,
        subject: formData.subject,
        text: formData.message,
        html: `<html><body><pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${formData.message}</pre></body></html>`,
        priority: formData.priority
      };

      const response = await apiRequest('/admin/email-accounts/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response?.success) {
        toast({
          title: 'Email enviado com sucesso!',
          description: `Email enviado para ${formData.to}`
        });

        // Limpar formulário
        setFormData({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          message: '',
          priority: 3
        });
        setShowCc(false);
        setShowBcc(false);

        // Redirecionar para enviados após 1 segundo
        setTimeout(() => {
          router.push('/admin/email/sent');
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Ocorreu um erro ao enviar o email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Deseja descartar este email?')) {
      router.push('/admin/email');
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma conta de email disponível</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Você precisa criar pelo menos uma conta de email antes de enviar emails.
            </p>
            <Button onClick={() => router.push('/admin/email-accounts')}>
              Criar Conta de Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Escrever Email</h1>
          <p className="text-muted-foreground mt-2">
            Enviar email institucional
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de conta */}
          <div className="space-y-2">
            <Label htmlFor="account">De (Conta de Email)</Label>
            <select
              id="account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </select>
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Usar Template
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </Button>
              {showTemplates && (
                <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {template.subject}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Para */}
          <div className="space-y-2">
            <Label htmlFor="to">Para</Label>
            <Input
              id="to"
              type="text"
              placeholder="destinatario@exemplo.com (separe múltiplos emails com vírgula)"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
            />
          </div>

          {/* CC e BCC */}
          <div className="flex gap-2">
            {!showCc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
              >
                Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
              >
                Bcc
              </Button>
            )}
          </div>

          {showCc && (
            <div className="space-y-2">
              <Label htmlFor="cc">Cc (Com Cópia)</Label>
              <Input
                id="cc"
                type="text"
                placeholder="cc@exemplo.com"
                value={formData.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
              />
            </div>
          )}

          {showBcc && (
            <div className="space-y-2">
              <Label htmlFor="bcc">Bcc (Cópia Oculta)</Label>
              <Input
                id="bcc"
                type="text"
                placeholder="bcc@exemplo.com"
                value={formData.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
              />
            </div>
          )}

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Assunto do email"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={1}>Alta</option>
              <option value={3}>Normal</option>
              <option value={5}>Baixa</option>
            </select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Escreva sua mensagem aqui..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={12}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length} caracteres
            </p>
          </div>

          {/* Ações do formulário */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <Users className="inline h-4 w-4 mr-1" />
              Conta selecionada: {accounts.find(a => a.id === selectedAccount)?.email}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSend} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
