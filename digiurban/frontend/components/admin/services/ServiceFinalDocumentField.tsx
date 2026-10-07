'use client'

/**
 * "Documento entregue ao concluir": certidão, alvará, recibo... Quando o
 * pedido é concluído, o documento é gerado sozinho; depois que quem concluiu
 * assina (com a senha), ele vai sozinho para o cidadão.
 */

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Label } from '@/components/ui/label'

interface ServiceFinalDocumentFieldProps {
  value: string | null
  onChange: (field: 'finalDocumentTemplateId', value: string | null) => void
}

export function ServiceFinalDocumentField({ value, onChange }: ServiceFinalDocumentFieldProps) {
  const { apiRequest } = useAdminAuth()
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; isActive: boolean }>>([])

  useEffect(() => {
    apiRequest('/document-templates?scope=PROTOCOL')
      .then((result: any) => setTemplates((result?.data || []).filter((item: any) => item.isActive || item.id === value)))
      .catch(() => setTemplates([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor="finalDocument">Documento entregue ao concluir</Label>
      <select
        id="finalDocument"
        value={value || ''}
        onChange={(e) => onChange('finalDocumentTemplateId', e.target.value || null)}
        className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">Nenhum</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>{template.name}</option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Ao concluir o pedido, o documento é gerado sozinho. Quem concluiu assina com a senha e ele vai direto para o cidadão, com QR Code para conferir.
      </p>
    </div>
  )
}
