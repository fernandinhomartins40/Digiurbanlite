'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function ComposeEmailPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/admin/email-compose/senders', {
        method: 'GET'
      });

      if (response?.success) {
        const activeAccounts = response.accounts.filter((acc: EmailAccount) => acc.isActive);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setFormData(prev => ({ ...prev, accountId: response.preferredAccountId || activeAccounts[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountId || !formData.to || !formData.subject || !formData.body) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      const response = await apiRequest('/admin/email-compose/send', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response?.success) {
        toast({
          title: 'Email enviado!',
          description: `Email enviado com sucesso para ${formData.to}`
        });

        // Reset form
        setFormData({
          accountId: formData.accountId,
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: ''
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar o email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/email-accounts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              Enviar Email
            </h1>
            <p className="text-gray-600 mt-1">
              Enviar email via webmail interno
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhuma conta de email ativa
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Crie uma conta de email primeiro para enviar emails
              </p>
              <Button
                onClick={() => router.push('/admin/email-accounts')}
                className="mt-4"
              >
                Ir para Contas de Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nova Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              {/* Enviar Como */}
              <div>
                <Label htmlFor="accountId">Enviar como *</Label>
                <select
                  id="accountId"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.email})
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p>Enviando de: {selectedAccount.email}</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span>Hoje: {selectedAccount.sentToday}/{selectedAccount.dailyLimit}</span>
                        <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              (selectedAccount.sentToday / selectedAccount.dailyLimit) * 100 >= 90
                                ? 'bg-red-500'
                                : (selectedAccount.sentToday / selectedAccount.dailyLimit) * 100 >= 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((selectedAccount.sentToday / selectedAccount.dailyLimit) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-[10px]">
                          {Math.round((selectedAccount.sentToday / selectedAccount.dailyLimit) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Mês: {selectedAccount.sentThisMonth}/{selectedAccount.monthlyLimit}</span>
                        <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              (selectedAccount.sentThisMonth / selectedAccount.monthlyLimit) * 100 >= 90
                                ? 'bg-red-500'
                                : (selectedAccount.sentThisMonth / selectedAccount.monthlyLimit) * 100 >= 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((selectedAccount.sentThisMonth / selectedAccount.monthlyLimit) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-[10px]">
                          {Math.round((selectedAccount.sentThisMonth / selectedAccount.monthlyLimit) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Para */}
              <div>
                <Label htmlFor="to">Para *</Label>
                <Input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="destinatario@exemplo.com"
                  required
                  className="mt-1"
                />
              </div>

              {/* CC e BCC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cc">CC (cópia)</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={formData.cc}
                    onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                    placeholder="copia@exemplo.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separe múltiplos emails por vírgula
                  </p>
                </div>

                <div>
                  <Label htmlFor="bcc">BCC (cópia oculta)</Label>
                  <Input
                    id="bcc"
                    type="email"
                    value={formData.bcc}
                    onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                    placeholder="copia.oculta@exemplo.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separe múltiplos emails por vírgula
                  </p>
                </div>
              </div>

              {/* Assunto */}
              <div>
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto do email"
                  required
                  className="mt-1"
                />
              </div>

              {/* Mensagem */}
              <div>
                <Label htmlFor="body">Mensagem *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Digite sua mensagem aqui..."
                  required
                  rows={12}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você pode usar HTML básico na mensagem
                </p>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/email-accounts')}
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={sending} className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Enviar Email'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
