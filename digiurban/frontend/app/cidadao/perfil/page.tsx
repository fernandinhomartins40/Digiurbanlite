'use client';

/**
 * Meu perfil — uma coluna:
 *   1. Quem sou eu + nível (Bronze/Prata/Ouro) e o que falta para subir
 *   2. Dados pessoais e endereço (lista; "Editar" abre o formulário)
 *   3. Senha (troca de verdade em /citizen/auth/change-password — antes o
 *      botão só fechava o formulário e não trocava nada)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, ChevronRight, Eye, EyeOff, Loader2, Pencil } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernMaskedInput, formatValue } from '@/components/ui/modern-masked-input';
import { useViaCEP, formatCEP, isValidCEP } from '@/hooks/useViaCEP';
import { cn } from '@/lib/utils';
import { citizenDocumentLabel } from '@/lib/citizen-document-types';
import { tagColorClass } from '@/lib/citizen-tags';
import { HomeLocationMark } from '@/components/citizen/HomeLocationMark';
import type { CitizenAccessLevelSummary } from '@/types/citizen-access';

const MARITAL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];
const INCOME = ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos'];
const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const LEVEL: Record<string, { label: string; className: string }> = {
  GOLD: { label: 'Nível Ouro', className: 'bg-amber-100 text-amber-800' },
  SILVER: { label: 'Nível Prata', className: 'bg-slate-200 text-slate-800' },
  BRONZE: { label: 'Nível Bronze', className: 'bg-orange-100 text-orange-800' },
};

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: '8 caracteres ou mais' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'uma letra maiúscula' },
  { test: (v: string) => /[a-z]/.test(v), label: 'uma letra minúscula' },
  { test: (v: string) => /\d/.test(v), label: 'um número' },
  { test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v), label: 'um símbolo (ex.: ! @ #)' },
];

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
      <dt className="text-sm text-gray-500 sm:w-44 sm:shrink-0">{label}</dt>
      <dd className={cn('text-sm break-words', value ? 'text-gray-900' : 'text-gray-400')}>{value || 'Não informado'}</dd>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, children, wide }: { id: string; label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('space-y-1.5', wide && 'sm:col-span-2')}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function PerfilPage() {
  const { citizen, updateProfile, apiRequest, refreshCitizenData } = useCitizenAuth();
  const [resubmitting, setResubmitting] = useState(false);

  // etiquetas do cidadão e serviços sugeridos a partir delas
  const [myTags, setMyTags] = useState<{
    tags: Array<{ id: string; name: string; color: string | null }>;
    services: Array<{ id: string; name: string; department: string | null; forTag: string | null }>;
  } | null>(null);
  useEffect(() => {
    apiRequest('/citizen/auth/my-tags')
      .then((response: any) => setMyTags(response?.data || null))
      .catch(() => setMyTags(null));
  }, [apiRequest]);

  // LGPD: baixar os meus dados e excluir a minha conta
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleDownloadData = async () => {
    try {
      const data = await apiRequest('/citizen/auth/my-data');
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meus-dados.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível baixar agora. Tente de novo.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!deletePassword) return setDeleteError('Digite a sua senha para confirmar.');
    try {
      setDeleteBusy(true);
      await apiRequest('/citizen/auth/delete-account', { method: 'POST', body: JSON.stringify({ password: deletePassword }) });
      toast.success('Sua conta foi excluída.');
      window.location.href = '/cidadao/login';
    } catch (error: any) {
      setDeleteError(error?.message || 'Não foi possível excluir agora. Tente de novo.');
    } finally {
      setDeleteBusy(false);
    }
  };

  // recusado: depois de corrigir, a pessoa pede nova conferência (antes a conta era desativada)
  const handleResubmit = async () => {
    try {
      setResubmitting(true);
      const response = await apiRequest('/citizen/auth/verification/resubmit', { method: 'POST' });
      toast.success(response?.message || 'Pedido enviado. A prefeitura vai conferir de novo.');
      await refreshCitizenData();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível pedir agora. Tente de novo.');
    } finally {
      setResubmitting(false);
    }
  };
  const { searchByCEP, loading: cepLoading, error: cepError, clearError } = useViaCEP();
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const emptyForm = {
    name: '', email: '', phone: '', phoneSecondary: '', birthDate: '', rg: '', motherName: '', maritalStatus: '',
    occupation: '', familyIncome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '',
    uf: '', pontoReferencia: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const fillFromCitizen = () => {
    if (!citizen) return;
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
      pontoReferencia: citizen.address?.pontoReferencia || '',
    });
  };

  useEffect(fillFromCitizen, [citizen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    apiRequest('/citizen/auth/access-level')
      .then((response: any) => active && setAccessLevel(response?.data?.accessLevel || null))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [apiRequest, citizen?.updatedAt]);

  const handleCEPChange = async (value: string) => {
    const formatted = formatCEP(value);
    setFormData((prev) => ({ ...prev, cep: formatted }));
    clearError();
    if (isValidCEP(formatted)) {
      const address = await searchByCEP(formatted);
      if (address) {
        setFormData((prev) => ({
          ...prev,
          cep: address.zipCode,
          logradouro: address.street,
          bairro: address.neighborhood,
          cidade: address.city,
          uf: address.state,
        }));
      }
    }
  };

  const handleSave = async () => {
    setFormError(null);
    if (formData.name.trim().length < 2) return setFormError('Informe o nome completo.');
    if (!formData.email.includes('@')) return setFormError('Informe um e-mail válido.');
    // dados já conferidos pela prefeitura: avisar que mudar volta para conferência
    if (citizen && (citizen.verificationStatus === 'VERIFIED' || citizen.verificationStatus === 'GOLD')) {
      const same = (a?: string | null, b?: string | null) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
      const day = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
      const changed =
        !same(formData.name, citizen.name) ||
        !same(formData.rg, (citizen as any).rg) ||
        !same(formData.motherName, (citizen as any).motherName) ||
        (formData.birthDate ? day(formData.birthDate) : '') !== day((citizen as any).birthDate);
      if (
        changed &&
        !window.confirm(
          'Nome, data de nascimento, RG e nome da mãe já foram conferidos pela prefeitura. Se mudar, o seu cadastro volta para conferência. Quer continuar?'
        )
      ) {
        return;
      }
    }
    try {
      setIsSaving(true);
      const trim = (v: string) => v?.trim() || undefined;
      const result = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: trim(formData.phone),
        phoneSecondary: trim(formData.phoneSecondary),
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        rg: trim(formData.rg),
        motherName: trim(formData.motherName),
        maritalStatus: trim(formData.maritalStatus),
        occupation: trim(formData.occupation),
        familyIncome: trim(formData.familyIncome),
        address: {
          cep: formData.cep.trim(),
          logradouro: formData.logradouro.trim(),
          numero: formData.numero.trim(),
          complemento: formData.complemento.trim(),
          bairro: formData.bairro.trim(),
          cidade: formData.cidade.trim(),
          uf: formData.uf.trim(),
          pontoReferencia: formData.pontoReferencia.trim(),
        },
      } as any);
      if (result.success) {
        toast.success(result.message && result.message !== 'Perfil atualizado com sucesso' ? result.message : 'Dados atualizados!');
        setIsEditing(false);
      } else {
        setFormError(result.message || 'Não foi possível salvar.');
      }
    } catch {
      setFormError('Não foi possível salvar. Tente de novo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!passwordData.currentPassword) return setPasswordError('Digite a senha atual.');
    if (!PASSWORD_RULES.every((rule) => rule.test(passwordData.newPassword))) return setPasswordError('A nova senha ainda não cumpre todas as regras.');
    if (passwordData.newPassword !== passwordData.confirmPassword) return setPasswordError('A confirmação não é igual à nova senha.');
    try {
      setSavingPassword(true);
      await apiRequest('/citizen/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      toast.success('Senha trocada!');
      setChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordError(error?.message || 'Não foi possível trocar a senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  /* ---------- nível ---------- */
  const level = LEVEL[accessLevel?.currentLevel || (citizen?.verificationStatus === 'GOLD' ? 'GOLD' : citizen?.verificationStatus === 'VERIFIED' ? 'SILVER' : 'BRONZE')];
  const todo: Array<{ label: string; href: string }> = [];
  if (accessLevel && accessLevel.currentLevel !== 'GOLD') {
    const gold = accessLevel.goldCriteria;
    if (!gold.profileComplete || gold.missingProfileFields.length) {
      todo.push({ label: `Completar dados: ${gold.missingProfileFields.join(', ') || 'perfil'}`, href: '#dados' });
    }
    if (gold.missingDocumentTypes.length) {
      todo.push({
        label: `Enviar ${gold.missingDocumentTypes.map((type) => citizenDocumentLabel(type)).join(', ')}`,
        href: '/cidadao/documentos',
      });
    }
    if (!gold.biometricConfirmed) todo.push({ label: 'Cadastrar o rosto (biometria facial)', href: '/cidadao/biometria-facial' });
  }

  const initials = (citizen?.name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const address = citizen?.address;
  const addressLine = address?.logradouro
    ? `${address.logradouro}${address.numero ? `, ${address.numero}` : ''}${address.complemento ? ` — ${address.complemento}` : ''}`
    : '';
  const cityLine = [address?.bairro, address?.cidade && `${address.cidade}${address.uf ? `/${address.uf}` : ''}`, address?.cep].filter(Boolean).join(' · ');

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* 1. quem sou eu */}
        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900">{citizen?.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>CPF {citizen?.cpf}</span>
                {level && <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', level.className)}>{level.label}</span>}
              </div>
            </div>
          </div>

          {citizen?.verificationStatus === 'REJECTED' && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">A prefeitura não conseguiu conferir o seu cadastro.</p>
              {citizen.verificationNotes && <p className="mt-1">Motivo: {citizen.verificationNotes}</p>}
              <p className="mt-1 text-red-700">Corrija os seus dados abaixo e peça uma nova conferência.</p>
              <Button size="sm" className="mt-2" onClick={handleResubmit} disabled={resubmitting}>
                {resubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pedir nova conferência
              </Button>
            </div>
          )}

          {todo.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-900">Para chegar ao nível Ouro</p>
              <p className="mb-2 text-xs text-gray-500">Com o Ouro, mais serviços ficam liberados sem ir à prefeitura.</p>
              <ul className="space-y-1">
                {todo.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-blue-700 hover:bg-blue-50">
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 2. dados */}
        {isEditing ? (
          <section id="dados" className="space-y-5 rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Editar meus dados</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label="Nome completo" wide>
                <Input id="name" value={formData.name} onChange={set('name')} autoComplete="name" />
              </Field>
              <Field id="email" label="E-mail" wide>
                <Input id="email" type="email" value={formData.email} onChange={set('email')} autoComplete="email" />
              </Field>
              <Field id="phone" label="Telefone">
                <ModernMaskedInput id="phone" type="phone" value={formData.phone} onChange={set('phone')} autoComplete="tel" />
              </Field>
              <Field id="phoneSecondary" label="Outro telefone (opcional)">
                <ModernMaskedInput id="phoneSecondary" type="phone" value={formData.phoneSecondary} onChange={set('phoneSecondary')} />
              </Field>
              <Field id="birthDate" label="Data de nascimento">
                <Input id="birthDate" type="date" value={formData.birthDate} onChange={set('birthDate')} />
              </Field>
              <Field id="rg" label="RG">
                <ModernMaskedInput id="rg" type="rg" value={formData.rg} onChange={set('rg')} />
              </Field>
              <Field id="motherName" label="Nome da mãe" wide>
                <Input id="motherName" value={formData.motherName} onChange={set('motherName')} />
              </Field>
              <Field id="maritalStatus" label="Estado civil">
                <select id="maritalStatus" value={formData.maritalStatus} onChange={set('maritalStatus')} className={SELECT_CLASS}>
                  <option value="">Selecione</option>
                  {MARITAL.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field id="familyIncome" label="Renda da família">
                <select id="familyIncome" value={formData.familyIncome} onChange={set('familyIncome')} className={SELECT_CLASS}>
                  <option value="">Selecione</option>
                  {INCOME.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field id="occupation" label="Profissão" wide>
                <Input id="occupation" value={formData.occupation} onChange={set('occupation')} />
              </Field>
            </div>

            <div className="border-t pt-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Endereço</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="cep" label="CEP">
                  <div className="relative">
                    <ModernMaskedInput id="cep" type="cep" value={formData.cep} onChange={(e) => handleCEPChange(e.target.value)} />
                    {cepLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />}
                  </div>
                  {cepError ? (
                    <p className="text-xs text-red-600">{cepError}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Digite o CEP e o endereço se completa sozinho.</p>
                  )}
                </Field>
                <div className="hidden sm:block" />
                <Field id="logradouro" label="Rua" wide>
                  <Input id="logradouro" value={formData.logradouro} onChange={set('logradouro')} />
                </Field>
                <Field id="numero" label="Número">
                  <Input id="numero" value={formData.numero} onChange={set('numero')} inputMode="numeric" />
                </Field>
                <Field id="complemento" label="Complemento (opcional)">
                  <Input id="complemento" value={formData.complemento} onChange={set('complemento')} />
                </Field>
                <Field id="bairro" label="Bairro">
                  <Input id="bairro" value={formData.bairro} onChange={set('bairro')} />
                </Field>
                <Field id="cidade" label="Cidade">
                  <div className="flex gap-2">
                    <Input id="cidade" value={formData.cidade} onChange={set('cidade')} className="flex-1" />
                    <Input id="uf" aria-label="Estado" value={formData.uf} onChange={set('uf')} maxLength={2} className="w-16 uppercase" />
                  </div>
                </Field>
                <Field id="pontoReferencia" label="Ponto de referência (opcional)" wide>
                  <Input id="pontoReferencia" value={formData.pontoReferencia} onChange={set('pontoReferencia')} />
                </Field>
              </div>
            </div>

            {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormError(null);
                  fillFromCitizen();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </section>
        ) : (
          <div id="dados" className="space-y-5">
            <Section
              title="Meus dados"
              action={
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>
              }
            >
              <dl className="divide-y">
                <Row label="E-mail" value={citizen?.email} />
                <Row label="Telefone" value={[citizen?.phone, citizen?.phoneSecondary].filter(Boolean).map((p) => formatValue(p!, 'phone')).join(' · ')} />
                <Row label="Nascimento" value={citizen?.birthDate ? new Date(citizen.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null} />
                <Row label="RG" value={citizen?.rg ? formatValue(citizen.rg, 'rg') : null} />
                <Row label="Nome da mãe" value={citizen?.motherName} />
                <Row label="Estado civil" value={citizen?.maritalStatus} />
                <Row label="Profissão" value={citizen?.occupation} />
                <Row label="Renda da família" value={citizen?.familyIncome} />
              </dl>
            </Section>

            <Section title="Endereço">
              {addressLine ? (
                <div className="text-sm text-gray-900">
                  <p>{addressLine}</p>
                  <p className="text-gray-600">{cityLine}</p>
                  {address?.pontoReferencia && <p className="mt-1 text-gray-500">Referência: {address.pontoReferencia}</p>}
                  <HomeLocationMark key={`${addressLine}|${cityLine}`} />
                </div>
              ) : (
                <p className="text-sm text-gray-400">Não informado</p>
              )}
            </Section>
          </div>
        )}

        {/* 3. senha */}
        <Section
          title="Senha"
          action={
            !changingPassword && (
              <Button size="sm" variant="outline" onClick={() => setChangingPassword(true)}>
                Trocar senha
              </Button>
            )
          }
        >
          {!changingPassword ? (
            <p className="text-sm text-gray-500">Use uma senha que você não usa em outros sites.</p>
          ) : (
            <div className="space-y-4 pt-1">
              <Field id="currentPassword" label="Senha atual">
                <Input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                />
              </Field>
              <Field id="newPassword" label="Nova senha">
                <Input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                />
                <ul className="grid gap-1 pt-1 text-xs sm:grid-cols-2">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(passwordData.newPassword);
                    return (
                      <li key={rule.label} className={cn('flex items-center gap-1.5', ok ? 'text-emerald-700' : 'text-gray-500')}>
                        <Check className={cn('h-3.5 w-3.5', ok ? 'opacity-100' : 'opacity-30')} />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </Field>
              <Field id="confirmPassword" label="Repita a nova senha">
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </Field>
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPasswords ? 'Esconder senhas' : 'Mostrar senhas'}
              </button>

              {passwordError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  disabled={savingPassword}
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordError(null);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleChangePassword} disabled={savingPassword}>
                  {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Trocar senha
                </Button>
              </div>
            </div>
          )}
        </Section>

        {myTags && myTags.tags.length > 0 && (
          <Section title="No cadastro da prefeitura, você é">
            <div className="flex flex-wrap gap-2">
              {myTags.tags.map((tag) => (
                <span key={tag.id} className={cn('rounded-full px-3 py-1 text-sm font-medium', tagColorClass(tag.color))}>
                  {tag.name}
                </span>
              ))}
            </div>
            {myTags.services.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">Serviços para você</p>
                <ul className="mt-1 divide-y">
                  {myTags.services.map((service) => (
                    <li key={service.id}>
                      <Link href={`/cidadao/servicos/${service.id}/solicitar`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-blue-700">
                        <span className="min-w-0">
                          <span className="block truncate text-gray-900">{service.name}</span>
                          <span className="block truncate text-xs text-gray-500">
                            {service.forTag ? `Só para quem é ${service.forTag}` : service.department}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        <Section title="Meus dados e privacidade">
          <p className="text-sm text-gray-500">Você pode baixar uma cópia de tudo o que a prefeitura guarda sobre você aqui, ou excluir a sua conta.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleDownloadData}>Baixar os meus dados</Button>
            {!deleting && (
              <Button variant="outline" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setDeleting(true)}>
                Excluir a minha conta
              </Button>
            )}
          </div>
          {deleting && (
            <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-900">
                Ao excluir, apagamos o seu contato, endereço, documentos, biometria, família e o acesso ao portal. Ficam guardados só o seu nome,
                o CPF e os pedidos já feitos, porque a prefeitura é obrigada a manter o registro do atendimento. Para voltar depois, é preciso
                ir à prefeitura.
              </p>
              <Field id="deletePassword" label="Sua senha, para confirmar">
                <Input
                  id="deletePassword"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </Field>
              {deleteError && <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm text-red-700">{deleteError}</p>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  disabled={deleteBusy}
                  onClick={() => {
                    setDeleting(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount} disabled={deleteBusy}>
                  {deleteBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Excluir a minha conta
                </Button>
              </div>
            </div>
          )}
        </Section>

        {citizen?.createdAt && (
          <p className="text-center text-xs text-gray-400">
            Cadastro desde {new Date(citizen.createdAt).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </CitizenLayout>
  );
}
