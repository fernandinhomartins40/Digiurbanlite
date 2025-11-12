'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface Field {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface FormModalProps {
  title: string
  description?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: Field[]
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
}

export function FormModal({
  title,
  description,
  open,
  onOpenChange,
  fields,
  initialData = {},
  onSubmit,
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setFormData(initialData)
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      toast({
        title: 'Sucesso',
        description: initialData.id
          ? 'Registro atualizado com sucesso'
          : 'Registro criado com sucesso',
      })
      onOpenChange(false)
      setFormData({})
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar registro',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: Field) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) =>
              setFormData({ ...formData, [field.name]: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        )

      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.name]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === 'textarea' ? 'md:col-span-2' : 'col-span-1'
                }
              >
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : initialData.id ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
