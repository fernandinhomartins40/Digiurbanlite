'use client'

/**
 * Cadastrar filho(a) ou outro menor de 18 anos que não tem conta.
 * O dependente entra na família na hora (sem e-mail nem senha) e pode ser
 * escolhido nos pedidos que são para ele.
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModernMaskedInput } from '@/components/ui/modern-masked-input'
import { useToast } from '@/hooks/use-toast'

const RELATIONSHIPS = [
  { value: 'SON', label: 'Filho' },
  { value: 'DAUGHTER', label: 'Filha' },
  { value: 'GRANDSON', label: 'Neto' },
  { value: 'GRANDDAUGHTER', label: 'Neta' },
  { value: 'BROTHER', label: 'Irmão' },
  { value: 'SISTER', label: 'Irmã' },
  { value: 'OTHER', label: 'Outro (sou o responsável)' },
]

interface AddDependentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>
}

export function AddDependentDialog({ open, onOpenChange, onSuccess, apiRequest }: AddDependentDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [relationship, setRelationship] = useState('SON')
  const [hasDisability, setHasDisability] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName('')
    setCpf('')
    setBirthDate('')
    setRelationship('SON')
    setHasDisability(false)
    setError(null)
  }

  const save = async () => {
    setError(null)
    if (name.trim().split(/\s+/).length < 2) return setError('Informe o nome completo.')
    if (cpf.replace(/\D/g, '').length !== 11) return setError('Informe o CPF completo (ele vem na certidão de nascimento).')
    if (!birthDate) return setError('Informe a data de nascimento.')
    try {
      setSaving(true)
      const response = await apiRequest('/citizen/family/dependents', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), cpf: cpf.replace(/\D/g, ''), birthDate, relationship, hasDisability }),
      })
      if (response?.success === false) throw new Error(response?.error?.message || response?.message || response?.error)
      toast({ title: 'Dependente cadastrado', description: `${name.trim().split(' ')[0]} já faz parte da sua família.` })
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (saveError: any) {
      setError(typeof saveError?.message === 'string' ? saveError.message : 'Não foi possível cadastrar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar filho(a) sem conta</DialogTitle>
          <DialogDescription>
            Para menores de 18 anos. Não precisa de e-mail nem senha: você cuida dos pedidos dele(a).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="dependent-name">Nome completo</Label>
            <Input id="dependent-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dependent-cpf">CPF</Label>
              <ModernMaskedInput id="dependent-cpf" type="cpf" value={cpf} onChange={(e: any) => setCpf(e?.target?.value ?? e)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dependent-birth">Data de nascimento</Label>
              <Input id="dependent-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dependent-relationship">O que ele(a) é seu</Label>
            <select
              id="dependent-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {RELATIONSHIPS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={hasDisability} onCheckedChange={(checked) => setHasDisability(checked === true)} />
            Tem alguma deficiência
          </label>
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
