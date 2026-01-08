'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Inbox as InboxIcon,
  Search,
  Star,
  Trash2,
  Reply,
  Forward,
  MailOpen,
  Loader2,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InboxEmail {
  id: string;
  messageId: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  preview: string;
  textContent?: string;
  htmlContent?: string;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string;
  attachments?: number;
}

export default function InboxPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'starred'>('all');
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);

  useEffect(() => {
    fetchInboxEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, filterType]);

  const fetchInboxEmails = async () => {
    try {
      setLoading(true);

      const response = await apiRequest('/admin/email/inbox', {
        method: 'GET'
      });

      if (response?.success && response.emails) {
        setEmails(response.emails);
      } else if (response?.emails) {
        setEmails(response.emails);
      }
    } catch (error: any) {
      console.error('Error fetching inbox emails:', error);

      toast({
        title: 'Erro ao carregar emails',
        description: 'Não foi possível carregar os emails recebidos',
        variant: 'destructive'
      });

      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    // Filtro por tipo
    if (filterType === 'unread') {
      filtered = filtered.filter(e => !e.isRead);
    } else if (filterType === 'starred') {
      filtered = filtered.filter(e => e.isStarred);
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.fromEmail.toLowerCase().includes(term) ||
        e.fromName.toLowerCase().includes(term) ||
        e.subject.toLowerCase().includes(term) ||
        e.preview.toLowerCase().includes(term)
      );
    }

    setFilteredEmails(filtered);
  };

  const markAsRead = async (emailId: string, isRead: boolean) => {
    try {
      await apiRequest(`/admin/email/inbox/${emailId}/read`, {
        method: 'PUT',
        body: JSON.stringify({ isRead })
      });

      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead } : e));

      toast({
        title: isRead ? 'Marcado como lido' : 'Marcado como não lido'
      });
    } catch (error) {
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead } : e));
    }
  };

  const toggleStar = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      await apiRequest(`/admin/email/inbox/${emailId}/star`, {
        method: 'PUT',
        body: JSON.stringify({ isStarred: !email.isStarred })
      });

      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error) {
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      ));
    }
  };

  const moveToTrash = async (emailId: string) => {
    try {
      await apiRequest(`/admin/email/inbox/${emailId}`, {
        method: 'DELETE'
      });

      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }

      toast({
        title: 'Email movido para lixeira'
      });
    } catch (error) {
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    }
  };

  const viewEmail = (email: InboxEmail) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id, true);
    }
  };

  const replyEmail = (email: InboxEmail) => {
    router.push(`/admin/email/compose?reply=${email.id}&to=${email.fromEmail}&subject=Re: ${email.subject}`);
  };

  const forwardEmail = (email: InboxEmail) => {
    router.push(`/admin/email/compose?forward=${email.id}&subject=Fwd: ${email.subject}`);
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

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando emails...</p>
        </div>
      </div>
    );
  }

  // Layout de 2 colunas estilo Gmail
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Caixa de Entrada</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchInboxEmails} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/admin/email/compose')} className="w-full sm:w-auto" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Escrever</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 border-b">
        <div className="relative flex-1 max-w-full sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="shrink-0"
          >
            <span className="hidden sm:inline">Todas</span>
            <span className="sm:hidden">Todas</span>
          </Button>
          <Button
            variant={filterType === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('unread')}
            className="shrink-0"
          >
            <span className="hidden sm:inline">Não lidas</span>
            <span className="sm:hidden">Não lidas</span>
          </Button>
          <Button
            variant={filterType === 'starred' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('starred')}
            className="shrink-0"
          >
            <Star className="mr-0 sm:mr-1 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Com estrela</span>
          </Button>
        </div>
      </div>

      {/* Email List & Preview (2 columns like Gmail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className={cn(
          "overflow-y-auto",
          selectedEmail
            ? "hidden md:block md:w-[350px] lg:w-[400px] md:border-r"
            : "flex-1"
        )}>
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
              <InboxIcon className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground/30 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {emails.length === 0 ? 'Nenhum email' : 'Nenhum email encontrado'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {emails.length === 0
                  ? 'Sua caixa de entrada está vazia'
                  : 'Tente ajustar os filtros'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => viewEmail(email)}
                  className={cn(
                    "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2",
                    !email.isRead
                      ? "bg-blue-50/50 border-l-primary font-medium"
                      : "border-l-transparent",
                    selectedEmail?.id === email.id && "bg-muted"
                  )}
                >
                  {/* Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                    className="mt-1 flex-shrink-0"
                  >
                    {email.isStarred ? (
                      <Star className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Star className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground/40 hover:text-yellow-500" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-xs sm:text-sm truncate",
                        !email.isRead && "font-semibold"
                      )}>
                        {email.fromName || email.fromEmail}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {email.attachments && email.attachments > 0 && (
                          <Paperclip className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatDate(email.receivedAt)}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-xs sm:text-sm truncate",
                      !email.isRead && "font-semibold"
                    )}>
                      {email.subject || '(Sem assunto)'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {email.preview}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Preview/Detail */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Email Header */}
            <div className="border-b p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 break-words">
                    {selectedEmail.subject || '(Sem assunto)'}
                  </h2>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-base shrink-0">
                      {(selectedEmail.fromName || selectedEmail.fromEmail).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {selectedEmail.fromName}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm truncate">
                          {'<'}{selectedEmail.fromEmail}{'>'}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        para {selectedEmail.toEmail}
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1 sm:hidden">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedEmail.receivedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                      <Clock className="h-3 sm:h-4 w-3 sm:w-4" />
                      {new Date(selectedEmail.receivedAt).toLocaleString('pt-BR', {
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
                  className="shrink-0"
                >
                  <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => replyEmail(selectedEmail)}
                  className="flex-1 sm:flex-initial"
                >
                  <Reply className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="text-xs sm:text-sm">Responder</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forwardEmail(selectedEmail)}
                  className="flex-1 sm:flex-initial"
                >
                  <Forward className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="text-xs sm:text-sm">Encaminhar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStar(selectedEmail.id)}
                  className="shrink-0"
                >
                  {selectedEmail.isStarred ? (
                    <Star className="h-3 sm:h-4 w-3 sm:w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <Star className="h-3 sm:h-4 w-3 sm:w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveToTrash(selectedEmail.id)}
                  className="shrink-0"
                >
                  <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(selectedEmail.id, !selectedEmail.isRead)}
                  className="shrink-0"
                >
                  <MailOpen className="h-3 sm:h-4 w-3 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="prose prose-sm sm:prose max-w-none">
                {selectedEmail.htmlContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    className="email-content text-sm sm:text-base"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                    {selectedEmail.textContent || selectedEmail.preview}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
