'use client'

/**
 * Documentos que o cidadão envia no pedido.
 *
 * Escolhidos na LISTA PADRÃO (shared/constants/required-documents.ts): o mesmo
 * documento tem sempre o mesmo nome, dica e jeito de fotografar em todo serviço.
 * "De quem / qual" vai no detalhe ("do responsável"), não no nome. Documento que
 * não existe na lista pode ser criado, mas fica marcado como próprio do município.
 */

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, X, Camera, Search, AlertTriangle } from 'lucide-react'
import {
  DOCUMENT_CATALOG,
  DOCUMENT_CODES,
  DocumentCode,
  expandRequiredDocument,
  isDocumentCode,
} from '@/shared/constants/required-documents'

interface DocumentsStepProps {
  formData: {
    requiresDocuments: boolean
    requiredDocuments: any[]
  }
  onChange: (field: string, value: any) => void
}

const DEFAULT_FORMATS = ['pdf', 'jpg', 'jpeg', 'png']

const normalize = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Os mais pedidos aparecem primeiro, sem precisar procurar */
const COMMON: DocumentCode[] = ['IDENTIDADE', 'CPF', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_RENDA', 'CERTIDAO_NASCIMENTO', 'CARTAO_SUS', 'FOTOS_LOCAL', 'FOTO_3X4']

/** "Documento de identidade (RG, CIN ou CNH) — do responsável" → "do responsável" */
function noteOf(doc: any): string {
  const code: unknown = doc?.code
  if (!isDocumentCode(code)) return ''
  const base = DOCUMENT_CATALOG[code].name
  return typeof doc.name === 'string' && doc.name.startsWith(`${base} — `) ? doc.name.slice(base.length + 3) : ''
}

export function DocumentsStep({ formData, onChange }: DocumentsStepProps) {
  const [search, setSearch] = useState('')

  const rawDocuments = Array.isArray(formData.requiredDocuments) ? formData.requiredDocuments : []

  // texto solto (formato antigo) vira objeto; o servidor padroniza nomes conhecidos ao salvar
  const documents = rawDocuments.map((doc) =>
    typeof doc === 'string'
      ? { name: doc, description: '', required: true, acceptedFormats: DEFAULT_FORMATS, allowCameraUpload: true, maxSizeMB: 5 }
      : {
          ...doc,
          acceptedFormats: doc.acceptedFormats || DEFAULT_FORMATS,
          allowCameraUpload: doc.allowCameraUpload !== undefined ? doc.allowCameraUpload : true,
          maxSizeMB: doc.maxSizeMB || 5,
        }
  )

  const usedCodes = new Set(documents.map((doc) => doc.code).filter(isDocumentCode))

  const results = useMemo(() => {
    const term = normalize(search.trim())
    if (!term) return COMMON.filter((code) => !usedCodes.has(code))
    return DOCUMENT_CODES.filter((code) => {
      if (usedCodes.has(code)) return false
      const def = DOCUMENT_CATALOG[code]
      return normalize(`${def.name} ${def.hint} ${def.group}`).includes(term)
    }).slice(0, 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, documents.length])

  const save = (next: any[]) => onChange('requiredDocuments', next)

  const update = (index: number, patch: Record<string, any>) => {
    const next = [...documents]
    next[index] = { ...next[index], ...patch }
    save(next)
  }

  const addStandard = (code: DocumentCode) => {
    save([...documents, expandRequiredDocument(code)])
    setSearch('')
  }

  const addCustom = () => {
    const name = search.trim()
    if (!name) return
    save([...documents, { name, description: '', required: true, acceptedFormats: DEFAULT_FORMATS, allowCameraUpload: true, maxSizeMB: 5 }])
    setSearch('')
  }

  const setNote = (index: number, note: string) => {
    const doc = documents[index]
    if (!isDocumentCode(doc.code)) return
    const base = DOCUMENT_CATALOG[doc.code as DocumentCode].name
    update(index, { name: note.trim() ? `${base} — ${note}` : base })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-900">Documentos que o cidadão envia</p>
          <p className="text-xs text-amber-700 mt-1">
            Escolha na lista padrão. Assim o cidadão vê sempre o mesmo nome e a câmera já sabe como fotografar cada um (frente e verso, várias páginas...).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresDocuments"
            checked={formData.requiresDocuments}
            onCheckedChange={(checked) => onChange('requiresDocuments', checked)}
          />
          <Label htmlFor="requiresDocuments" className="cursor-pointer font-medium">
            Este serviço pede documentos
          </Label>
        </div>

        {formData.requiresDocuments && (
          <div className="space-y-4 pl-6 border-l-2 border-amber-200">
            <div>
              <Label htmlFor="documentSearch" className="text-sm font-medium">
                Adicionar documento
              </Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="documentSearch"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (results.length > 0) addStandard(results[0])
                    }
                  }}
                  placeholder="Procure: identidade, residência, matrícula, laudo..."
                  className="pl-9"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {results.map((code) => (
                  <Badge
                    key={code}
                    variant="outline"
                    title={DOCUMENT_CATALOG[code].hint}
                    className="cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    onClick={() => addStandard(code)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {DOCUMENT_CATALOG[code].name}
                  </Badge>
                ))}
              </div>

              {search.trim() && results.length === 0 && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p>Nenhum documento da lista padrão tem esse nome. Tente outra palavra (ex.: &quot;propriedade&quot;, &quot;renda&quot;, &quot;veículo&quot;).</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2 h-8 text-xs" onClick={addCustom}>
                    <Plus className="h-3 w-3 mr-1" />
                    Criar &quot;{search.trim()}&quot; só para este município
                  </Button>
                </div>
              )}
            </div>

            {documents.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Documentos pedidos ({documents.length})
                </Label>
                <div className="space-y-2">
                  {documents.map((doc, index) => {
                    const standard = isDocumentCode(doc.code)
                    const def = standard ? DOCUMENT_CATALOG[doc.code as DocumentCode] : null
                    return (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{def ? def.name : doc.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{def ? def.hint : doc.description}</p>
                              {!standard && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  Fora da lista padrão (próprio do município)
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => save(documents.filter((_, i) => i !== index))}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Tirar ${doc.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pl-7">
                          {standard && (
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <Label htmlFor={`note-${index}`} className="text-xs text-gray-600">
                                De quem ou qual (opcional)
                              </Label>
                              <Input
                                id={`note-${index}`}
                                value={noteOf(doc)}
                                onChange={(e) => setNote(index, e.target.value)}
                                placeholder="Ex.: do responsável, de cada sócio, categoria D"
                                className="h-8 text-xs"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Checkbox id={`required-${index}`} checked={doc.required !== false} onCheckedChange={(checked) => update(index, { required: checked === true })} />
                            <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                              Obrigatório
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`camera-${index}`}
                              checked={doc.allowCameraUpload !== false}
                              onCheckedChange={(checked) => update(index, { allowCameraUpload: checked === true })}
                            />
                            <Label htmlFor={`camera-${index}`} className="text-xs cursor-pointer flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Permitir fotografar pela câmera
                            </Label>
                          </div>

                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-gray-600">Formatos aceitos</Label>
                            <Select value={(doc.acceptedFormats || []).join(',')} onValueChange={(value) => update(index, { acceptedFormats: value.split(',') })}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione os formatos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf,jpg,jpeg,png">PDF ou foto</SelectItem>
                                <SelectItem value="pdf">Só PDF</SelectItem>
                                <SelectItem value="jpg,jpeg,png">Só foto</SelectItem>
                                <SelectItem value="pdf,jpg,jpeg,png,doc,docx">PDF, foto ou Word</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-gray-600">Tamanho máximo (MB)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              value={doc.maxSizeMB || 5}
                              onChange={(e) => update(index, { maxSizeMB: parseInt(e.target.value) || 5 })}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!formData.requiresDocuments && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Este serviço não pede documentos</p>
            <p className="text-xs text-gray-500 mt-1">Marque a opção acima se o cidadão precisar enviar documentos</p>
          </div>
        )}
      </div>
    </div>
  )
}
