'use client'

/**
 * Conferência pública de documentos (sem login), uma página para tudo:
 * documento do protocolo (código VAL-...), documento assinado e documento do
 * processo interno (código da assinatura). O QR Code da folha de assinaturas
 * abre esta página já com o código (?codigo=...).
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle2, XCircle, Upload, Loader2, FileCheck, Calendar, Building, User, AlertCircle, Info, PenLine } from 'lucide-react'
import { toast } from 'sonner'

interface SignatureResult {
  name: string
  role: string | null
  signedAt: string
  code: string | null
  highlighted?: boolean
  valid: boolean
  revoked?: boolean
  reason?: string | null
}

interface CheckResult {
  municipality: string | null
  status: 'VALID' | 'INVALID' | 'SUPERSEDED' | 'REVOKED' | 'EXPIRED' | 'UNSIGNED'
  document: {
    kind?: string
    title?: string
    number?: string
    service?: string
    department?: string
    person?: string | null
    subject?: string | null
    createdAt?: string
    validationCode?: string | null
    revision?: number
    newerVersionCode?: string | null
    expiresAt?: string | null
  }
  signatures: SignatureResult[]
  fileMatches?: boolean
}

const STATUS: Record<CheckResult['status'], { ok: boolean; title: string; text: string }> = {
  VALID: { ok: true, title: 'Documento autêntico', text: 'O documento existe e todas as assinaturas conferem.' },
  UNSIGNED: { ok: true, title: 'Documento encontrado', text: 'O documento existe, mas ainda não foi assinado.' },
  INVALID: { ok: false, title: 'Atenção: assinatura não confere', text: 'Pelo menos uma assinatura não confere com o documento.' },
  SUPERSEDED: { ok: false, title: 'Versão substituída', text: 'Este documento foi substituído por uma versão mais nova. Peça a versão atual.' },
  REVOKED: { ok: false, title: 'Documento cancelado', text: 'A prefeitura cancelou este documento.' },
  EXPIRED: { ok: false, title: 'Documento vencido', text: 'O prazo de validade deste documento terminou.' },
}

const dateTime = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

export default function ValidateDocumentPage() {
  const [code, setCode] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'validate' | 'integrity'>('validate')

  const validate = async (value = code) => {
    if (!value.trim()) {
      toast.error('Digite o código')
      return
    }
    setLoading(true)
    setResult(null)
    setNotFound(null)
    try {
      const response = await fetch(`/api/public/validate/code/${encodeURIComponent(value.trim())}`)
      const data = await response.json()
      if (!response.ok || !data?.success) {
        setNotFound(data?.message || 'Código não encontrado.')
        return
      }
      setResult(data.data)
    } catch {
      setNotFound('Não foi possível conferir agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const verifyFile = async () => {
    if (!code.trim() || !file) {
      toast.error('Digite o código e escolha o PDF')
      return
    }
    setLoading(true)
    setResult(null)
    setNotFound(null)
    const formData = new FormData()
    formData.append('code', code.trim())
    formData.append('file', file)
    try {
      const response = await fetch('/api/public/validate/verify-integrity', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        setNotFound(data?.message || 'Código não encontrado.')
        return
      }
      setResult(data.data)
    } catch {
      setNotFound('Não foi possível conferir o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  // QR Code: /validar-documento?codigo=XXXX-XXXX-XXXX-XXXX
  useEffect(() => {
    const fromQr = new URLSearchParams(window.location.search).get('codigo')
    if (fromQr) {
      setCode(fromQr.toUpperCase())
      void validate(fromQr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const status = result ? STATUS[result.status] : null
  const ok = !!status?.ok && (mode !== 'integrity' || result?.fileMatches !== false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conferir documento</h1>
          <p className="text-gray-600">Veja se um documento da prefeitura é autêntico e quem assinou</p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button variant={mode === 'validate' ? 'default' : 'outline'} onClick={() => { setMode('validate'); setResult(null); setNotFound(null) }}>
            <FileCheck className="h-4 w-4 mr-2" />
            Conferir código
          </Button>
          <Button variant={mode === 'integrity' ? 'default' : 'outline'} onClick={() => { setMode('integrity'); setResult(null); setNotFound(null) }}>
            <Upload className="h-4 w-4 mr-2" />
            Conferir o arquivo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {mode === 'validate' ? 'Conferir código' : 'Conferir o arquivo PDF'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código</label>
              <Input
                placeholder="VAL-2026-123456-7890 ou ABCD-1234-ABCD-1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && mode === 'validate' && validate()}
                className="font-mono text-lg"
                maxLength={40}
              />
              <p className="text-xs text-gray-500 mt-1">Está na folha de assinaturas do documento (ou leia o QR Code com o celular)</p>
            </div>

            {mode === 'integrity' && (
              <div>
                <label className="block text-sm font-medium mb-2">Arquivo PDF</label>
                <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500 mt-1">Confere se o PDF que você tem é exatamente o que a prefeitura emitiu</p>
              </div>
            )}

            <Button onClick={() => (mode === 'validate' ? validate() : verifyFile())} disabled={loading || !code} className="w-full" size="lg">
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Shield className="h-5 w-5 mr-2" />}
              {loading ? 'Conferindo...' : 'Conferir'}
            </Button>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 flex items-start gap-4">
              <XCircle className="h-12 w-12 text-red-600 shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-1 text-red-900">Não encontrado</h3>
                <p className="text-sm">{notFound}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && status && (
          <Card className={ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {ok ? <CheckCircle2 className="h-12 w-12 text-green-600 shrink-0" /> : <XCircle className="h-12 w-12 text-red-600 shrink-0" />}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className={`font-bold text-xl mb-1 ${ok ? 'text-green-900' : 'text-red-900'}`}>
                      {mode === 'integrity' && result.fileMatches === false ? 'Atenção: o arquivo não é o emitido' : status.title}
                    </h3>
                    <p className="text-sm">
                      {mode === 'integrity'
                        ? result.fileMatches
                          ? 'O PDF é exatamente o que a prefeitura emitiu.'
                          : 'O PDF enviado é diferente do emitido: pode ter sido alterado ou ser de outra versão.'
                        : status.text}
                    </p>
                    {result.document.newerVersionCode && (
                      <p className="text-sm mt-1">
                        Versão atual:{' '}
                        <button type="button" className="font-mono text-blue-700 underline" onClick={() => { setCode(result.document.newerVersionCode!); void validate(result.document.newerVersionCode!) }}>
                          {result.document.newerVersionCode}
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <Field icon={FileCheck} label={result.document.kind || 'Documento'} value={result.document.title} />
                      {result.document.number && <Field icon={Info} label="Número" value={result.document.number} />}
                      {result.municipality && <Field icon={Building} label="Emitido por" value={result.municipality} />}
                      {result.document.department && <Field icon={Building} label="Secretaria" value={result.document.department} />}
                      {result.document.service && <Field icon={Info} label="Serviço" value={result.document.service} />}
                      {result.document.subject && <Field icon={Info} label="Assunto" value={result.document.subject} />}
                      {result.document.person && <Field icon={User} label="Cidadão" value={result.document.person} />}
                      {result.document.createdAt && <Field icon={Calendar} label="Emitido em" value={new Date(result.document.createdAt).toLocaleDateString('pt-BR')} />}
                      {result.document.expiresAt && <Field icon={Calendar} label="Validade" value={new Date(result.document.expiresAt).toLocaleDateString('pt-BR')} />}
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-4 rounded-lg border">
                    <p className="flex items-center gap-2 font-medium text-gray-900"><PenLine className="h-4 w-4" />Assinaturas</p>
                    {result.signatures.length === 0 && <p className="text-sm text-gray-500">Nenhuma assinatura.</p>}
                    {result.signatures.map((signature, index) => (
                      <div key={`${signature.code}-${index}`} className={`rounded-md border p-2 text-sm ${signature.highlighted ? 'border-blue-300 bg-blue-50' : ''}`}>
                        <p className={`flex items-center gap-1.5 font-medium ${signature.valid ? 'text-green-800' : 'text-red-800'}`}>
                          {signature.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {signature.name}
                        </p>
                        {signature.role && <p className="text-gray-600">{signature.role}</p>}
                        <p className="text-gray-600">{dateTime(signature.signedAt)} · código <span className="font-mono">{signature.code}</span></p>
                        {!signature.valid && signature.reason && <p className="text-red-700">{signature.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Sobre a conferência</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Todo documento assinado tem uma folha de assinaturas com código e QR Code</li>
                  <li>Assinatura eletrônica avançada (Lei 14.063/2020) com certificado da AC DigiUrban</li>
                  <li>&quot;Conferir o arquivo&quot; mostra se o PDF foi alterado depois de emitido</li>
                  <li>Esta página é pública: qualquer pessoa pode conferir</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-gray-600">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}
