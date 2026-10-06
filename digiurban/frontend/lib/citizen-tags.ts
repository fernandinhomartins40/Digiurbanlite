/** Cores das etiquetas do cidadão (as mesmas na tela de etiquetas, na ficha e na lista) */

export const TAG_COLORS = ['blue', 'green', 'amber', 'red', 'purple', 'teal', 'pink', 'gray'] as const

const CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  teal: 'bg-teal-100 text-teal-800',
  pink: 'bg-pink-100 text-pink-800',
  gray: 'bg-gray-200 text-gray-800',
}

export function tagColorClass(color: string | null | undefined): string {
  return CLASSES[String(color || '')] || CLASSES.blue
}
