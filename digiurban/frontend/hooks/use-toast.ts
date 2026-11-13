// Um só sistema de aviso no produto: esta função (usada em ~130 telas) entrega pelo sonner.
// Título genérico ("Sucesso", "Erro") com descrição mostra a descrição como frase principal.
import type * as React from "react"
import { toast as sonner } from "sonner"

type Toast = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive" | null
  duration?: number
  action?: React.ReactNode
  className?: string
}

const GENERIC = /^(sucesso|erro|aten[cç][aã]o|aviso|ok|pronto)[!.]?$/i

export function toastParts(title: React.ReactNode, description: React.ReactNode) {
  const generic = typeof title === "string" && GENERIC.test(title.trim())
  if (generic && description) return { head: description, body: undefined, success: /^(sucesso|pronto|ok)/i.test(String(title).trim()) }
  return { head: title ?? description, body: title ? description : undefined, success: false }
}

function toast({ title, description, variant, duration, action }: Toast) {
  const { head, body, success } = toastParts(title, description)
  const show = variant === "destructive" ? sonner.error : success ? sonner.success : sonner
  const id = show(head as any, { description: body as any, duration, action: action as any })
  return { id: String(id), dismiss: () => sonner.dismiss(id), update: (_: Toast) => {} }
}

function useToast() {
  return { toast, dismiss: (toastId?: string) => sonner.dismiss(toastId), toasts: [] as Toast[] }
}

export { useToast, toast }
