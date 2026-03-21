'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/src/components/ui/rich-text-editor';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Send,
  X,
  Users,
  Mail,
  Loader2,
  ChevronDown,
  FileText,
  Upload,
  Paperclip
} from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  sentToday: number;
  sentThisMonth: number;
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
    message: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);

      // Buscar contas de email disponíveis
      const accountsResponse = await apiRequest('/admin/email-compose/senders', {
        method: 'GET'
      });

      if (accountsResponse?.success && accountsResponse.accounts) {
        const activeAccounts = accountsResponse.accounts.filter((acc: EmailAccount) => acc.isActive);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setSelectedAccount(accountsResponse.preferredAccountId || activeAccounts[0].id);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

      // Se houver anexos, usar FormData
      if (attachments.length > 0) {
        console.log('📎 [FRONTEND] Enviando email com anexos:', attachments.length);
        console.log('📎 [FRONTEND] Arquivos:', attachments.map(f => ({ name: f.name, size: f.size, type: f.type })));

        const formDataPayload = new FormData();
        formDataPayload.append('accountId', selectedAccount);
        formDataPayload.append('to', JSON.stringify(formData.to.split(',').map(e => e.trim())));
        if (formData.cc) {
          formDataPayload.append('cc', JSON.stringify(formData.cc.split(',').map(e => e.trim())));
        }
        if (formData.bcc) {
          formDataPayload.append('bcc', JSON.stringify(formData.bcc.split(',').map(e => e.trim())));
        }
        formDataPayload.append('subject', formData.subject);
        formDataPayload.append('html', formData.message);

        // Adicionar anexos
        attachments.forEach((file, index) => {
          console.log(`📎 [FRONTEND] Adicionando arquivo ${index + 1}:`, file.name, file.size);
          formDataPayload.append('attachments', file);
        });

        // Debug: mostrar todas as entradas do FormData
        console.log('📎 [FRONTEND] FormData entries:');
        for (const [key, value] of formDataPayload.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
          } else {
            console.log(`  ${key}:`, value);
          }
        }

        const response = await apiRequest('/admin/email-compose/send', {
          method: 'POST',
          body: formDataPayload
          // Content-Type será definido automaticamente como multipart/form-data
        });

        if (response?.success) {
          toast({
            title: 'Email enviado com sucesso!',
            description: `Email enviado para ${formData.to} com ${attachments.length} anexo(s)`
          });

          // Limpar formulário
          setFormData({
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            message: ''
          });
          setAttachments([]);
          setShowCc(false);
          setShowBcc(false);

          // Redirecionar para enviados após 1 segundo
          setTimeout(() => {
            router.push('/admin/email/sent');
          }, 1000);
        }
      } else {
        // Sem anexos, usar JSON
        const payload = {
          accountId: selectedAccount,
          to: formData.to.split(',').map(e => e.trim()),
          cc: formData.cc ? formData.cc.split(',').map(e => e.trim()) : undefined,
          bcc: formData.bcc ? formData.bcc.split(',').map(e => e.trim()) : undefined,
          subject: formData.subject,
          text: formData.message.replace(/<[^>]*>/g, ''),
          html: formData.message
        };

        const response = await apiRequest('/admin/email-compose/send', {
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
            message: ''
          });
          setAttachments([]);
          setShowCc(false);
          setShowBcc(false);

          // Redirecionar para enviados após 1 segundo
          setTimeout(() => {
            router.push('/admin/email/sent');
          }, 1000);
        }
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
      <div className="space-y-4 sm:space-y-6 w-full px-2 sm:px-4 lg:px-0">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Nenhuma conta de email disponível</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 sm:mb-6 max-w-md">
              Você precisa criar pelo menos uma conta de email antes de enviar emails.
            </p>
            <Button
              onClick={() => router.push('/admin/email-accounts')}
              className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            >
              Criar Conta de Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Escrever Email</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Enviar email institucional
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 sm:flex-none"
          >
            <X className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Cancelar</span>
            <span className="sm:hidden">Cancelar</span>
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Enviando...</span>
                <span className="sm:hidden">Enviando...</span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Enviar Email</span>
                <span className="sm:hidden">Enviar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Nova Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Seleção de conta */}
          <div className="space-y-2">
            <Label htmlFor="account" className="text-sm sm:text-base">De (Conta de Email)</Label>
            <select
              id="account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                className="w-full justify-between text-xs sm:text-sm h-8 sm:h-9"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Usar Template</span>
                </div>
                <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </Button>
              {showTemplates && (
                <div className="border rounded-lg p-2 space-y-1 max-h-40 sm:max-h-48 overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template)}
                      className="w-full text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <div className="font-medium truncate">{template.name}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
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
            <Label htmlFor="to" className="text-sm sm:text-base">Para</Label>
            <Input
              id="to"
              type="text"
              placeholder="destinatario@exemplo.com"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="text-xs sm:text-sm h-9 sm:h-10"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Separe múltiplos emails com vírgula
            </p>
          </div>

          {/* CC e BCC */}
          <div className="flex gap-2 flex-wrap">
            {!showCc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs sm:text-sm h-7 sm:h-8"
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
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Bcc
              </Button>
            )}
          </div>

          {showCc && (
            <div className="space-y-2">
              <Label htmlFor="cc" className="text-sm sm:text-base">Cc (Com Cópia)</Label>
              <Input
                id="cc"
                type="text"
                placeholder="cc@exemplo.com"
                value={formData.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>
          )}

          {showBcc && (
            <div className="space-y-2">
              <Label htmlFor="bcc" className="text-sm sm:text-base">Bcc (Cópia Oculta)</Label>
              <Input
                id="bcc"
                type="text"
                placeholder="bcc@exemplo.com"
                value={formData.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>
          )}

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm sm:text-base">Assunto</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Assunto do email"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm sm:text-base">Mensagem</Label>
            <RichTextEditor
              value={formData.message}
              onChange={(value) => handleInputChange('message', value)}
              placeholder="Escreva sua mensagem aqui..."
              className="min-h-[200px] sm:min-h-[300px]"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formData.message.replace(/<[^>]*>/g, '').length} caracteres
            </p>
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Anexos</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs sm:text-sm h-9 sm:h-10"
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Adicionar Anexo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {attachments.length} arquivo(s) anexado(s)
                </p>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ações do formulário */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-3 sm:pt-4 border-t">
            <div className="text-xs sm:text-sm space-y-1 w-full sm:w-auto">
              <div className="text-muted-foreground flex items-center gap-1">
                <Users className="inline h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">
                  <span className="hidden sm:inline">Conta: </span>
                  {accounts.find(a => a.id === selectedAccount)?.email}
                </span>
              </div>
              {selectedAccount && (() => {
                const account = accounts.find(a => a.id === selectedAccount);
                if (!account) return null;

                const dailyPercent = account.dailyLimit > 0
                  ? Math.round((account.sentToday / account.dailyLimit) * 100)
                  : 0;
                const monthlyPercent = account.monthlyLimit > 0
                  ? Math.round((account.sentThisMonth / account.monthlyLimit) * 100)
                  : 0;

                return (
                  <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="whitespace-nowrap">Hoje: {account.sentToday}/{account.dailyLimit}</span>
                      <div className="h-1.5 w-16 sm:w-20 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${dailyPercent >= 90 ? 'bg-red-500' : dailyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(dailyPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px]">{dailyPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="whitespace-nowrap">Mês: {account.sentThisMonth}/{account.monthlyLimit}</span>
                      <div className="h-1.5 w-16 sm:w-20 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${monthlyPercent >= 90 ? 'bg-red-500' : monthlyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px]">{monthlyPercent}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Enviar</span>
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
