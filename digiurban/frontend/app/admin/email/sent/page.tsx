'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
  AlertCircle,
  TrendingUp,
  MousePointerClick,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailAttachment {
  filename: string;
  contentType: string | null;
  size: number | null;
  url: string | null;
}

interface SentEmail {
  id: string;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments?: EmailAttachment[];
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
  QUEUED: { label: 'Na Fila', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', badge: 'bg-gray-500' },
  SENDING: { label: 'Enviando', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-500' },
  SENT: { label: 'Enviado', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-500' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-500' },
  FAILED: { label: 'Falhou', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-500' },
  BOUNCED: { label: 'Rejeitado', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-500' }
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

  useEffect(() => {
    fetchSentEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, statusFilter]);

  const fetchSentEmails = async () => {
    try {
      setLoading(true);

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

      if (error.message?.includes('404')) {
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'A API de emails enviados está sendo implementada',
          variant: 'default'
        });
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

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const formatFileSize = (size?: number | null) => {
    if (!size || size <= 0) {
      return 'Tamanho não informado';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentUrl = (url?: string | null) => {
    if (!url) {
      return '#';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
    const backendBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

    return `${backendBase}${url}`;
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
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando emails enviados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Enviados</h1>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {stats.total} email{stats.total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={fetchSentEmails} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/admin/email/compose')} className="flex-1 sm:flex-initial">
            <Mail className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Escrever</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-3 sm:py-4 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Entregues</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">{stats.delivered}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Falharam</p>
            <p className="text-lg sm:text-xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border-b">
        <div className="relative flex-1 sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar emails enviados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-auto"
        >
          <option value="ALL">Todos</option>
          <option value="DELIVERED">Entregues</option>
          <option value="SENT">Enviados</option>
          <option value="FAILED">Falharam</option>
          <option value="BOUNCED">Rejeitados</option>
          <option value="QUEUED">Na fila</option>
        </select>
      </div>

      {/* Email List & Preview */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Email List */}
        <div className={cn(
          "lg:border-r overflow-y-auto",
          selectedEmail ? "hidden lg:block lg:w-[400px]" : "flex-1"
        )}>
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
              <Send className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {emails.length === 0 ? 'Nenhum email enviado' : 'Nenhum email encontrado'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {emails.length === 0
                  ? 'Seus emails enviados aparecerão aqui'
                  : 'Tente ajustar os filtros'}
              </p>
              {emails.length === 0 && (
                <Button onClick={() => router.push('/admin/email/compose')} className="w-full sm:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => {
                const config = statusConfig[email.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={cn(
                      "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedEmail?.id === email.id && "bg-muted"
                    )}
                  >
                    {/* Status Indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      config.badge
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {email.toEmail}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {(email.attachments?.length || 0) > 0 && (
                            <span className="text-xs text-muted-foreground" title="Anexos">
                              <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline" />
                              <span className="hidden sm:inline ml-1">{email.attachments?.length}</span>
                            </span>
                          )}
                          {email.opens > 0 && (
                            <span className="text-xs text-purple-600" title="Aberturas">
                              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline" />
                              <span className="hidden sm:inline">{email.opens}</span>
                            </span>
                          )}
                          {email.clicks > 0 && (
                            <span className="text-xs text-blue-600" title="Cliques">
                              <MousePointerClick className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline" />
                              <span className="hidden sm:inline">{email.clicks}</span>
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(email.sentAt || email.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm truncate font-medium">
                        {email.subject || '(Sem assunto)'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs",
                          config.bg,
                          config.color
                        )}>
                          <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Email Detail */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Email Header */}
            <div className="border-b p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 break-words">{selectedEmail.subject || '(Sem assunto)'}</h2>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                      {selectedEmail.toEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-xs sm:text-sm">Para:</span>
                        <span className="text-muted-foreground text-xs sm:text-sm break-all">{selectedEmail.toEmail}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-all">
                        De: {selectedEmail.fromEmail}
                      </div>
                      {selectedEmail.ccEmails && selectedEmail.ccEmails.length > 0 && (
                        <div className="text-xs sm:text-sm text-muted-foreground break-all">
                          Cc: {selectedEmail.ccEmails.join(', ')}
                        </div>
                      )}
                      {selectedEmail.bccEmails && selectedEmail.bccEmails.length > 0 && (
                        <div className="text-xs sm:text-sm text-muted-foreground break-all">
                          Cco: {selectedEmail.bccEmails.join(', ')}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground sm:hidden">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {new Date(selectedEmail.sentAt || selectedEmail.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedEmail.sentAt || selectedEmail.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEmail(null)}
                  className="flex-shrink-0 lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              {/* Status & Metrics */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <div className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg",
                  statusConfig[selectedEmail.status].bg
                )}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedEmail.status].icon;
                    return <StatusIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", statusConfig[selectedEmail.status].color)} />;
                  })()}
                  <span className={cn("text-xs sm:text-sm font-medium", statusConfig[selectedEmail.status].color)}>
                    {statusConfig[selectedEmail.status].label}
                  </span>
                </div>

                {selectedEmail.opens > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-purple-50">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <span className="text-xs sm:text-sm font-medium text-purple-600">
                      {selectedEmail.opens} abertura{selectedEmail.opens !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {selectedEmail.clicks > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-50">
                    <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <span className="text-xs sm:text-sm font-medium text-blue-600">
                      {selectedEmail.clicks} click{selectedEmail.clicks !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {(selectedEmail.attachments?.length || 0) > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100">
                    <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      {selectedEmail.attachments?.length} anexo{selectedEmail.attachments?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Details */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
              {selectedEmail.errorMessage && (
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-red-900 mb-1 text-sm sm:text-base">Erro no Envio</h4>
                      <p className="text-xs sm:text-sm text-red-800 break-words">{selectedEmail.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Message ID</label>
                  <p className="mt-1 text-xs sm:text-sm font-mono text-muted-foreground break-all">{selectedEmail.messageId}</p>
                </div>

                {selectedEmail.deliveredAt && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Entregue em</label>
                    <p className="mt-1 text-xs sm:text-sm">
                      {new Date(selectedEmail.deliveredAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Conteúdo</label>
                <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                  <div className="prose prose-sm sm:prose max-w-none">
                    {selectedEmail.htmlContent ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                        className="email-content text-sm sm:text-base"
                      />
                    ) : selectedEmail.textContent ? (
                      <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                        {selectedEmail.textContent}
                      </pre>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Este email não possui conteúdo salvo para visualização.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {(selectedEmail.attachments?.length || 0) > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Anexos</label>
                  <div className="space-y-2">
                    {selectedEmail.attachments?.map((attachment, index) => (
                      <a
                        key={`${selectedEmail.id}-attachment-${index}`}
                        href={getAttachmentUrl(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                              {attachment.contentType ? ` • ${attachment.contentType}` : ''}
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
