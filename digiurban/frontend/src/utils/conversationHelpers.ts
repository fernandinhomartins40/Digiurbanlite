/**
 * Helpers para manipulação de conversas
 */

// Importar tipo do hook para evitar duplicação
export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Type: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  participant2Type: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  type?: 'DIRECT' | 'GROUP' | 'SUPPORT';
  status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount1?: number;
  unreadCount2?: number;
  totalMessages?: number;
  isBotConversation?: boolean;
  metadata?: {
    botStatus?: 'ACTIVE' | 'PAUSED' | 'HUMAN_TAKEOVER';
    assignedTo?: string;
  };
  // Campos enriquecidos pelo frontend
  title?: string;
  citizenName?: string;
  serverName?: string;
  unreadCount?: number;
  conversationStatus?: 'bot' | 'human' | 'closed';
  avatar?: string;
  isPinned?: boolean;
  isBot?: boolean;
}

/**
 * Formatar tempo relativo (ex: "5min atrás", "2h atrás")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString('pt-BR');
}

/**
 * Formatar hora (ex: "14:35")
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatar data completa (ex: "15/01/2024 às 14:35")
 */
export function formatFullDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obter iniciais do nome (ex: "João Silva" -> "JS")
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncar texto com ellipsis (ex: "Texto muito longo..." -> "Texto muito...")
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

/**
 * Ordenar conversas: Bot primeiro, depois por última mensagem
 */
export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    // Bot sempre no topo
    if (a.isBotConversation && !b.isBotConversation) return -1;
    if (!a.isBotConversation && b.isBotConversation) return 1;

    // Depois por última mensagem (mais recente primeiro)
    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

    return dateB - dateA;
  });
}

/**
 * Verificar se usuário é participante da conversa
 */
export function isParticipant(
  conversation: Conversation,
  userId: string,
  userType: 'CITIZEN' | 'SERVER'
): boolean {
  return (
    (conversation.participant1Id === userId && conversation.participant1Type === userType) ||
    (conversation.participant2Id === userId && conversation.participant2Type === userType)
  );
}

/**
 * Obter ID do outro participante da conversa
 */
export function getOtherParticipantId(
  conversation: Conversation,
  userId: string,
  userType: 'CITIZEN' | 'SERVER'
): string | null {
  if (conversation.participant1Id === userId && conversation.participant1Type === userType) {
    return conversation.participant2Id;
  }

  if (conversation.participant2Id === userId && conversation.participant2Type === userType) {
    return conversation.participant1Id;
  }

  return null;
}

/**
 * Obter tipo do outro participante da conversa
 */
export function getOtherParticipantType(
  conversation: Conversation,
  userId: string,
  userType: 'CITIZEN' | 'SERVER'
): 'CITIZEN' | 'SERVER' | 'SYSTEM' | null {
  if (conversation.participant1Id === userId && conversation.participant1Type === userType) {
    return conversation.participant2Type;
  }

  if (conversation.participant2Id === userId && conversation.participant2Type === userType) {
    return conversation.participant1Type;
  }

  return null;
}

/**
 * Determinar cor do avatar baseado no nome
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];

  const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return colors[charCode % colors.length];
}

/**
 * Validar se mensagem é válida
 */
export function isValidMessage(content: string): boolean {
  return content.trim().length > 0 && content.trim().length <= 10000;
}

/**
 * Contar mensagens não lidas total
 */
export function getTotalUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
}

/**
 * Filtrar conversas por query de busca
 */
export function filterConversations(
  conversations: Conversation[],
  searchQuery: string
): Conversation[] {
  if (!searchQuery.trim()) return conversations;

  const query = searchQuery.toLowerCase();

  return conversations.filter(conv => {
    const name = (conv as any).title || (conv as any).citizenName || (conv as any).serverName || '';
    return name.toLowerCase().includes(query);
  });
}

/**
 * Verificar se conversa é com bot
 */
export function isBotConversation(conversation: Conversation): boolean {
  return (
    conversation.isBotConversation === true ||
    conversation.participant1Type === 'SYSTEM' ||
    conversation.participant2Type === 'SYSTEM'
  );
}

/**
 * Obter status da conversa para exibição
 */
export function getConversationStatus(conversation: any): 'bot' | 'human' | 'closed' {
  if (conversation.status === 'CLOSED') return 'closed';

  if (isBotConversation(conversation)) {
    if (
      conversation.metadata?.botStatus === 'PAUSED' ||
      conversation.metadata?.botStatus === 'HUMAN_TAKEOVER'
    ) {
      return 'human';
    }
    return 'bot';
  }

  return 'human';
}

/**
 * Obter cor do badge baseado no status
 */
export function getStatusBadgeColor(status: 'bot' | 'human' | 'closed'): string {
  switch (status) {
    case 'bot':
      return 'bg-purple-100 text-purple-700';
    case 'human':
      return 'bg-orange-100 text-orange-700';
    case 'closed':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Obter label do status
 */
export function getStatusLabel(status: 'bot' | 'human' | 'closed'): string {
  switch (status) {
    case 'bot':
      return 'IA';
    case 'human':
      return 'Humano';
    case 'closed':
      return 'Fechada';
    default:
      return 'Desconhecido';
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Validar arquivo para upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 10MB',
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido',
    };
  }

  return { valid: true };
}

/**
 * Formatar tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
