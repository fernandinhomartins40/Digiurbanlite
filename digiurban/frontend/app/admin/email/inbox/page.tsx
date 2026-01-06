'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Inbox as InboxIcon,
  Search,
  Star,
  StarOff,
  Trash2,
  Reply,
  Forward,
  Archive,
  MailOpen,
  Loader2,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  MoreVertical,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  const starredCount = emails.filter(e => e.isStarred).length;

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
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Caixa de Entrada</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchInboxEmails}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/admin/email/compose')}>
            <Mail className="mr-2 h-4 w-4" />
            Escrever
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="py-3 flex items-center gap-3 border-b">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Todas
          </Button>
          <Button
            variant={filterType === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('unread')}
          >
            Não lidas
          </Button>
          <Button
            variant={filterType === 'starred' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('starred')}
          >
            <Star className="mr-1 h-3.5 w-3.5" />
            Com estrela
          </Button>
        </div>
      </div>

      {/* Email List & Preview (2 columns like Gmail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className={cn(
          "border-r overflow-y-auto",
          selectedEmail ? "w-[400px]" : "flex-1"
        )}>
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <InboxIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {emails.length === 0 ? 'Nenhum email' : 'Nenhum email encontrado'}
              </h3>
              <p className="text-sm text-muted-foreground">
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
                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2",
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
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground/40 hover:text-yellow-500" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        !email.isRead && "font-semibold"
                      )}>
                        {email.fromName || email.fromEmail}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {email.attachments && email.attachments > 0 && (
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(email.receivedAt)}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-sm truncate",
                      !email.isRead && "font-semibold"
                    )}>
                      {email.subject || '(Sem assunto)'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
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
            <div className="border-b p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-4">{selectedEmail.subject || '(Sem assunto)'}</h2>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {(selectedEmail.fromName || selectedEmail.fromEmail).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{selectedEmail.fromName}</span>
                        <span className="text-muted-foreground text-sm">
                          {'<'}{selectedEmail.fromEmail}{'>'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        para {selectedEmail.toEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
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
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => replyEmail(selectedEmail)}
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Responder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forwardEmail(selectedEmail)}
                >
                  <Forward className="mr-2 h-4 w-4" />
                  Encaminhar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStar(selectedEmail.id)}
                >
                  {selectedEmail.isStarred ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveToTrash(selectedEmail.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(selectedEmail.id, !selectedEmail.isRead)}
                >
                  <MailOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                {selectedEmail.htmlContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    className="email-content"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
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
