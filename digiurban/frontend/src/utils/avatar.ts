/**
 * Utilitários para geração de avatares
 * - Se tiver foto: retorna URL
 * - Se não tiver: retorna objeto com iniciais e cor
 */

// Cores pastéis para avatares
const AVATAR_COLORS = [
  '#FF6B6B', // Vermelho
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul
  '#FFA07A', // Salmão
  '#98D8C8', // Verde água
  '#F7DC6F', // Amarelo
  '#BB8FCE', // Roxo
  '#85C1E2', // Azul claro
  '#F8B195', // Pêssego
  '#C06C84', // Rosa
];

/**
 * Gera cor consistente baseada no nome
 */
function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Extrai iniciais do nome (máximo 2 letras)
 */
function getInitials(name: string): string {
  if (!name) return '??';

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    // Nome único: primeira e segunda letra
    return words[0].substring(0, 2).toUpperCase();
  }

  // Múltiplas palavras: primeira letra de cada
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Retorna dados para renderizar avatar
 */
export interface AvatarData {
  type: 'image' | 'initials';
  value: string; // URL da imagem ou iniciais
  bgColor?: string; // Cor de fundo (apenas para initials)
  textColor?: string; // Cor do texto (sempre branco para initials)
}

export function getAvatarData(name: string, avatarUrl?: string | null): AvatarData {
  // Se tem URL de avatar
  if (avatarUrl) {
    return {
      type: 'image',
      value: avatarUrl,
    };
  }

  // Caso contrário, usar iniciais + cor
  return {
    type: 'initials',
    value: getInitials(name),
    bgColor: getColorFromName(name),
    textColor: '#FFFFFF',
  };
}

/**
 * Componente React inline para Avatar
 * Pode ser usado assim:
 *
 * const avatar = getAvatarData(citizen.name, citizen.avatar);
 *
 * {avatar.type === 'image' ? (
 *   <img src={avatar.value} alt={citizen.name} />
 * ) : (
 *   <div style={{ backgroundColor: avatar.bgColor, color: avatar.textColor }}>
 *     {avatar.value}
 *   </div>
 * )}
 */
