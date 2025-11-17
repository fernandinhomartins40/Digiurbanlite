'use client';

import { useState, useEffect } from 'react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
import { ModernMaskedInput, formatValue } from '@/components/ui/modern-masked-input';
import { useViaCEP, formatCEP, isValidCEP } from '@/hooks/useViaCEP';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Key,
  CheckCircle2,
  Shield,
  Calendar,
  Building2,
  Edit,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';

export default function PerfilPage() {
  const { citizen, updateProfile } = useCitizenAuth();
  const { searchByCEP, loading: cepLoading, error: cepError, clearError } = useViaCEP();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cepInputValue, setCepInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ✅ PADRONIZADO: Formulário usa nomenclatura do banco (português)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneSecondary: '',
    birthDate: '',
    rg: '',
    motherName: '',
    maritalStatus: '',
    occupation: '',
    familyIncome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    pontoReferencia: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ✅ PADRONIZADO: Carrega dados do cidadão usando nomenclatura do banco
  // ✅ FORMATAÇÃO: Aplica máscaras aos valores vindos do backend
  useEffect(() => {
    if (citizen) {
      setFormData({
        name: citizen.name || '',
        email: citizen.email || '',
        phone: formatValue(citizen.phone || '', 'phone'),
        phoneSecondary: formatValue(citizen.phoneSecondary || '', 'phone'),
        birthDate: citizen.birthDate ? new Date(citizen.birthDate).toISOString().split('T')[0] : '',
        rg: formatValue(citizen.rg || '', 'rg'),
        motherName: citizen.motherName || '',
        maritalStatus: citizen.maritalStatus || '',
        occupation: citizen.occupation || '',
        familyIncome: citizen.familyIncome || '',
        cep: citizen.address?.cep || '',
        logradouro: citizen.address?.logradouro || '',
        numero: citizen.address?.numero || '',
        complemento: citizen.address?.complemento || '',
        bairro: citizen.address?.bairro || '',
        cidade: citizen.address?.cidade || '',
        uf: citizen.address?.uf || '',
        pontoReferencia: citizen.address?.pontoReferencia || ''
      });
      setCepInputValue(citizen.address?.cep || '');
    }
  }, [citizen]);

  // ✅ PADRONIZADO: Busca CEP e preenche com nomenclatura do banco
  const handleCEPChange = async (value: string) => {
    // Formata o CEP enquanto digita
    const formatted = formatCEP(value);
    setCepInputValue(formatted);
    setFormData({ ...formData, cep: formatted });
    clearError();

    // Só busca se o CEP estiver completo
    if (isValidCEP(formatted)) {
      const addressData = await searchByCEP(formatted);
      if (addressData) {
        // ✅ PADRONIZADO: useViaCEP retorna dados em inglês, convertemos para português
        setFormData(prev => ({
          ...prev,
          cep: addressData.zipCode,
          logradouro: addressData.street,
          bairro: addressData.neighborhood,
          cidade: addressData.city,
          uf: addressData.state
        }));
      }
    }
  };

  // ✅ PADRONIZADO: Salva dados com nomenclatura do banco
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Validações básicas
      if (!formData.name || formData.name.length < 2) {
        setSaveMessage({ type: 'error', text: 'Nome deve ter pelo menos 2 caracteres' });
        return;
      }

      if (!formData.email || !formData.email.includes('@')) {
        setSaveMessage({ type: 'error', text: 'Email inválido' });
        return;
      }

      // ✅ PADRONIZADO: Preparar dados com nomenclatura do banco
      // ⚠️ IMPORTANTE: Enviar campos mesmo se vazios para permitir limpeza de dados
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone?.trim() || null,
        phoneSecondary: formData.phoneSecondary?.trim() || null,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        rg: formData.rg?.trim() || null,
        motherName: formData.motherName?.trim() || null,
        maritalStatus: formData.maritalStatus?.trim() || null,
        occupation: formData.occupation?.trim() || null,
        familyIncome: formData.familyIncome?.trim() || null,
        address: {
          cep: formData.cep?.trim() || '',
          logradouro: formData.logradouro?.trim() || '',
          numero: formData.numero?.trim() || '',
          complemento: formData.complemento?.trim() || '',
          bairro: formData.bairro?.trim() || '',
          cidade: formData.cidade?.trim() || '',
          uf: formData.uf?.trim() || '',
          pontoReferencia: formData.pontoReferencia?.trim() || ''
        }
      };

      console.log('📝 Dados sendo enviados para atualização:', updateData);
      const result = await updateProfile(updateData);

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setIsEditing(false);

        // Limpar mensagem após 3 segundos
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    // Aqui você integraria com o backend
    console.log('Alterando senha');
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e configurações</p>
        </div>

        {/* Status da Conta */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="bg-blue-100 p-2.5 sm:p-3 rounded-full">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900">Conta Verificada</h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  Seu cadastro foi verificado pela administração municipal
                </p>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg self-end sm:self-auto">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-900">Status: Prata</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Mensagem de feedback */}
            {saveMessage && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {saveMessage.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {saveMessage.text}
                </p>
              </div>
            )}

            <Card>
              <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Informações Pessoais</CardTitle>
                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveMessage(null);
                      }}
                      className="flex-1 sm:flex-none"
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="flex-1 sm:flex-none"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar'
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <User className="h-4 w-4 text-gray-400" />
                          {citizen?.name || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <Shield className="h-4 w-4 text-gray-400" />
                      {citizen?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {citizen?.email || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <MaskedInput
                          id="phone"
                          type="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {citizen?.phone || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneSecondary">Telefone Secundário</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <ModernMaskedInput
                          id="phoneSecondary"
                          type="phone"
                          value={formData.phoneSecondary}
                          onChange={(e) => {
                            console.log('📱 Telefone Secundário onChange:', e.target.value);
                            setFormData({ ...formData, phoneSecondary: e.target.value });
                          }}
                          placeholder="(00) 00000-0000"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {citizen?.phoneSecondary || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {citizen?.birthDate ? new Date(citizen.birthDate).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <ModernMaskedInput
                          id="rg"
                          type="rg"
                          value={formData.rg}
                          onChange={(e) => {
                            console.log('🪪 RG onChange:', e.target.value);
                            setFormData({ ...formData, rg: e.target.value });
                          }}
                          placeholder="00.000.000-0"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Shield className="h-4 w-4 text-gray-400" />
                          {citizen?.rg || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="motherName">Nome da Mãe</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="motherName"
                          value={formData.motherName}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          placeholder="Nome completo da mãe"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <User className="h-4 w-4 text-gray-400" />
                          {citizen?.motherName || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="maritalStatus">Estado Civil</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <select
                          id="maritalStatus"
                          value={formData.maritalStatus}
                          onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecione...</option>
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                          <option value="União Estável">União Estável</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{citizen?.maritalStatus || '-'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Profissão/Ocupação</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          placeholder="Sua profissão ou ocupação"
                        />
                      ) : (
                        <p className="text-gray-900">{citizen?.occupation || '-'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="familyIncome">Renda Familiar</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <select
                          id="familyIncome"
                          value={formData.familyIncome}
                          onChange={(e) => setFormData({ ...formData, familyIncome: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecione...</option>
                          <option value="Até 1 salário mínimo">Até 1 salário mínimo</option>
                          <option value="1 a 2 salários mínimos">1 a 2 salários mínimos</option>
                          <option value="2 a 3 salários mínimos">2 a 3 salários mínimos</option>
                          <option value="3 a 5 salários mínimos">3 a 5 salários mínimos</option>
                          <option value="Acima de 5 salários mínimos">Acima de 5 salários mínimos</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{citizen?.familyIncome || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CEP - Primeiro campo */}
                  <div className="md:col-span-2">
                    <Label htmlFor="cep" className="flex items-center gap-2">
                      CEP
                      {isEditing && (
                        <span className="text-xs text-gray-500 font-normal">
                          (Digite o CEP para preencher automaticamente)
                        </span>
                      )}
                    </Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <div className="relative">
                          <MaskedInput
                            id="cep"
                            type="cep"
                            placeholder="00000-000"
                            value={cepInputValue}
                            onChange={(e) => handleCEPChange(e.target.value)}
                            className={cepError ? 'border-red-300' : ''}
                          />
                          {cepLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">{citizen?.address?.cep || '-'}</p>
                      )}
                      {cepError && isEditing && (
                        <p className="text-xs text-red-600 mt-1">{cepError}</p>
                      )}
                    </div>
                  </div>

                  {/* Logradouro */}
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Logradouro</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="logradouro"
                          value={formData.logradouro}
                          onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                          placeholder="Rua, Avenida, etc."
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {citizen?.address?.logradouro || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Número */}
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          placeholder="123"
                        />
                      ) : (
                        <p className="text-gray-900">{citizen?.address?.numero || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Complemento */}
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="complemento"
                          value={formData.complemento}
                          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                          placeholder="Apto, Bloco, etc. (opcional)"
                        />
                      ) : (
                        <p className="text-gray-900">{citizen?.address?.complemento || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Bairro */}
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                          placeholder="Nome do bairro"
                        />
                      ) : (
                        <p className="text-gray-900">{citizen?.address?.bairro || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Cidade */}
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                          placeholder="Nome da cidade"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {citizen?.address?.cidade || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <Label htmlFor="uf">Estado</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="uf"
                          value={formData.uf}
                          onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      ) : (
                        <p className="text-gray-900">{citizen?.address?.uf || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Ponto de Referência */}
                  <div className="md:col-span-2">
                    <Label htmlFor="pontoReferencia">Ponto de Referência</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          id="pontoReferencia"
                          value={formData.pontoReferencia}
                          onChange={(e) => setFormData({ ...formData, pontoReferencia: e.target.value })}
                          placeholder="Ex: Próximo ao mercado central"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {citizen?.address?.pontoReferencia || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {!isChangingPassword ? (
                  <div>
                    <Label>Senha</Label>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span>••••••••</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsChangingPassword(true)}
                      >
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="w-full sm:flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePassword} className="w-full sm:flex-1">
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com informações */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Membro desde</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {citizen?.createdAt ? new Date(citizen.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Shield className="h-4 w-4" />
                    <span>Status de Verificação</span>
                  </div>
                  <p className="text-sm font-medium text-green-600">Verificado (Prata)</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Origem do Cadastro</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Administração Municipal</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Dicas de Segurança
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Nunca compartilhe sua senha</li>
                  <li>• Use uma senha forte e única</li>
                  <li>• Mantenha seus dados atualizados</li>
                  <li>• Verifique sempre o endereço do site</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
