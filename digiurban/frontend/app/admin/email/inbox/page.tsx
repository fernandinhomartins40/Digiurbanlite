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
  Eye,
  X
} from 'lucide-react';

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
  const [showDetails, setShowDetails] = useState(false);

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
      // Fallback local se API não existir
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
      // Fallback local
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      ));
    }
  };

  const moveToTrash = async (emailId: string) => {
    if (!confirm('Mover este email para a lixeira?')) return;

    try {
      await apiRequest(`/admin/email/inbox/${emailId}`, {
        method: 'DELETE'
      });

      setEmails(prev => prev.filter(e => e.id !== emailId));
      setShowDetails(false);

      toast({
        title: 'Email movido para lixeira'
      });
    } catch (error) {
      // Fallback local
      setEmails(prev => prev.filter(e => e.id !== emailId));
      setShowDetails(false);
    }
  };

  const viewEmail = (email: InboxEmail) => {
    setSelectedEmail(email);
    setShowDetails(true);
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

  const unreadCount = emails.filter(e => !e.isRead).length;
  const starredCount = emails.filter(e => e.isStarred).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando caixa de entrada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Caixa de Entrada</h1>
          <p className="text-muted-foreground mt-2">
            {unreadCount} não {unreadCount === 1 ? 'lido' : 'lidos'}
          </p>
        </div>
        <Button onClick={() => router.push('/admin/email/compose')}>
          <Mail className="mr-2 h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                Todas ({emails.length})
              </Button>
              <Button
                variant={filterType === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilterType('unread')}
              >
                Não lidas ({unreadCount})
              </Button>
              <Button
                variant={filterType === 'starred' ? 'default' : 'outline'}
                onClick={() => setFilterType('starred')}
              >
                <Star className="mr-2 h-4 w-4" />
                Destacadas ({starredCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de emails */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12">
              <InboxIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum email encontrado</h3>
              <p className="text-muted-foreground">
                {emails.length === 0
                  ? 'Sua caixa de entrada está vazia'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                    email.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                  }`}
                  onClick={() => viewEmail(email)}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                      className="mt-1"
                    >
                      {email.isStarred ? (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${!email.isRead ? 'text-blue-900' : ''}`}>
                              {email.fromName}
                            </h4>
                            {!email.isRead && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{email.fromEmail}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(email.receivedAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {email.attachments && email.attachments > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              📎 {email.attachments}
                            </div>
                          )}
                        </div>
                      </div>

                      <h5 className={`font-medium mb-1 ${!email.isRead ? 'text-blue-900' : ''}`}>
                        {email.subject}
                      </h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {email.preview}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewEmail(email);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      {showDetails && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <CardTitle>{selectedEmail.subject}</CardTitle>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>De:</strong> {selectedEmail.fromName} ({selectedEmail.fromEmail})</p>
                    <p><strong>Para:</strong> {selectedEmail.toEmail}</p>
                    <p><strong>Data:</strong> {new Date(selectedEmail.receivedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                {selectedEmail.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">
                    {selectedEmail.textContent || selectedEmail.preview}
                  </pre>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => replyEmail(selectedEmail)}>
                  <Reply className="mr-2 h-4 w-4" />
                  Responder
                </Button>
                <Button variant="outline" onClick={() => forwardEmail(selectedEmail)}>
                  <Forward className="mr-2 h-4 w-4" />
                  Encaminhar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => markAsRead(selectedEmail.id, !selectedEmail.isRead)}
                >
                  <MailOpen className="mr-2 h-4 w-4" />
                  {selectedEmail.isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => moveToTrash(selectedEmail.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
