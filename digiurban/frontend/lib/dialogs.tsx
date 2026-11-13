'use client'
// Confirmação e aviso do produto, no lugar de window.confirm/alert do navegador.
// <DialogHost /> fica montado uma vez (ToasterProvider); confirmDialog() resolve true/false.
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Ask = { message: string; resolve: (ok: boolean) => void }
let open: ((ask: Ask) => void) | null = null

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!open) return resolve(window.confirm(message)) // host ainda não montado
    open({ message, resolve })
  })
}

const BAD = /erro|falh|não foi|nao foi|inválid|invalid|obrigat|preencha|selecione|informe|não é|limite|excede/i
/** Aviso curto no canto (substitui alert) */
export function notify(message: unknown) {
  const text = String(message ?? '')
  if (BAD.test(text)) toast.error(text)
  else toast(text)
}

const DESTRUCTIVE = /exclu|apag|remov|delet|cancel|desativ|revog|encerr/i

export function DialogHost() {
  const [ask, setAsk] = useState<Ask | null>(null)
  useEffect(() => {
    open = setAsk
    return () => { open = null }
  }, [])
  const close = (ok: boolean) => { ask?.resolve(ok); setAsk(null) }
  const [title, ...rest] = (ask?.message || '').split('\n').filter(Boolean)
  return (
    <AlertDialog open={!!ask} onOpenChange={(v) => { if (!v) close(false) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">{rest.join('\n')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => close(true)}
            className={DESTRUCTIVE.test(ask?.message || '') ? 'bg-[var(--lg-red)] text-white hover:bg-[var(--lg-red)]/90' : undefined}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
