"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Plus, AlertTriangle, Edit2, Trash2, ShieldAlert } from "lucide-react"
import type { AlergiaReacao, TipoAlergia, GravidadeAlergia } from "@/types/saude"

interface AlergiasReacoesCardProps {
  citizenId: string
  showAlert?: boolean
}

export default function AlergiasReacoesCard({ citizenId, showAlert = true }: AlergiasReacoesCardProps) {
  const [alergias, setAlergias] = useState<AlergiaReacao[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<AlergiaReacao | null>(null)

  const [formData, setFormData] = useState<{
    tipo: TipoAlergia
    substancia: string
    reacao: string
    gravidade: GravidadeAlergia
    observacoes: string
  }>({
    tipo: 'MEDICAMENTO',
    substancia: '',
    reacao: '',
    gravidade: 'LEVE',
    observacoes: ''
  })

  useEffect(() => {
    carregarAlergias()
  }, [citizenId])

  const carregarAlergias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/alergias`)
      if (response.ok) {
        const data = await response.json()
        setAlergias(data)
      }
    } catch (error) {
      console.error('Erro ao carregar alergias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editando
        ? `/api/apps/saude/prontuario/${citizenId}/alergias/${editando.id}`
        : `/api/apps/saude/prontuario/${citizenId}/alergias`

      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          citizenId,
          dataIdentificacao: new Date(),
          ativo: true,
        }),
      })

      if (response.ok) {
        await carregarAlergias()
        setDialogOpen(false)
        setEditando(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar alergia:', error)
    }
  }

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/alergias/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo }),
      })

      if (response.ok) {
        await carregarAlergias()
      }
    } catch (error) {
      console.error('Erro ao atualizar alergia:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta alergia?')) return

    try {
      const response = await fetch(`/api/apps/saude/prontuario/${citizenId}/alergias/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await carregarAlergias()
      }
    } catch (error) {
      console.error('Erro ao excluir alergia:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'MEDICAMENTO',
      substancia: '',
      reacao: '',
      gravidade: 'LEVE',
      observacoes: ''
    })
  }

  const openEditDialog = (alergia: AlergiaReacao) => {
    setEditando(alergia)
    setFormData({
      tipo: alergia.tipo,
      substancia: alergia.substancia,
      reacao: alergia.reacao,
      gravidade: alergia.gravidade,
      observacoes: alergia.observacoes || ''
    })
    setDialogOpen(true)
  }

  const getGravidadeColor = (gravidade: string) => {
    const colors: Record<string, string> = {
      'LEVE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'MODERADA': 'bg-orange-100 text-orange-800 border-orange-300',
      'GRAVE': 'bg-red-100 text-red-800 border-red-300',
      'ANAFILAXIA': 'bg-purple-100 text-purple-800 border-purple-300',
    }
    return colors[gravidade] || 'bg-gray-100 text-gray-800'
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'MEDICAMENTO': 'Medicamento',
      'ALIMENTO': 'Alimento',
      'AMBIENTAL': 'Ambiental',
      'CONTATO': 'Contato',
      'LATEX': 'Látex',
      'OUTRA': 'Outra',
    }
    return labels[tipo] || tipo
  }

  const alergiasAtivas = alergias.filter(a => a.ativo)
  const alergiasInativas = alergias.filter(a => !a.ativo)

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Alerta de Alergias Ativas */}
      {showAlert && alergiasAtivas.length > 0 && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-bold">ATENÇÃO: Paciente com Alergias Registradas</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {alergiasAtivas.map(alergia => (
                <div key={alergia.id} className="font-medium">
                  • {getTipoLabel(alergia.tipo)}: <strong>{alergia.substancia}</strong>
                  {alergia.gravidade === 'ANAFILAXIA' && (
                    <Badge className="ml-2 bg-purple-600">RISCO DE ANAFILAXIA</Badge>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Alergias e Reações Adversas
              </CardTitle>
              <CardDescription>
                Registro de alergias e reações adversas do paciente
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditando(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Alergia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editando ? 'Editar Alergia' : 'Registrar Nova Alergia'}
                  </DialogTitle>
                  <DialogDescription>
                    Documente alergias e reações adversas para segurança do paciente
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Alergia *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
                          <SelectItem value="ALIMENTO">Alimento</SelectItem>
                          <SelectItem value="AMBIENTAL">Ambiental (pólen, ácaros)</SelectItem>
                          <SelectItem value="CONTATO">Contato (pele)</SelectItem>
                          <SelectItem value="LATEX">Látex</SelectItem>
                          <SelectItem value="OUTRA">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gravidade">Gravidade *</Label>
                      <Select
                        value={formData.gravidade}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, gravidade: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEVE">Leve</SelectItem>
                          <SelectItem value="MODERADA">Moderada</SelectItem>
                          <SelectItem value="GRAVE">Grave</SelectItem>
                          <SelectItem value="ANAFILAXIA">Anafilaxia (Risco de Vida)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="substancia">Substância / Alérgeno *</Label>
                    <Input
                      id="substancia"
                      placeholder="Ex: Dipirona, Amendoim, Penicilina"
                      value={formData.substancia}
                      onChange={(e) => setFormData(prev => ({ ...prev, substancia: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reacao">Descrição da Reação *</Label>
                    <textarea
                      id="reacao"
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      placeholder="Descreva a reação apresentada pelo paciente (ex: urticária, prurido, edema, dificuldade respiratória)"
                      value={formData.reacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, reacao: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações Adicionais</Label>
                    <textarea
                      id="observacoes"
                      className="w-full min-h-[60px] p-3 border rounded-md"
                      placeholder="Informações complementares, data do evento, circunstâncias..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    />
                  </div>

                  {formData.gravidade === 'ANAFILAXIA' && (
                    <Alert variant="destructive">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle>Atenção: Risco de Anafilaxia</AlertTitle>
                      <AlertDescription>
                        Esta alergia será destacada em todos os atendimentos para garantir a segurança do paciente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.substancia || !formData.reacao}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alergias Ativas */}
          {alergiasAtivas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma alergia registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alergiasAtivas.map(alergia => (
                <Card key={alergia.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{getTipoLabel(alergia.tipo)}</Badge>
                          <Badge className={getGravidadeColor(alergia.gravidade)}>
                            {alergia.gravidade}
                          </Badge>
                          {alergia.gravidade === 'ANAFILAXIA' && (
                            <ShieldAlert className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <h4 className="font-bold text-lg text-red-700 mb-1">
                          {alergia.substancia}
                        </h4>
                        <p className="text-sm mb-2">
                          <strong>Reação:</strong> {alergia.reacao}
                        </p>
                        {alergia.observacoes && (
                          <p className="text-sm text-muted-foreground">
                            {alergia.observacoes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Registrado em {new Date(alergia.dataIdentificacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(alergia)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAtivo(alergia.id, false)}
                        >
                          Inativar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(alergia.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Alergias Inativas */}
          {alergiasInativas.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Alergias Inativas ({alergiasInativas.length})
              </h4>
              <div className="space-y-2">
                {alergiasInativas.map(alergia => (
                  <Card key={alergia.id} className="opacity-60">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{alergia.substancia}</span>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(alergia.tipo)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAtivo(alergia.id, true)}
                        >
                          Reativar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
