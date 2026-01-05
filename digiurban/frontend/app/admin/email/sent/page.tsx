'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Loader2,
  AlertCircle,
  TrendingUp,
  MousePointerClick
} from 'lucide-react';

interface SentEmail {
  id: string;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  opens: number;
  clicks: number;
  createdAt: string;
}

const statusConfig = {
  QUEUED: { label: 'Na Fila', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  SENDING: { label: 'Enviando', icon: Send, color: 'text-blue-500', bg: 'bg-blue-100' },
  SENT: { label: 'Enviado', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  FAILED: { label: 'Falhou', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  BOUNCED: { label: 'Rejeitado', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' }
};

export default function SentEmailsPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSentEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, statusFilter]);

  const fetchSentEmails = async () => {
    try {
      setLoading(true);

      // Buscar servidor de email primeiro
      const serverResponse = await apiRequest('/admin/email-service', {
        method: 'GET'
      });

      if (!serverResponse?.hasEmailService) {
        toast({
          title: 'Serviço não ativado',
          description: 'Configure o serviço de email primeiro',
          variant: 'destructive'
        });
        router.push('/admin/email-service');
        return;
      }

      // Buscar emails enviados
      const response = await apiRequest('/admin/email/sent', {
        method: 'GET'
      });

      if (response?.success && response.emails) {
        setEmails(response.emails);
      } else if (response?.emails) {
        setEmails(response.emails);
      }
    } catch (error: any) {
      console.error('Error fetching sent emails:', error);

      // Se a rota não existe ainda, mostrar mensagem amigável
      if (error.message?.includes('404')) {
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'A API de emails enviados está sendo implementada',
          variant: 'default'
        });
        // Dados mockados para demonstração
        setEmails([]);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os emails enviados',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    // Filtro por status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(email =>
        email.toEmail.toLowerCase().includes(term) ||
        email.subject.toLowerCase().includes(term) ||
        email.fromEmail.toLowerCase().includes(term)
      );
    }

    setFilteredEmails(filtered);
  };

  const viewDetails = (email: SentEmail) => {
    setSelectedEmail(email);
    setShowDetails(true);
  };

  const getStats = () => {
    return {
      total: emails.length,
      delivered: emails.filter(e => e.status === 'DELIVERED').length,
      failed: emails.filter(e => e.status === 'FAILED' || e.status === 'BOUNCED').length,
      pending: emails.filter(e => e.status === 'QUEUED' || e.status === 'SENDING').length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando emails enviados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Emails Enviados</h1>
          <p className="text-muted-foreground mt-2">
            Histórico de emails enviados pelo sistema
          </p>
        </div>
        <Button onClick={() => router.push('/admin/email/compose')}>
          <Send className="mr-2 h-4 w-4" />
          Novo Email
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por destinatário, assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Todos os status</option>
              <option value="DELIVERED">Entregues</option>
              <option value="SENT">Enviados</option>
              <option value="FAILED">Falharam</option>
              <option value="BOUNCED">Rejeitados</option>
              <option value="QUEUED">Na fila</option>
            </select>

            <Button variant="outline" onClick={fetchSentEmails}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de emails */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
            {searchTerm || statusFilter !== 'ALL' ? ' (filtrado)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum email encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {emails.length === 0
                  ? 'Você ainda não enviou nenhum email'
                  : 'Tente ajustar os filtros de busca'}
              </p>
              {emails.length === 0 && (
                <Button onClick={() => router.push('/admin/email/compose')}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Primeiro Email
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmails.map((email) => {
                const config = statusConfig[email.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => viewDetails(email)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                          {email.opens > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              <TrendingUp className="h-3 w-3" />
                              {email.opens} abertura{email.opens !== 1 ? 's' : ''}
                            </span>
                          )}
                          {email.clicks > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <MousePointerClick className="h-3 w-3" />
                              {email.clicks} click{email.clicks !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold truncate">{email.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          Para: {email.toEmail}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>De: {email.fromEmail}</span>
                          <span>•</span>
                          <span>
                            {email.sentAt
                              ? new Date(email.sentAt).toLocaleString('pt-BR')
                              : new Date(email.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    {email.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Erro:</strong> {email.errorMessage}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes (simplificado) */}
      {showDetails && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Detalhes do Email</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedEmail.status].bg} ${statusConfig[selectedEmail.status].color}`}>
                    {statusConfig[selectedEmail.status].label}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">De</label>
                <p className="mt-1">{selectedEmail.fromEmail}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Para</label>
                <p className="mt-1">{selectedEmail.toEmail}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Assunto</label>
                <p className="mt-1 font-semibold">{selectedEmail.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Message ID</label>
                <p className="mt-1 text-xs font-mono text-muted-foreground">{selectedEmail.messageId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Aberturas</label>
                  <p className="mt-1 text-2xl font-bold">{selectedEmail.opens}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cliques</label>
                  <p className="mt-1 text-2xl font-bold">{selectedEmail.clicks}</p>
                </div>
              </div>

              {selectedEmail.sentAt && (
                <div>
                  <label className="text-sm font-medium">Enviado em</label>
                  <p className="mt-1">{new Date(selectedEmail.sentAt).toLocaleString('pt-BR')}</p>
                </div>
              )}

              {selectedEmail.deliveredAt && (
                <div>
                  <label className="text-sm font-medium">Entregue em</label>
                  <p className="mt-1">{new Date(selectedEmail.deliveredAt).toLocaleString('pt-BR')}</p>
                </div>
              )}

              {selectedEmail.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-red-600">Mensagem de Erro</label>
                  <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {selectedEmail.errorMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
