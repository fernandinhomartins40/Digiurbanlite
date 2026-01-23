'use client';

import { useState, useEffect } from 'react';
import { Search, User, Users, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  cpf?: string;
  role?: string;
  department?: string;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (payload: {
    contactId: string;
    contactType: 'CITIZEN' | 'SERVER';
    contact: Contact;
  }) => void;
}

export function NewConversationDialog({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [activeTab, setActiveTab] = useState<'citizens' | 'servers'>('citizens');
  const [searchQuery, setSearchQuery] = useState('');
  const [citizens, setCitizens] = useState<Contact[]>([]);
  const [servers, setServers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        loadContacts(searchQuery);
      } else {
        loadContacts();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const loadContacts = async (search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const messagesApiUrl = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';
      const endpoint = activeTab === 'citizens' ? '/contacts/citizens' : '/contacts/servers';

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(
        `${messagesApiUrl}${endpoint}?${params.toString()}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar contatos');
      }

      const data = await response.json();

      if (activeTab === 'citizens') {
        setCitizens(data);
      } else {
        setServers(data);
      }
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError('Não foi possível carregar os contatos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (contact: Contact) => {
    setCreating(true);
    setError(null);

    try {
      onConversationCreated({
        contactId: contact.id,
        contactType: activeTab === 'citizens' ? 'CITIZEN' : 'SERVER',
        contact,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao criar conversa:', err);
      setError('Não foi possível iniciar a conversa. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const contacts = activeTab === 'citizens' ? citizens : servers;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Selecione um cidadão ou servidor para iniciar uma conversa
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="citizens" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cidadãos
              </TabsTrigger>
              <TabsTrigger value="servers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Servidores
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={`Buscar ${activeTab === 'citizens' ? 'cidadãos' : 'servidores'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Lista de Contatos */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Nenhum contato encontrado</p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? 'Tente ajustar sua busca'
                    : `Não há ${activeTab === 'citizens' ? 'cidadãos' : 'servidores'} disponíveis`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleCreateConversation(contact)}
                    disabled={creating}
                    className="w-full p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {contact.name}
                          </h4>
                          {activeTab === 'servers' && contact.role && (
                            <Badge variant="secondary" className="text-xs">
                              {contact.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {contact.email}
                        </p>
                        {activeTab === 'servers' && contact.department && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {contact.department}
                          </p>
                        )}
                        {activeTab === 'citizens' && contact.phone && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {contact.phone}
                          </p>
                        )}
                      </div>

                      {creating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <div className="text-blue-600">→</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer com informação */}
          <div className="border-t pt-3 text-xs text-gray-500 text-center">
            {activeTab === 'citizens'
              ? 'Selecione um cidadão para iniciar uma conversa'
              : 'Selecione um servidor para iniciar uma conversa'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationDialog;
