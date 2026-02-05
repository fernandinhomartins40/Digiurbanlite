import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  id: string;
  userId: string;

  // Aparência
  theme: 'light' | 'dark' | 'system';
  primaryColor?: string;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reduceMotion: boolean;

  // Avatar
  avatarUrl?: string;

  // Notificações - Canais
  emailNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;

  // Notificações - Tipos
  notifyNewProtocol: boolean;
  notifyProtocolUpdate: boolean;
  notifyNewCitizen: boolean;
  notifySystemUpdates: boolean;
  notifyAssignment: boolean;
  notifyOverdueSLA: boolean;
  notifyMessages: boolean;
  notifyDocuments: boolean;

  // Horário de silêncio
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;

  // Visualização
  defaultProtocolView: 'table' | 'grid' | 'kanban';
  protocolsPerPage: number;
  showArchivedByDefault: boolean;

  // Dashboard
  dashboardLayout?: any;

  // Localização
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Privacidade
  showOnlineStatus: boolean;
  allowAnalytics: boolean;
  showActivityHistory: boolean;

  // Avançado
  developerMode: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

export function useAdminPreferences() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar preferências
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/admin/preferences', {
        method: 'GET',
      });

      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar preferências:', error);
      toast({
        title: 'Erro ao carregar preferências',
        description: error.message || 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiRequest, toast]);

  // Atualizar preferências
  const updatePreferences = useCallback(async (data: Partial<UserPreferences>) => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success) {
        setPreferences(response.data);
        toast({
          title: 'Preferências salvas',
          description: 'Suas preferências foram atualizadas com sucesso.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar as preferências',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast]);

  // Resetar preferências
  const resetPreferences = useCallback(async () => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/preferences', {
        method: 'DELETE',
      });

      if (response.success) {
        setPreferences(response.data);
        toast({
          title: 'Preferências resetadas',
          description: 'Suas preferências foram restauradas para os valores padrão.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao resetar preferências:', error);
      toast({
        title: 'Erro ao resetar',
        description: error.message || 'Ocorreu um erro ao resetar as preferências',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast]);

  // Atualizar perfil
  const updateProfile = useCallback(async (data: {
    name?: string;
    email?: string;
    telefone?: string;
    telefoneSecundario?: string;
    cpf?: string;
    rg?: string;
    dataNascimento?: string;
    endereco?: any;
  }) => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/preferences/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success) {
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso.',
        });
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message || 'Ocorreu um erro ao atualizar o perfil',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast]);

  // Upload de avatar
  const uploadAvatar = useCallback(async (file: File) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiRequest('/admin/preferences/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.success) {
        // Atualizar preferências com novo avatar
        if (preferences) {
          setPreferences({
            ...preferences,
            avatarUrl: response.data.avatarUrl,
          });
        }
        toast({
          title: 'Avatar atualizado',
          description: 'Sua foto de perfil foi atualizada com sucesso.',
        });
        return response.data.avatarUrl;
      }
      return null;
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: error.message || 'Ocorreu um erro ao fazer upload da foto',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast, preferences]);

  // Remover avatar
  const removeAvatar = useCallback(async () => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/preferences/avatar', {
        method: 'DELETE',
      });

      if (response.success) {
        // Atualizar preferências removendo avatar
        if (preferences) {
          setPreferences({
            ...preferences,
            avatarUrl: undefined,
          });
        }
        toast({
          title: 'Avatar removido',
          description: 'Sua foto de perfil foi removida.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao remover avatar:', error);
      toast({
        title: 'Erro ao remover avatar',
        description: error.message || 'Ocorreu um erro ao remover a foto',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast, preferences]);

  // Alterar senha
  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/preferences/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success) {
        toast({
          title: 'Senha alterada',
          description: 'Sua senha foi alterada com sucesso.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Ocorreu um erro ao alterar a senha',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [apiRequest, toast]);

  // Carregar sessões ativas
  const loadSessions = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/preferences/sessions', {
        method: 'GET',
      });

      if (response.success) {
        setSessions(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar sessões:', error);
    }
  }, [apiRequest]);

  // Revogar uma sessão
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const response = await apiRequest(`/admin/preferences/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        toast({
          title: 'Sessão revogada',
          description: 'A sessão foi encerrada com sucesso.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao revogar sessão:', error);
      toast({
        title: 'Erro ao revogar sessão',
        description: error.message || 'Ocorreu um erro ao revogar a sessão',
        variant: 'destructive',
      });
      return false;
    }
  }, [apiRequest, toast, sessions]);

  // Revogar todas as sessões exceto a atual
  const revokeAllSessions = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/preferences/sessions', {
        method: 'DELETE',
      });

      if (response.success) {
        await loadSessions();
        toast({
          title: 'Sessões revogadas',
          description: 'Todas as outras sessões foram encerradas.',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Erro ao revogar sessões:', error);
      toast({
        title: 'Erro ao revogar sessões',
        description: error.message || 'Ocorreu um erro ao revogar as sessões',
        variant: 'destructive',
      });
      return false;
    }
  }, [apiRequest, toast, loadSessions]);

  // Carregar preferências ao montar
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    sessions,
    loading,
    saving,

    // Preferências
    updatePreferences,
    resetPreferences,
    loadPreferences,

    // Perfil
    updateProfile,

    // Avatar
    uploadAvatar,
    removeAvatar,

    // Segurança
    changePassword,

    // Sessões
    loadSessions,
    revokeSession,
    revokeAllSessions,
  };
}
