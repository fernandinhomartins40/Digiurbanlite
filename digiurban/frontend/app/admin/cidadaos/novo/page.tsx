'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react'

export default function NovoCidadaoPage() {
  const router = useRouter()
  const { user, apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    // Endereço
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const [loadingCep, setLoadingCep] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.cpf || !formData.name) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha CPF e nome',
      })
      return
    }

    setLoading(true)

    try {
      const address = {
        cep: formData.zipCode.replace(/\D/g, ''),
        logradouro: formData.street,
        numero: formData.number,
        complemento: formData.complement,
        bairro: formData.neighborhood,
        cidade: formData.city,
        uf: formData.state.toUpperCase(),
      }

      console.log('Enviando dados:', {
        cpf: formData.cpf.replace(/\D/g, ''),
        name: formData.name,
        email: formData.email,
      })

      const response = await apiRequest('/admin/citizens', {
        method: 'POST',
        body: JSON.stringify({
          cpf: formData.cpf.replace(/\D/g, ''),
          name: formData.name,
          email: formData.email.trim() || undefined,
          phone: formData.phone || undefined,
          birthDate: formData.birthDate || undefined,
          address: Object.values(address).some(v => v) ? address : undefined,
        }),
      })

      console.log('Resposta da API:', response)

      if (response.success) {
        toast({
          title: 'Cidadão cadastrado! ✅',
          description: response.message || `${formData.name} foi cadastrado como Prata (verificado)`,
        })

        router.push('/admin/cidadaos')
      } else {
        throw new Error(response.error || 'Erro ao cadastrar cidadão')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível cadastrar o cidadão',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').substring(0, 15)
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2').substring(0, 9)
  }

  const searchCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      return
    }

    setLoadingCep(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast({
          variant: 'destructive',
          title: 'CEP não encontrado',
          description: 'Verifique o CEP informado e tente novamente',
        })
        return
      }

      // Preencher os campos com os dados da API
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        complement: data.complemento || prev.complement,
      }))

      toast({
        title: 'CEP encontrado! ✅',
        description: 'Endereço preenchido automaticamente',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar CEP',
        description: 'Não foi possível consultar o CEP. Tente novamente.',
      })
    } finally {
      setLoadingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    const formattedCep = formatCEP(value)
    setFormData({ ...formData, zipCode: formattedCep })

    // Buscar automaticamente quando o CEP estiver completo
    const cleanCep = formattedCep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      searchCEP(formattedCep)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Adicionar Cidadão
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Cadastro administrativo - Status Prata (Verificado)
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Informações básicas do cidadão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                    }
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome completo do cidadão"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@exemplo.com (se tiver)"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: formatPhone(e.target.value) })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Digite o CEP para preencher automaticamente (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CEP em destaque no topo */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <Label htmlFor="zipCode" className="text-base font-semibold">
                  CEP
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="text-lg"
                    disabled={loadingCep}
                  />
                  {loadingCep && (
                    <div className="flex items-center justify-center px-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  💡 Digite o CEP e o endereço será preenchido automaticamente
                </p>
              </div>

              {/* Campos de endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua/Avenida</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) =>
                      setFormData({ ...formData, complement: e.target.value })
                    }
                    placeholder="Apto, bloco, etc"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value.toUpperCase() })
                    }
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acesso ao Portal (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>Acesso ao Portal do Cidadão</CardTitle>
              <CardDescription>
                Como o cidadão entra no portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                💡 Com e-mail, o cidadão recebe um link para criar a própria senha (o servidor não define senha de ninguém).
                Sem e-mail, ele é atendido pelo balcão e pode criar o acesso depois, quando informar um e-mail.
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={loading} className="min-w-[200px]">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Cidadão (Prata)
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
