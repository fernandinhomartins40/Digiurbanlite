'use client'

/**
 * Fila única de assinaturas do servidor: o que espera a assinatura dele
 * (documento do protocolo, enviado ou do processo interno) e o que ele pediu.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PenLine, Send } from 'lucide-react'

interface QueueItem {
  id: string
  title: string
  url: string
  requestedByName: string
  userName: string
  createdAt: string
}

export function SignatureQueueCard() {
  const [toSign, setToSign] = useState<QueueItem[]>([])
  const [asked, setAsked] = useState<QueueItem[]>([])

  useEffect(() => {
    fetch('/api/signatures/queue', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        setToSign(data?.data?.toSign || [])
        setAsked(data?.data?.asked || [])
      })
      .catch(() => undefined)
  }, [])

  if (toSign.length === 0 && asked.length === 0) return null

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="mb-2 flex items-center gap-2 font-medium text-amber-900"><PenLine className="h-4 w-4" />Esperando a sua assinatura ({toSign.length})</p>
        {toSign.length === 0 && <p className="text-sm text-amber-800">Nada para assinar.</p>}
        <ul className="space-y-1 text-sm">
          {toSign.slice(0, 8).map((item) => (
            <li key={item.id}>
              <Link href={item.url} className="block truncate text-amber-950 hover:underline">{item.title}</Link>
              <span className="text-xs text-amber-800">pedido por {item.requestedByName}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <p className="mb-2 flex items-center gap-2 font-medium text-gray-900"><Send className="h-4 w-4" />Assinaturas que você pediu ({asked.length})</p>
        {asked.length === 0 && <p className="text-sm text-gray-500">Nenhum pedido em aberto.</p>}
        <ul className="space-y-1 text-sm">
          {asked.slice(0, 8).map((item) => (
            <li key={item.id}>
              <Link href={item.url} className="block truncate text-gray-900 hover:underline">{item.title}</Link>
              <span className="text-xs text-gray-500">esperando {item.userName}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
