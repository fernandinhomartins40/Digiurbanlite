'use client';

/**
 * Equipe da plataforma — quem opera este console.
 * Papéis: Administrador (tudo) e Suporte (consulta e ajuda, sem mexer em
 * cobrança, planos, municípios ou equipe). Senhas novas/redefinidas são
 * temporárias: a pessoa troca no primeiro acesso.
 * Substitui a antiga "Gestão de Super Admins" (usuários SUPER_ADMIN presos a
 * um município).
 */

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

type Role = 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isYou?: boolean;
}

const ROLE_LABEL: Record<Role, string> = { PLATFORM_ADMIN: 'Administrador', PLATFORM_SUPPORT: 'Suporte' };
const ROLE_HINT: Record<Role, string> = {
  PLATFORM_ADMIN: 'Faz tudo: municípios, planos, cobrança, backups e equipe.',
  PLATFORM_SUPPORT: 'Consulta tudo e ajuda os municípios, mas não altera nada.',
};

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Não foi possível concluir');
  return data;
}

export default function PlatformTeamPage() {
  const { toast } = useToast();
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'PLATFORM_SUPPORT' });
  const [secret, setSecret] = useState<{ label: string; value: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/api/platform/team');
      setTeam(data.team || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar a equipe', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('invite');
    try {
      const data = await call('/api/platform/team', { method: 'POST', body: JSON.stringify(form) });
      setSecret({ label: `Senha temporária de ${data.member.name}`, value: data.temporaryPassword });
      setForm({ name: '', email: '', role: 'PLATFORM_SUPPORT' });
      load();
    } catch (error: any) {
      toast({ title: 'Não foi possível convidar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const update = async (m: Member, body: Partial<Pick<Member, 'role' | 'isActive'>>, success: string) => {
    setBusy(m.id);
    try {
      await call(`/api/platform/team/${m.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast({ title: success });
      load();
    } catch (error: any) {
      toast({ title: 'Não foi possível alterar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (m: Member) => {
    if (!confirm(`Gerar uma nova senha temporária para ${m.name}? A senha atual deixa de funcionar.`)) return;
    setBusy(m.id);
    try {
      const data = await call(`/api/platform/team/${m.id}/reset-password`, { method: 'POST' });
      setSecret({ label: `Nova senha temporária de ${m.name}`, value: data.temporaryPassword });
      load();
    } catch (error: any) {
      toast({ title: 'Não foi possível redefinir', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const active = team.filter((m) => m.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <UserCog className="h-7 w-7 text-blue-600" />
          Equipe da plataforma
        </h1>
        <p className="text-gray-600">Quem opera este console. Cada pessoa tem o próprio login.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Pessoas ativas</p>
            <p className="text-2xl font-bold">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Administradores</p>
            <p className="text-2xl font-bold">{active.filter((m) => m.role === 'PLATFORM_ADMIN').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Suporte</p>
            <p className="text-2xl font-bold">{active.filter((m) => m.role === 'PLATFORM_SUPPORT').length}</p>
          </CardContent>
        </Card>
      </div>

      {secret && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="font-semibold text-green-900">{secret.label}</p>
              <p className="text-sm text-green-800">
                Envie para a pessoa por um canal seguro. Ela vai criar a própria senha no primeiro acesso. Esta senha não aparece de novo.
              </p>
              <code className="mt-2 inline-block rounded bg-white px-3 py-1.5 text-base font-bold tracking-wide">{secret.value}</code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(secret.value);
                  toast({ title: 'Senha copiada' });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button variant="ghost" onClick={() => setSecret(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convidar pessoa
            </CardTitle>
            <CardDescription>{ROLE_HINT[form.role]}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={invite} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_200px_auto]">
              <div>
                <Label htmlFor="t-name">Nome</Label>
                <Input id="t-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="t-email">E-mail</Label>
                <Input id="t-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="t-role">Papel</Label>
                <select
                  id="t-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PLATFORM_SUPPORT">Suporte</option>
                  <option value="PLATFORM_ADMIN">Administrador</option>
                </select>
              </div>
              <Button type="submit" disabled={busy === 'invite'}>
                {busy === 'invite' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Convidar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pessoas ({team.length})
          </CardTitle>
          {!isAdmin && <CardDescription>Seu acesso é de Suporte: você pode ver a equipe, mas não alterar.</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="divide-y">
              {team.map((m) => (
                <div key={m.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${m.isActive ? '' : 'opacity-60'}`}>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {m.name}
                      {m.isYou && <Badge variant="outline">você</Badge>}
                      <Badge className={m.role === 'PLATFORM_ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}>
                        {m.role === 'PLATFORM_ADMIN' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {ROLE_LABEL[m.role]}
                      </Badge>
                      {!m.isActive && <Badge className="bg-red-100 text-red-800">Desativado</Badge>}
                      {m.isActive && m.mustChangePassword && <Badge className="bg-amber-100 text-amber-800">Aguardando 1º acesso</Badge>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {m.email} · último acesso: {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('pt-BR') : 'nunca'}
                    </p>
                  </div>
                  {isAdmin && !m.isYou && (
                    <div className="flex flex-wrap gap-2">
                      <select
                        aria-label={`Papel de ${m.name}`}
                        value={m.role}
                        disabled={busy === m.id}
                        onChange={(e) => update(m, { role: e.target.value as Role }, 'Papel alterado')}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="PLATFORM_ADMIN">Administrador</option>
                        <option value="PLATFORM_SUPPORT">Suporte</option>
                      </select>
                      <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => resetPassword(m)}>
                        <KeyRound className="mr-1 h-4 w-4" />
                        Nova senha
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === m.id}
                        className={m.isActive ? 'text-red-600' : 'text-green-700'}
                        onClick={() => update(m, { isActive: !m.isActive }, m.isActive ? 'Acesso desativado' : 'Acesso reativado')}
                      >
                        {m.isActive ? 'Desativar' : 'Reativar'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
