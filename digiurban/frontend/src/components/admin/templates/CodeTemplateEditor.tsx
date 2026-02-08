'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { PenTool, Type, Image, Table, Code2 } from 'lucide-react'

interface CodeTemplateEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function CodeTemplateEditor({ content, onChange, placeholder }: CodeTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(content || '')

  // Sincronizar content prop com estado local
  useEffect(() => {
    setLocalContent(content || '')
  }, [content])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalContent(newValue)
    onChange(newValue)
  }

  // Funções de inserção rápida
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = localContent.substring(0, start) + text + localContent.substring(end)

    setLocalContent(newContent)
    onChange(newContent)

    // Restaurar cursor após inserção
    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + text.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 10)
  }

  const insertSignature = () => {
    const signatureHtml = `
<div class="signature-placeholder" data-signature-width="200" data-signature-height="80" style="border: 2px dashed #3b82f6; background-color: rgba(59, 130, 246, 0.05); padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; display: inline-block; min-width: 200px; min-height: 80px;">
  <div style="color: #3b82f6; font-size: 14px; font-weight: 500;">✍️ ÁREA DE ASSINATURA DIGITAL</div>
  <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">A assinatura será aplicada automaticamente aqui</div>
</div>`
    insertAtCursor(signatureHtml)
  }

  const insertHeading = () => {
    insertAtCursor('<h2 style="text-align: center; margin: 20px 0;">Título do Documento</h2>')
  }

  const insertParagraph = () => {
    insertAtCursor('<p style="margin: 10px 0; text-align: justify;">Seu texto aqui...</p>')
  }

  const insertTable = () => {
    const tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f4f4f4;">Coluna 1</th>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f4f4f4;">Coluna 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Dado 1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Dado 2</td>
    </tr>
  </tbody>
</table>`
    insertAtCursor(tableHtml)
  }

  const insertImage = () => {
    insertAtCursor('<img src="{{municipalityLogo}}" alt="Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;" />')
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={insertHeading}
            title="Inserir título"
            className="text-gray-700 hover:text-gray-900"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={insertParagraph}
            title="Inserir parágrafo"
            className="text-gray-700 hover:text-gray-900"
          >
            <Code2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={insertImage}
            title="Inserir imagem"
            className="text-gray-700 hover:text-gray-900"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={insertTable}
            title="Inserir tabela"
            className="text-gray-700 hover:text-gray-900"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={insertSignature}
            title="Inserir área de assinatura digital"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <PenTool className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto text-xs text-muted-foreground flex items-center">
          {localContent.length} caracteres
        </div>
      </div>

      {/* Editor de código */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleChange}
          placeholder={placeholder || 'Digite o HTML do template aqui...'}
          className="w-full min-h-[600px] p-4 font-mono text-sm bg-white border-0 focus:outline-none focus:ring-0 resize-none"
          style={{
            lineHeight: '1.6',
            tabSize: 2,
          }}
          spellCheck={false}
        />
        {!localContent && placeholder && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none font-mono text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* Dica na parte inferior */}
      <div className="bg-gray-50 border-t px-4 py-2 text-xs text-muted-foreground">
        💡 <strong>Dica:</strong> Use variáveis como <code className="bg-gray-200 px-1.5 py-0.5 rounded">{`{{protocolNumber}}`}</code> que serão substituídas automaticamente.
        Alterne para o modo "Visualizar Resultado" para ver como ficará o documento.
      </div>
    </div>
  )
}
