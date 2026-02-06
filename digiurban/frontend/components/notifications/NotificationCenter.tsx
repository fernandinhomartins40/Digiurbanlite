'use client';

/**
 * ============================================================================
 * NOTIFICATION CENTER - Centro de Notificações
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getFullApiUrl } from '@/lib/api-config';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(getFullApiUrl('/citizen/notifications'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar ao abrir
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Buscar a cada 30 segundos quando aberto
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [open]);

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(getFullApiUrl('/citizen/notifications/mark-read'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await fetch(getFullApiUrl('/citizen/notifications/mark-read'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          markAllAsRead: true,
        }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('Todas as notificações marcadas como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações');
    }
  };

  // Remover notificação
  const removeNotification = async (notificationId: string) => {
    try {
      const response = await fetch(getFullApiUrl(`/citizen/notifications/${notificationId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success('Notificação removida');
      }
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  // Ícone do tipo de notificação
  const getTypeColor = (type: string) => {
    if (type.includes('COMPLETED') || type.includes('APPROVED')) return 'text-green-500';
    if (type.includes('REJECTED') || type.includes('OVERDUE')) return 'text-red-500';
    if (type.includes('EXPIRING') || type.includes('REMINDER')) return 'text-yellow-500';
    return 'text-blue-500';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? 'bg-accent/30' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>

                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeNotification(notification.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Notificações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
