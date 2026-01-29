"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CheckCircle, AlertCircle, XCircle, Calendar, Edit2, Trash2 } from "lucide-react"
import type { ProblemaCondicao, TipoClassificacao, StatusProblema, GravidadeProblema } from "@/types/saude"

interface ListaProblemasCondicoesProps {
  citizenId: string
}

export default function ListaProblemasCondicoes({ citizenId }: ListaProblemasCondicoesProps) {
  const [problemas, setProblemas] = useState<ProblemaCondicao[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<ProblemaCondicao | null>(null)

  const [formData, setFormData] = useState<{
    tipo: TipoClassificacao
    codigo: string
    descricao: string
    status: StatusProblema
    gravidade: GravidadeProblema
    prioridade: number
    observacoes: string
  }>({
    tipo: 'CIAP2',
    codigo: '',
    descricao: '',
    status: 'ATIVO',
    gravidade: 'LEVE',
    prioridade: 0,
    observacoes: ''
  })

  useEffect(() => {
    carregarProblemas()
  }, [citizenId])

  const carregarProblemas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/problemas`)
      if (response.ok) {
        const data = await response.json()
        setProblemas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar problemas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editando
        ? `/api/apps/saude/prontuario/${citizenId}/problemas/${editando.id}`
        : `/api/apps/saude/prontuario/${citizenId}/problemas`

      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          citizenId,
          dataInicio: new Date(),
        }),
      })

      if (response.ok) {
        await carregarProblemas()
        setDialogOpen(false)
        setEditando(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar problema:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este problema?')) return

    try {
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/problemas/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await carregarProblemas()
      }
    } catch (error) {
      console.error('Erro ao excluir problema:', error)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/problemas/${id}/resolver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataResolucao: new Date(),
        }),
      })

      if (response.ok) {
        await carregarProblemas()
      }
    } catch (error) {
      console.error('Erro ao resolver problema:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'CIAP2',
      codigo: '',
      descricao: '',
      status: 'ATIVO',
      gravidade: 'LEVE',
      prioridade: 0,
      observacoes: ''
    })
  }

  const openEditDialog = (problema: ProblemaCondicao) => {
    setEditando(problema)
    setFormData({
      tipo: problema.tipo,
      codigo: problema.codigo,
      descricao: problema.descricao,
      status: problema.status,
      gravidade: problema.gravidade || 'LEVE',
      prioridade: problema.prioridade,
      observacoes: problema.observacoes || ''
    })
    setDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ATIVO': 'bg-red-100 text-red-800 border-red-300',
      'LATENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'RESOLVIDO': 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      'ATIVO': <AlertCircle className="h-4 w-4" />,
      'LATENTE': <CheckCircle className="h-4 w-4" />,
      'RESOLVIDO': <CheckCircle className="h-4 w-4" />,
    }
    return icons[status] || null
  }

  const getGravidadeColor = (gravidade?: string) => {
    const colors: Record<string, string> = {
      'LEVE': 'text-green-600',
      'MODERADO': 'text-yellow-600',
      'GRAVE': 'text-red-600',
    }
    return colors[gravidade || 'LEVE'] || 'text-gray-600'
  }

  const problemasAtivos = problemas.filter(p => p.status === 'ATIVO')
  const problemasLatentes = problemas.filter(p => p.status === 'LATENTE')
  const problemasResolvidos = problemas.filter(p => p.status === 'RESOLVIDO')

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Lista de Problemas e Condições</CardTitle>
              <CardDescription>
                Acompanhamento longitudinal de problemas de saúde (CIAP-2 / CID-10)
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditando(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Problema
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editando ? 'Editar Problema' : 'Adicionar Novo Problema'}
                  </DialogTitle>
                  <DialogDescription>
                    Registre um problema ou condição de saúde do paciente
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Classificação</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CIAP2">CIAP-2 (Atenção Primária)</SelectItem>
                          <SelectItem value="CID10">CID-10 (Hospitalar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        placeholder={formData.tipo === 'CIAP2' ? 'Ex: K86' : 'Ex: I10'}
                        value={formData.codigo}
                        onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição do Problema</Label>
                    <Input
                      id="descricao"
                      placeholder="Ex: Hipertensão Arterial Sistêmica"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="LATENTE">Latente</SelectItem>
                          <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gravidade">Gravidade</Label>
                      <Select
                        value={formData.gravidade}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, gravidade: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEVE">Leve</SelectItem>
                          <SelectItem value="MODERADO">Moderado</SelectItem>
                          <SelectItem value="GRAVE">Grave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioridade">Prioridade (0-10)</Label>
                      <Input
                        id="prioridade"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.prioridade}
                        onChange={(e) => setFormData(prev => ({ ...prev, prioridade: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <textarea
                      id="observacoes"
                      className="w-full min-h-[80px] p-3 border rounded-md"
                      placeholder="Observações adicionais sobre o problema..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Problemas Ativos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Problemas Ativos ({problemasAtivos.length})
            </h3>
            {problemasAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum problema ativo registrado</p>
            ) : (
              <div className="space-y-2">
                {problemasAtivos.map(problema => (
                  <Card key={problema.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                              {problema.tipo}: {problema.codigo}
                            </Badge>
                            <Badge className={getStatusColor(problema.status)}>
                              {getStatusIcon(problema.status)}
                              <span className="ml-1">{problema.status}</span>
                            </Badge>
                            {problema.gravidade && (
                              <span className={`text-sm font-medium ${getGravidadeColor(problema.gravidade)}`}>
                                {problema.gravidade}
                              </span>
                            )}
                            {problema.prioridade > 5 && (
                              <Badge variant="destructive">Alta Prioridade</Badge>
                            )}
                          </div>
                          <h4 className="font-medium mb-1">{problema.descricao}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {new Date(problema.dataInicio).toLocaleDateString('pt-BR')}
                          </p>
                          {problema.observacoes && (
                            <p className="text-sm mt-2 text-gray-600">{problema.observacoes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(problema)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleResolve(problema.id)}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(problema.id)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {problemasLatentes.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Problemas Latentes ({problemasLatentes.length})
                </h3>
                <div className="space-y-2">
                  {problemasLatentes.map(problema => (
                    <Card key={problema.id} className="opacity-75">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                {problema.tipo}: {problema.codigo}
                              </Badge>
                              <Badge className={getStatusColor(problema.status)}>
                                {problema.status}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{problema.descricao}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(problema)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {problemasResolvidos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Problemas Resolvidos ({problemasResolvidos.length})
                </h3>
                <div className="space-y-2">
                  {problemasResolvidos.slice(0, 5).map(problema => (
                    <Card key={problema.id} className="opacity-60">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-xs">
                                {problema.tipo}: {problema.codigo}
                              </Badge>
                              <Badge className={getStatusColor(problema.status)}>
                                {problema.status}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-medium">{problema.descricao}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Resolvido em {problema.dataResolucao ? new Date(problema.dataResolucao).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {problemasResolvidos.length > 5 && (
                    <p className="text-sm text-center text-muted-foreground">
                      + {problemasResolvidos.length - 5} problemas resolvidos
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
