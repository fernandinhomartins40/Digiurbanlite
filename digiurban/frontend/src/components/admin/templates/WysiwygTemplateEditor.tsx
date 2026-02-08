'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core'
import { Node, mergeAttributes } from '@tiptap/core'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Highlighter,
  PenTool
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

interface WysiwygTemplateEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function WysiwygTemplateEditor({ content, onChange, placeholder }: WysiwygTemplateEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  // Extensão para preservar divs customizadas e todos os atributos
  const CustomDiv = Node.create({
    name: 'customDiv',
    group: 'block',
    content: 'block*',

    parseHTML() {
      return [{ tag: 'div' }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes), 0]
    },

    addAttributes() {
      return {
        class: { default: null },
        style: { default: null },
        'data-signature-width': { default: null },
        'data-signature-height': { default: null },
      }
    },
  })

  // Extensão para preservar atributos style em todos os elementos
  const CustomHTML = Extension.create({
    name: 'customHTML',

    addGlobalAttributes() {
      return [
        {
          types: ['heading', 'paragraph', 'textStyle', 'tableCell', 'tableHeader'],
          attributes: {
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {}
                }
                return { style: attributes.style }
              },
            },
            class: {
              default: null,
              parseHTML: element => element.getAttribute('class'),
              renderHTML: attributes => {
                if (!attributes.class) {
                  return {}
                }
                return { class: attributes.class }
              },
            },
          },
        },
      ]
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Desabilitar codeBlock padrão
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          // Evitar erro 404 quando src contém variáveis Handlebars
          loading: 'lazy',
        },
      }).extend({
        // Sobrescrever parseHTML para tratar variáveis Handlebars
        parseHTML() {
          return [
            {
              tag: 'img[src]',
              getAttrs: (node) => {
                const src = (node as HTMLElement).getAttribute('src')
                // Permitir variáveis Handlebars sem validação
                if (src?.includes('{{')) {
                  return { src }
                }
                return { src }
              },
            },
          ]
        },
        addAttributes() {
          return {
            src: {
              default: null,
              parseHTML: (element) => element.getAttribute('src'),
              renderHTML: (attributes) => {
                if (!attributes.src) return {}
                return { src: attributes.src }
              },
            },
            alt: {
              default: null,
              parseHTML: (element) => element.getAttribute('alt'),
              renderHTML: (attributes) => {
                if (!attributes.alt) return {}
                return { alt: attributes.alt }
              },
            },
            title: {
              default: null,
              parseHTML: (element) => element.getAttribute('title'),
              renderHTML: (attributes) => {
                if (!attributes.title) return {}
                return { title: attributes.title }
              },
            },
            style: {
              default: null,
              parseHTML: (element) => element.getAttribute('style'),
              renderHTML: (attributes) => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
          }
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse;',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      CustomDiv, // Suporte a divs customizadas
      CustomHTML, // Preservar atributos style e class
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[500px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    enableInputRules: false, // Desabilitar regras automáticas que podem interferir
    enablePasteRules: false, // Desabilitar regras de colagem
  })

  // Atualizar conteúdo do editor quando prop 'content' mudar
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML()
      // Só atualizar se o conteúdo for diferente para evitar loops
      if (currentContent !== content) {
        editor.commands.setContent(content, { emitUpdate: false })
      }
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageDialog(false)
    }
  }

  const addLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run()
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run()
      }
      setLinkUrl('')
      setLinkText('')
      setShowLinkDialog(false)
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertSignatureArea = () => {
    const signatureHtml = `
      <div class="signature-placeholder"
           data-signature-width="200"
           data-signature-height="80"
           style="border: 2px dashed #3b82f6;
                  background-color: rgba(59, 130, 246, 0.05);
                  padding: 20px;
                  margin: 20px 0;
                  text-align: center;
                  border-radius: 8px;
                  display: inline-block;
                  min-width: 200px;
                  min-height: 80px;">
        <div style="color: #3b82f6; font-size: 14px; font-weight: 500;">
          ✍️ ÁREA DE ASSINATURA DIGITAL
        </div>
        <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">
          A assinatura será aplicada automaticamente aqui
        </div>
      </div>
    `
    editor.chain().focus().insertContent(signatureHtml).run()
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Tachado"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Destacar"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Insert elements */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowImageDialog(!showImageDialog)}
            title="Inserir imagem"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            title="Inserir link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={insertTable}
            title="Inserir tabela"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Linha horizontal"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={insertSignatureArea}
            title="Inserir área de assinatura digital"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <PenTool className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image dialog */}
      {showImageDialog && (
        <div className="bg-blue-50 border-b p-3 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">URL da Imagem</label>
            <Input
              placeholder="https://exemplo.com/imagem.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addImage()}
            />
          </div>
          <Button onClick={addImage} size="sm">Inserir</Button>
          <Button onClick={() => setShowImageDialog(false)} size="sm" variant="outline">Cancelar</Button>
        </div>
      )}

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="bg-blue-50 border-b p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Texto do Link</label>
              <Input
                placeholder="Clique aqui"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">URL</label>
              <Input
                placeholder="https://exemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addLink} size="sm">Inserir</Button>
            <Button onClick={() => setShowLinkDialog(false)} size="sm" variant="outline">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Placeholder when empty */}
      {!content && placeholder && (
        <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
